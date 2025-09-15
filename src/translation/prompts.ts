import type { ModelIdType, providerOption } from "../model_list";
import { mistralAIModelList } from "../model_list";

export const ch_prompt = `# 指令：
            請將以下日文文章翻譯成台灣常用的繁體中文。我會在接下來的訊息提供文章。

            # 翻譯規則：
            1.  文章內的所有日文**人名**與**專有名詞**（例如地名、組織名、品牌名等）必須**保留日文原文**，請勿翻譯。
            2.  其餘內容需翻譯成通順自然的台灣繁體中文。

            # 輸出要求：
            直接輸出翻譯後的完整文章，不要包含任何說明、標題或原文。

            # 其他注意事項
            請再三確認翻譯的內容符合上述規則，並且沒有遺漏任何重要信息，否則我會很傷心，請多加注意。`;

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

 The article will be presented in the following section.`;

export function getTranslationPrompt(props: {
    similarity_retry_count: number;
    modelId: string;
    provider: string;
}) {
    const { similarity_retry_count } = props;
    const modelId = props.modelId as ModelIdType;
    const provider = props.provider as (typeof providerOption)[number]["value"];
    if (
        modelId === "llama-3.3-70b-versatile" ||
        modelId === "gemini-2.5-flash-lite" ||
        modelId === "openai/gpt-oss-120b" ||
        modelId === "openai/gpt-oss-20b" ||
        modelId === "openai/gpt-oss-20b:free" ||
        mistralAIModelList.map((d) => d.value as string).includes(modelId) ||
        // modelId === "moonshotai/kimi-k2-instruct" ||
        // modelId === "moonshotai/kimi-k2:free" ||
        modelId === "gemini-2.5-flash" ||
        provider === "cerebras"
    ) {
        return oddTranslationPrompt(similarity_retry_count);
    }
    return evenTranslationPrompt(similarity_retry_count);
}

function evenTranslationPrompt(similarity_retry_count: number) {
    if (similarity_retry_count % 2 === 0) {
        return ch_prompt;
    }
    return en_prompt;
}

export function oddTranslationPrompt(similarity_retry_count: number) {
    if (similarity_retry_count % 2 === 1) {
        return ch_prompt;
    }
    return en_prompt;
}

export function getOneStepTranslatePrompt(
    originalText: string,
    similarity_retry_count: number,
    modelId: string,
    provider: string
) {
    const translation_prompt = getTranslationPrompt({
        similarity_retry_count,
        modelId,
        provider,
    });
    return `
        ${translation_prompt}

        ---
        ${originalText}
        ---
        `;
}

// Two step translation prompt. JP => ZH

// export function getTwoStepFirstTranslatePrompt(originalText: string) {
//     return (
//         "Translate the following content into traditional Chinese (Taiwan). Output the translation result only."
//         + "\n\nThe article will be presented in the following section.\n\n" +
//         "```\n" +
//         originalText +
//         "\n```"
//     );
// }

// export function getTwoStepSecondTranslatePrompt(originalText: string, firstTranslation: string) {
//     return (
//         "You are a professional translator who has proficient in translating Japanese article into traditional Chinese (Taiwan) one whlie keeping the proper nouns their original Japanese form. Please compare the original and translated articles and replace the proper nouns in the translated one with that in the original one. Additionally, please only output the result without any extra explaination. Therefore, the output should be a translated article in traditional Chinese (Taiwan) with proper nouns untranslated and in their original form. You need to understand the context in order to decide whether it is proper nouns or not. For example, you need to keep human name and special item their Japanese form.\n" +
//         "The original and translated articles will be presented in the following section.\nOther then proper nouns (which you need to carefully identify), make sure to keep the article translated in traditional Chinese (Taiwan).\n\n### Original\n\n```\n" +
//         originalText +
//         "\n```\n\n### Translated\n\n```\n" +
//         firstTranslation +
//         "\n```"
//     );
// }

export function getTwoStepFirstTranslatePrompt(originalText: string) {
    return (
        `You are a professional translator who thoroughly understand the context and make the best decision in translating Japanese articles into English. Generally, when it comes to proper nouns like name, place or special items, there is often no official transltion. Therefore, you tend to keep their original Japanese forms. The article will be provided later on and make sure the output only contain the translated content without additional descriptive words.
After the translation is done, re-check the result and keep:

1. The article is indeed translated into English.
2. Proper nouns are in their original Japanese form.

Now you understand the translation rule, here's the instruction of how you will translate the article.

1. Go through the entire article and understand what it says. Don't translate yet.
2. Identify the proper nouns and understand the context around them. Don't translate yet.
3. Around the proper nouns, based on the understanding of the context, now you can translate the article without changing proper nouns. (keep proper nouns their original form).
4. Revise the translation result. If you accidentally translate the proper nouns, this is the chance you can fix it. If the proper noun is in Japanese, you should keep it in its original Japanese form.
5. If somehow the article is entirely untranslated, please go back to step 1 and make sure to actually translate the article this time.

 The article will be presented in the following section.
 
 
 ` +
        originalText +
        "\n```"
    );
}

export function getTwoStepSecondTranslatePrompt(
    originalText: string,
    firstTranslation: string
) {
    return (
        "You are a professional translator who has proficient in translating Japanese article into traditional Chinese (Taiwan) one whlie keeping the proper nouns their original Japanese form. Please compare the original and translated articles and replace the proper nouns in the translated one with that in the original one. Additionally, please only output the result without any extra explaination. Therefore, the output should be a translated article in traditional Chinese (Taiwan) with proper nouns untranslated and in their original form. You need to understand the context in order to decide whether it is proper nouns or not. For example, you need to keep human name and special item their Japanese form.\n" +
        "The original and translated articles will be presented in the following section.\nOther then proper nouns (which you need to carefully identify), make sure to keep the article translated in traditional Chinese (Taiwan).\n\n### Original\n\n```\n" +
        originalText +
        "\n```\n\n### Translated\n\n```\n" +
        firstTranslation +
        "\n```"
    );
}
