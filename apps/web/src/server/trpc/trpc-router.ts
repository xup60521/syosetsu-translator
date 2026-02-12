import { z } from "zod";
import { driveProcedure } from "./routers/drive";
import { novelProcedure } from "./routers/novel";
import { encrypt } from "@repo/shared";
import { historyProcedure } from "./routers/history";
import { modelList } from "@/lib/model_list";
import { TRPCError } from "@trpc/server";
import { workflowProcedure } from "./routers/workflow";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc/init";

export const trpcRouter = createTRPCRouter({
    hello: publicProcedure.query(() => "hello world"),
    protected_hello: protectedProcedure.query(
        () => "hello from protected procedure",
    ),
    drive: driveProcedure,
    novel: novelProcedure,
    encrypt: publicProcedure
        .input(z.object({ apiKey: z.string() }))
        .mutation(({ input }) => encrypt(input.apiKey)),
    history: historyProcedure,
    model_list: publicProcedure
        .input(z.object({ provider: z.string() }))
        .query(async ({ input }) => {
            const { provider } = input;
            const getter = modelList[provider];
            if (!getter) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid provider",
                });
            }
            return await getter();
        }),
    workflow: workflowProcedure,
});
export type TRPCRouter = typeof trpcRouter;
