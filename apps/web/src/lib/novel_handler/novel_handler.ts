import { syosetsu_handler } from "./syosetsu";
import { pixiv_handler } from "./pixiv";
import { kakuyomu_handler } from "./kakuyomu";

export type NovelHandlerResultType = {
    id: string;
    title: string;
    indexPrefix: string;
    content: string;
    series_title_and_author: string;
    series_title: string;
    url: string;
    author: string;
    tags?: string[];
};

/**
 * This function takes an URL as input and extracts the novel detail of that url. This function can only accept single episode url at once and might throw error.
 *
 * @param url - The URL of the novel to extract details from.
 * @returns A promise that resolves to the extracted novel details as a ResultType.
 * @throws Will throw an error if no handler is defined for the given URL origin.
 */



export async function novel_handler(
    url: string,
    { with_Cookies }: { with_Cookies?: boolean }
): Promise<NovelHandlerResultType> {
    const urlobj = new URL(url);
    let result: NovelHandlerResultType | undefined = undefined;
    switch (urlobj.origin) {
        case "https://ncode.syosetu.com":
            result = await syosetsu_handler(urlobj, { with_Cookies });
            break;
        case "https://www.pixiv.net":
            result = await pixiv_handler(urlobj, { with_Cookies });
            break;
        case "https://kakuyomu.jp":
            result = await kakuyomu_handler(urlobj, { with_Cookies });
            break;
    }
    if (!result) throw new Error("handler is not defined");
    return result;
}
