import { checkbox, confirm, input } from "@inquirer/prompts";
import { sleep } from "../translation/translation-utils";
import fs from "fs/promises";
import { getCookiesFromRedis, updateCookiesToRedis } from "../redis";

async function gatherAllSeriesData() {
    const options = await pixivSearchOptions();
    const url = constructPixivSearchURL(options);

    const novel_series_arr = [];
    let finalpage = 1;
    for (let page = 1; page <= finalpage; page++) {
        url.searchParams.set("p", page.toString());
        console.log(`Fetching page ${page}: ${url.toString()}`);
        // Fetch and process data here

        const with_Cookies = options.is_fetch_with_cookies;
        const fetchOptions: RequestInit = {};
        fetchOptions.headers = {};
        if (with_Cookies) {
            const currentCookie = await getCookiesFromRedis({
                websiteType: "pixiv",
            });

            fetchOptions.headers.Cookie = currentCookie || "";
        }

        const response = await fetch(url.toString(), fetchOptions);
        if (with_Cookies) {
            const set_cookies = response.headers.getSetCookie();
            await updateCookiesToRedis({
                websiteType: "pixiv",
                setCookieArr: set_cookies,
            });
        }

        const data = await response.json();
        novel_series_arr.push(...data.body.novel.data);
        if (page===1) {
            finalpage = data.body.novel.lastPage;
            console.log(`Total pages to fetch: ${finalpage}`);
        }
        await sleep(8000 * Math.random()); // Be polite and avoid rate limiting
    }
    console.log(`Fetched a total of ${novel_series_arr.length} series.`);
    // save data to series_data.json
    await fs.writeFile(
        "series_data.json",
        JSON.stringify(novel_series_arr, null, 2),
        "utf-8"
    );
    console.log("Series data saved to series_data.json");
}

function constructPixivSearchURL(
    options: Awaited<ReturnType<typeof pixivSearchOptions>>
): URL {
    const baseURL =
        "https://www.pixiv.net/ajax/search/novels/" + options.search_tags_str;
    const params = new URLSearchParams({
        order: "date_d",
        mode: "all",
        p: "1",
        gs: options.is_group_series ? "1" : "0",
        ai: options.is_display_ai_works ? "0" : "1",
    });
    return new URL(`${baseURL}?${params.toString()}`);
}

async function pixivSearchOptions() {
    const search_tags_str = await input({
        message: "Enter search tags (separated by spaces):",
        default: "本好きの下剋上",
    });
    const is_display_ai_works = await confirm({
        message: "Display AI works? (yes/no):",
        default: false,
    });
    const is_group_series = await confirm({
        message: "Prefer group series? (yes/no):",
        default: true,
    });
    const is_fetch_with_cookies = await confirm({
        message: "Fetch with cookies? (yes/no):",
        default: true,
    });
    return {
        search_tags_str,
        is_display_ai_works,
        is_group_series,
        is_fetch_with_cookies,
    };
}

export { gatherAllSeriesData };
