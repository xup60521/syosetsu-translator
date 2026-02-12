import { Output, streamText } from 'ai';
import { handle_file } from './handle_file';
import { replace_words } from './replace';

import { en_prompt } from './utils';
import z from 'zod';
import { decrypt, NovelHandlerResultType, supportedProvider } from '@repo/shared';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createCerebras } from '@ai-sdk/cerebras';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stringSimilarity } from 'string-similarity-js';

const ai_translated_result_schema = z.object({
	id: z.string(),
	translated_content: z.string(),
});

type BatchTranslationParameter = {
	urls: string[];
	provider: (typeof supportedProvider)[number]['value'];
	model_id: string;
	encrypted_api_key: string;
	with_Cookies?: boolean;
	user_id: string;
	folder_id: string;
	encrypted_refresh_token: string;
};

async function novel_handler(url: string, options?: { with_Cookies?: boolean }) {
    const res = await fetch(process.env.NOVEL_HANDLER_URL, {method: "POST", body: JSON.stringify({url, with_Cookies: options?.with_Cookies})})
    const data = await res.json() as NovelHandlerResultType
    return data
}

export async function batchTranslate(props: BatchTranslationParameter) {
	const { urls, model_id, with_Cookies, provider, encrypted_api_key, folder_id, encrypted_refresh_token } = props;
	const providerInstance = getProvider(provider, encrypted_api_key);
	const model = providerInstance(model_id);

	const google_refresh_token = decrypt(encrypted_refresh_token);
	const novel_data = urls.map(async (url) => novel_handler(url, { with_Cookies }));
	const untranslated_data = await Promise.all(novel_data);
	// console.log("translating...")
	let try_count = 0;
	while (untranslated_data.length > 0) {
		// console.log("Remaining sections:", untranslated_data.length);
		try_count++;
		if (try_count > 3) {
			throw new Error('Translation failed');
		}
		const { elementStream } = streamText({
			model,
			output: Output.array({ element: ai_translated_result_schema }),
			messages: [
				{
					role: 'user',
					content: en_prompt,
				},
				{
					role: 'user',
					content: JSON.stringify(untranslated_data),
				},
			],
		});

		for await (const item of elementStream) {
			if (!item) {
				continue;
			}
			const metadata = untranslated_data.find((d) => d.id.trim() === item.id.trim())!;
			if (!metadata) {
				continue;
			}

			const similarity = stringSimilarity(item.translated_content.replaceAll('\\n', '\n'), metadata.content.replaceAll('\\n', '\n'));
			if (similarity > 0.95) {
				continue;
			}

			// remove that item from untranslated_data to save memory
			untranslated_data.splice(untranslated_data.indexOf(metadata), 1);
			const sectionedText = item.translated_content!.replace(/(\r\n|\r|\n)/g, '\n\n');
			const { series_title_and_author, title, indexPrefix, url, tags, author } = metadata;
			const content =
				`# ${title}

${indexPrefix}

URL: ${url}
Author: ${author}
Model: ${model.modelId}
Tags: ${tags?.join(', ') ?? ''}

` +
				(
					await replace_words(sectionedText, {
						series_title_and_author,
						title,
						tags,
					})
				).replaceAll('\\n', '\n');

			// console.log(content);
			await handle_file({
				series_title_and_author,
				title,
				indexPrefix,
				content,
				folder_id,
				refresh_token: google_refresh_token!,
			});
		}
	}
	// console.log("finishing translation")
}

function getProvider(provider: BatchTranslationParameter['provider'], encrypted_api_key: string) {
	const decrypted_api_key = decrypt(encrypted_api_key);
	if (provider === 'google-ai-studio') {
		return createGoogleGenerativeAI({ apiKey: decrypted_api_key });
	}
	if (provider === 'cerebras') {
		return createCerebras({ apiKey: decrypted_api_key });
	}
	if (provider === 'groq') {
		return createGroq({ apiKey: decrypted_api_key });
	}
	if (provider === 'mistral') {
		return createMistral({ apiKey: decrypted_api_key });
	}
	if (provider === 'openrouter') {
		return createOpenRouter({ apiKey: decrypted_api_key });
	}
	throw new Error(`Provider '${provider}' is not implemented.`);
}
