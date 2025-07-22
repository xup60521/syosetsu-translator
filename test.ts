import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

async function main() {
    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_KEY,
    });

    const model = openrouter.languageModel(
        "qwen/qwq-32b:free"
    );
    const { text } = await generateText({
        model: model,
        prompt: "Hello, world!",
    });
    console.log(text);
}

main()