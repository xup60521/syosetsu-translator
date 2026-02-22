

export const windowsFileEscapeRegex = /[<>:"/\\|?*]/g;




export const en_prompt = `[SYSTEM]
You are a professional Japanese-to-Traditional Chinese (Taiwan) translator specializing in nuanced article localization. Your priority is context-accurate translation while strictly adhering to proper noun preservation rules.

[RULES]
1. TARGET LANGUAGE: Traditional Chinese (Taiwanese usage/phrasing).
2. PROPER NOUNS: Keep all proper nouns (names, places, specialized brand terms, or unique item names) in their ORIGINAL Japanese form (Kanji/Katakana/Hiragana). Do not attempt to localize or phonetically translate them.
3. OUTPUT: Provide ONLY the translated content. No preamble ("Here is the translation..."), no explanations, and no metadata.

[PROCESS]
- STEP 1: Analyze the source text to identify proper nouns and cultural context.
- STEP 2: Perform the translation while skipping identified proper nouns.
- STEP 3: Self-review to ensure no proper nouns were accidentally converted to Chinese characters or phonetic equivalents.

[EXAMPLES]
- Source: "東京駅で田中さんと待ち合わせる。" 
- Correct Output: "在 東京駅 與 田中 先生碰面。" (Proper nouns preserved in original form)
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
        result[result.length - 1]!.length < result[result.length - 2]!.length
    ) {
        const last = result.pop()!;
        result[result.length - 1] = result[result.length - 1]!.concat(last);
    }
    return result;
}
