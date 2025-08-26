import { select as multipleSelect } from "inquirer-select-pro";
import { input, confirm } from "@inquirer/prompts";
import * as fs from "node:fs/promises";
import {
    chunkArray,
    getDefaultModelWaitTime,
    input_auto_retry,
    input_divide_line,
    input_one_or_two_step_translation,
    input_select_model,
    input_start_from,
    input_with_cookies_or_not,
} from "./utils";
import { windowsFileEscapeRegex } from "./novel_handler/pixiv";
import { translation } from "./translation";
import { getCookiesFromRedis, updateCookiesToRedis } from "./redis";

export async function translate_from_pixiv_user() {
    const url = await input({
        message: "Enter pixiv user url",
        validate: (value) => {
            try {
                const url = new URL(value);
                if (url.host !== "www.pixiv.net") {
                    return "Not pixiv url";
                }
                const [, users, userId] = url.pathname.split("/");
                if (users !== "users") {
                    return "Not pixiv user url";
                }
                if (!userId || userId === "") {
                    return "No userId";
                }
                return true;
            } catch (_) {
                return "Invalid URL";
            }
        },
    });
    const urlObj = new URL(url);
    const fetch_user_data_with_Cookies = await input_with_cookies_or_not({
        default: true,
    });
    const fetchOptions: RequestInit = {};
    fetchOptions.headers = {};
    if (fetch_user_data_with_Cookies) {
        const currentCookie = await getCookiesFromRedis({
            websiteType: "pixiv",
        });

        fetchOptions.headers.Cookie = currentCookie || "";
    }
    const [, , userId] = urlObj.pathname.split("/");
    const userProfileAllResponse = await fetch(
        `https://www.pixiv.net/ajax/user/${userId}/profile/all`,
        fetchOptions
    );
    const userProfileAllData =
        (await userProfileAllResponse.json()) as UserProfileAllData;
    const set_cookies = userProfileAllResponse.headers.getSetCookie();
    await updateCookiesToRedis({
        websiteType: "pixiv",
        setCookieArr: set_cookies,
    });
    const urlArr = [] as string[];

    const toFindSeries = await confirm({
        message: "Do you want to find series?",
    });
    if (toFindSeries) {
        const notYetIncludedSeriesOptions =
            await getNotYetTranslatedSeriesOptions(userProfileAllData);
        urlArr.push(
            ...(await multipleSelect({
                message: "Choose series to translate",
                options: notYetIncludedSeriesOptions,
            }))
        );
    }

    const toFindSingle = await confirm({
        message: "Do you want to find single works?",
    });
    if (toFindSingle) {
        const notYetIncludedSingleOptions =
            await getNotYetTranslatedSingleOptions({
                userProfileAllData: userProfileAllData,
                userId,
            });
        urlArr.push(
            ...(await multipleSelect({
                message: "Choose single works to translate",
                options: notYetIncludedSingleOptions,
            }))
        );
    }

    if (urlArr.length === 0) {
        console.log("No works selected for translation.");
        return;
    }

    const { model, provider } = await input_select_model();
    const divide_line = await input_divide_line(model.modelId);
    const auto_retry = await input_auto_retry();
    const start_from = await input_start_from();
    const with_Cookies = await input_with_cookies_or_not();
    const one_or_two_step = await input_one_or_two_step_translation();

    return await translation({
        model,
        provider,
        url_string: urlArr.join(" "),
        auto_retry,
        divide_line,
        start_from,
        with_Cookies,
        one_or_two_step,
    });
}

async function getNotYetTranslatedSeriesOptions(
    userProfileAllData: UserProfileAllData
): Promise<{ name: string; value: string }[]> {
    const authorFolderNamesAndSeriesId =
        userProfileAllData.body.novelSeries.map((props) => {
            const series_title = props.title;
            const author = props.userName
                .replaceAll(windowsFileEscapeRegex, " ")
                .trimEnd();
            const series_title_and_author = (
                series_title +
                " " +
                author
            ).replaceAll(windowsFileEscapeRegex, " ");
            const tagsStr = props.tags.map((tag) => `#${tag}`).join(", ");
            return {
                tagsStr,
                series_title: series_title.replaceAll(
                    windowsFileEscapeRegex,
                    " "
                ),
                series_title_and_author,
                series_id: props.id,
            };
        });
    // console.log(authorFolderNamesAndSeriesId);

    const notYetIncludedSeries = [] as typeof authorFolderNamesAndSeriesId;
    const outputFolders = await fs.readdir("./output");
    authorFolderNamesAndSeriesId.forEach((data) => {
        if (
            !outputFolders.includes(data.series_title_and_author) &&
            !outputFolders.includes(data.series_title)
        ) {
            notYetIncludedSeries.push(data);
        }
    });
    return notYetIncludedSeries.map((d) => {
        const url = `https://www.pixiv.net/novel/series/${d.series_id}`;
        return {
            name: d.series_title_and_author + " " + url + "\n" + d.tagsStr,
            value: url,
        };
    });
}

