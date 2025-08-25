import { select } from "@inquirer/prompts";
import { replaceTextInFiles } from "./src/replace";
import { translation } from "./src/translation";


import "dotenv/config";
import {
    getDefaultModelWaitTime,
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_start_from,
    input_url_string,
    input_with_cookies_or_not,
} from "./src/utils";
import { windowsFileEscapeRegex } from "./src/novel_handler/pixiv";
import { translate_from_pixiv_user } from "./src/translate_from_pixiv.user";

const options = [
    {
        name: "Translate from URLs",
        value: "translate from URL",
    },
    // {
    //     name: "Translate from files",
    //     value: "translate from files",
    // },
    {
        name: "Replace Words",
        value: "replace",
    },
    {
        name: "Translate from pixiv user",
        value: "translate from pixiv user",
    },
] as const;
// Function to prompt the user
async function main() {
    while (true) {
        const answers = await select({
            message: "Please select an option:",
            choices: options,
        });

        switch (answers) {
            case "translate from URL":
                await translate_from_URL();
                break;
            case "replace":
                await replaceTextInFiles();
                break;
            // case "translate from files":
            // await translate_from_files();
            // break;
            case "translate from pixiv user":
                await translate_from_pixiv_user();
                break;
            default:
                break;
        }
    }
}

main();

async function translate_from_URL() {
    const { model, provider } = await input_select_model();
    const divide_line = await input_divide_line();
    const url_string = await input_url_string();
    const auto_retry = await input_auto_retry();
    const start_from = await input_start_from();
    const with_Cookies = await input_with_cookies_or_not();

    return await translation({
        model,
        provider,
        url_string,
        auto_retry,
        divide_line,
        start_from,
        with_Cookies,
    });
}



