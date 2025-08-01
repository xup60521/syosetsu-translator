import { replace_words } from "./replace";
import handler from "./novel_handler";
import cliProgress from "cli-progress";
import {
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_url_string,
    input_retry_or_stop,
    input_start_from,
    getDefaultModelWaitTime,
} from "./utils";
import { decompose_url } from "./decompose_url";
import { handle_file } from "./handle_file";
import { streamText, type LanguageModelV1 } from "ai";
import { stringSimilarity } from "string-similarity-js";

const multibar = new cliProgress.MultiBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: " {bar} | {filename} | {value}/{total}",
    },
    cliProgress.Presets.shades_classic
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
    const { sleep_ms, model, divide_line, url_string, start_from } = params;

    let { auto_retry } = params;
    const urls = await decompose_url(url_string);

    let b1 = multibar.create(urls.length, 0);

    let url_index = start_from - 1;
    while (url_index < urls.length) {
        try {
            const novel_url = urls[url_index];
            const [
                { series_title, paragraphArr, title, indexPrefix, url, tags },
            ] = await handler(novel_url);
            b1.update(url_index + 1, { filename: url });
            let sectionedText = "";
            try {
                sectionedText = (
                    await translateText(
                        paragraphArr,
                        divide_line,
                        model,
                        sleep_ms
                    )
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
Tags: ${tags?.join(", ") ?? ""}
    
    ` + (await replace_words(sectionedText, { series_title, title, tags }));

            await handle_file({ series_title, title, indexPrefix, content });

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
                break;
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
                        sleep_ms: getDefaultModelWaitTime({ model, provider }),
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
            sleep_ms: getDefaultModelWaitTime({ model, provider }),
            start_from,
        });
    })();
}

export async function translateText(
    paragraphArr: string[],
    divide_line: number,
    model: LanguageModelV1,
    sleep_ms?: number
) {
    const numberOfLine = paragraphArr.length;
    const numberOfSections = Math.floor(numberOfLine / divide_line) + 2;
    const buf: string[][] = [];

    for (let i = 0; i < numberOfSections; i++) {
        buf.push(paragraphArr.slice(divide_line * i, divide_line * (i + 1)));
    }

    // Create a single progress bar for sections
    const sectionBar = multibar.create(
        buf.filter((d) => d.length !== 0).length,
        0,
        { filename: "Translating Sections" },
        cliProgress.Presets.rect
    );

    const bufText: string[] = [];

    try {
        let filteredSections = buf.filter((d) => d.length !== 0);
        let sectionIndex = 0;
        while (sectionIndex < filteredSections.length) {
            const section = filteredSections[sectionIndex];
            const fulltext = section.filter((d) => d !== "").join("\n");
            const stream = streamText({
                model,
                seed: Math.floor(10000 * Math.random()),
                temperature: 0.1,
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

            let streamedText = "";
            for await (const delta of stream.textStream) {
                streamedText += delta;
            }
            const reg = /^[\t\n ]*$/;
            if (reg.test(streamedText)) {
                throw new Error(
                    "The translation result is empty, please check your model or input."
                );
            }
            // if the translated and original content is too similar, re-translate this section
            if (stringSimilarity(streamedText, fulltext) > 0.9) {
                console.warn(
                    "The translation result is too similar to the original content, re-translating this section..."
                );
                sectionBar.update(sectionIndex + 1, {
                    filename: "Re-translating Section",
                });
                continue;
            }
            bufText.push(streamedText);
            sectionBar.update(sectionIndex + 1);
            if (sleep_ms) {
                await sleep(sleep_ms);
            }
            sectionIndex++;
        }
        sectionBar.stop();
        multibar.remove(sectionBar);
    } catch (err) {
        sectionBar.stop();
        throw err;
    }
    return bufText;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}
