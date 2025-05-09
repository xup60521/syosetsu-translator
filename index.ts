import { select, input, checkbox, confirm } from "@inquirer/prompts";
import { replaceTextInFiles } from "./replace";
import { translation } from "./translation";

import { state } from "./state";



// Function to prompt the user
async function main() {
    const options = [
        {
            name: "Translate from URLs",
            value: "translate",
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
        case "translate":
            let translation_is_done = false;
            while (!translation_is_done) {
                await state.selectModel();
                await state.input_divide_line();

                const inputQuestion = {
                    type: "input",
                    name: "inputValues",
                    message: "Enter URLs (separated by spaces):",
                };
                if (state.url_string === "") {
                    const inputAnswer = await input(inputQuestion);
                    state.set_url_string(inputAnswer);
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
        default:
            break;
    }
}

const providerOption = [
    {
        name: "Google",
        value: "google",
    },
    {
        name: "OpenAI",
        value: "openai",
    },
    {
        name: "Groq",
        value: "groq",
    },
    {
        name: "OpenRouter",
        value: "openrouter",
    },
];



main();
