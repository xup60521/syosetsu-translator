import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/auth-schema";
import { db } from "@/server/db/index";
import { env } from "@/env";

export const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET!,
    baseUrl: env.BETTER_AUTH_BASE_URL!,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    session: {
        additionalFields: {
            providerId: {
                type: "string",
                input: false,
            }
        }
    },
    socialProviders: {
        google: {
            clientId: env.VITE_GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            scope: [
                "openid",
                "profile",
                "email",
                "https://www.googleapis.com/auth/drive",
            ],
            // 正確的配置方式：直接放在 google 物件下
            accessType: "offline",
            prompt: "consent",
        },
    },
    databaseHooks: {
        session: {
            create: {
                before: async (session, ctx) => {
                    
                }
                
            },
        },
    },
});
