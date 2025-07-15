import { generateText } from "ai";
import { input_select_model } from "./utils";

const rules = `
Translate the following Japanese article into Traditional Chinese (Taiwan).
Strictly adhere to the following rules:

1. Proper Noun Preservation: Do NOT translate any proper nouns. This includes, but is not limited to:
	- People's Names: e.g., 山田太郎 (Yamada Tarou) should remain 山田太郎.
	- Place Names: e.g., 東京 (Tokyo) should remain 東京, 富士山 (Mount Fuji) should remain 富士山.
	- Organization/Company Names: e.g., ソニー (Sony) should remain ソニー, 日本放送協会 (NHK) should remain 日本放送協会.
	- Specific Product Names, Brand Names, or Event Names: e.g., PlayStation, Pokémon, Olympics.
2. Contextual Understanding: Ensure the translation flows naturally and accurately conveys the original meaning while maintaining the tone.`;

const { model } = await input_select_model();
await generateText({
    model,
    prompt: rules,
    seed: Math.floor(10000 * Math.random()),
});
