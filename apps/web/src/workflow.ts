import { NovelHandlerResultType, type WorkflowPayloadType } from "@repo/shared";
import {
    batchTranslate,
    chunkArray,
    decrypt,
    getProvider,
    save_file_to_gdrive,
} from "@repo/shared/server";
import { Redis } from "@upstash/redis";
import {
    WorkflowEntrypoint,
    type WorkflowStep,
    type WorkflowEvent,
    env,
} from "cloudflare:workers";

export class SyosetsuTranslatorWorkflow extends WorkflowEntrypoint<
    Env,
    WorkflowPayloadType
> {
    async run(event: WorkflowEvent<WorkflowPayloadType>, step: WorkflowStep) {
        const payload = event.payload;
        const {
            urls,
            batch_size,
            model_id,
            provider,
            encrypted_api_key,
            user_id,
            concurrency,
            folder_id,
            encrypted_refresh_token,
        } = payload;
        const batches = [] as string[][];
        const total = urls.length;
        const workflowId = event.instanceId;

        try {
            for (let i = 0; i < urls.length; i += batch_size) {
                batches.push(urls.slice(i, i + batch_size));
            }

            let totalProcessed = 0;
            let api_call_count = 0;

            const concurrent_batches = chunkArray(batches, concurrency);
            for (
                let batches_index = 0;
                batches_index < concurrent_batches.length;
                batches_index++
            ) {
                const batches = concurrent_batches[batches_index]!;
                // Concurrently process batches in the current chunk
                await Promise.all(
                    batches.map(async (batch, batch_index) => {
                        const currentBatch = batch;
                        api_call_count += await step.do(
                            `process-batch-${batches_index}-${batch_index}`,
                            async () => {
                                const decrypted_api_key = decrypt(
                                    encrypted_api_key,
                                    process.env.ENCRYPTION_KEY!,
                                );
                                const providerInstance = getProvider(
                                    provider,
                                    decrypted_api_key,
                                );
                                const model = providerInstance(model_id);
                                return await batchTranslate(
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
                            },
                        );
                        totalProcessed += currentBatch.length;
                        await new Promise((resolve) =>
                            setTimeout(resolve, 10000),
                        ); // Wait 10 secs to prevent reaching rate limit
                        // console.log(totalProcessed, total)
                    }),
                );
                const progress = Math.round((totalProcessed / total) * 100);
                await step.do(
                    `update-redis-progress-${batches_index}`,
                    async () => {
                        await redis.hset(`task:${workflowId}`, {
                            status:
                                totalProcessed >= total
                                    ? "completed"
                                    : "processing",
                            progress: progress,
                            current: totalProcessed,
                            api_call_count,
                        });
                    },
                );
            }
            console.log(`Workflow ${workflowId} completed successfully.`);
        } catch (e) {
            await step.do(`handle-failure`, async () => {
                console.log(
                    `[Workflow Failure] ID: ${workflowId}, Status: ${e instanceof Error ? e.message : "Unknown error"}`,
                );

                const errorMessage =
                    typeof e === "string"
                        ? e
                        : JSON.stringify(e) || "Translation failed";

                // 關鍵：確保 redis 指令被 await 且錯誤被捕捉
                try {
                    await redis.hset(`task:${workflowId}`, {
                        status: "failed",
                        error_message: errorMessage,
                    });
                    console.log(`Successfully updated Redis for ${workflowId}`);
                } catch (redisError) {
                    console.error(
                        "Failed to update Redis in failureFunction:",
                        redisError,
                    );
                }
            });
        }
    }
}

async function novel_handler(url: string) {
    const data = (await fetch(
        env.WORKFLOW_NOVEL_HANDLER_URL + "/novel_handler",
        { method: "POST", body: JSON.stringify({ url }) },
    ).then((res) => res.json())) as NovelHandlerResultType;
    return data;
}

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
