import { streamObject, type LanguageModelV1 } from "ai";
import { handle_file } from "../handle_file";
import { replace_words } from "../replace";
import { decompose_url } from "../url_handler/decompose_url";
import { novel_handler } from "../url_handler/single_novel_handler";
import { chunkArray, input_select_model, input_url_string } from "../utils";
import { en_prompt } from "./prompts";
import z from "zod";
import fs from "fs/promises";
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
    batch_size: number;
};

export async function batchTranslate(props: BatchTranslationParameter) {
    const { url_string, start_from, model, with_Cookies, provider, batch_size } = props;

    const urls = (await decompose_url(url_string)).splice(start_from - 1);
    const progressbar = multibar.create(urls.length, 0, {filename: "Batch Translation"});

    const batches = chunkArray(urls, batch_size)
    for (const batch of batches) {
        
        const novel_data = batch.map(async (url) =>
            novel_handler(url, { with_Cookies })
        );
        const untranslated_data = await Promise.all(novel_data);
    
        // store temp untranslated data to debug
        // await fs.writeFile("temp.txt", JSON.stringify(untranslated_data));
    
        // const untranslated_data = JSON.parse(
        //     await fs.readFile("temp.txt", "utf8")
        // ) as NovelHandlerResultType[];
    
        while (untranslated_data.length > 0) {
            // console.log("Remaining sections:", untranslated_data.length);
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
                // remove that item from untranslated_data to save memory
                untranslated_data.splice(untranslated_data.indexOf(metadata), 1);
                
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
                    (
                        await replace_words(sectionedText, {
                            series_title_and_author,
                            title,
                            tags,
                        })
                    ).replaceAll("\\n", "\n");
    
                // console.log(content);
                await handle_file({
                    series_title_and_author,
                    title,
                    indexPrefix,
                    content,
                });
                progressbar.increment(1);
                
            }
        }
        
    }

}
