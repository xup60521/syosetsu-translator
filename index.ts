import { select } from "@inquirer/prompts";
import { replaceTextInFiles } from "./replace";
import { translation } from "./translation";

import 'dotenv/config'
import {
    getDefaultModelWaitTime,
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_start_from,
    input_url_string,
    input_with_cookies_or_not,
} from "./utils";

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
];
// Function to prompt the user
async function main() {
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
        case "translate from files":
            // await translate_from_files();
            break;
        default:
            break;
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

    await translation({
        model,
        provider,
        url_string,
        auto_retry,
        divide_line,
        sleep_ms: getDefaultModelWaitTime({ model, provider }),
        start_from,
        with_Cookies,
    });
}

// async function translate_from_files() {
//     let translation_text_is_done = false;
//     while (!translation_text_is_done) {
//         await state.selectModel();
//         await state.input_divide_line();

//         if (!state.model) {
//             throw new Error("No model selected");
//         }

//         const inputQuestion = {
//             type: "input",
//             name: "input folder name",
//             message: "Enter Folder Name: ",
//         };

//         const folderPath =
//             "./translate_from_files/" + (await input(inputQuestion));
//         const files = await fs.readdir(folderPath);
//         const txtFiles = files.filter((file) => path.extname(file) === ".txt");

//         await state.input_auto_retry();

//         for await (const filePath of txtFiles) {
//             const fullPath = path.join(folderPath, filePath);

//             const content = await fs.readFile(fullPath, "utf-8");
//             // console.log(content)
//             const paragraphArr = content.split("\n");

//             const translated_content = (
//                 await translateText(
//                     paragraphArr,
//                     state.divide_line,
//                     state.model
//                 )
//             )
//                 .join("\n")
//                 .replace(/(\r\n|\r|\n)/g, "\n\n");
//             const finish_file_path = path.join(
//                 folderPath,
//                 "translated_" + filePath
//             );
//             await fs.writeFile(
//                 finish_file_path,
//                 await replace_words(translated_content)
//             );
//         }
//         translation_text_is_done = true;
//     }
// }
