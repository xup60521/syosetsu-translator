import { replace_words } from "../replace";
import { novel_handler } from "../novel_handler";
import { handle_file } from "../handle_file";
import { translateText } from "./translateText";
import type { DoTranslationProps } from "./types";

export async function doTranslation(novel_url: string, props: DoTranslationProps) {
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
