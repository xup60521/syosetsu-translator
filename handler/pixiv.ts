import type { CheerioAPI } from "cheerio";

export function pixiv_handler(urlobj: URL, $: CheerioAPI) {
    const preload_content = $('meta[name="preload-data"]').attr()?.content;
    const novel_id = urlobj.searchParams.get("id");
    if (!preload_content) throw new Error("no preload-content");
    if (!novel_id) throw new Error("no novel id");

    const contentObj = JSON.parse(preload_content) as PreloadContent;
    const title = contentObj.novel[novel_id].title;
    const series_title = contentObj.novel[novel_id].seriesNavData.title;
    const indexPrefix =
        contentObj.novel[novel_id].seriesNavData.title +
        " " +
        contentObj.novel[novel_id].seriesNavData.order;
    const paragraphArr = contentObj.novel[novel_id].content.split("\n");

    const regex = /[\/:?]/g
    return [
        {
            title: title.replaceAll(regex, " "),
            indexPrefix,
            paragraphArr,
            series_title,
        },
    ];
}

interface PreloadContent {
    timestamp: string;
    novel: Novel;
}

interface Novel {
    [id: string]: NovelID;
}

interface NovelID {
    description: string;
    id: string;
    title: string;
    pageCount: number;
    content: string;
    coverUrl: string;
    suggestedSettings: SuggestedSettings;
    isBookmarkable: boolean;
    bookmarkData: null;
    likeData: boolean;
    pollData: null;
    marker: null;
    seriesNavData: SeriesNavData;
    descriptionBoothId: null;
    descriptionYoutubeId: null;
    comicPromotion: null;
    fanboxPromotion: null;
    contestBanners: any[];
    contestData: null;
    request: null;
    imageResponseOutData: any[];
    imageResponseData: any[];
    imageResponseCount: number;
}

interface SeriesNavData {
    seriesType: string;
    seriesId: number;
    title: string;
    isConcluded: boolean;
    isReplaceable: boolean;
    isWatched: boolean;
    isNotifying: boolean;
    order: number;
    prev: Next;
    next: Next;
}

interface Next {
    title: string;
    order: number;
    id: string;
    available: boolean;
}

interface SuggestedSettings {
    viewMode: number;
    themeBackground: number;
    themeSize: null;
    themeSpacing: null;
}
