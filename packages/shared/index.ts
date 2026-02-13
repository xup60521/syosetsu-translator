
export type * from "./lib/type"

export const supportedProvider = [
    { value: "google-ai-studio", label: "Google AI Studio" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "mistral", label: "MistralAI" },
    { value: "cerebras", label: "Cerebras" },
    { value: "groq", label: "Groq" },
] as const;

