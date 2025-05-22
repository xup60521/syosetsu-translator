import { load, type CheerioAPI } from "cheerio";

const regex = /[<>:"/\\|?*]/g;

export async function pixiv_handler(urlobj: URL) {
    if (urlobj.pathname.includes("/novel/series/")) {
        return series_handler(urlobj);
    } else {
        return single_handler(urlobj);
    }
}

async function single_handler(urlobj: URL) {

    const novel_id = urlobj.searchParams.get("id")

    const this_novel_data = await fetch(`https://www.pixiv.net/ajax/novel/${novel_id}`).then((res) => res.json());
    // console.log(this_novel_data)
    const paragraphs = this_novel_data.body.content
    const paragraphArr = paragraphs.split("\n");
    
    
    const title = this_novel_data.body.title;
    const series_title = this_novel_data.body.seriesNavData.title;
    const indexPrefix =
        series_title +
        " " +
        this_novel_data.body.seriesNavData.order;

    return [
        {
            title: title.replaceAll(regex, " "),
            indexPrefix: indexPrefix.replaceAll(regex, " "),
            paragraphArr,
            series_title: series_title.replaceAll(regex, " "),
        },
    ];
}

async function series_handler(urlobj: URL) {
    const series_id = urlobj.pathname.split("/").at(-1);
    if (!series_id) throw new Error("No Series ID");
    const novel_series_data = await fetch(
        `https://www.pixiv.net/ajax/novel/series/${series_id}`
    ).then((res) => res.json());
    const { title, publishedContentCount, firstNovelId } =
        novel_series_data.body;
    // console.log(novel_series_data)
    const series_title = title;
    console.log(series_title, publishedContentCount, firstNovelId);
    if (
        typeof series_title !== "string" ||
        typeof publishedContentCount !== "number" ||
        typeof firstNovelId !== "string"
    ) {
        throw new Error("Series data has some error");
    }
    const all_content_data = [] as {
        title: string;
        indexPrefix: string;
        paragraphArr: string[];
        series_title: string;
    }[];
    let current_novel_id = firstNovelId;
    for (let i = 0; i < publishedContentCount; i++) {
        const this_novel_data = await fetch(
            `https://www.pixiv.net/ajax/novel/${current_novel_id}`
        ).then((res) => res.json());
        try {
            const indexPrefix =
                series_title + " " + this_novel_data.body.seriesNavData.order;
            const title = this_novel_data.body.title;
            const paragraphs = this_novel_data.body.content;
            const next_novel_id = this_novel_data.body.seriesNavData.next.id;
            if (
                typeof indexPrefix !== "string" ||
                typeof title !== "string" ||
                typeof paragraphs !== "string"
            ) {
                throw new Error(
                    "error when fecthing novel id=" + current_novel_id
                );
            }
            all_content_data[i] = {
                title: title.replaceAll(regex, " "),
                indexPrefix,
                paragraphArr: paragraphs.split("\n"),
                series_title,
            };
            current_novel_id = next_novel_id;
            console.log(`complete ${i}/${publishedContentCount}`);
            if (typeof current_novel_id !== "string") {
                break;
            }
        } catch {
            console.error(this_novel_data);
            break;
        }
    }
    return all_content_data;
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
