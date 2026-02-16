import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createCerebras } from "@ai-sdk/cerebras";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter, type LanguageModelV3 } from "@openrouter/ai-sdk-provider";
import type { SupportedProviderType } from ".."
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export function getProvider(
    provider: SupportedProviderType,
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
    if (provider === "openai") {
        return createOpenAI({apiKey: decrypted_api_key})
    }
    if (provider === "anthropic") {
        return createAnthropic({apiKey: decrypted_api_key})
    }
    throw new Error(`Provider '${provider}' is not implemented.`);
}