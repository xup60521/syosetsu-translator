import type { DecomposedURL } from "../type";

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
export async function decompose_pixiv(
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