async function getNotYetTranslatedSingleOptions(props: {
    userProfileAllData: UserProfileAllData;
    userId: string;
}): Promise<{ name: string; value: string }[]> {
    const { userId, userProfileAllData } = props;
    const novels = Object.keys(userProfileAllData.body.novels);
    const chunkNumber = 60;
    const chunkNovels = chunkArray(novels, chunkNumber);

    const urls: string[] = chunkNovels.map(
        (chunk) =>
            `https://www.pixiv.net/ajax/user/${userId}/profile/novels?${chunk
                .map((d) => `ids[]=${d}`)
                .join("&")}`
    );

    const works = [] as PixivUserNovelsApiResponse["body"]["works"][string][];
    for await (const url of urls) {
        const response = await fetch(url);
        const data = (await response.json()) as PixivUserNovelsApiResponse;

        if (data.error) {
            console.error(
                `Error fetching novels for ${userId}: ${data.message}`
            );
            continue;
        }

        for (const work of Object.values(data.body.works)) {
            if (!work.isUnlisted) {
                works.push(work);
            }
        }
    }

    const filteredSeriesSingleWork = works.filter((d) => !d.seriesId);
    const authorFolderNamesAndSingleId = filteredSeriesSingleWork.map(
        (work) => {
            const author = work.userName
                .replaceAll(windowsFileEscapeRegex, " ")
                .trimEnd();
            const tagsStr = work.tags.map((tag) => `#${tag}`).join(", ");
            return {
                tagsStr,
                title: work.title.replaceAll(windowsFileEscapeRegex, " "),
                folderName: `${work.title} ${author}`.replaceAll(
                    windowsFileEscapeRegex,
                    " "
                ),
                workId: work.id,
            };
        }
    );

    const notYetIncludedSingle = [] as typeof authorFolderNamesAndSingleId;
    const outputFolders = await fs.readdir("./output");
    authorFolderNamesAndSingleId.forEach((data) => {
        if (
            !outputFolders.includes(data.folderName) &&
            !outputFolders.includes(data.title)
        ) {
            notYetIncludedSingle.push(data);
        }
    });

    return notYetIncludedSingle.map((d) => {
        const url = `https://www.pixiv.net/novel/show.php?id=${d.workId}`;
        return {
            name: d.folderName + " " + url + "\n      " + d.tagsStr,
            value: url,
        };
    });
}

export interface UserProfileAllData {
    error: boolean;
    message: string;
    body: ResponseBody;
}

interface ResponseBody {
    illusts: Record<string, null>;
    manga: Record<string, null>;
    novels: Record<string, null>;
    mangaSeries: MangaSeries[]; // Assuming it can contain objects, even if empty in example
    novelSeries: NovelSeries[];
    collections: Collection[]; // Assuming it can contain objects, even if empty in example
    pickup: PickupItem[];
    bookmarkCount: BookmarkCount;
    externalSiteWorksStatus: ExternalSiteWorksStatus;
    request: RequestData;
    shouldShowSensitiveNotice: boolean;
}

interface MangaSeries {
    // Structure not provided in the example, so using unknown
    // If it's always empty, `never[]` could be used, but `any[]` or `unknown[]` is safer for future data.
}

interface Collection {
    // Structure not provided in the example, so using unknown
}

interface NovelSeries {
    id: string;
    userId: string;
    userName: string;
    profileImageUrl: string;
    xRestrict: number; // 0 or 1
    isOriginal: boolean;
    isConcluded: boolean;
    genreId: string; // Likely a string representation of a number
    title: string;
    caption: string;
    language: string;
    tags: string[];
    publishedContentCount: number;
    publishedTotalCharacterCount: number;
    publishedTotalWordCount: number;
    publishedReadingTime: number;
    useWordCount: boolean;
    lastPublishedContentTimestamp: number;
    createdTimestamp: number;
    updatedTimestamp: number;
    createDate: string; // ISO 8601 string
    updateDate: string; // ISO 8601 string
    firstNovelId: string;
    latestNovelId: string;
    displaySeriesContentCount: number;
    shareText: string;
    total: number;
    firstEpisode: {
        url: string;
    };
    watchCount: number | null; // Can be null
    maxXRestrict: number | null; // Can be null
    cover: Cover;
    coverSettingData: unknown | null; // Can be null, type unknown if content not specified
    isWatched: boolean;
    isNotifying: boolean;
    aiType: number; // 0 or 1
}

