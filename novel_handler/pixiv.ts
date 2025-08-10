import { load, type CheerioAPI } from "cheerio";
import type { NovelHandlerResultType } from ".";

const regex = /[<>:"/\\|?*]/g;

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
    let this_novel_data;
    let fetchOptions: RequestInit = {};
    if (with_Cookies) {
        fetchOptions.headers = {
            Cookie: process.env.PIXIV_COOKIES ?? "",
        };
    }
    if (urlobj.pathname.includes("/novel/show")) {
        const novel_id = urlobj.searchParams.get("id");
        this_novel_data = await fetch(
            `https://www.pixiv.net/ajax/novel/${novel_id}`,
            fetchOptions
        ).then((res) => res.json());
    } else if (urlobj.pathname.includes("/ajax/novel")) {
        this_novel_data = await fetch(urlobj, fetchOptions).then((res) =>
            res.json()
        );
    } else {
        throw new Error("An error happens with url: " + urlobj.href);
    }
    // console.log(this_novel_data)
    const paragraphs = this_novel_data.body.content;
    const paragraphArr = paragraphs.split("\n");
    const tags = this_novel_data.body?.tags?.tags?.map(
        ({ tag }: { tag: string }) => tag
    ) as string[] | undefined;
    const title = this_novel_data.body.title;
    const series_title = this_novel_data.body?.seriesNavData?.title ?? title;
    // after removing through regex, delete the additional whitespaces on the right
    const author = this_novel_data.body?.userName
        .replaceAll(regex, " ")
        .trimEnd();
    const indexPrefix =
        series_title + " " + (this_novel_data.body?.seriesNavData?.order ?? "");

    return {
        title: title.replaceAll(regex, " "),
        indexPrefix: indexPrefix.replaceAll(regex, " "),
        paragraphArr,
        series_title: (series_title + " " + author).replaceAll(regex, " "),
        url: urlobj.href,
        tags: tags,
    };
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
