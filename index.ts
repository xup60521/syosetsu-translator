import { input, select } from "@inquirer/prompts";
import { replaceTextInFiles } from "./src/replace";
import { translation } from "./src/translation";
import { select as multipleSelect } from "inquirer-select-pro";
import * as fs from "node:fs/promises";

import "dotenv/config";
import {
    getDefaultModelWaitTime,
    input_auto_retry,
    input_divide_line,
    input_select_model,
    input_start_from,
    input_url_string,
    input_with_cookies_or_not,
} from "./src/utils";
import { regex } from "./src/novel_handler/pixiv";

const options = [
    {
        name: "Translate from URLs",
        value: "translate from URL",
    },
    // {
    //     name: "Translate from files",
    //     value: "translate from files",
    // },
    {
        name: "Replace Words",
        value: "replace",
    },
    {
        name: "Translate from pixiv user",
        value: "translate from pixiv user",
    },
] as const;
// Function to prompt the user
async function main() {
    while (true) {
        const answers = await select({
            message: "Please select an option:",
            choices: options,
        });

        switch (answers) {
            case "translate from URL":
                await translate_from_URL();
                break;
            case "replace":
                await replaceTextInFiles();
                break;
            // case "translate from files":
            // await translate_from_files();
            // break;
            case "translate from pixiv user":
                await translate_from_pixiv_user();
                break;
            default:
                break;
        }
    }
}

main();

async function translate_from_URL() {
    const { model, provider } = await input_select_model();
    const divide_line = await input_divide_line();
    const url_string = await input_url_string();
    const auto_retry = await input_auto_retry();
    const start_from = await input_start_from();
    const with_Cookies = await input_with_cookies_or_not();

    return await translation({
        model,
        provider,
        url_string,
        auto_retry,
        divide_line,
        sleep_ms: getDefaultModelWaitTime({ modelId: model.modelId, provider }),
        start_from,
        with_Cookies,
    });
}

async function translate_from_pixiv_user() {
    const url = await input({
        message: "Enter pixiv user url",
        validate: (value) => {
            try {
                const url = new URL(value);
                if (url.host !== "www.pixiv.net") {
                    return "Not pixiv url";
                }
                const [_, users, userId] = url.pathname.split("/");
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
    const [, , userId] = urlObj.pathname.split("/");

    const seriesData = ((
        await fetch(
            `https://www.pixiv.net/ajax/user/${userId}/profile/all`
        ).then((res) => res.json())
    ).body.novelSeries ?? []) as NovelSeries[];
    const authorFolderNamesAndSeriesId = seriesData.map((props) => {
        const series_title = props.title;
        const author = props.userName.replaceAll(regex, " ").trimEnd();
        const series_title_and_author = (
            series_title +
            " " +
            author
        ).replaceAll(regex, " ");
        return {
            series_title_and_author,
            series_id: props.id,
        };
    });
    const notYetIncludedSeries = [] as typeof authorFolderNamesAndSeriesId;
    const outputFolders = await fs.readdir("./output");
    authorFolderNamesAndSeriesId.forEach((data) => {
        if (!outputFolders.includes(data.series_title_and_author)) {
            notYetIncludedSeries.push(data);
        }
    });
    if (notYetIncludedSeries.length < 0) {
        return;
    }
    console.log("Seires that are not translated");
    // console.info(notYetIncludedSeries);

    const toTranslateUrls = await multipleSelect({
        message: "Choose series to translate",
        options: notYetIncludedSeries.map((d) => {
            const url = `https://www.pixiv.net/novel/series/${d.series_id}`;
            return {
                name: d.series_title_and_author + " " + url,
                value: url,
            };
        }),
    });

    const { model, provider } = await input_select_model();
    const divide_line = await input_divide_line();
    const auto_retry = await input_auto_retry();
    const start_from = await input_start_from();
    const with_Cookies = await input_with_cookies_or_not();

    return await translation({
        model,
        provider,
        url_string: toTranslateUrls.join(" "),
        auto_retry,
        divide_line,
        sleep_ms: getDefaultModelWaitTime({ modelId: model.modelId, provider }),
        start_from,
        with_Cookies,
    });
}

type CoverUrls = {
    "240mw": string;
    "480mw": string;
    "1200x1200": string;
    "128x128": string;
    original: string;
};

type FirstEpisode = {
    url: string;
};

type Cover = {
    urls: CoverUrls;
};

type NovelSeries = {
    id: string;
    userId: string;
    userName: string;
    profileImageUrl: string;
    xRestrict: number;
    isOriginal: boolean;
    isConcluded: boolean;
    genreId: string;
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
    createDate: string;
    updateDate: string;
    firstNovelId: string;
    latestNovelId: string;
    displaySeriesContentCount: number;
    shareText: string;
    total: number;
    firstEpisode: FirstEpisode;
    watchCount: null;
    maxXRestrict: null;
    cover: Cover;
    coverSettingData: null;
    isWatched: boolean;
    isNotifying: boolean;
    aiType: number;
};
