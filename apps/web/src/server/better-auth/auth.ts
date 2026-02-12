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
    // Debug: 記錄 account 創建時的資料
    // databaseHooks: {
    //     account: {
    //         create: {
    //             before: async (account) => {
    //                 console.log("=== DEBUG: Account Create ===");
    //                 console.log("Provider:", account.providerId);
    //                 console.log("Access Token:", account.accessToken ? "存在" : "NULL");
    //                 console.log("Refresh Token:", account.refreshToken ? "存在" : "NULL");
    //                 console.log("Full Account Data:", JSON.stringify(account, null, 2));
    //                 console.log("=============================");
    //                 // 回傳 undefined 或 void 讓 better-auth 繼續處理
    //                 return;
    //             },
    //         },
    //     },
    // },
});
