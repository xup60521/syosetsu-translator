import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { redis, RedisTaskData } from "@/server/redis";
import z from "zod";

export const historyProcedure = createTRPCRouter({
    list_history: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;
        if (!userId) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }
        try {
            // 1. 取得該用戶最近 20 個任務 ID
            // 最新 SDK 語法：zrange 搭配 { rev: true } 實現從新到舊
            const taskIds = await redis.zrange(`user:tasks:${userId}`, 0, 19, {
                rev: true,
            });

            if (!taskIds || taskIds.length === 0) {
                return [];
            }

            // 2. 建立 Pipeline 批次獲取所有 Hash 資料
            const pipeline = redis.pipeline();
            taskIds.forEach((id) => {
                pipeline.hgetall(`task:${id}`);
            });

            // 執行並指定型別 (細節詳見 Upstash Pipelining 文件)
            const results = await pipeline.exec<RedisTaskData[]>();

            // 3. 格式化回傳結果
            const history = taskIds
                .map((id, index) => {
                    const data = results[index];

                    // 如果該 taskId 對應的資料已過期或不存在，則回傳 null
                    if (!data || Object.keys(data).length === 0) return null;

                    return {
                        taskId: id as string,
                        status: data.status,
                        // 確保數值型別正確，因為 Redis 回傳有時會是字串
                        progress: Number(data.progress || 0),
                        current: Number(data.current || 0),
                        total: Number(data.total || 0),
                        // 解析存進去時的 JSON 字串
                        urls: data.urls ? data.urls : [],
                        errorMessage: data.error_message || null,
                        createdAt: data.created_at
                            ? Number(data.created_at)
                            : null,
                        provider: data.provider || null,
                        model: data.model_id || null,
                        apiKeyName: data.api_key_name || null,
                    };
                })
                .filter(Boolean); // 過濾掉 null

            return history;
        } catch (error) {
            console.error("Upstash Redis Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
    }),
    delete_history: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            if (!userId) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }
            const {taskId} = input
            await redis.del(`task:${taskId}`);
            await redis.zrem(`user:tasks:${userId}`, taskId);

            return { success: true };
        }),
});
