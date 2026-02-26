import { select } from "@inquirer/prompts";
import { input_url_string, translate_from_URL } from "./src/translate_from_url";
import { novel_handler } from "@repo/shared/server";

const options = [
    {
        name: "Translate from URLs",
        value: "translate from URL",
    },
    {
        name: "Novel Handler Test",
        value: "novel handler test",
    },
    {
        name: "Replace Words",
        value: "replace",
    },
    {
        name: "Exit",
        value: "exit",
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
                await translate_from_URL({ url_string });
                break;
            case "novel handler test":
                await novel_handler_test();
                break;
            case "replace":
                // await replaceTextInFiles();
                break;

            default:
                process.exit();
        }
    }
}

main();


async function novel_handler_test() {
    const url_string = await input_url_string();
    const result = await novel_handler(url_string, { with_Cookies: true });
    console.log(result);
     
}