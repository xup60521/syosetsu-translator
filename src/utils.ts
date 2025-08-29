import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { select, input, confirm, number } from "@inquirer/prompts";
import { createMistral } from "@ai-sdk/mistral";
import { createCerebras } from "@ai-sdk/cerebras";
// import { createOllama } from "ollama-ai-provider";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";
import { z } from "zod";
import {
    providerOption,
    googleModelList,
    openaiModelList,
    groqModelList,
    openRouterModelList,
    geminiCLIModelList,
    type ModelIdType,
    mistralAIModelList,
    cerebrasModelList,
} from "./model_list";

const default_divide_line = 30;

export const windowsFileEscapeRegex = /[<>:"/\\|?*]/g;

export async function input_with_cookies_or_not(props?: { default: boolean, custom_message?: string }) {
    return await confirm({
        message: props?.custom_message || "Use cookies for translation?",
        default: props?.default,
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
                name: "Retry (with cookies)",
                value: "retry_with_cookies",
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
        ] as const,
    });
}

export async function input_auto_retry() {
    return await confirm({
        message: "Auto Retry?",
        default: false,
    });
}

export async function input_divide_line(modelId?: string) {
    let divide_line = default_divide_line;
    const model_id = modelId as ModelIdType;
    if (
        model_id === "llama-3.3-70b-versatile" ||
        model_id === "llama3-70b-8192" ||
        model_id === "llama-3.3-70b" ||
        model_id === "gpt-oss-120b" ||
        model_id === "openai/gpt-oss-120b"
    ) {
        divide_line = 45;
    } else if (
        model_id === "gemini-2.5-flash" ||
        model_id === "moonshotai/kimi-k2-instruct" ||
        model_id === "moonshotai/kimi-k2:free"
    ) {
        divide_line = 60;
    }
    return z
        .number()
        .min(1)
        .default(divide_line)
        .parse(
            await number({
                message:
                    "Please enter a divideLine number (default to " +
                    divide_line +
                    ")",
                default: divide_line,
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
    } else if (provider === "gemini-cli") {
        const gemini = createGeminiProvider({
            authType: "oauth-personal",
        });
        const model = await select({
            message: "Please select a model",
            choices: geminiCLIModelList,
        });
        return {
            model: gemini(model) as LanguageModelV1,
            provider: "gemini-cli",
        };
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
    } else if (provider === "mistral-ai") {
        const mistral = createMistral({
            apiKey: process.env.MISTRAL_KEY,
        });
        const modelId = await select({
            message: "Please select a model",
            choices: mistralAIModelList,
        });
        return {
            model: mistral.languageModel(modelId) as LanguageModelV1,
            provider: "mistral-ai",
        };
    } else if (provider === "cerebras") {
        const cerebras = createCerebras({
            apiKey: process.env.CEREBRAS_KEY,
        });
        const modelId = await select({
            message: "Please select a model",
            choices: cerebrasModelList,
        });
        return {
            model: cerebras.languageModel(modelId) as LanguageModelV1,
            provider: "cerebras",
        };
    } else {
        throw new Error("Model is not specified");
    }
}

export async function input_one_or_two_step_translation() {
    return await select({
        message: "One-step or Two-step translation?",
        choices: [
            {
                name: "One-step",
                value: "one-step",
            },
            {
                name: "Two-step",
                value: "two-step",
            },
        ] as const,
    });
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

export function getModelWaitTime(props: {
    modelId: string;
    provider: string;
}) {
    const provider = props.provider as (typeof providerOption)[number]["value"];
    const modelId = props.modelId as ModelIdType;
    if (provider === "groq" && modelId === "openai/gpt-oss-120b") {
        return 20_000; // 20 seconds
    }
    if (provider === "cerebras") {
        return 3_000; // 3 seconds
    }
    if (modelId === "deepseek-r1-distill-llama-70b") {
        return 30_000; // 30 seconds
    }
    if (modelId === "gemini-2.5-flash-lite") {
        return 2_000; // 2 seconds
    }
    if (modelId.includes("gemma")) {
        return 2_000; // 2 seconds
    }
    if (modelId.includes("qwen/qwq-32b:free")) {
        // 1 min
        return 60_000; // 60 seconds
    }
    if (modelId === "llama-3.3-70b-versatile" || modelId === "llama-3.3-70b" || modelId === "llama3-70b-8192") {
        return 3_000; // 3 seconds
    }
    return undefined; // No wait time
}

export type ResultType<T, E> =
    | {
          success: true;
          value: T;
      }
    | {
          success: false;
          error: E;
      };

export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
    if (chunkSize <= 0) {
        throw new Error("Chunk size must be a positive number.");
    }

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
    }
    // If the last chunk is shorter than the previous, merge the last two chunks
    if (
        result.length > 1 &&
        result[result.length - 1].length < result[result.length - 2].length
    ) {
        const last = result.pop()!;
        result[result.length - 1] = result[result.length - 1].concat(last);
    }
    return result;
}