import { streamObject } from "ai";
import { handle_file } from "../handle_file";
import { replace_words } from "../replace";
import { decompose_url } from "../url_handler/decompose_url";
import { novel_handler } from "../url_handler/single_novel_handler";
import { input_select_model, input_url_string } from "../utils";
import { en_prompt } from "./prompts";
import z from "zod";

const ai_translated_result_schema = z.object({
    indexPrefix: z.string(),
    translated_content: z.string(),
});

export async function batchTranslate() {
    const { model, provider } = await input_select_model();
    const url_string = await input_url_string();
    const urls = await decompose_url(url_string);
    const novel_data = urls.map(async (url) => novel_handler(url, {}));
    const untranslated_data = (await Promise.all(novel_data)).map((d) => {
        const content = d.paragraphArr.join("\n");
        const { paragraphArr, ...item } = d;
        return { ...item, content };
    });

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

    for await (const item of elementStream) {
        if (!item) {
            continue;
        }
        const metadata = untranslated_data.find(
            (d) => d.indexPrefix === item.indexPrefix
        )!;
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
    }
}
