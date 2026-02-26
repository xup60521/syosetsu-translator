import { load, type CheerioAPI } from "cheerio";
import type { NovelHandlerResultType } from "@repo/shared";
import { randomUUID } from "crypto";
import { URLPattern } from "urlpattern-polyfill";
import { windowsFileEscapeRegex } from "../utils";

export async function syosetu_handler(
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

    const pathParts = urlobj.pathname.split("/").filter(Boolean);

    const $ = load(res);
    if (pathParts.length === 2) {
        return handle_long_work({ urlobj, $ });
    } else if (pathParts.length === 1) {
        return handle_short_work({ urlobj, $ });
    } else {
        throw new Error("Invalid URL");
    }
}

function handle_short_work({ urlobj, $ }: { urlobj: URL; $: CheerioAPI }) {
    const paragraphArr: string[] = [];
    const title = $(".p-novel__title").text();
    $(".p-novel__body > div > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });

    const series_title = title;
    const author = $("div.p-novel__author > a").text();
    const tags = getNovelTags(urlobj) ?? [series_title];

    return {
        id: randomUUID(),
        title: title,
        indexPrefix: urlobj.pathname.replaceAll("/", " ").trim(),
        content: paragraphArr.join("\n"),
        series_title_and_author: (series_title + " " + author)
            .replaceAll(windowsFileEscapeRegex, "")
            .trim(),
        url: urlobj.href,
        tags: tags,
        series_title,
        author,
    };
}

function handle_long_work({ urlobj, $ }: { urlobj: URL; $: CheerioAPI }) {
    const paragraphArr: string[] = [];
    const title = $(".p-novel__title").text();
    $(".p-novel__body > div > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });

    const series_title = $(
        "div.c-announce:nth-child(2) > a:nth-child(1)",
    ).text();
    const author = $("div.c-announce:nth-child(2) > a:nth-child(2)").text();
    const tags = getNovelTags(urlobj) ?? [series_title];

    return {
        id: randomUUID(),
        title: title,
        indexPrefix: urlobj.pathname.replaceAll("/", " ").trim(),
        content: paragraphArr.join("\n"),
        series_title_and_author: (series_title + " " + author)
            .replaceAll(windowsFileEscapeRegex, "")
            .trim(),
        url: urlobj.href,
        tags: tags,
        series_title,
        author,
    };
}

function getNovelTags(urlobj: URL) {
    // 本好きの下剋上 小書痴的下剋上系列
    const likeBookSeries = ["n4830bu", "n4750dy", "n7835cj"];
    const likeBookSeriesRegex = new RegExp(likeBookSeries.join("|"));
    if (likeBookSeriesRegex.test(urlobj.pathname)) {
        return ["本好きの下剋上"];
    }
    // サイレント・ウィッチ 沉默魔女的秘密系列
    const silentWitchSeries = ["n8356ga", "n5194gp", "n8978fv", "n7961jr"];
    const silentWitchSeriesRegex = new RegExp(silentWitchSeries.join("|"));
    if (silentWitchSeriesRegex.test(urlobj.pathname)) {
        return ["サイレント・ウィッチ"];
    }
    // 痛いのは嫌なので防御力に極振りしたいと思います 怕痛的我，把防禦力點滿就對了
    const scaredToHurtSeries = ["n0358dh"];
    const scaredToHurtSeriesRegex = new RegExp(scaredToHurtSeries.join("|"));
    if (scaredToHurtSeriesRegex.test(urlobj.pathname)) {
        return ["痛いのは嫌なので防御力に極振りしたいと思います"];
    }
    return undefined;
}
