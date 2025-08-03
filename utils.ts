import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { select, input, confirm, number } from "@inquirer/prompts";
import { createOllama } from "ollama-ai-provider";
import { z } from "zod";
import {
    providerOption,
    googleModelList,
    openaiModelList,
    groqModelList,
    openRouterModelList,
} from "./model_list";

const default_divide_line = 30;

export async function input_with_cookies_or_not() {
    return await confirm({
        message: "Use cookies for translation?",
        default: false,
    });
}

export async function input_retry_or_stop() {
    return await select({
        message: "Retry or Stop",
        choices: [
            {
                name: "Retry",
                value: "retry",
            },
            {
                name: "Retry (auto-retry)",
                value: "auto-retry",
            },
            {
                name: "Skip this one",
                value: "skip",
            },
            {
                name: "Stop",
                value: "stop",
            },
            {
                name: "Change Provider",
                value: "change_provider",
            },
        ],
    });
}

export async function input_auto_retry() {
    return await confirm({
        message: "Auto Retry?",
        default: false,
    });
}

export async function input_divide_line() {
    return z
        .number()
        .min(1)
        .default(default_divide_line)
        .parse(
            await number({
                message:
                    "Please enter a divideLine number (default to " +
                    default_divide_line +
                    ")",
                default: default_divide_line,
                validate: (input) => {
                    // only greater than 0 is allowed
                    const value = Number(input);
                    if (isNaN(value) || value < 1) {
                        return "Please enter a valid number greater than 0";
                    }
                    return true;
                },
            })
        );
}

export async function input_select_model() {
    const provider = await select({
        message: "Please select the provider",
        choices: providerOption,
    });

    if (provider === "google") {
        const key = await select({
            message: "Please select the API key",
            choices: [
                {
                    name: "Default",
                    value: 0,
                },
                {
                    name: "Secondary",
                    value: 1,
                },
                {
                    name: "Thirdly",
                    value: 2,
                },
            ],
        });
        const google = createGoogleGenerativeAI({
            apiKey:
                key === 0
                    ? process.env.GEMINI_KEY_0!
                    : key === 1
                    ? process.env.GEMINI_KEY_1!
                    : key === 2
                    ? process.env.GEMINI_KEY_2!
                    : "",
        });
        const model = await select({
            message: "Please select a model",
            choices: googleModelList,
        });
        return { model: google(model), provider: "google" };
    } else if (provider === "openai") {
        const openai = createOpenAI({
            apiKey: process.env.OPENAI_KEY!,
            compatibility: "strict",
        });
        const model = await select({
            message: "Please select a model",
            choices: openaiModelList,
        });
        return { model: openai(model) as LanguageModelV1, provider: "openai" };
    } else if (provider === "groq") {
        const groq = createGroq({
            apiKey: process.env.GROQ_KEY!,
        });
        const model = await select({
            message: "Please select a model",
            choices: groqModelList,
        });
        return { model: groq(model) as LanguageModelV1, provider: "groq" };
    } else if (provider === "openrouter") {
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_KEY,
        });
        const modelId = await select({
            message: "Please select a model",
            choices: openRouterModelList,
        });
        return {
            model: openrouter.languageModel(modelId) as LanguageModelV1,
            provider: "openrouter",
        };
    } else if (provider === "ollama") {
        let ollama_url = await select({
            message: "Please select the Ollama URL",
            choices: [
                {
                    name: "Local (http://localhost:11434/api)",
                    value: "http://localhost:11434/api",
                },
                {
                    name: "Hamachi (http://25.37.31.169:11434/api)",
                    value: "http://25.37.31.169:11434/api",
                },
                {
                    name: "Custom URL",
                    value: "custom",
                },
            ],
        });
        if (ollama_url === "custom") {
            ollama_url = await input({
                message: "Please enter the Ollama URL",
                validate: (input) => {
                    if (
                        input.startsWith("http://") ||
                        input.startsWith("https://")
                    ) {
                        return true;
                    }
                    return "Please enter a valid URL starting with http:// or https://";
                },
            });
        }
        const ollama = createOllama({
            baseURL: ollama_url,
        });
        const modelList = (
            await fetch(ollama_url + "/tags").then((res) => res.json())
        ).models.map(({ model }: { model: string }) => ({
            name: model,
            value: model,
        })) as { name: string; value: string }[];
        const modelId = await select({
            message: "Please select a model",
            choices: modelList,
        });
        return {
            model: ollama.languageModel(modelId) as LanguageModelV1,
            provider: "ollama",
        };
    } else {
        throw new Error("Model is not specified");
    }
}

export async function input_url_string() {
    return await input({
        message: "Please enter the URLs (separated by spaces)",
        validate: (input) => {
            const urls = input.split(" ").filter((url) => url.trim() !== "");
            if (urls.length === 0) {
                return "Please enter at least one URL";
            }
            for (const url of urls) {
                try {
                    new URL(url);
                } catch {
                    return `Invalid URL: ${url}`;
                }
            }
            return true;
        },
    });
}

export async function input_start_from() {
    return z
        .number()
        .positive()
        .min(1)
        .default(1)
        .parse(
            Number(
                await number({
                    message: "Start from (default to " + 1 + ")",
                    default: 1,
                    validate: (input) => {
                        const value = Number(input);
                        if (isNaN(value) || value < 1) {
                            return "Please enter a valid number greater than 0";
                        }
                        return true;
                    },
                })
            )
        );
}

export function getDefaultModelWaitTime(props: {
    model: LanguageModelV1;
    provider: string;
}) {
    const { model, provider } = props;
    if (provider === "groq") {
        return 10_000; // 10 seconds
    }
    if (model.modelId === "gemini-2.5-flash-lite") {
        return 10_000; // 10 seconds
    }
    if (model.modelId.includes("gemma")) {
        return 2_000; // 2 seconds
    }
    if (model.modelId.includes("qwen/qwq-32b:free")) {
        // 1 min
        return 60_000; // 60 seconds
    }
    return undefined; // No wait time
}

export function checkContentIfTranslatedOrNot({
    originalContent,
    translatedContent,
}: {
    originalContent: string;
    translatedContent: string;
}) {
    // Create a regex that delete all white-space, newline, tabs, etc. Only keep the english, japanese, and chinese characters.
    const regex = /[^\u4e00-\u9fa5a-zA-Z0-9]+/g;
    const original = originalContent.replace(regex, "");
    const translated = translatedContent.replace(regex, "");
    return original !== translated;
}
