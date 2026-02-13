import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

import { URLPattern } from "urlpattern-polyfill";
import { load } from "cheerio";
import { decomposeURL, novel_handler } from "@repo/shared/server";


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
            return await novel_handler(url, {
                with_Cookies: with_Cookies,
            });
        }),
    decompose_url: publicProcedure
        .input(
            z.object({
                url_string: urlSchema,
                with_Cookies: z.boolean().optional().default(false),
            }),
        )
        .query(async ({ input }) => {
            return await decomposeURL(input)
        }),
});
