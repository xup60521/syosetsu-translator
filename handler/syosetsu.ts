import type { CheerioAPI } from "cheerio";

export function syosetsu_handler(urlobj: URL, $: CheerioAPI) {
    
    const paragraphArr: string[] = [];
    const title = $(".p-novel__title").text();
    $(".p-novel__body > div > p").each((index, element) => {
        const $element = $(element);
        paragraphArr.push($element.text());
    });
    const series_title = $("div.c-announce:nth-child(2) > a").text() 

    return [{
        title: title,
        indexPrefix: urlobj.pathname.replaceAll("/", " ").trim(),
        paragraphArr,
        series_title
    }];
}
