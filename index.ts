import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { replaceTextInFiles } from "./replace";
import { translation } from "./translation";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { state } from "./state";

// const model = google("gemini-2.0-pro-exp-02-05");
// const ollama = createOllama({
//     baseURL: "http://127.0.0.1:11434/api"
// });
// const model = ollama("llama3.1:latest")

// Function to prompt the user
async function main() {
    const options = [
        {
            name: "Translate from URLs",
            value: "translate",
        },
        {
            name: "Replace Words",
            value: "replace",
        },
    ];

    const answers = await select({
        message: "Please select an option:",
        choices: options,
    });

    switch (answers) {
        case "translate":
            let translation_is_done = false;
            while (!translation_is_done) {

                const { model, provider } = await selectModel();
                const divideLine = await input({
                    message: "Please enter a divideLine number (default to 50)",
                    default: "50",
                });
                if (Number.isNaN(Number(divideLine))) {
                    throw new Error("Please enter a real number");
                } else if (Number(divideLine) <= 0) {
                    throw new Error("The number should be greater then 0");
                }
                const inputQuestion = {
                    type: "input",
                    name: "inputValues",
                    message: "Enter URLs (separated by spaces):",
                };
                if (state.value === "") {
                    const inputAnswer = await input(inputQuestion);
                    state.update(inputAnswer)
                }
                const autoRetry = await confirm({
                    message: "Auto Retry?",
                    default: false
                })
                const inputAnswerArr = state.value.split(" ");
                if (provider === "groq") {
                    translation_is_done = await translation(inputAnswerArr, model, Number(divideLine), autoRetry, 60_000);
                } else {
                    translation_is_done = await translation(inputAnswerArr, model, Number(divideLine), autoRetry);
                }
            }

            break;
        case "replace":
            await new Promise((resolve) =>
                setTimeout(() => resolve(undefined), 100)
            );
            replaceTextInFiles();
            break;
        default:
            break;
    }
}

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

async function selectModel() {
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
                },{
                    name: "gemini-1.5-flash-8b-latest",
                    value: "gemini-1.5-flash-8b-latest"
                },
                {
                    name: "gemini-1.5-pro-latest",
                    value: "gemini-1.5-pro-latest"
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

main();
