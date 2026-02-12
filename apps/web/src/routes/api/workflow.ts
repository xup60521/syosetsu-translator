import { batchTranslate } from "@/lib/batchTranslate";
import { redis } from "@/server/redis";
import { chunkArray } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { serve } from "@upstash/workflow/tanstack";
import type { WorkflowPayloadType } from "@repo/shared";

export const Route = createFileRoute("/api/workflow")({
    server: {
        handlers: serve(
            async (context) => {
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
                    encrypted_refresh_token,
                } = payload;
                const batches = [] as string[][];
                const total = urls.length;
                const workflowId = context.workflowRunId;

                for (let i = 0; i < urls.length; i += batch_size) {
                    batches.push(urls.slice(i, i + batch_size));
                }

                let totalProcessed = 0;

                const concurrent_batches = chunkArray(batches, concurrency);
                for (
                    let batches_index = 0;
                    batches_index < concurrent_batches.length;
                    batches_index++
                ) {
                    const batches = concurrent_batches[batches_index];
                    await Promise.all(
                        batches.map(async (batch, batch_index) => {
                            const currentBatch = batch;
                            // console.log(`Processing batch ${i}`);
                            await context.run(
                                `process-batch-${batches_index}-${batch_index}`,
                                async () => {
                                    await batchTranslate({
                                        encrypted_refresh_token,
                                        urls: currentBatch,
                                        model_id,
                                        with_Cookies: false,
                                        provider,
                                        encrypted_api_key,
                                        user_id,
                                        folder_id,
                                    });
                                },
                            );
                            totalProcessed += currentBatch.length;
                            // console.log(totalProcessed, total)
                        }),
                    );
                    const progress = Math.round((totalProcessed / total) * 100);
                    await context.run(
                        `update-redis-progress-${batches_index}`,
                        async () => {
                            await redis.hset(`task:${workflowId}`, {
                                status:
                                    totalProcessed >= total
                                        ? "completed"
                                        : "processing",
                                progress: progress,
                                current: totalProcessed,
                            });
                        },
                    );
                }

                // // ❌ 移除 try/catch，讓 workflow 自然失敗
                // for (let i = 0; i < batches.length; i++) {
                //     const currentBatch = batches[i];

                //     await context.run(`process-batch-${i}`, async () => {
                //         await batchTranslate({
                //             urls: currentBatch,
                //             model_id,
                //             with_Cookies: false,
                //             provider,
                //             encrypted_api_key,
                //             user_id,
                //             folder_id,
                //         });
                //         return { processed: currentBatch.length };
                //     });

                //     totalProcessed += currentBatch.length;
                //     const progress = Math.round((totalProcessed / total) * 100);

                //     await context.run(
                //         `update-redis-progress-${i}`,
                //         async () => {
                //             await redis.hset(`task:${workflowId}`, {
                //                 status:
                //                     totalProcessed >= total
                //                         ? "completed"
                //                         : "processing",
                //                 progress: progress,
                //                 current: totalProcessed,
                //             });
                //         },
                //     );
                // }
            },
            {
                // ✅ 使用 failureFunction 處理錯誤
                failureFunction: async ({
                    context,
                    failResponse,
                    failStatus,
                }) => {
                    // 確保正確取得 workflowRunId
                    const workflowId = context.workflowRunId;

                    console.log(
                        `[Workflow Failure] ID: ${workflowId}, Status: ${failStatus}`,
                    );

                    const errorMessage =
                        typeof failResponse === "string"
                            ? failResponse
                            : JSON.stringify(failResponse) ||
                              "Translation failed";

                    // 關鍵：確保 redis 指令被 await 且錯誤被捕捉
                    try {
                        await redis.hset(`task:${workflowId}`, {
                            status: "failed",
                            error_message: errorMessage,
                        });
                        console.log(
                            `Successfully updated Redis for ${workflowId}`,
                        );
                    } catch (redisError) {
                        console.error(
                            "Failed to update Redis in failureFunction:",
                            redisError,
                        );
                    }
                },
            },
        ),
    },
});
