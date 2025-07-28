import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

async function main() {
    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_KEY,
    });

    const model = openrouter.languageModel(
        "deepseek/deepseek-chat-v3-0324:free"
    );
    const { text } = await generateText({
        model: model,
        prompt: "Hello, world!",
    });
    console.log(text);
}

main()