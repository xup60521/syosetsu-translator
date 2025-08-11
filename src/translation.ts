import { replace_words } from "./replace";
import { novel_handler } from "./novel_handler";
import cliProgress from "cli-progress";
import {
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_url_string,
    input_retry_or_stop,
    input_start_from,
    getDefaultModelWaitTime,
    input_with_cookies_or_not,
    getTranslationPrompt,
    type ResultType,
} from "./utils";
import { decompose_url } from "./novel_handler/decompose_url";
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

type DoTranslationProps = {
    sleep_ms?: number;
    model: LanguageModelV1;
    divide_line: number;
    with_Cookies?: boolean;
};

type TranslationParameter = {
    provider: string;
    auto_retry: boolean;
    url_string: string;
    start_from: number;
} & DoTranslationProps & {};

export async function translation(params: TranslationParameter) {
    const {
        sleep_ms,
        model,
        divide_line,
        with_Cookies,
        url_string,
        start_from,
    } = params;

    let { auto_retry } = params;
    const urls = await decompose_url(url_string);
    let b1 = multibar.create(urls.length, 0);
    let url_index = start_from - 1;
    while (url_index < urls.length) {
        try {
            const novel_url = urls[url_index];
            b1.update(url_index + 1, { filename: novel_url });
            await doTranslation(novel_url, {
                sleep_ms,
                model,
                divide_line,
                with_Cookies,
            });
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
                    const with_Cookies = await input_with_cookies_or_not();

                    await translation({
                        model,
                        provider,
                        url_string,
                        auto_retry,
                        divide_line,
                        sleep_ms: getDefaultModelWaitTime({ model, provider }),
                        start_from: url_index + 1,
                        with_Cookies,
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
        const with_Cookies = await input_with_cookies_or_not();

        await translation({
            model,
            provider,
            url_string,
            auto_retry,
            divide_line,
            sleep_ms: getDefaultModelWaitTime({ model, provider }),
            start_from,
            with_Cookies,
        });
    })();
}

async function doTranslation(novel_url: string, props: DoTranslationProps) {
    const { sleep_ms, model, divide_line, with_Cookies } = props;
    const { series_title, paragraphArr, title, indexPrefix, url, tags } =
        await novel_handler(novel_url, { with_Cookies });

    const translationResult = await translateText({
        paragraphArr,
        divide_line,
        model,
        sleep_ms,
    });

    if (!translationResult.success) {
        console.error("\nAn error occurred when translating " + url);
        throw new Error(translationResult.error);
    }
    const sectionedText = translationResult.value
        .join("\n")
        .replace(/(\r\n|\r|\n)/g, "\n\n");

    const content =
        `# ${title} 
    
URL: ${url}
${indexPrefix}

Model: ${model.modelId}
Devide Line: ${divide_line}
Tags: ${tags?.join(", ") ?? ""}
    
` + (await replace_words(sectionedText, { series_title, title, tags }));

    await handle_file({ series_title, title, indexPrefix, content });
}

type TranslateTextParams = {
    paragraphArr: string[];
    divide_line: number;
    model: LanguageModelV1;
    sleep_ms?: number;
};

export async function translateText(
    params: TranslateTextParams
): Promise<ResultType<string[], any>> {
    const { paragraphArr, divide_line, model, sleep_ms } = params;
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
        const retry_count_map = new Map<number, number>();
        const similarity_map = new Map<number, number>();
        while (sectionIndex < filteredSections.length) {
            const section = filteredSections[sectionIndex];
            const fulltext = section.filter((d) => d !== "").join("\n");
            const similarity_retry_count =
                similarity_map.get(sectionIndex) ?? 0;
            const translation_prompt = getTranslationPrompt({
                similarity_retry_count,
                modelId: model.modelId,
            });
            const stream = streamText({
                model,
                seed: Math.floor(10000 * Math.random()),
                temperature: 0.0,
                prompt: `
        ${translation_prompt}

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
                retry_count_map.set(
                    sectionIndex,
                    (retry_count_map.get(sectionIndex) || 0) + 1
                );
                console.warn(
                    `\nThe translation result is empty, retrying section ${
                        sectionIndex + 1
                    }...\n`
                );
                if (retry_count_map.get(sectionIndex) ?? 0 > 3) {
                    throw new Error(
                        "The translation result is empty after 3 retries, additional action is required."
                    );
                }
                if (sleep_ms) {
                    await sleep(sleep_ms);
                }
                continue;
            }
            // if the translated and original content is too similar, re-translate this section
            if (stringSimilarity(streamedText, fulltext) > 0.9) {
                console.warn(
                    "The translation result is too similar to the original content, re-translating this section..."
                );
                similarity_map.set(
                    sectionIndex,
                    (similarity_map.get(sectionIndex) || 0) + 1
                );
                if (sleep_ms) {
                    await sleep(sleep_ms);
                }
                continue;
            }
            // Remove <think> tags and their content
            streamedText = streamedText.replace(
                /<think>[\s\S]*?<\/think>/g,
                ""
            );
            bufText.push(streamedText);
            sectionBar.update(sectionIndex + 1);
            if (sleep_ms) {
                await sleep(sleep_ms);
            }
            sectionIndex++;
        }
        sectionBar.stop();
        multibar.remove(sectionBar);
        return { success: true, value: bufText };
    } catch (err) {
        sectionBar.stop();
        return { success: false, error: err };
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}
