import { load } from "cheerio";
import type { NovelHandlerResultType } from ".";
import { windowsFileEscapeRegex } from "../../utils";

export async function kakuyomu_handler(
    urlobj: URL,
    { with_Cookies }: { with_Cookies?: boolean }
): Promise<NovelHandlerResultType> {
    const res = await fetch(urlobj, {
        headers: {
            ...(with_Cookies ? { Cookie: process.env.SYOSSETSU_COOKIES } : {}),
        },
    }).then((res) => res.text());
    const $ = load(res);
    const paragraphArr: string[] = [];
    $(".js-episode-body > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });
    
    let sidebar_url = urlobj.toString()
    if (!sidebar_url.endsWith("/")) {
        sidebar_url += "/"
    }
    sidebar_url += "episode_sidebar"
    const sidebar_res = await fetch(sidebar_url).then((res) => res.text());
    const $sidebar = load(sidebar_res);
    const series_title = $sidebar("h3.heading-level4 > a").text();
    const title = $("header#contentMain-header > p").text();
    const author = $sidebar("h4.heading-level5 > a").text();
    const indexPrefix =
        series_title + " " + title;
    return {
        title: title,
        indexPrefix: indexPrefix.replaceAll(windowsFileEscapeRegex, " "),
        paragraphArr,
        series_title_and_author: (series_title + " " + author).replaceAll(windowsFileEscapeRegex, " ").trim(),
        url: urlobj.href,
        tags: [series_title],
        series_title,
        author,
    };
}