interface Cover {
    urls: {
        "240mw": string;
        "480mw": string;
        "1200x1200": string;
        "128x128": string;
        original: string;
    };
}

interface PickupItem {
    id: number;
    title: string;
    genre: string; // Likely a string representation of a number
    xRestrict: number; // 0 or 1
    restrict: number; // 0 or 1
    url: string;
    tags: string[];
    userId: string;
    userName: string;
    profileImageUrl: string;
    textCount: number;
    wordCount: number;
    readingTime: number;
    useWordCount: boolean;
    description: string;
    isBookmarkable: boolean;
    bookmarkData: unknown | null; // Can be null, type unknown if content not specified
    bookmarkCount: number;
    isOriginal: boolean;
    marker: unknown | null; // Can be null, type unknown if content not specified
    titleCaptionTranslation: {
        workTitle: string | null;
        workCaption: string | null;
    };
    createDate: string; // ISO 8601 string
    updateDate: string; // ISO 8601 string
    isMasked: boolean;
    aiType: number; // 0 or 1
    seriesId: string;
    seriesTitle: string;
    isUnlisted: boolean;
    visibilityScope: number;
    language: string;
    type: string;
    deletable: boolean;
    draggable: boolean;
    contentUrl: string;
}

interface BookmarkCount {
    public: {
        illust: number;
        novel: number;
    };
    private: {
        illust: number;
        novel: number;
    };
}

interface ExternalSiteWorksStatus {
    booth: boolean;
    sketch: boolean;
    vroidHub: boolean;
}

interface RequestData {
    showRequestTab: boolean;
    showRequestSentTab: boolean;
    postWorks: {
        artworks: ArtworkRequest[]; // Assuming it can contain objects, even if empty in example
        novels: NovelRequest[]; // Assuming it can contain objects, even if empty in example
    };
}

interface ArtworkRequest {
    // Structure not provided in the example, so using unknown
}

interface NovelRequest {
    // Structure not provided in the example, so using unknown
}

// Pixiv User Novels API Response 型別（不與現有型別衝突）
export interface PixivUserNovelsApiResponse {
    error: boolean;
    message: string;
    body: PixivUserNovelsApiBody;
}

interface PixivUserNovelsApiBody {
    works: Record<string, PixivUserNovelWork>;
    zoneConfig: PixivUserNovelsZoneConfig;
    extraData: PixivUserNovelsExtraData;
}

interface PixivUserNovelWork {
    id: string;
    title: string;
    genre: string;
    xRestrict: number;
    restrict: number;
    url: string;
    tags: string[];
    userId: string;
    userName: string;
    profileImageUrl: string;
    textCount: number;
    wordCount: number;
    readingTime: number;
    useWordCount: boolean;
    description: string;
    isBookmarkable: boolean;
    bookmarkData: null;
    bookmarkCount: number;
    isOriginal: boolean;
    marker: null;
    titleCaptionTranslation: {
        workTitle: string | null;
        workCaption: string | null;
    };
    createDate: string;
    updateDate: string;
    isMasked: boolean;
    aiType: number;
    isUnlisted: boolean;
    visibilityScope: number;
    language: string;
    seriesId?: string;
    seriesTitle?: string;
}

interface PixivUserNovelsZoneConfig {
    header: { url: string };
    footer: { url: string };
    "500x500": { url: string };
    t_responsive_320_50: { url: string };
    t_responsive_300_250: { url: string };
    logo: { url: string };
    ad_logo: { url: string };
}

interface PixivUserNovelsExtraData {
    meta: PixivUserNovelsMeta;
}

interface PixivUserNovelsMeta {
    title: string;
    description: string;
    canonical: string;
    ogp: PixivUserNovelsOgp;
    twitter: PixivUserNovelsTwitter;
    alternateLanguages: {
        ja: string;
        en: string;
    };
    descriptionHeader: string;
}

interface PixivUserNovelsOgp {
    description: string;
    image: string;
    title: string;
    type: string;
}

interface PixivUserNovelsTwitter {
    description: string;
    image: string;
    title: string;
    card: string;
}
