import { load, type CheerioAPI } from "cheerio";
import type { NovelHandlerResultType } from "./novel_handler";
// import { getCookiesFromRedis, updateCookiesToRedis } from "../../redis";
import { windowsFileEscapeRegex } from "../utils";
import { randomUUID } from "crypto";

export async function pixiv_handler(
    urlobj: URL,
    { with_Cookies }: { with_Cookies?: boolean }
): Promise<NovelHandlerResultType> {
    return single_handler(urlobj, { with_Cookies });
}

async function single_handler(
    urlobj: URL,
    { with_Cookies }: { with_Cookies?: boolean }
): Promise<NovelHandlerResultType> {
    let this_novel_response;
    const fetchOptions: RequestInit = {};
    fetchOptions.headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
    };
    // if (with_Cookies) {
    //     const currentCookie = await getCookiesFromRedis({
    //         websiteType: "pixiv",
    //     });

    //     fetchOptions.headers.Cookie = currentCookie || "";
    // }
    if (urlobj.pathname.includes("/novel/show")) {
        const novel_id = urlobj.searchParams.get("id");
        this_novel_response = await fetch(
            `https://www.pixiv.net/ajax/novel/${novel_id}`,
            fetchOptions
        );
    } else if (urlobj.pathname.includes("/ajax/novel")) {
        this_novel_response = await fetch(urlobj, fetchOptions);
    } else {
        throw new Error("An error happens with url: " + urlobj.href);
    }

    // // Cookies
    // if (with_Cookies) {
    //     const set_cookies = this_novel_response.headers.getSetCookie();
    //     await updateCookiesToRedis({
    //         websiteType: "pixiv",
    //         setCookieArr: set_cookies,
    //     });
    // }

    const this_novel_data = await this_novel_response.json();
    const paragraphs = this_novel_data.body.content;
    const content = paragraphs.replaceAll("\n\n", "\n")
    const tags = this_novel_data.body?.tags?.tags?.map(
        ({ tag }: { tag: string }) => tag
    ) as string[] | undefined;
    const title = this_novel_data.body.title;
    const series_title = this_novel_data.body?.seriesNavData?.title ?? title;
    // after removing through regex, delete the additional whitespaces on the right
    const author = this_novel_data.body?.userName
        .replaceAll(windowsFileEscapeRegex, " ")
        .trimEnd();
    const indexPrefix =
        series_title + " " + (this_novel_data.body?.seriesNavData?.order ?? "");

    return {
        id: randomUUID(),
        title: title.replaceAll(windowsFileEscapeRegex, " "),
        indexPrefix: indexPrefix.replaceAll(windowsFileEscapeRegex, " "),
        content,
        series_title_and_author: (series_title + " " + author).replaceAll(
            windowsFileEscapeRegex,
            " "
        ).trim(),
        series_title,
        url: urlobj.href,
        author,
        tags: tags,
    };
}
