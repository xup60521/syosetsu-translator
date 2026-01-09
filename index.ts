import { confirm, select } from "@inquirer/prompts";
import { replace_words, replaceTextInFiles } from "./src/replace";
import { translation } from "./src/translation";
import fs from "fs/promises";
import { contextSearch } from "./src/context_search";

import "dotenv/config";
import {
    input_auto_retry,
    input_batch_size,
    input_divide_line,
    input_one_or_two_step_translation,
    input_select_model,
    input_start_from,
    input_url_string,
    input_with_cookies_or_not,
} from "./src/utils";
import { gatherAllSeriesData } from "./src/gather_all_series_data";
import { decompose_url } from "./src/url_handler/decompose_url";
import { novel_handler } from "./src/url_handler/single_novel_handler";
import { sleep } from "./src/translation/translation-utils";
import { handle_file } from "./src/handle_file";
import { SingleBar, Presets } from "cli-progress";
import { batchTranslate } from "./src/translation/batchTranslate";


const options = [
    {
        name: "Translate from URLs",
        value: "translate from URL",
    },
    {
        name: "Fetch from URLs (no translation)",
        value: "fetch from URL",
    },
    // {
    //     name: "Translate from files",
    //     value: "translate from files",
    // },
    {
        name: "Replace Words",
        value: "replace",
    },
    // {
    //     name: "Translate from pixiv user",
    //     value: "translate from pixiv user",
    // },
    {
        name: "Gather all series data from pixiv",
        value: "gather all series data",
    },
    {
        name: "Context Search",
        value: "context search",
    },
    // exit without error
    { name: "Exit", value: "exit" },
] as const;
// Function to prompt the user
async function main() {
    
    let isRunning = true;
    while (isRunning) {
        const answers = await select({
            message: "Please select an option:",
            choices: options,
        });

        switch (answers) {
            case "translate from URL":
                await translate_from_URL();
                break;

            case "fetch from URL":
                await fetchFromURL();
                break;
            case "replace":
                await replaceTextInFiles();
                break;
            // case "translate from files":
            // await translate_from_files();
            // break;
            // case "translate from pixiv user":
            //     await translate_from_pixiv_user();
            //     break;
            case "gather all series data":
                await gatherAllSeriesData();
                break;
            case "context search":
                await contextSearch();
                break;
            case "exit":
                isRunning = false;
                return;
            default:
                break;
        }
    }
}

main();

async function translate_from_URL() {
    const enableBatchTranslate = await confirm({
        message: "Enable Batch Translate?",
        default: false,
    });
    if (enableBatchTranslate) {
        const { model, provider } = await input_select_model();

        const url_string = await input_url_string();
        const start_from = await input_start_from();
        const with_Cookies = await input_with_cookies_or_not();
        const batch_size = (await input_batch_size())!
        return await batchTranslate({
            model,
            provider,
            url_string,
            batch_size,
            start_from,
            with_Cookies,
        });
    }
    const { model, provider } = await input_select_model();
    const divide_line = await input_divide_line(model.modelId);

    const url_string = await input_url_string();

    const auto_retry = await input_auto_retry();
    const start_from = await input_start_from();
    const with_Cookies = await input_with_cookies_or_not();
    const one_or_two_step = await input_one_or_two_step_translation();

    return await translation({
        model,
        provider,
        url_string,
        auto_retry,
        divide_line,
        start_from,
        with_Cookies,
        one_or_two_step,
    });
}

async function fetchFromURL(url_string?: string) {
    if (!url_string) {
        url_string = await input_url_string();
    }
    const with_Cookies = await input_with_cookies_or_not();
    const start_from = await input_start_from();
    const urls = (await decompose_url(url_string, with_Cookies)).splice(
        start_from - 1
    );

    const progressBar = new SingleBar({
        ...Presets.shades_classic,
        format: "{bar} | {percentage}% | {value}/{total} URLs",
    });

    progressBar.start(urls.length, 0);

    for (const novel_url of urls) {
        const {
            series_title_and_author,
            content: originalContent,
            title,
            indexPrefix,
            url,
            tags,
            author,
        } = await novel_handler(novel_url, { with_Cookies });

        const content =
            `# ${title} 
            
        ${indexPrefix}
        
        URL: ${url}
        Author: ${author}
        Model: No model (fetch only)
        Devide Line: N/A
        Tags: ${tags?.join(", ") ?? ""}

        ` +
            (await replace_words(
                originalContent.replace(/(\r\n|\r|\n)/g, "\n\n"),
                {
                    series_title_and_author,
                    title,
                    tags,
                }
            ));
        await handle_file({
            series_title_and_author,
            title,
            indexPrefix,
            content,
            istranslated: false,
        });
        await sleep(Math.random() * 2000);

        progressBar.increment();
    }

    progressBar.stop();
}
