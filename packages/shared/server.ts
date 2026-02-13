import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createCerebras } from "@ai-sdk/cerebras";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter, type LanguageModelV3 } from "@openrouter/ai-sdk-provider";
import type { supportedProvider } from "."

export * from "./lib/model_list"

export function getProvider(
    provider: (typeof supportedProvider)[number]["value"],
    decrypted_api_key: string,
) {
    
    if (provider === "google-ai-studio") {
        return createGoogleGenerativeAI({ apiKey: decrypted_api_key });
    }
    if (provider === "cerebras") {
        return createCerebras({ apiKey: decrypted_api_key });
    }
    if (provider === "groq") {
        return createGroq({ apiKey: decrypted_api_key });
    }
    if (provider === "mistral") {
        return createMistral({ apiKey: decrypted_api_key });
    }
    if (provider === "openrouter") {
        return createOpenRouter({ apiKey: decrypted_api_key });
    }
    throw new Error(`Provider '${provider}' is not implemented.`);
}

export * from "./lib/cryptography"
export * from "./lib/batchTranslate"
export * from "./lib/decompose_url"
export * from "./lib/novel_handler/novel_handler"
export * from "./lib/replace"
export * from "./lib/utils"