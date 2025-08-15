export type ModelIdType =
    | (typeof googleModelList)[number]["value"]
    | (typeof geminiCLIModelList)[number]["value"]
    | (typeof openaiModelList)[number]["value"]
    | (typeof groqModelList)[number]["value"]
    | (typeof openRouterModelList)[number]["value"]
    | (typeof mistralAIModelList)[number]["value"];

export const providerOption = [
    {
        name: "Google",
        value: "google",
    },
    {
        name: "Gemini-CLI",
        value: "gemini-cli",
    },
    {
        name: "OpenAI",
        value: "openai",
    },
    {
        name: "Groq",
        value: "groq",
    },
    {
        name: "OpenRouter",
        value: "openrouter",
    },
    // {
    //     name: "Ollama",
    //     value: "ollama",
    // },
    {
        name: "Mistral AI",
        value: "mistral-ai",
    },
] as const;

export const googleModelList = [
    // // 1.5
    // {
    //     name: "gemini-1.5-flash-latest",
    //     value: "gemini-1.5-flash-latest",
    // },
    // {
    //     name: "gemini-1.5-flash-8b-latest",
    //     value: "gemini-1.5-flash-8b-latest",
    // },
    // 2.0
    {
        name: "gemini-2.0-flash-thinking-exp-01-21",
        value: "gemini-2.0-flash-thinking-exp-01-21",
    },
    {
        name: "gemini-2.0-flash-preview-image-generation",
        value: "gemini-2.0-flash-preview-image-generation",
    },
    {
        name: "gemini-2.0-flash",
        value: "gemini-2.0-flash",
    },
    {
        name: "gemini-2.0-flash-lite",
        value: "gemini-2.0-flash-lite",
    },
    {
        name: "gemini-2.0-pro-exp-02-05",
        value: "gemini-2.0-pro-exp-02-05",
    },
    // 2.5
    {
        name: "gemini-2.5-flash",
        value: "gemini-2.5-flash",
    },
    {
        name: "gemini-2.5-flash-lite",
        value: "gemini-2.5-flash-lite",
    },
    {
        name: "gemini-2.5-pro",
        value: "gemini-2.5-pro",
    },
    // Gemma 3 & 3n
    {
        name: "gemma-3n-e4b-it",
        value: "gemma-3n-e4b-it",
    },
    {
        name: "gemma-3-12b-it",
        value: "gemma-3-12b-it",
    },
    {
        name: "gemma-3-27b-it",
        value: "gemma-3-27b-it",
    },
] as const;

export const geminiCLIModelList = [
    {
        name: "gemini-2.5-flash",
        value: "gemini-2.5-flash",
    },
    // gemini-2.5-pro
    {
        name: "gemini-2.5-pro",
        value: "gemini-2.5-pro",
    },
] as const;

export const openaiModelList = [
    { name: "o3-mini-2025-01-31", value: "o3-mini-2025-01-31" },
    {
        name: "gpt-4o-mini-2024-07-18",
        value: "gpt-4o-mini-2024-07-18",
    },
] as const;

export const groqModelList = [
    // moonshotai/kimi-k2-instruct
    {
        name: "moonshotai/kimi-k2-instruct",
        value: "moonshotai/kimi-k2-instruct",
    },
    // openai/gpt-oss-120b
    {
        name: "openai/gpt-oss-120b",
        value: "openai/gpt-oss-120b",
    },
    // openai/gpt-oss-20b
    {
        name: "openai/gpt-oss-20b",
        value: "openai/gpt-oss-20b",
    },
    {
        name: "llama-3.3-70b-versatile",
        value: "llama-3.3-70b-versatile",
    },
    {
        name: "llama-3.1-8b-instant",
        value: "llama-3.1-8b-instant",
    },
    // llama3-70b-8192
    {
        name: "llama3-70b-8192",
        value: "llama3-70b-8192",
    },
    {
        name: "meta-llama/llama-4-maverick-17b-128e-instruct",
        value: "meta-llama/llama-4-maverick-17b-128e-instruct",
    },
    {
        name: "meta-llama/llama-4-scout-17b-16e-instruct",
        value: "meta-llama/llama-4-scout-17b-16e-instruct",
    },
    {
        name: "compound-beta",
        value: "compound-beta",
    },
    // qwen/qwen3-32b
    {
        name: "qwen/qwen3-32b",
        value: "qwen/qwen3-32b",
    },
    // deepseek-r1-distill-llama-70b
    {
        name: "deepseek-r1-distill-llama-70b",
        value: "deepseek-r1-distill-llama-70b",
    },
] as const;

export const openRouterModelList = [
    // openai/gpt-oss-20b:free
    {
        name: "openai/gpt-oss-20b:free",
        value: "openai/gpt-oss-20b:free",
    },
    {
        name: "moonshotai/kimi-k2:free",
        value: "moonshotai/kimi-k2:free",
    },
    // deepseek/deepseek-chat-v3-0324:free
    {
        name: "deepseek/deepseek-chat-v3-0324:free",
        value: "deepseek/deepseek-chat-v3-0324:free",
    },
    // deepseek/deepseek-r1-distill-llama-70b:free
    {
        name: "deepseek/deepseek-r1-distill-llama-70b:free",
        value: "deepseek/deepseek-r1-distill-llama-70b:free",
    },
    // qwen/qwen3-coder:free
    {
        name: "qwen/qwen3-coder:free",
        value: "qwen/qwen3-coder:free",
    },
    // qwen/qwen3-235b-a22b:free
    {
        name: "qwen/qwen3-235b-a22b:free",
        value: "qwen/qwen3-235b-a22b:free",
    },
    // microsoft/mai-ds-r1:free
    {
        name: "microsoft/mai-ds-r1:free",
        value: "microsoft/mai-ds-r1:free",
    },
    // z-ai/glm-4.5-air:free
    {
        name: "z-ai/glm-4.5-air:free",
        value: "z-ai/glm-4.5-air:free",
    },
] as const;

export const mistralAIModelList = [
    {
        name: "Mistral Large 2.1",
        value: "mistral-large-2411",
    },
    {
        name: "Mistral Medium 3",
        value: "mistral-medium-2505",
    },
    {
        name: "Mistral Medium 3.1",
        value: "mistral-medium-2508",
    },
    {
        name: "Magistral Medium 1.1",
        value: "magistral-medium-2507",
    },
    {
        name: "Magistral Medium 1",
        value: "magistral-medium-2506",
    },
    {
        name: "Mistral Small 2",
        value: "mistral-small-2407",
    },
    {
        name: "Ministral 8B",
        value: "ministral-8b-2410",
    },
    {
        name: "Magistral Small 1",
        value: "magistral-small-2506",
    },
    {
        name: "Mistral Small 3.1",
        value: "mistral-small-2503",
    },
    {
        name: "Mistral Small 3",
        value: "mistral-small-2501",
    },
    {
        name: "Mistral Nemo 12B",
        value: "open-mistral-nemo",
    },
] as const;
