import { select } from "@inquirer/prompts";
import { input_url_string, translate_from_URL } from "./src/translate_from_url";


const options = [
    {
        name: "Translate from URLs",
        value: "translate from URL",
    },
    {
        name: "Replace Words",
        value: "replace",
    },
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
                const url_string = await input_url_string();
                await translate_from_URL({url_string});
                break;
            case "replace":
                // await replaceTextInFiles();
                break;
            default:
                break;
        }
    }
}

main();

