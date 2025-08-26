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

export async function input_with_cookies_or_not(props?: { default: boolean }) {
    return await confirm({
        message: "Use cookies for translation?",
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
        // } else if (provider === "ollama") {
        //     let ollama_url = await select({
        //         message: "Please select the Ollama URL",
        //         choices: [
        //             {
        //                 name: "Local (http://localhost:11434/api)",
        //                 value: "http://localhost:11434/api",
        //             },
        //             {
        //                 name: "Hamachi (http://25.37.31.169:11434/api)",
        //                 value: "http://25.37.31.169:11434/api",
        //             },
        //             {
        //                 name: "Custom URL",
        //                 value: "custom",
        //             },
        //         ],
        //     });
        //     if (ollama_url === "custom") {
        //         ollama_url = await input({
        //             message: "Please enter the Ollama URL",
        //             validate: (input) => {
        //                 if (
        //                     input.startsWith("http://") ||
        //                     input.startsWith("https://")
        //                 ) {
        //                     return true;
        //                 }
        //                 return "Please enter a valid URL starting with http:// or https://";
        //             },
        //         });
        //     }
        //     const ollama = createOllama({
        //         baseURL: ollama_url,
        //     });
        //     const modelList = (
        //         await fetch(ollama_url + "/tags").then((res) => res.json())
        //     ).models.map(({ model }: { model: string }) => ({
        //         name: model,
        //         value: model,
        //     })) as { name: string; value: string }[];
        //     const modelId = await select({
        //         message: "Please select a model",
        //         choices: modelList,
        //     });
        //     return {
        //         model: ollama.languageModel(modelId) as LanguageModelV1,
        //         provider: "ollama",
        //     };
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
        return 10_000; // 10 seconds
    }
    if (modelId.includes("gemma")) {
        return 2_000; // 2 seconds
    }
    if (modelId.includes("qwen/qwq-32b:free")) {
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

export function getTranslationPrompt(props: {
    similarity_retry_count: number;
    modelId: string;
    provider: string;
}) {
    const { similarity_retry_count } = props;
    const modelId = props.modelId as ModelIdType;
    const provider = props.provider as (typeof providerOption)[number]["value"];
    if (
        modelId === "llama-3.3-70b-versatile" ||
        modelId === "gemini-2.5-flash-lite" ||
        modelId === "openai/gpt-oss-120b" ||
        modelId === "openai/gpt-oss-20b" ||
        modelId === "openai/gpt-oss-20b:free" ||
        mistralAIModelList.map((d) => d.value as string).includes(modelId) ||
        modelId === "moonshotai/kimi-k2-instruct" ||
        modelId === "moonshotai/kimi-k2:free" ||
        modelId === "gemini-2.5-flash" ||
        provider === "cerebras"
    ) {
        return oddTranslationPrompt(similarity_retry_count);
    }
    return evenTranslationPrompt(similarity_retry_count);
}

function evenTranslationPrompt(similarity_retry_count: number) {
    if (similarity_retry_count % 2 === 0) {
        return ch_prompt;
    }
    return en_prompt;
}

export function oddTranslationPrompt(similarity_retry_count: number) {
    if (similarity_retry_count % 2 === 1) {
        return ch_prompt;
    }
    return en_prompt;
}

const ch_prompt = `# 指令：
            請將以下日文文章翻譯成台灣常用的繁體中文。我會在接下來的訊息提供文章。

            # 翻譯規則：
            1.  文章內的所有日文**人名**與**專有名詞**（例如地名、組織名、品牌名等）必須**保留日文原文**，請勿翻譯。
            2.  其餘內容需翻譯成通順自然的台灣繁體中文。

            # 輸出要求：
            直接輸出翻譯後的完整文章，不要包含任何說明、標題或原文。

            # 其他注意事項
            請再三確認翻譯的內容符合上述規則，並且沒有遺漏任何重要信息，否則我會很傷心，請多加注意。`;

const en_prompt = `You are a professional translator who thoroughly understand the context and make the best decision in translating Japanese articles into traditional Chinese (Taiwan). Generally, when it comes to proper nouns like name, place or special items, there is often no official transltion. Therefore, you tend to keep their original Japanese forms. The article will be provided later on and make sure the output only contain the translated content without additional descriptive words.
After the translation is done, re-check the result and keep:

1. The article is indeed translated into traditional Chinese (Taiwan).
2. Proper nouns are in their original Japanese form.

Now you understand the translation rule, here's the instruction of how you will translate the article.

1. Go through the entire article and understand what it says. Don't translate yet.
2. Identify the proper nouns and understand the context around them. Don't translate yet.
3. Around the proper nouns, based on the understanding of the context, now you can translate the article without changing proper nouns. (keep proper nouns their original form).
4. Revise the translation result. If you accidentally translate the proper nouns, this is the chance you can fix it. If the proper noun is in Japanese, you should keep it in its original Japanese form.
5. If somehow the article is entirely untranslated, please go back to step 1 and make sure to actually translate the article this time.

The article will be presented in the following section.`;

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
    return result;
}
