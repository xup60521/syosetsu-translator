import { serve, createWorkflow, serveMany } from '@upstash/workflow/cloudflare';
import { NovelHandlerResultType, supportedProvider, type WorkflowPayloadType } from '@repo/shared';
import { batchTranslate, decrypt, getProvider } from '@repo/shared/server';
import { chunkArray } from './utils';
import { Redis } from '@upstash/redis';
import { env } from 'cloudflare:workers';
import { save_file_to_gdrive } from './save_file_to_gdrive';

export const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN,
});

async function novel_handler(url: string, options?: { with_Cookies?: boolean }) {
	const res = await fetch(env.NOVEL_HANDLER_URL, { method: 'POST', body: JSON.stringify({ url, with_Cookies: options?.with_Cookies }) });
	const data = (await res.json()) as NovelHandlerResultType;
	return data;
}

// 1️⃣ 建立子 workflow（處理單一 batch）
const processBatchWorkflow = createWorkflow(async (context) => {
	const payload = context.requestPayload as {
		batch: string[];
		batch_index: number;
		model_id: string;
		provider: string;
		encrypted_api_key: string;
		user_id: string;
		folder_id: string;
		encrypted_refresh_token: string;
		workflowId: string;
	};

	// 延遲
	await context.sleep('delay', payload.batch_index * 5);

	// 處理這個 batch
	await context.run('process', async () => {
		const decrypted_api_key = decrypt(payload.encrypted_api_key, process.env.ENCRYPTION_KEY);
		const providerInstance = getProvider(payload.provider, decrypted_api_key);
		const model = providerInstance(payload.model_id);

		await batchTranslate(
			{
				encrypted_refresh_token: payload.encrypted_refresh_token,
				urls: payload.batch,
				model_id: payload.model_id,
				with_Cookies: false,
				provider: payload.provider,
				model,
				user_id: payload.user_id,
				folder_id: payload.folder_id,
			},
			novel_handler,
			save_file_to_gdrive,
		);
	});

	return { processed: payload.batch.length };
});

// 2️⃣ 主 workflow（協調所有 batches）
const mainWorkflow = createWorkflow(async (context) => {
	const payload = context.requestPayload as WorkflowPayloadType;
	const { 
		urls, 
		batch_size, 
		model_id, 
		provider, 
		encrypted_api_key, 
		user_id, 
		concurrency, 
		folder_id, 
		encrypted_refresh_token 
	} = payload;

	const batches = [] as string[][];
	const total = urls.length;
	const workflowId = context.workflowRunId;

	// 初始化 Redis
	await context.run('init-redis', async () => {
		await redis.hset(`task:${workflowId}`, {
			status: 'processing',
			progress: 0,
			current: 0,
			total: total,
		});
	});

	// 分批
	for (let i = 0; i < urls.length; i += batch_size) {
		batches.push(urls.slice(i, i + batch_size));
	}

	let totalProcessed = 0;
	const concurrent_batches = chunkArray(batches, concurrency);

	// 處理每組併發 batches
	for (let batches_index = 0; batches_index < concurrent_batches.length; batches_index++) {
		const currentBatches = concurrent_batches[batches_index];
		
		// ✅ 每個 batch 都會觸發新的 HTTP request / Workers invocation
		const results = await Promise.all(
			currentBatches.map((batch, batch_index) =>
				context.invoke(`batch-${batches_index}-${batch_index}`, {
					workflow: processBatchWorkflow,
					body: {
						batch,
						batch_index,
						model_id,
						provider,
						encrypted_api_key,
						user_id,
						folder_id,
						encrypted_refresh_token,
						workflowId,
					},
				})
			)
		);

		// 累計已處理數量
		totalProcessed += results.reduce((sum, r) => sum + r.body.processed, 0);

		// 更新進度
		const progress = Math.round((totalProcessed / total) * 100);
		await context.run(`update-progress-${batches_index}`, async () => {
			await redis.hset(`task:${workflowId}`, {
				status: totalProcessed >= total ? 'completed' : 'processing',
				progress: progress,
				current: totalProcessed,
			});
		});
	}
});

// 3️⃣ 匯出兩個 workflows
export default serveMany({
	main: mainWorkflow,
	processBatch: processBatchWorkflow,
});