import { input, number, search, select } from "@inquirer/prompts";
import type { supportedProvider } from "@repo/shared";
import {
    batchTranslate,
    decomposeURL,
    getProvider,
    modelList,
    novel_handler,
} from "@repo/shared/server";
import fs from "fs/promises";
import { save_file } from "./save_file";
import cliProgress from "cli-progress";
import pRetry from "p-retry";
import { chunkArray } from "@repo/shared/server";

type ProviderType = (typeof supportedProvider)[number]["value"];

export async function translate_from_URL({url_string}:{url_string: string}) {
    const provider = (await select({
        message: "Select a provider",
        choices: Object.keys(modelList),
    })) as ProviderType;
    const getter = modelList[provider];
    if (!getter) {
        throw new Error(`Provider: ${provider} is not supported`);
    }
    const api_key = await getApiKey(provider);
    const model_id = await search({
        message: "Select a model",
        source: async (input) =>
            (await getter()).filter(({ value }) =>
                input ? value.includes(input) : true,
            ),
    });
    const model = getProvider(provider, api_key)(model_id);
    const concurrency = await number({
        message: "Concurrency",
        default: 1,
        min: 1,
        required: true,
    });
    const batch_size = await number({
        message: "Batch size",
        default: 5,
        min: 1,
        required: true,
    });
    const start_from = await number({
        message: "Start from batch number",
        default: 1,
        min: 1,
        required: true,
    })
    const urls = (await decomposeURL({ url_string })).map((d) => d.url);
    const unfinish_urls = structuredClone(urls)
    const batches = [] as string[][];
    const total = urls.length;
    for (let i = 0; i < urls.length; i += batch_size) {
        batches.push(urls.slice(i, i + batch_size));
    }
    let totalProcessed = start_from - 1;
    const progress_bar = new cliProgress.SingleBar(
        {},
        cliProgress.Presets.legacy,
    );
    progress_bar.start(total, totalProcessed);

    const concurrent_batches = chunkArray(batches, concurrency);
    try {
		for (let batches_index = start_from  - 1; batches_index < concurrent_batches.length; batches_index++) {
			const batches = concurrent_batches[batches_index]!;
            await Promise.all(
                batches.map(async (batch, batch_index) => {
                    await pRetry(
                        async () => {
                            const currentBatch = batch;
                            // console.log(`Processing batch ${i}`);
        
                            await batchTranslate(
                                {
                                    urls: currentBatch,
                                    model_id,
                                    with_Cookies: false,
                                    provider,
                                    model,
                                    folder_id: "output",
                                },
                                novel_handler,
                                save_file,
                            );
                            urls.forEach(item => {
                                const index = unfinish_urls.indexOf(item)
                                if (index !== -1) {
                                    unfinish_urls.splice(index, 1)
                                }
                            })
                            totalProcessed += currentBatch.length;
                            progress_bar.update(totalProcessed);
                        },
                        {
                            retries: 3,
                            onFailedAttempt: (err) => {
                                console.log(
                                    `Attempt ${err.attemptNumber} failed. ${err.retriesLeft} retries left.`,
                                );
                            },
                        },
                    );
        
                    // console.log(totalProcessed, total)
                }),
            );
        }
    
        progress_bar.stop();
    } catch (err) {
        console.error("Translation failed. Error:\n", err)
        const option = await select({
            message:"What do you want to do?",
            choices: [{
                name: "Retry unfinished urls",
                value: "retry"
            }, {
                name: "Exit",
                value: "exit"
            }] as const
        })
        if (option === "retry") {
                return translate_from_URL({url_string: unfinish_urls.join(" ")});
        }
    }
}

async function getApiKey(provider: ProviderType) {
    const message = "Select an API key";
    if (provider === "cerebras") {
        return await select({
            message,
            choices: [{ name: "cerebras", value: process.env.CEREBRAS_KEY! }],
        });
    }
    if (provider === "google-ai-studio") {
        return await select({
            message,
            choices: [
                {
                    name: "Default 0",
                    value: process.env.GEMINI_KEY_0!,
                },
                {
                    name: "Default 1",
                    value: process.env.GEMINI_KEY_0_1!,
                },
                {
                    name: "Default 2",
                    value: process.env.GEMINI_KEY_0_2!,
                },
                {
                    name: "Secondary",
                    value: process.env.GEMINI_KEY_1!,
                },
                {
                    name: "Thirdly",
                    value: process.env.GEMINI_KEY_2!,
                },
            ],
        });
    }
    if (provider === "groq") {
        return await select({
            message,
            choices: [{ name: "groq", value: process.env.GROQ_KEY! }],
        });
    }
    if (provider === "mistral") {
        return await select({
            message,
            choices: [{ name: "mistral", value: process.env.MISTRAL_KEY! }],
        });
    }
    if (provider === "openrouter") {
        return await select({
            message,
            choices: [
                { name: "openrouter", value: process.env.OPENROUTER_KEY! },
            ],
        });
    }
    throw new Error(`Provider '${provider}' is not implemented.`);
}

export async function input_url_string() {
    let url_string = await input({
        message:
            "Please enter the URLs (separated by spaces) (leave blank to read from urls.txt)",
        validate: (input) => {
            if (input === "") {
                return true;
            }
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
    if (url_string === "") {
        url_string = await fs.readFile("./urls.txt", "utf-8");
    }
    return url_string;
}
