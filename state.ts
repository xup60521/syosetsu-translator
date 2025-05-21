import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";

const default_divide_line = 50;

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

class URL_State {
    url_string = "";
    set_url_string = (e: string) => {
        this.url_string = e;
    };

}

class State {
    model = undefined as undefined | LanguageModelV1;
    provider = undefined as undefined | string;
    divide_line = default_divide_line;
    auto_retry = false;
    input_auto_retry = async () => {
        this.auto_retry = await confirm({
            message: "Auto Retry?",
            default: false,
        });
    };
    input_divide_line = async () => {
        this.divide_line = z.number().positive().parse(
            Number(await input({
                message: "Please enter a divideLine number (default to 50)",
                default: "50",
            }))
        );
    };
    selectModel = async () => {
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
                        name: "gemini-1.5-pro-latest",
                        value: "gemini-1.5-pro-latest",
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
                        name: "gemini-2.0-flash-exp-image-generation",
                        value: "gemini-2.0-flash-exp-image-generation",
                    },
                    {
                        name: "gemini-2.0-flash-001",
                        value: "gemini-2.0-flash-001",
                    },
                    {
                        name: "gemini-2.0-flash-lite-001",
                        value: "gemini-2.0-flash-lite-001",
                    },
                    {
                        name: "gemini-2.5-pro-exp-03-25",
                        value: "gemini-2.5-pro-exp-03-25",
                    },
                    {
                        name: "gemini-2.5-flash-preview-04-17",
                        value: "gemini-2.5-flash-preview-04-17",
                    },
                ],
            });
            this.model = google(model);
            this.provider = "google";
            return;
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
            this.model = openai(model) as LanguageModelV1;
            this.provider = "openai";
            return;
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
            this.model = groq(model) as LanguageModelV1;
            this.provider = "groq";
            return;
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
            this.model = openrouter.chat(model) as LanguageModelV1;
            this.provider = "openrouter";
            return;
        } else {
            throw new Error("Model is not specified");
        }
    };
}

export const state = new State();
export const url_state = new URL_State()