import type { DecomposedURL } from "../type";
import { URLPattern } from "urlpattern-polyfill";
import { load } from "cheerio";
import { decomposeURL } from ".";

/**
 * Decomposes a syosetsu novel URL into individual episode URLs.
 *
 * If the provided URL points to a novel's list page (e.g., `/novel_id`), this function paginates through all available pages,
 * fetching and extracting episode URLs from each page. If the URL points directly to an episode (e.g., `/novel_id/order`),
 * it simply returns that episode URL.
 *
 * @param url - The URL object representing either a syosetsu novel list page or a direct episode page.
 * @returns A promise that resolves to an array of strings, each representing a decomposed episode URL.
 */
export async function decompose_syosetu(
    url: URL,
    with_Cookies = false,
): Promise<DecomposedURL[]> {
    const pathParts = url.pathname.split("/").filter(Boolean);
    const ncode = pathParts[0];
    // pathParts: ["{novel_id}"] or ["{novel_id}", "{order}"]
    // const episodePattern = new URLPattern({
    //     baseURL: "https://ncode.syosetu.com",
    //     pathname: "/:ncode/:order/",
    // });
    // if (episodePattern.test(url)) {
    //     return [{ url: url.toString(), title: undefined }];
    // }

    // const ncodePattern = new URLPattern({
    //     baseURL: "https://ncode.syosetu.com",
    //     pathname: "/:ncode/",
    // });
    // if (ncodePattern.test(url)) {
    //     const ncode = ncodePattern.exec(url)?.pathname.groups.ncode;
    //     if (!ncode) {
    //         throw new Error("Failed to extract ncode from URL");
    //     }
    //     if (ncode.startsWith("s")) {
    //         const r = await fetch(url, {
    //             headers: {
    //                 "User-Agent":
    //                     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    //             },
    //         });
    //         const html = await r.text();
    //         const $ = load(html);
    //         const h2s = $("h2").toArray();
    //         const urls = h2s.map(h2 => {
    //             const a = $(h2).find("a").first();
    //             const href = a.attr("href");
    //             if (href) {
    //                 return  href;
    //             }
    //         })
    //         .filter((x): x is string => !!x) as string[];
    //         if (urls.length > 0) {
    //             return await decomposeURL({url_string: urls.join(" "), with_Cookies});
    //         }
    //     }
    //     const response = await fetch(
    //         `https://api.syosetu.com/novelapi/api/?ncode=${ncode}&out=json`,
    //         {
    //             headers: {
    //                 "User-Agent":
    //                     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    //             },
    //         },
    //     );
    //     const j = (await response.json()) as unknown[];
    //     const data = j[1] as Data;
    //     if (data.novel_type === 2) {
    //         return [{ url: url.toString(), title: data.title }];
    //     }
    //     const novel_count = data.general_all_no as number;
    //     const urls = new Array(novel_count).fill(null).map((_, i) => ({
    //         title: undefined,
    //         url: `https://ncode.syosetu.com/${ncode}/${i + 1}/`,
    //     }));
    //     return urls;
    // }
    if (pathParts.length === 1) {
        // List page, need to decompose
        if (ncode!.startsWith("s")) {
            const r = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                },
            });
            const html = await r.text();
            const $ = load(html);
            const h2s = $("h2").toArray();
            const urls = h2s
                .map((h2) => {
                    const a = $(h2).find("a").first();
                    const href = a.attr("href");
                    if (href) {
                        return href;
                    }
                })
                .filter((x): x is string => !!x) as string[];
            if (urls.length > 0) {
                return await decomposeURL({
                    url_string: urls.join(" "),
                    with_Cookies,
                });
            }
        }

        // move from web crawling to using API
        const response = await fetch(
            `https://api.syosetu.com/novelapi/api/?ncode=${ncode}&out=json`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                },
            },
        );
        const j = (await response.json()) as unknown[];
        const data = j[1] as Data;
        if (data.novel_type === 2) {
            return [{ url: url.toString(), title: data.title }];
        }
        const novel_count = data.general_all_no as number;
        const urls = new Array(novel_count).fill(null).map((_, i) => ({
            title: undefined,
            url: `https://ncode.syosetu.com/${ncode}/${i + 1}/`,
        }));
        return urls;
    } else if (pathParts.length === 2) {
        // Direct episode page, return the url itself
        return [{ url: url.toString(), title: undefined }];
    } else {
    }
    throw new Error(
        "The URL does not point to a valid syosetsu novel series or episode: " +
            url.toString(),
    );
}

type Data = {
    title: string;
    ncode: string;
    userid: number;
    writer: string;
    story: string;
    biggenre: number;
    genre: number;
    gensaku: string;
    keyword: string;
    general_firstup: string;
    general_lastup: string;
    novel_type: number;
    end: number;
    general_all_no: number;
    length: number;
    time: number;
    isstop: number;
    isr15: number;
    isbl: number;
    isgl: number;
    iszankoku: number;
    istensei: number;
    istenni: number;
    global_point: number;
    daily_point: number;
    weekly_point: number;
    monthly_point: number;
    quarter_point: number;
    yearly_point: number;
    fav_novel_cnt: number;
    impression_cnt: number;
    review_cnt: number;
    all_point: number;
    all_hyoka_cnt: number;
    sasie_cnt: number;
    kaiwaritu: number;
    novelupdated_at: string;
    updated_at: string;
};
