import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

import { URLPattern } from "urlpattern-polyfill";
import { load } from "cheerio";
import { decomposeURL, novel_handler } from "@repo/shared/server";
import { env } from "@/env";
import { DecomposedURL, NovelHandlerResultType } from "@repo/shared";

const urlSchema = z.string().transform((val, ctx) => {
    // Split by one or more whitespace characters
    const parts = val.trim().split(/\s+/);

    for (const part of parts) {
        const result = z.string().url().safeParse(part);
        if (!result.success) {
            ctx.addIssue({
                code: "custom",
                message: `"${part}" is not a valid URL`,
            });
        }
    }

    return parts.join(" ");
});

export const novelProcedure = createTRPCRouter({
    novel_handler: publicProcedure
        .input(
            z.object({
                url: z.url(),
                with_Cookies: z.boolean().optional().default(false),
            }),
        )
        .query(async ({ input }) => {
            const { url, with_Cookies } = input;
            const data = await fetch(
                env.WORKFLOW_NOVEL_HANDLER_URL + "/novel_handler",
                { method: "POST", body: JSON.stringify({ url, with_Cookies })},
            ).then(res => res.json()) as NovelHandlerResultType;
            return data;
        }),
    decompose_url: publicProcedure
        .input(
            z.object({
                url_string: urlSchema,
                with_Cookies: z.boolean().optional().default(false),
            }),
        )
        .mutation(async ({ input }) => {
            const { url_string, with_Cookies } = input;
            const data = await fetch(
                env.WORKFLOW_NOVEL_HANDLER_URL + "/decompose_url",
                { method: "POST", body: JSON.stringify({ url_string, with_Cookies })},
            ).then(res => res.json()) as DecomposedURL[];
            return data;
        }),
});
