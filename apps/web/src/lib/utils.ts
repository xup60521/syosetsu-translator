import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const windowsFileEscapeRegex = /[<>:"/\\|?*]/g;

export const supportedProvider = [
    { value: "google-ai-studio", label: "Google AI Studio" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "mistral", label: "MistralAI" },
    { value: "cerebras", label: "Cerebras" },
    { value: "groq", label: "Groq" },
] as const;

export type WorkflowPayloadType = {
    urls: string[];
    provider: (typeof supportedProvider)[number]["value"];
    encrypted_api_key: string;
    user_id: string;
    model_id: string;
    concurrency: number;
    batch_size: number;
    folder_id: string;
    api_key_name?: string;
}

export const en_prompt = `You are a professional translator who thoroughly understand the context and make the best decision in translating Japanese articles into traditional Chinese (Taiwan). Generally, when it comes to proper nouns like name, place or special items, there is often no official transltion. Therefore, you tend to keep their original Japanese forms. The article will be provided later on and make sure the output only contain the translated content without additional descriptive words.
After the translation is done, re-check the result and keep:

1. The article is indeed translated into traditional Chinese (Taiwan).
2. Proper nouns are in their original Japanese form.

Now you understand the translation rule, here's the instruction of how you will translate the article.

1. Go through the entire article and understand what it says. Don't translate yet.
2. Identify the proper nouns and understand the context around them. Don't translate yet.
3. Around the proper nouns, based on the understanding of the context, now you can translate the article without changing proper nouns. (keep proper nouns their original form).
4. Revise the translation result. If you accidentally translate the proper nouns, this is the chance you can fix it. If the proper noun is in Japanese, you should keep it in its original Japanese form.
5. If somehow the article is entirely untranslated, please go back to step 1 and make sure to actually translate the article this time.

 The article will be presented in the following section. 
 
 **Important!** Remember to format your text and use line breaks to make it easier to read.
 `;

export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
    if (chunkSize < 0) {
        throw new Error("Chunk size must be a positive number.");
    }
    if (chunkSize === 0) {
        return [arr];
    }

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
    }
    // If the last chunk is shorter than the previous, merge the last two chunks
    if (
        result.length > 1 &&
        result[result.length - 1].length < result[result.length - 2].length
    ) {
        const last = result.pop()!;
        result[result.length - 1] = result[result.length - 1].concat(last);
    }
    return result;
}
