import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider";
import { createOllama } from "ollama-ai-provider";
import { generateText, type LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { load } from "cheerio";
import { replace_words } from "./replace";
import fs from "node:fs/promises";
import handler from "./novel_handler";
import cliProgress from "cli-progress";
import { select } from "@inquirer/prompts";
import {
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_url_string,
    input_retry_or_stop,
    input_start_from,
} from "./utils";
import { url_string_handler } from "./url_string_handler";
import { handle_file } from "./handle_file";

const multibar = new cliProgress.MultiBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: " {bar} | {filename} | {value}/{total}",
    },
    cliProgress.Presets.shades_grey
);

type TranslationParameter = {
    sleep_ms?: number;
    model: LanguageModelV1;
    provider: string;
    auto_retry: boolean;
    divide_line: number;
    url_string: string;
    start_from: number;
};

export async function translation(params: TranslationParameter) {
    const { sleep_ms, model, provider, divide_line, url_string, start_from } =
        params;
    let { auto_retry } = params;
    const urls = await url_string_handler(url_string);

    let b1 = multibar.create(urls.length, 0);

    let url_index = start_from - 1;
    while (url_index < urls.length) {
        try {
            const novel_url = urls[url_index];
            const [{ series_title, paragraphArr, title, indexPrefix, url }] =
                await handler(novel_url);
            b1.update(url_index + 1, { filename: url });
            let sectionedText = "";
            try {
                sectionedText = (
                    await translateText(paragraphArr, divide_line, model)
                )
                    .join("\n")
                    .replace(/(\r\n|\r|\n)/g, "\n\n");
            } catch (err) {
                b1.stop();
                console.error("\nAn error occurred when translating " + url);
                throw new Error(err as any);
            }

            const content =
                `# ${title} 
    
    URL: ${url}
    ${indexPrefix}
    
    Model: ${model.modelId}
    Devide Line: ${divide_line}
    
    ` + (await replace_words(sectionedText));

            await handle_file({ series_title, title, indexPrefix, content });

            if (sleep_ms) {
                await sleep(sleep_ms);
            }

            url_index++;
        } catch (err) {
            console.error(err);
            if (auto_retry) {
                b1 = multibar.create(urls.length, 0);
                continue;
            }
            const result = await input_retry_or_stop();
            if (result === "retry") {
                b1 = multibar.create(urls.length, 0);
                continue;
            } else if (result === "auto-retry") {
                b1 = multibar.create(urls.length, 0);
                auto_retry = true;
                continue;
            } else if (result === "skip") {
                url_index++;
                b1.update(url_index, { filename: urls[url_index] });
                continue;
            } else if (result === "stop") {
                console.error("Operation terminated");
                break
            } else if (result === "change_provider") {
                multibar.stop();

                return (async () => {
                    const { model, provider } = await input_select_model();
                    const divide_line = await input_divide_line();
                    const auto_retry = await input_auto_retry();

                    await translation({
                        model,
                        provider,
                        url_string,
                        auto_retry,
                        divide_line,
                        sleep_ms: provider === "groq" ? 60_000 : undefined,
                        start_from: url_index + 1,
                    });
                })();
            }
        }
    }

    multibar.stop();
    return (async () => {
        const { model, provider } = await input_select_model();
        const divide_line = await input_divide_line();
        const url_string = await input_url_string();
        const auto_retry = await input_auto_retry();
        const start_from = await input_start_from();

        await translation({
            model,
            provider,
            url_string,
            auto_retry,
            divide_line,
            sleep_ms: provider === "groq" ? 60_000 : undefined,
            start_from,
        });
    })();
}

export async function translateText(
    paragraphArr: string[],
    divide_line: number,
    model: LanguageModelV1
) {
    const numberOfLine = paragraphArr.length;
    const numberOfSections = Math.floor(numberOfLine / divide_line) + 2;
    // console.log(numberOfLine,divide_line, numberOfSections)
    const buf: string[][] = [];

    for (let i = 0; i < numberOfSections; i++) {
        // console.log(divide_line * i, divide_line * (i + 1));
        buf.push(paragraphArr.slice(divide_line * i, divide_line * (i + 1)));
    }

    const bufText = [];
    for await (const section of buf.filter((d) => d.length !== 0)) {
        const fulltext = section.filter((d) => d !== "").join("\n");
        const { text } = await generateText({
            model,
            seed: Math.floor(10000 * Math.random()),

            prompt: `
# 指令：
請將以下日文文章翻譯成台灣常用的繁體中文。我會在接下來的訊息提供文章。

# 翻譯規則：
1.  文章內的所有日文**人名**與**專有名詞**（例如地名、組織名、品牌名等）必須**保留日文原文**，請勿翻譯。
2.  其餘內容需翻譯成通順自然的台灣繁體中文。

# 輸出要求：
直接輸出翻譯後的完整文章，不要包含任何說明、標題或原文。

# 其他注意事項
請再三確認翻譯的內容符合上述規則，並且沒有遺漏任何重要信息，否則我會很傷心，請多加注意。

---
${fulltext}
---
`,
        });
        bufText.push(text);
    }
    return bufText;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}
