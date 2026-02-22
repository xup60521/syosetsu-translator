import { Hono } from "hono";
import { decomposeURL, novel_handler } from "@repo/shared/server";
import { serve } from '@upstash/workflow/hono';
import { type NovelHandlerResultType, supportedProvider, type WorkflowPayloadType } from '@repo/shared';
import { batchTranslate, decrypt, getProvider } from '@repo/shared/server';
import { chunkArray } from './src/utils';
import { Redis } from '@upstash/redis';
import { logger } from 'hono/logger'
import { save_file_to_gdrive } from './src/save_file_to_gdrive';

const app = new Hono();

app.use(logger());

app.get("/", async (c) => {
    return c.text("Hello from Hono!");
});

// go to `keep-alive` worker
app.get("/health", async (c) => {
    return c.text("OK");
});

app.post("/novel_handler", async (c) => {
    const { url, with_Cookies } = (await c.req.json()) as {
        url: string;
        with_Cookies?: boolean;
    };
    const data = await novel_handler(url, {
        with_Cookies: with_Cookies,
    });
    return c.json(data);
});

app.post("/decompose_url", async (c) => {
    const { url_string, with_Cookies } = (await c.req.json()) as {
        url_string: string;
        with_Cookies?: boolean;
    };
    return c.json(await decomposeURL({ url_string, with_Cookies }))
});

app.post("/workflow", serve(
    async (context) => {
        const payload = context.requestPayload as WorkflowPayloadType;
        const { urls, batch_size, model_id, provider, encrypted_api_key, user_id, concurrency, folder_id, encrypted_refresh_token } = payload;
        const batches = [] as string[][];
        const total = urls.length;
        const workflowId = context.workflowRunId;

        for (let i = 0; i < urls.length; i += batch_size) {
            batches.push(urls.slice(i, i + batch_size));
        }

        let totalProcessed = 0;

        const concurrent_batches = chunkArray(batches, concurrency);
        for (let batches_index = 0; batches_index < concurrent_batches.length; batches_index++) {
            const batches = concurrent_batches[batches_index]!;
            await Promise.all(
                batches.map(async (batch, batch_index) => {
                    const currentBatch = batch;
                    // console.log(`Processing batch ${i}`);
                    await context.run(`process-batch-${batches_index}-${batch_index}`, async () => {
                        const decrypted_api_key = decrypt(encrypted_api_key, process.env.ENCRYPTION_KEY!);
                        const providerInstance = getProvider(provider, decrypted_api_key);
                        const model = providerInstance(model_id);
                        await batchTranslate(
                            {
                                encrypted_refresh_token,
                                urls: currentBatch,
                                model_id,
                                with_Cookies: false,
                                provider,
                                model,
                                user_id,
                                folder_id,
                            },
                            novel_handler,
                            save_file_to_gdrive,
                        );
                    });
                    totalProcessed += currentBatch.length;
                    // console.log(totalProcessed, total)
                }),
            );
            const progress = Math.round((totalProcessed / total) * 100);
            await context.run(`update-redis-progress-${batches_index}`, async () => {
                await redis.hset(`task:${workflowId}`, {
                    status: totalProcessed >= total ? 'completed' : 'processing',
                    progress: progress,
                    current: totalProcessed,
                });
            });
        }


    },
    {
        // ✅ 使用 failureFunction 處理錯誤
        failureFunction: async ({ context, failResponse, failStatus }) => {
            // 確保正確取得 workflowRunId
            const workflowId = context.workflowRunId;

            console.log(`[Workflow Failure] ID: ${workflowId}, Status: ${failStatus}`);

            const errorMessage = typeof failResponse === 'string' ? failResponse : JSON.stringify(failResponse) || 'Translation failed';

            // 關鍵：確保 redis 指令被 await 且錯誤被捕捉
            try {
                await redis.hset(`task:${workflowId}`, {
                    status: 'failed',
                    error_message: errorMessage,
                });
                console.log(`Successfully updated Redis for ${workflowId}`);
            } catch (redisError) {
                console.error('Failed to update Redis in failureFunction:', redisError);
            }
        },
    },
))




export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default {
    port: 3001, // dev and render server are running on port 3001
    fetch: app.fetch,
};
