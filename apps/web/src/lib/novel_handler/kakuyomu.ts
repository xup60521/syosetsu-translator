import { load } from "cheerio";
import type { NovelHandlerResultType } from "@repo/shared";
import { windowsFileEscapeRegex } from "../utils";
import { randomUUID } from "crypto";

export async function kakuyomu_handler(
    urlobj: URL,
    { with_Cookies }: { with_Cookies?: boolean },
): Promise<NovelHandlerResultType> {
    const res = await fetch(urlobj, {
        headers: {
            ...(with_Cookies ? { Cookie: process.env.SYOSSETSU_COOKIES } : {}),
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        },
    }).then((res) => res.text());
    const $ = load(res);
    const paragraphArr: string[] = [];
    $(".js-episode-body > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });

    let sidebar_url = urlobj.toString();
    if (!sidebar_url.endsWith("/")) {
        sidebar_url += "/";
    }
    sidebar_url += "episode_sidebar";
    // console.log(sidebar_url)
    const sidebar_res = await fetch(sidebar_url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        },
    }).then((res) => res.text());
    const $sidebar = load(sidebar_res);
    const series_title = $sidebar("h3.heading-level4 > a").text();
    // const episode = $("header#contentMain-header > p:last-child").text();
    const title = $("header#contentMain-header > p.widget-episodeTitle").text();
    const author = $sidebar("h4.heading-level5 > a").text();

    const all_episodes = [] as string[];
    $sidebar("ol.widget-toc-items > li.widget-toc-episode span").each(
        (index, element) => {
            const $element = $sidebar(element);
            all_episodes.push($element.text());
        },
    );

    const all_episodes_urls = [] as string[];
    $sidebar("ol.widget-toc-items > li.widget-toc-episode a").each(
        (index, element) => {
            const $element = $sidebar(element);
            all_episodes_urls.push($element.attr("href") || "");
        },
    );

    // console.log(all_episodes_urls)
    const current_pathname = urlobj.pathname;
    const episode =
        all_episodes_urls.findIndex((episode_url) => {
            return episode_url === current_pathname;
        }) + 1;
    // console.log(title)
    // const episode = all_episodes.indexOf(title) + 1;
    // console.log(episode)

    const indexPrefix = series_title + " " + episode;
    return {
        id: randomUUID(),
        title: title,
        indexPrefix: indexPrefix.replaceAll(windowsFileEscapeRegex, " "),
        content: paragraphArr.join("\n"),
        series_title_and_author: (series_title + " " + author)
            .replaceAll(windowsFileEscapeRegex, " ")
            .trim(),
        url: urlobj.href,
        tags: [series_title],
        series_title,
        author,
    };
}
