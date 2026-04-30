import z from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { account } from "@/server/db/auth-schema";
import type { WorkflowPayloadType } from "@repo/shared";
import { qstashClient } from "@/server/qstash-client";
import { env } from "cloudflare:workers";
import { redis } from "@/server/redis";
import { encrypt } from "@repo/shared/server";

const dataSchema = z.object({
    urls: z.array(z.url({ message: "Invalid URL format" })),
    provider: z.string().min(1, "Provider is required"),
    encrypted_api_key: z.string().min(1, "API key is required"),
    model_id: z.string().min(1, "Model ID is required"),
    concurrency: z.number().int().positive(),
    batch_size: z.number().int().positive(),
    folder_id: z.string().min(1, "Folder ID is required"),
    api_key_name: z.string().optional(),
});

export const workflowProcedure = createTRPCRouter({
    translate: protectedProcedure
        .input(dataSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            if (!userId) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }
            const userAccount = await db.query.account.findFirst({
                where: (fields, { and, eq }) =>
                    and(
                        eq(account.userId, userId),
                        eq(account.providerId, "google"),
                    ),
            });

            if (!userAccount || !userAccount.refreshToken) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "No Google Drive connection found.",
                });
            }

            const google_refresh_token = userAccount?.refreshToken;

            if (!google_refresh_token) {
                // 如果沒有拿到，可能是沒加 access_type: offline 或使用者需要重新授權
                console.error("No Google Refresh Token found for this user");
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No refresh token",
                });
            }
            const payload = {
                ...input,
                user_id: userId,
                encrypted_refresh_token: encrypt(
                    google_refresh_token,
                    env.ENCRYPTION_KEY,
                ),
            } as WorkflowPayloadType;
            const workflow_base_url = env.WORKFLOW_NOVEL_HANDLER_URL.includes(
                "localhost",
            )
                ? env.WORKFLOW_NOVEL_HANDLER_URL.replace(
                      "localhost",
                      "host.docker.internal",
                  )
                : env.WORKFLOW_NOVEL_HANDLER_URL;
            const { workflowRunId } = await qstashClient.trigger({
                // Your workflow route handler
                url: workflow_base_url + "/workflow",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload,
                retries: 3,
            });

            // const { id: workflowRunId } = await env.ST_WORKFLOW.create({
            //     params: payload,
            // });
            console.log("workflow is triggered with ID:", workflowRunId);

            await redis
                .pipeline()
                .zadd(`user:tasks:${userId}`, {
                    score: Date.now(),
                    member: workflowRunId,
                })
                .hset(`task:${workflowRunId}`, {
                    status: "starting",
                    progress: 0,
                    current: 0,
                    api_call_count: 0,
                    total: payload.urls.length,
                    urls: JSON.stringify(payload.urls),
                    created_at: Date.now(),
                    provider: payload.provider,
                    model_id: payload.model_id,
                    api_key_name: payload.api_key_name || "",
                })
                .expire(`task:${workflowRunId}`, 604800) // 7 days後自動過期
                .exec();

            // console.log("update progress to redis")

            return "ok";
        }),
    cancel: protectedProcedure
        .input(z.object({ workflow_id: z.string() }))
        .mutation(async ({ input }) => {
            const { workflow_id } = input;
            qstashClient.cancel({ ids: [workflow_id] });
            console.log("terminating workflow instance", workflow_id);
            // const instance = await env.ST_WORKFLOW.get(workflow_id);
            // const status = await instance.status();
            // if (
            //     status.status === "terminated" ||
            //     status.status === "complete"
            // ) {
            //     console.log(
            //         `Workflow ${workflow_id} is already completed or terminated.`,
            //     );
            // } else {
            //     await instance.terminate();
            // }
            await redis.hset(`task:${workflow_id}`, {
                status: "canceled",
            });
            return "ok";
        }),
});
