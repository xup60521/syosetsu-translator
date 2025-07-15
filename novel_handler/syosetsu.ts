import { load, type CheerioAPI } from "cheerio";

export async function syosetsu_handler(urlobj: URL) {
    const res = await fetch(urlobj).then((res) => res.text());
    const $ = load(res);
    const paragraphArr: string[] = [];
    const title = $(".p-novel__title").text();
    $(".p-novel__body > div > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });
    const series_title = $("div.c-announce:nth-child(2) > a").text();
    const tags = getNovelTags(urlobj)

    return [
        {
            title: title,
            indexPrefix: urlobj.pathname.replaceAll("/", " ").trim(),
            paragraphArr,
            series_title,
            url: urlobj.href,
            tags: tags,
        },
    ];
}


function getNovelTags(urlobj: URL): [string] | undefined {
    // 本好きの下剋上 小書痴的下剋上系列
    const likeBookSeries = ["n4830bu", "n4750dy", "n7835cj"];
    const likeBookSeriesRegex = new RegExp(likeBookSeries.join("|"));
    if (likeBookSeriesRegex.test(urlobj.pathname)) {
        return ["本好きの下剋上" ]
    }
    // サイレント・ウィッチ 沉默魔女的秘密系列
    const silentWitchSeries = ["n8356ga", "n5194gp", "n8978fv", "n7961jr"];
    const silentWitchSeriesRegex = new RegExp(silentWitchSeries.join("|"));
    if (silentWitchSeriesRegex.test(urlobj.pathname)) {
        return ["サイレント・ウィッチ"];
    }
    return undefined;
}