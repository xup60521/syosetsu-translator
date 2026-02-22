import { load } from "cheerio";
import type { DecomposedURL } from "../type";

export async function decompose_alphapolis(
    url: URL,
    with_Cookies = false,
): Promise<DecomposedURL[]> {
    // https://www.alphapolis.co.jp/novel/475353206/100031617/episode/10813820
    const single_match = new URLPattern({
        baseURL: "https://www.alphapolis.co.jp/",
        pathname: "/novel/:user_id/:series_id/episode/:work_id",
    });
    if (single_match.test(url)) {
        return [{ url: url.toString(), title: undefined }];
    }
    // https://www.alphapolis.co.jp/novel/475353206/100031617
    const series_match = new URLPattern({
        baseURL: "https://www.alphapolis.co.jp/",
        pathname: "/novel/:user_id/:series_id",
    });
    if (series_match.test(url)) {
        const pageHTML = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            },
        }).then((res) => res.text());
        const $ = load(pageHTML);
        const decomposed_urls = $(".episode > a")
            .toArray()
            .map((h) => {
                const $node = $(h);
                const url = $node.attr("href")!;
                const title = $node.find("span").first().text().trim(); // descendant span
                return { url, title };
            });
        return decomposed_urls;
    }
    return [];
}


