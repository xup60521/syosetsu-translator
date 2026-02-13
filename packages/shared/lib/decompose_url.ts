
import { URLPattern } from "urlpattern-polyfill";
import { load } from "cheerio";
import type { DecomposedURL } from "./type";

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
            const processed_urls = await decompose_syosetsu(
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
        } else {
            novel_urls.push({ url: url.toString(), title: undefined });
        }
    }
    return novel_urls;
}

async function decompose_kakuyomu(
    url: URL,
    with_Cookies = false,
): Promise<DecomposedURL[]> {
    const series_pattern = new URLPattern({
        baseURL: "https://kakuyomu.jp/",
        pathname: "/works/:series_id",
    });
    if (series_pattern.test(url)) {
        const seriesPageHTML = await fetch(url).then((res) => res.text());
        const seiresPage$ = load(seriesPageHTML);
        const first_episode_url = seiresPage$("aside a").first().attr("href");
        if (!first_episode_url) return [];
        const sidebar_url = new URL(
            "https://kakuyomu.jp" + first_episode_url + "/episode_sidebar",
        );
        // console.log(sidebar_url)
        return await decompose_kakuyomu(sidebar_url);
    }
    const single_episode_pattern = new URLPattern({
        baseURL: "https://kakuyomu.jp/",
        pathname: "/works/:series_id/episodes/:work_id",
    });
    if (single_episode_pattern.test(url)) {
        return [{ url: url.toString(), title: undefined }];
    }
    const episode_sidebar_pattern = new URLPattern({
        baseURL: "https://kakuyomu.jp/",
        pathname: "/works/:series_id/episodes/:work_id/episode_sidebar",
    });
    if (episode_sidebar_pattern.test(url)) {
        const pageHtml = await fetch(url).then((res) => res.text());
        const $ = load(pageHtml);
        const urlArr = $("li a")
            .toArray()
            .map((elm) => ({
                url: "https://kakuyomu.jp" + $(elm).attr("href"),
                title: $(elm).text(),
            }))
            .filter((d) => !!d) as DecomposedURL[];
        return urlArr;
    }
    return [];
}

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
async function decompose_syosetsu(
    url: URL,
    with_Cookies = false,
): Promise<{ title: string | undefined; url: string }[]> {
    const decomposed_urls = [] as { title: string | undefined; url: string }[];

    const pathParts = url.pathname.split("/").filter(Boolean);
    // pathParts: ["{novel_id}"] or ["{novel_id}", "{order}"]
    if (pathParts.length === 1) {
        // List page, need to decompose

        // move from web crawling to using API
        const response = await fetch(
            `https://api.syosetu.com/novelapi/api/?ncode=${pathParts[0]}&out=json`,
        );
        const novel_count = (await response.json())[1].general_all_no as number;
        const urls = new Array(novel_count).fill(null).map((_, i) => ({
            title: undefined,
            url: `https://ncode.syosetu.com/${pathParts[0]}/${i + 1}/`,
        }));

        decomposed_urls.push(...urls);
    } else if (pathParts.length === 2) {
        // Direct episode page, return the url itself
        decomposed_urls.push({ url: url.toString(), title: undefined });
    } else {
        throw new Error(
            "The URL does not point to a valid syosetsu novel series or episode: " +
                url.toString(),
        );
    }
    return decomposed_urls;
}

/**
 * Handles URLs from Pixiv, specifically for novel series or individual novel pages.
 *
 * If the URL points to a novel series, it fetches the series content titles and returns
 * an array of URLs for each novel in the series. If the URL points to an individual novel,
 * it returns that URL.
 *
 * @param url - The URL object to process.
 * @returns A promise that resolves to an array of URLs for the novels in the series or the individual novel URL.
 */
async function decompose_pixiv(
    url: URL,
    with_Cookies = false,
): Promise<DecomposedURL[]> {
    const seriesMatch = url.pathname.match(/^\/novel\/series\/(\d+)\/?$/);
    if (seriesMatch) {
        const series_id = seriesMatch[1];
        if (!series_id) {
            throw new Error(
                "Could not extract series ID from URL: " + url.toString(),
            );
        }

        const fetchOptions: RequestInit = {};
        fetchOptions.headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
        };
        // if (with_Cookies) {
        //     const currentCookie = await getCookiesFromRedis({
        //         websiteType: "pixiv",
        //     });
        //     if (currentCookie) {
        //         fetchOptions.headers.Cookie = currentCookie;
        //     }
        // }

        const response = await fetch(
            `https://www.pixiv.net/ajax/novel/series/${series_id}/content_titles`,
            fetchOptions,
        );
        const series_content_titles = (await response.json()).body;
        // update pixiv cookies
        // await updateCookiesToRedis({
        //     websiteType: "pixiv",
        //     setCookieArr: response.headers.getSetCookie(),
        // });
        const novel_ids = series_content_titles
            .map((d: { id: string; available: boolean; title: string }) =>
                // remove the condition to always return the URL
                d.available
                    ? // true
                      {
                          title: d.title,
                          url: `https://www.pixiv.net/novel/show.php?id=${d.id}`,
                      }
                    : null,
            )
            .filter(
                (d: { title: string | undefined; url: string } | null) => d,
            ) as { title: string | undefined; url: string }[];
        return novel_ids;
    }
    if (url.pathname.includes("/novel/show")) {
        return [{ title: undefined, url: url.toString() }];
    }
    // if (url.pathname.includes("/users/")) {
    //     const [, users, userId] = url.pathname.split("/");
    //     if (users !== "users") {
    //         throw new Error(url.toString() + " is not a pixiv user url");
    //     }
    //     if (!userId || userId === "") {
    //         throw new Error(url.toString() + " has no userId");
    //     }
    //     const urls = await translate_from_pixiv_user(url.toString());
    //     if (urls) {
    //         const decomposed_urls = decompose_url(urls.join(" "));
    //         return decomposed_urls;
    //     }
    //     return [];
    // }
    if (url.pathname.includes("/ajax/")) {
        throw new Error(
            "To reduce confusion, you should not use the ajax URL. Use the normal URL instead.",
        );
    }
    throw new Error(
        "The URL is not a valid Pixiv novel series or novel page: " +
            url.toString(),
    );
}
