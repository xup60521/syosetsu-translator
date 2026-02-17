import { load } from "cheerio";
import type { NovelHandlerResultType } from "../type";
import { randomUUID } from "crypto";
import { windowsFileEscapeRegex } from "../utils";

export async function alphapolis_handler(
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
    const $ = load(res);
    // const paragraphArr: string[] = $("div#novelBody").text().split("\n");
    const title = $("h2.episode-title").text().trim();
    const author = $("h2.author").text().trim();
    const series_title = $("h1.title").text().trim();
    const episode = $("div.page-count").text().split("/")[0]!.trim();
    const indexPrefix = series_title + " " + episode;
    const scriptText =
        $("script")
            .toArray()
            .map((s) => $(s).html() ?? "")
            .find((t) => t.includes("/novel/episode_body")) ?? "";

    const episode_id = Number(scriptText.match(/episode['"]\s*:\s*(\d+)/)?.[1]);
    const token = scriptText.match(/token['"]\s*:\s*['"]([a-f0-9]+)['"]/)?.[1]!;
    const content = await fetchEpisodeBody(episode_id, token)
    return {
        id: randomUUID(),
        title: title,
        indexPrefix: indexPrefix.replaceAll(windowsFileEscapeRegex, " "),
        content ,
        series_title_and_author: (series_title + " " + author)
            .replaceAll(windowsFileEscapeRegex, " ")
            .trim(),
        url: urlobj.href,
        tags: [series_title],
        series_title,
        author,
    };
}

async function fetchEpisodeBody(episode_id: number, token: string) {
  const res = await fetch("https://www.alphapolis.co.jp/novel/episode_body", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      // sometimes helps:
      // referer: "https://www.alphapolis.co.jp/novel/....(the episode page)...",
    },
    body: new URLSearchParams({
      episode: String(episode_id),
      token,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`episode_body failed: ${res.status} ${res.statusText}`);
  }

  return await res.text(); // HTML fragment
}