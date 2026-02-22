import { URLPattern } from "urlpattern-polyfill";
import { load } from "cheerio";
import type { DecomposedURL } from "../type";
import { decompose_pixiv } from "./pixiv";
import { decompose_syosetu } from "./syosetu";
import { decompose_kakuyomu } from "./kakuyomu";
import { decompose_alphapolis } from "./alphapolis";

export async function decomposeURL({
    url_string,
    with_Cookies = false,
}: {
    url_string: string;
    with_Cookies?: boolean;
}) {
    const urls = url_string.split(" ");
    const novel_urls: DecomposedURL[] = [];
    for await (const url of urls) {
        const urlobj = new URL(url);
        if (urlobj.host === "www.pixiv.net") {
            const processed_urls = await decompose_pixiv(urlobj, with_Cookies);

            novel_urls.push(...processed_urls);
        } else if (urlobj.host === "ncode.syosetu.com") {
            const processed_urls = await decompose_syosetu(
                urlobj,
                with_Cookies,
            );

            novel_urls.push(...processed_urls);
        } else if (urlobj.host === "kakuyomu.jp") {
            const processed_urls = await decompose_kakuyomu(
                urlobj,
                with_Cookies,
            );

            novel_urls.push(...processed_urls);
        } else if (urlobj.host === "www.alphapolis.co.jp") {
            const processed_urls = await decompose_alphapolis(
                urlobj,
                with_Cookies,
            );
            novel_urls.push(...processed_urls);
        } else {
            novel_urls.push({ url: url.toString(), title: undefined });
        }
    }
    return novel_urls;
}


