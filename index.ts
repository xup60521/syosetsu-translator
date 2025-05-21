import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { replace_words, replaceTextInFiles } from "./replace";
import { translateText, translation } from "./translation";
import fs from "node:fs/promises";

import { state, url_state } from "./state";
import path from "node:path";

// Function to prompt the user
async function main() {
    const options = [
        {
            name: "Translate from URLs",
            value: "translate from URL",
        },
        {
            name: "Translate from files",
            value: "translate from files",
        },
        {
            name: "Replace Words",
            value: "replace",
        },
    ];

    const answers = await select({
        message: "Please select an option:",
        choices: options,
    });

    switch (answers) {
        case "translate from URL":
            let translation_is_done = false;
            while (!translation_is_done) {
                await state.selectModel();
                await state.input_divide_line();

                const inputQuestion = {
                    type: "input",
                    name: "inputValues",
                    message: "Enter URLs (separated by spaces):",
                };
                if (url_state.url_string === "") {
                    const inputAnswer = await input(inputQuestion);
                    url_state.set_url_string(inputAnswer);
                }

                await state.input_auto_retry();

                if (state.provider === "groq") {
                    translation_is_done = await translation({
                        sleep_ms: 60_000,
                    });
                } else {
                    translation_is_done = await translation({});
                }
            }

            break;
        case "replace":
            await new Promise((resolve) =>
                setTimeout(() => resolve(undefined), 100)
            );
            replaceTextInFiles();
            break;
        case "translate from files":
            let translation_text_is_done = false;
            while (!translation_text_is_done) {
                await state.selectModel();
                await state.input_divide_line();

                if (!state.model) {
                    throw new Error("No model selected");
                }

                const inputQuestion = {
                    type: "input",
                    name: "input folder name",
                    message: "Enter Folder Name: ",
                };

                const folderPath =
                    "./translate_from_files/" + (await input(inputQuestion));
                const files = await fs.readdir(folderPath);
                const txtFiles = files.filter(
                    (file) => path.extname(file) === ".txt"
                );

                await state.input_auto_retry();

                for await (const filePath of txtFiles) {
                    const fullPath = path.join(folderPath, filePath);

                    const content = await fs.readFile(fullPath, "utf-8");
                    // console.log(content)
                    const paragraphArr = content.split("\n");

                    const translated_content = (
                        await translateText(
                            paragraphArr,
                            state.divide_line,
                            state.model
                        )
                    )
                        .join("\n")
                        .replace(/(\r\n|\r|\n)/g, "\n\n");
                    const finish_file_path = path.join(
                        folderPath,
                        "translated_" + filePath
                    );
                    await fs.writeFile(
                        finish_file_path,
                        await replace_words(translated_content)
                    );
                }
                translation_is_done = true;
            }
            break;
        default:
            break;
    }
}

main()
