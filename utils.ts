import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";

const default_divide_line = 30;

const providerOption = [
    {
        name: "Google",
        value: "google",
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
];

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
            choices: [
                {
                    name: "gemini-1.5-flash-latest",
                    value: "gemini-1.5-flash-latest",
                },
                {
                    name: "gemini-1.5-flash-8b-latest",
                    value: "gemini-1.5-flash-8b-latest",
                },
                {
                    name: "gemini-2.0-flash-thinking-exp-01-21",
                    value: "gemini-2.0-flash-thinking-exp-01-21",
                },
                {
                    name: "gemini-2.0-pro-exp-02-05",
                    value: "gemini-2.0-pro-exp-02-05",
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
                    name: "gemini-2.5-pro-exp-03-25",
                    value: "gemini-2.5-pro-exp-03-25",
                },
                {
                    name: "gemini-2.5-flash",
                    value: "gemini-2.5-flash",
                },
                {
                    name: "gemini-2.5-flash-lite-preview-06-17",
                    value: "gemini-2.5-flash-lite-preview-06-17",
                }
            ],
        });
        return { model: google(model), provider: "google" };
    } else if (provider === "openai") {
        const openai = createOpenAI({
            apiKey: process.env.OPENAI_KEY!,
            compatibility: "strict",
        });
        const model = await select({
            message: "Please select a model",
            choices: [
                { name: "o3-mini-2025-01-31", value: "o3-mini-2025-01-31" },
                {
                    name: "gpt-4o-mini-2024-07-18",
                    value: "gpt-4o-mini-2024-07-18",
                },
            ],
        });
        return { model: openai(model) as LanguageModelV1, provider: "openai" };
    } else if (provider === "groq") {
        const groq = createGroq({
            apiKey: process.env.GROQ_KEY!,
        });
        const model = await select({
            message: "Please select a model",
            choices: [
                {
                    name: "llama-3.3-70b-versatile",
                    value: "llama-3.3-70b-versatile",
                },
                {
                    name: "llama-3.1-8b-instant",
                    value: "llama-3.1-8b-instant",
                },
                {
                    name: "meta-llama/llama-4-scout-17b-16e-instruct",
                    value: "meta-llama/llama-4-scout-17b-16e-instruct",
                },
            ],
        });
        return { model: groq(model) as LanguageModelV1, provider: "groq" };
    } else if (provider === "openrouter") {
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_KEY,
        });
        const model = await select({
            message: "Please select a model",
            choices: [
                {
                    name: "openrouter/optimus-alpha",
                    value: "openrouter/optimus-alpha",
                },
            ],
        });
        return {
            model: openrouter.chat(model) as LanguageModelV1,
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
