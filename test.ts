import { load } from "cheerio";

async function handle_syosetsu(url: URL) {
    const decomposed_urls = [] as string[];

    const pathParts = url.pathname.split("/").filter(Boolean);
    // pathParts: ["{novel_id}"] or ["{novel_id}", "{order}"]
    if (pathParts.length === 1) {
        // List page, need to decompose
        let page = 1;
        while (true) {
            url.searchParams.set("p", page.toString());
            const html = await fetch(url).then((res) => res.text());
            const $ = load(html);
            $("a.p-eplist__subtitle").each((_, element) => {
                const href = $(element).attr("href");
                if (href) {
                    decomposed_urls.push(new URL(href, url.origin).toString());
                }
            });
            const nextPage = $("a.c-pager__item--next").attr("href");
            if (nextPage) {
                page++;
            } else {
                break;
            }
        }
    } else if (pathParts.length === 2) {
        // Direct episode page, return the url itself
        decomposed_urls.push(url.toString());
    }
    return decomposed_urls;
}


