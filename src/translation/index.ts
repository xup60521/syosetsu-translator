import {
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_retry_or_stop,
    input_with_cookies_or_not,
    input_one_or_two_step_translation,
} from "../utils";
import { decompose_url } from "../url_handler/decompose_url";
import { replace_words } from "../replace";
import { novel_handler } from "../url_handler/single_novel_handler";
import { handle_file } from "../handle_file";
import { translateText } from "./translateText";
import type { DoTranslationProps } from "./types";

import type { TranslationParameter } from "./types";
import { multibar } from "./translation-utils";

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
