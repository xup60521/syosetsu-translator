import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";
import {
    providerOption,
    googleModelList,
    openaiModelList,
    groqModelList,
    openRouterModelList,
} from "./model_list";

const default_divide_line = 30;

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
        .positive()
        .parse(
            Number(
                await input({
                    message:
                        "Please enter a divideLine number (default to " +
                        default_divide_line +
                        ")",
                    default: String(default_divide_line),
                })
            )
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
    } else {
        throw new Error("Model is not specified");
    }
}

export async function input_url_string() {
    const inputQuestion = {
        type: "input",
        name: "inputValues",
        message: "Enter URLs (separated by spaces):",
    };
    return await input(inputQuestion);
}

export async function input_start_from() {
    return z
        .number()
        .positive()
        .parse(
            Number(
                await input({
                    message: "Start from (default to " + 1 + ")",
                    default: "1",
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
        return 2_000; // 2 seconds
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
