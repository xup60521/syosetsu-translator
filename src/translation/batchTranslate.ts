import { streamObject, type LanguageModelV1 } from "ai";
import { handle_file } from "../handle_file";
import { replace_words } from "../replace";
import { decompose_url } from "../url_handler/decompose_url";
import { novel_handler } from "../url_handler/single_novel_handler";
import { input_select_model, input_url_string } from "../utils";
import { en_prompt } from "./prompts";
import z from "zod";
import fs from "fs/promises"
import type { ProviderType } from "../model_list";
import cliProgress from "cli-progress";
import { multibar } from "./translation-utils";

const ai_translated_result_schema = z.object({
    indexPrefix: z.string(),
    translated_content: z.string(),
});

type BatchTranslationParameter = {
    url_string: string;
    start_from: number;
    model: LanguageModelV1;
    with_Cookies?: boolean;
    provider: ProviderType;
};

export async function batchTranslate(props: BatchTranslationParameter) {
    const { url_string, start_from, model, with_Cookies, provider } = props;

    const urls = (await decompose_url(url_string)).splice(start_from - 1);
    const progressbar = multibar.create(urls.length, 0);
    const novel_data = urls.map(async (url) =>
        novel_handler(url, { with_Cookies })
    );
    const untranslated_data = (await Promise.all(novel_data)).map((d) => {
        const content = d.paragraphArr.join("\n");
        const { paragraphArr, ...item } = d;
        return { ...item, content };
    });

    // store temp untranslated data to debug
    // await fs.writeFile("temp.txt", JSON.stringify(untranslated_data));

    // const untranslated_data = JSON.parse(
    //     await fs.readFile("temp.txt", "utf8")
    // ) as NovelHandlerResultType[];

    const { elementStream } = streamObject({
        model,
        output: "array",
        schema: ai_translated_result_schema,
        messages: [
            {
                role: "user",
                content: en_prompt,
            },
            {
                role: "user",
                content: JSON.stringify(untranslated_data),
            },
        ],
    });
    let currentIndex = 1
    
    for await (const item of elementStream) {
        if (!item) {
            continue;
        }
        const metadata = untranslated_data.find(
            (d) => d.indexPrefix === item.indexPrefix
        )!;
        progressbar.update(currentIndex, {filename: metadata.title})
        const sectionedText = item.translated_content!.replace(
            /(\r\n|\r|\n)/g,
            "\n\n"
        );
        const {
            series_title_and_author,
            title,
            indexPrefix,
            url,
            tags,
            author,
        } = metadata;
        const content =
            `# ${title}

        ${indexPrefix}

        URL: ${url}
        Author: ${author}
        Model: ${model.modelId}
        Devide Line: full_text
        Tags: ${tags?.join(", ") ?? ""}

        ` +
            (await replace_words(sectionedText, {
                series_title_and_author,
                title,
                tags,
            }));

        // console.log(content);
        await handle_file({
            series_title_and_author,
            title,
            indexPrefix,
            content,
        });
        currentIndex++
    }
}
