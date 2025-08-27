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
    getModelWaitTime,
    input_with_cookies_or_not,
    getTranslationPrompt,
    type ResultType,
    chunkArray,
    input_one_or_two_step_translation,
    en_prompt,
    ch_prompt,
} from "./utils";
import { decompose_url } from "./novel_handler/decompose_url";
import { handle_file } from "./handle_file";
import { streamText, type LanguageModelV1 } from "ai";
import { stringSimilarity } from "string-similarity-js";
import { select } from "@inquirer/prompts";
import type { ModelIdType } from "./model_list";
import * as fs from "node:fs/promises";

const multibar = new cliProgress.MultiBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: " {bar} | {filename} | {value}/{total}",
    },
    cliProgress.Presets.shades_classic
);

type DoTranslationProps = {
    model: LanguageModelV1;
    divide_line: number;
    with_Cookies?: boolean;
    provider: string;
    one_or_two_step: Awaited<
        ReturnType<typeof input_one_or_two_step_translation>
    >;
};

type TranslationParameter = {
    provider: string;
    auto_retry: boolean;
    url_string: string;
    start_from: number;
} & DoTranslationProps & {};

export async function translation(params: TranslationParameter) {
    const {
        model,
        divide_line,
        url_string,
        start_from,
        provider,
        one_or_two_step,
    } = params;

    let { auto_retry, with_Cookies } = params;
    const urls = await decompose_url(url_string);
    let b1 = multibar.create(urls.length, 0);
    let url_index = start_from - 1;
    while (url_index < urls.length) {
        try {
            const novel_url = urls[url_index];
            b1.update(url_index + 1, { filename: novel_url });
            await doTranslation(novel_url, {
                model,
                divide_line,
                with_Cookies,
                provider,
                one_or_two_step,
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
            } else if (result === "retry_with_cookies") {
                b1 = multibar.create(urls.length, 0);
                with_Cookies = true;
                continue;
            } else if (result === "stop") {
                console.error("Operation terminated");
                break;
            } else if (result === "change_provider") {
                multibar.stop();

                return (async () => {
                    const { model, provider } = await input_select_model();
                    const divide_line = await input_divide_line(model.modelId);
                    const auto_retry = await input_auto_retry();
                    const with_Cookies = await input_with_cookies_or_not();
                    const one_or_two_step =
                        await input_one_or_two_step_translation();

                    await translation({
                        model,
                        provider,
                        url_string,
                        auto_retry,
                        divide_line,
                        start_from: url_index + 1,
                        with_Cookies,
                        one_or_two_step,
                    });
                })();
            }
        }
    }

    multibar.stop();
    return;
}

async function doTranslation(novel_url: string, props: DoTranslationProps) {
    const { model, divide_line, with_Cookies, provider, one_or_two_step } =
        props;
    const {
        series_title_and_author,
        paragraphArr,
        title,
        indexPrefix,
        url,
        tags,
        author,
    } = await novel_handler(novel_url, { with_Cookies });

    const translationResult = await translateText({
        paragraphArr,
        divide_line,
        model,
        provider,
        one_or_two_step,
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
    
${indexPrefix}

URL: ${url}
Author: ${author}
Model: ${model.modelId}
Devide Line: ${divide_line}
Tags: ${tags?.join(", ") ?? ""}
    
` +
        (await replace_words(sectionedText, {
            series_title_and_author,
            title,
            tags,
        }));

    await handle_file({ series_title_and_author, title, indexPrefix, content });
}

type TranslateTextParams = {
    paragraphArr: string[];
    divide_line: number;
    model: LanguageModelV1;
    provider: string;
    one_or_two_step: Awaited<
        ReturnType<typeof input_one_or_two_step_translation>
    >;
};

const checkEmptyRegex = /^[\t\n ]*$/;

export async function translateText(
    params: TranslateTextParams
): Promise<ResultType<string[], any>> {
    const { paragraphArr, divide_line } = params;
    let { model, provider, one_or_two_step } = params;
    const modelId = model.modelId as ModelIdType;
    let sleep_ms = getModelWaitTime({
        modelId,
        provider,
    });

    // const numberOfLine = paragraphArr.length;
    // const numberOfSections = Math.floor(numberOfLine / divide_line) + 2;
    // const buf: string[][] = [];
    // for (let i = 0; i < numberOfSections; i++) {
    //     buf.push(paragraphArr.slice(divide_line * i, divide_line * (i + 1)));
    // }

    const buf = chunkArray(paragraphArr, divide_line);

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
            const originalText = section.filter((d) => d !== "").join("\n");
            const similarity_retry_count =
                similarity_map.get(sectionIndex) ?? 0;
            let translatedText = "";

            if (one_or_two_step === "two-step") {
                translatedText = await twoStepTranslateText(
                    similarity_retry_count,
                    model,
                    provider,
                    originalText
                );
            } else if (one_or_two_step === "one-step") {
                translatedText = await oneStepTranslateText(
                    similarity_retry_count,
                    model,
                    provider,
                    originalText
                );
            }

            // handle empty translation result

            if (checkEmptyRegex.test(translatedText)) {
                retry_count_map.set(
                    sectionIndex,
                    (retry_count_map.get(sectionIndex) || 0) + 1
                );
                console.warn(
                    `\nThe translation result is empty, retrying section ${
                        sectionIndex + 1
                    }...\n`
                );

                // Check if the retry count exceeds the limit
                if (retry_count_map.get(sectionIndex) ?? 0 > 3) {
                    console.warn(
                        `The translation result is empty after 3 retries, additional action is required for section ${
                            sectionIndex + 1
                        }...\n`
                    );
                    const retrySectionAnswer = await select({
                        message:
                            "The translation result is empty after 3 retries. What would you like to do?",
                        choices: [
                            {
                                name: "Retry this section with same model",
                                value: "retry_same",
                            },
                            {
                                name: "Retry this section with different model",
                                value: "retry_different",
                            },
                            {
                                name: "Skip this section",
                                value: "skip",
                            },
                            {
                                name: "Retry the entire translation",
                                value: "retry_all",
                            },
                        ] as const,
                    });
                    if (retrySectionAnswer === "retry_same") {
                        retry_count_map.set(sectionIndex, 0);
                        // update progress
                        sectionBar.update(sectionIndex + 1);
                        continue;
                    } else if (retrySectionAnswer === "retry_different") {
                        // Retry with a different model
                        retry_count_map.set(sectionIndex, 0);
                        const newModelAndProvider = await input_select_model();
                        model = newModelAndProvider.model;
                        provider = newModelAndProvider.provider;
                        sleep_ms = getModelWaitTime({
                            modelId: model.modelId,
                            provider,
                        });
                        one_or_two_step =
                            await input_one_or_two_step_translation();
                        bufText.push(
                            `\n\n[This section was retried with a different model: ${model.modelId}]\n\n`
                        );
                        continue;
                    } else if (retrySectionAnswer === "skip") {
                        // Skip this section
                        bufText.push(
                            `\n\n[This section was skipped due to repeated empty translation results.]\n\n`
                        );
                        sectionBar.update(sectionIndex + 1);
                        sectionIndex++;
                        continue;
                    } else if (retrySectionAnswer === "retry_all") {
                        throw new Error(
                            "Retry the entire translation due to repeated empty translation results."
                        );
                    }
                }
                if (sleep_ms) {
                    await sleep(sleep_ms);
                }
                continue;
            }
            // if the translated and original content is too similar, re-translate this section
            if (
                stringSimilarity(translatedText, originalText) > 0.97 &&
                translatedText.length > 30
            ) {
                console.warn(
                    "The translation result is too similar to the original content, re-translating this section..."
                );
                similarity_map.set(
                    sectionIndex,
                    (similarity_map.get(sectionIndex) || 0) + 1
                );
                if (similarity_map.get(sectionIndex) ?? 0 > 3) {
                    const retryOptions = [
                        {
                            name: "Show differences",
                            value: "show_differences",
                        },
                        {
                            name: "Retry this section with same model",
                            value: "retry_same",
                        },
                        {
                            name: "Retry this section with different model",
                            value: "retry_different",
                        },
                        {
                            name: "Skip this section",
                            value: "skip",
                        },
                        {
                            name: "Retry the entire translation",
                            value: "retry_all",
                        },
                    ] as const;
                    let retrySectionAnswer = await select({
                        message:
                            "The translation result is too similar to the original content after 3 retries. What would you like to do?",
                        choices: retryOptions,
                    });
                    if (retrySectionAnswer === "show_differences") {
                        // Show differences
                        const similarityLog = `Original Text:\n${originalText}\n\nTranslated Text:\n${translatedText}\n\nSimilarity: ${stringSimilarity(
                            translatedText,
                            originalText
                        )}`;
                        console.log(similarityLog);
                        retrySectionAnswer = await select({
                            message: "What would you like to do?",
                            choices: retryOptions.filter(
                                (d) => d.value !== "show_differences"
                            ),
                        });
                    } 
                    if (retrySectionAnswer === "retry_same") {
                        similarity_map.set(sectionIndex, 0);
                        sectionBar.update(sectionIndex + 1);
                        continue;
                    } else if (retrySectionAnswer === "retry_different") {
                        // Retry with a different model
                        similarity_map.set(sectionIndex, 0);
                        const newModelAndProvider = await input_select_model();
                        model = newModelAndProvider.model;
                        provider = newModelAndProvider.provider;
                        sleep_ms = getModelWaitTime({
                            modelId: model.modelId,
                            provider,
                        });
                        one_or_two_step =
                            await input_one_or_two_step_translation();
                        bufText.push(
                            `\n\n[This section was retried with a different model: ${model.modelId}]\n\n`
                        );
                        sectionBar.update(sectionIndex + 1);
                        continue;
                    } else if (retrySectionAnswer === "skip") {
                        // Skip this section
                        bufText.push(
                            `\n\n[This section was skipped due to repeated empty translation results.]\n\n`
                        );
                        sectionBar.update(sectionIndex + 1);
                        sectionIndex++;
                        continue;
                    } else if (retrySectionAnswer === "retry_all") {
                        throw new Error(
                            "Retry the entire translation due to repeated similar translation results."
                        );
                    }
                }
                if (sleep_ms) {
                    await sleep(sleep_ms);
                }
                continue;
            }

            // Danger: sometimes the model can repond "請提供文章內容，我將依照指示進行翻譯。"
            // which is not a issue here since it is due to the margin of being chunked.

            // // if the result is too unsimilar (probably complete different output)
            // if (stringSimilarity(translatedText, originalText) < 0.01) {
            //     console.warn(
            //         "The translation result is too dissimilar from the original content, re-translating this section..."
            //     );
            //     console.log(translatedText)
            //     if (sleep_ms) {
            //         await sleep(sleep_ms);
            //     }
            //     continue;
            // }

            // Remove <think> tags and their content
            translatedText = translatedText.replace(
                /<think>[\s\S]*?<\/think>/g,
                ""
            );
            bufText.push(translatedText);
            sectionBar.update(sectionIndex + 1);

            // console.log(provider, modelId, sleep_ms)
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

async function oneStepTranslateText(
    similarity_retry_count: number,
    model: LanguageModelV1,
    provider: string,
    originalText: string
) {
    const translation_prompt = getTranslationPrompt({
        similarity_retry_count,
        modelId: model.modelId,
        provider,
    });
    const stream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.0,
        prompt: `
        ${translation_prompt}

        ---
        ${originalText}
        ---
        `,
    });

    let streamedText = "";
    for await (const delta of stream.textStream) {
        streamedText += delta;
    }
    return streamedText;
}

async function twoStepTranslateText(
    similarity_retry_count: number,
    model: LanguageModelV1,
    provider: string,
    originalText: string
) {

    const firstPrompt =
        "Translate the following content into traditional Chinese (Taiwan). Output the translation result only." +
        "\n\nThe article will be presented in the following section.\n\n" +
        "```\n" +
        originalText +
        "\n```";
    const stream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.0,
        prompt: `
        ${firstPrompt}
        `,
    });

    let firstTranslation = "";
    for await (const delta of stream.textStream) {
        firstTranslation += delta;
    }
    if (checkEmptyRegex.test(firstTranslation)) {
        return "";
    }

    // const firstPrompt =
    //     ch_prompt +
    //     "\n\nThe article will be presented in the following section.\n\n" +
    //     "```\n" +
    //     originalText +
    //     "\n```";
    // const stream = streamText({
    //     model,
    //     seed: Math.floor(10000 * Math.random()),
    //     temperature: 0.0,
    //     prompt: `
    //     ${firstPrompt}
    //     `,
    // });

    // let firstTranslation = "";
    // for await (const delta of stream.textStream) {
    //     firstTranslation += delta;
    // }
    // if (checkEmptyRegex.test(firstTranslation)) {
    //     return "";
    // }

    // if (stringSimilarity(firstTranslation, originalText) > 0.95) {
    //     const first_modified_prompt =
    //         en_prompt +
    //         "\n\nThe article will be presented in the following section.\n\n" +
    //         "```\n" +
    //         originalText +
    //         "\n```";

    //     const stream = streamText({
    //         model,
    //         seed: Math.floor(10000 * Math.random()),
    //         temperature: 0.0,
    //         prompt: `
    //     ${first_modified_prompt}
    //     `,
    //     });

    //     firstTranslation = "";
    //     for await (const delta of stream.textStream) {
    //         firstTranslation += delta;
    //     }
    //     if (checkEmptyRegex.test(firstTranslation)) {
    //         return "";
    //     }
    // }

    // console.log(firstTranslation);

    const secondPrompt =
        "You are a professional translator who has proficient in translating Japanese article into traditional Chinese (Taiwan) one whlie keeping the proper nouns their original Japanese form. Please compare the original and translated articles and replace the proper nouns in the translated one with that in the original one. Additionally, please only output the result without any extra explaination. Therefore, the output should be a translated article in traditional Chinese (Taiwan) with proper nouns untranslated and in their original form. You need to understand the context in order to decide whether it is proper nouns or not. For example, you need to keep human name and special item their Japanese form.\n\nThe original and translated articles will be presented in the following section.\nOther then proper nouns (which you need to carefully identify), make sure to keep the article translated in traditional Chinese (Taiwan).\n\n### Original\n\n```\n" +
        originalText +
        "\n```\n\n### Translated\n\n```\n" +
        firstTranslation +
        "\n```";

    // Save secondPrompt to a txt file in the root folder
    // fs.writeFile("./second_prompt.txt", secondPrompt);

    // Optionally, you can still log it if needed
    // console.log(secondPrompt);

    let secondTranslation = "";
    const secondStream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.1,
        prompt: `
        ${secondPrompt}
        `,
    });

    for await (const delta of secondStream.textStream) {
        secondTranslation += delta;
    }
    // console.log(secondTranslation);
    return secondTranslation;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}
