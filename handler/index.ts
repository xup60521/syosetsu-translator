import { load, type CheerioAPI } from "cheerio";
import { syosetsu_handler } from "./syosetsu";
import { z } from "zod";
import { pixiv_handler } from "./pixiv";

type ResultType = {
    title: string;
    indexPrefix: string;
    paragraphArr: string[];
    series_title: string;
}[]

export default async function handler(url: string) {
    
    const urlobj = new URL(url);
    let result: ResultType | undefined = undefined;
    switch (urlobj.origin) {
        case "https://ncode.syosetu.com":
            result = await syosetsu_handler(urlobj)
            break;
        case "https://www.pixiv.net":
            result = await pixiv_handler(urlobj)
            break;
    }
    if (!result) throw new Error("handler is not defined");
    return result;
}
