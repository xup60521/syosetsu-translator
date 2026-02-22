import { load } from "cheerio";
import type { DecomposedURL } from "../type";

export async function decompose_kakuyomu(
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
        const pageHtml = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            },
        }).then((res) => res.text());
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