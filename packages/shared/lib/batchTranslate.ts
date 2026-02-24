import { Output, streamText, type LanguageModel } from "ai";
import { replace_words } from "./replace";
import { en_prompt } from "./utils";
import z from "zod";
import {
    supportedProvider,
    type HandleFileInput,
    type NovelHandlerResultType,
} from "@repo/shared";

const ai_translated_result_schema = z.object({
    id: z.string(),
    translated_content: z.string(),
});

type BatchTranslationParameter = {
    urls: string[];
    provider: string | (typeof supportedProvider)[number]["value"];
    model_id: string;
    model: LanguageModel;
    with_Cookies?: boolean;
    user_id?: string;
    folder_id: string;
    encrypted_refresh_token?: string;
};


// don't use the shared novel_handler directly
// since the workflow calls the novel_handler endpoint elsewhere,
// use dependency injection instead.
export async function batchTranslate(
    props: BatchTranslationParameter,
    novel_handler: (
        url: string,
        options: { with_Cookies?: boolean },
    ) => Promise<NovelHandlerResultType>,
    handle_file: (params: HandleFileInput) => Promise<void>,
) {
    const {
        urls,
        model_id,
        with_Cookies,
        provider,
        model,
        folder_id,
        encrypted_refresh_token,
    } = props


    const novel_data = urls.map(async (url) =>
        novel_handler(url, { with_Cookies }),
    );
    const untranslated_data = await Promise.all(novel_data);
    // console.log("translating...")
    const error_pool = []as any[];

    while (untranslated_data.length > 0) {

        const { elementStream } = streamText({
            model,
            output: Output.array({ element: ai_translated_result_schema }),
            messages: [
                {
                    role: "system",
                    content: en_prompt,
                },
                {
                    role: "user",
                    content: JSON.stringify(untranslated_data),
                },
            ],
            maxRetries: 3,
        })
    
        for await (const item of elementStream) {
    
            const metadata = untranslated_data.find(
                (d) => d.id.trim() === item.id.trim(),
            )!;
            if (!metadata || !item) {
                continue;
            }
    
            // remove that item from untranslated_data to save memory
            untranslated_data.splice(untranslated_data.indexOf(metadata), 1);
            const sectionedText = item.translated_content!.replace(
                /(\r\n|\r|\n)/g,
                "\n\n",
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
    Provider: ${provider}
    Model: ${model_id}
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
                folder_id,
                encrypted_refresh_token,
            });
    }

    }
}
// console.log("finishing translation")

