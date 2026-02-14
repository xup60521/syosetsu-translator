import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        GOOGLE_CLIENT_SECRET: z.string(),
        BETTER_AUTH_BASE_URL: z.url(),
        WORKFLOW_NOVEL_HANDLER_URL: z.url(),
        BETTER_AUTH_SECRET: z.string(),
        ENCRYPTION_KEY: z.string(),
        DATABASE_URL: z.string(),
        QSTASH_URL: z.url(),
        QSTASH_TOKEN: z.string(),
        QSTASH_CURRENT_SIGNING_KEY: z.string(),
        QSTASH_NEXT_SIGNING_KEY: z.string(),
        UPSTASH_REDIS_REST_URL: z.url(),
        UPSTASH_REDIS_REST_TOKEN: z.string(),
        
    },

    /**
     * The prefix that client-side variables must have. This is enforced both at
     * a type-level and at runtime.
     */
    clientPrefix: "VITE_",

    client: {
        VITE_GOOGLE_CLIENT_ID: z.string(),
        VITE_GOOGLE_APP_ID: z.string(),
    },

    /**
     * What object holds the environment variables at runtime. This is usually
     * `process.env` or `import.meta.env`.
     */
    runtimeEnv: {
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        BETTER_AUTH_BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.BETTER_AUTH_BASE_URL,
        WORKFLOW_NOVEL_HANDLER_URL: process.env.WORKFLOW_NOVEL_HANDLER_URL!,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        QSTASH_URL: process.env.QSTASH_URL,
        QSTASH_TOKEN: process.env.QSTASH_TOKEN,
        QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
        QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
        VITE_GOOGLE_APP_ID: process.env.VITE_GOOGLE_APP_ID,
    },

    /**
     * By default, this library will feed the environment variables directly to
     * the Zod validator.
     *
     * This means that if you have an empty string for a value that is supposed
     * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
     * it as a type mismatch violation. Additionally, if you have an empty string
     * for a value that is supposed to be a string with a default value (e.g.
     * `DOMAIN=` in an ".env" file), the default value will never be applied.
     *
     * In order to solve these issues, we recommend that all new projects
     * explicitly specify this option as true.
     */
    emptyStringAsUndefined: true,
});
