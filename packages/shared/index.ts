import type { modelList } from "./server";

export type * from "./lib/type";

// value should match modelList key
export const supportedProvider = [
    { value: "google-ai-studio", label: "Google AI Studio" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "mistral", label: "MistralAI" },
    { value: "cerebras", label: "Cerebras" },
    { value: "groq", label: "Groq" },
    { value: "anthropic", label: "Anthropic" },
    { value: "openai", label: "OpenAI" },
] as (Record<"value", keyof typeof modelList> & Record<"label", string>)[];

export type SupportedProviderType = (typeof supportedProvider)[number]["value"];
