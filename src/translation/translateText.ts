import { streamText, type LanguageModelV1 } from "ai";
import { stringSimilarity } from "string-similarity-js";
import { select } from "@inquirer/prompts";
import type { ModelIdType } from "../model_list";
import {
    input_select_model,
    input_one_or_two_step_translation,
    getModelWaitTime,
    chunkArray,
    type ResultType,
} from "../utils";
import { multibar, sleep } from "./translation-utils";
import type { TranslateTextParams } from "./types";
import {
    getOneStepTranslatePrompt,
    getTwoStepFirstTranslatePrompt,
    getTwoStepSecondTranslatePrompt,
} from "./prompts";

const checkEmptyRegex = /^[	
 ]*$/;

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

    const buf = chunkArray(paragraphArr, divide_line);

    const sectionBar = multibar.create(
        buf.filter((d) => d.length !== 0).length,
        0,
        { filename: "Translating Sections" }
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

            if (checkEmptyRegex.test(translatedText)) {
                retry_count_map.set(
                    sectionIndex,
                    (retry_count_map.get(sectionIndex) || 0) + 1
                );
                console.warn(
                    `\nThe translation result is empty, retrying section ${ 
                        sectionIndex + 1 
                    }...
`
                );

                if (retry_count_map.get(sectionIndex) ?? 0 > 3) {
                    console.warn(
                        `The translation result is empty after 3 retries, additional action is required for section ${ 
                            sectionIndex + 1 
                        }...
`
                    );
                    const retrySectionAnswer = await select({
                        message:
                            "The translation result is empty after 3 retries. What would you like to do?",
                        choices:
                            [
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
                        sectionBar.update(sectionIndex + 1);
                        continue;
                    } else if (retrySectionAnswer === "retry_different") {
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
                            `

[This section was retried with a different model: ${model.modelId}]

`
                        );
                        continue;
                    } else if (retrySectionAnswer === "skip") {
                        bufText.push(
                            `

[This section was skipped due to repeated empty translation results.]

`
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
                        const similarityLog = `Original Text:
${originalText}

Translated Text:
${translatedText}

Similarity: ${stringSimilarity(
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
                            `

[This section was retried with a different model: ${model.modelId}]

`
                        );
                        sectionBar.update(sectionIndex + 1);
                        continue;
                    } else if (retrySectionAnswer === "skip") {
                        bufText.push(
                            `

[This section was skipped due to repeated empty translation results.]

`
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

            translatedText = translatedText.replace(
                /<think>[
	
]*?/<think>/g,
                ""
            );
            bufText.push(translatedText);
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

async function oneStepTranslateText(
    similarity_retry_count: number,
    model: LanguageModelV1,
    provider: string,
    originalText: string
) {
    const prompt = getOneStepTranslatePrompt(
        originalText,
        similarity_retry_count,
        model.modelId,
        provider
    );
    const stream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.0,
        prompt,
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
    const firstPrompt = getTwoStepFirstTranslatePrompt(originalText);
    const stream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.0,
        prompt: firstPrompt,
    });

    let firstTranslation = "";
    for await (const delta of stream.textStream) {
        firstTranslation += delta;
    }
    if (checkEmptyRegex.test(firstTranslation)) {
        return "";
    }

    const secondPrompt = getTwoStepSecondTranslatePrompt(
        originalText,
        firstTranslation
    );

    let secondTranslation = "";
    const secondStream = streamText({
        model,
        seed: Math.floor(10000 * Math.random()),
        temperature: 0.1,
        prompt: secondPrompt,
    });

    for await (const delta of secondStream.textStream) {
        secondTranslation += delta;
    }
    return secondTranslation;
}
