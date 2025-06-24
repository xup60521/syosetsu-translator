export async function url_string_handler(url_string: string) {
    const urls = url_string.split(" ");
    const novel_urls: string[] = [];
    for await (const url of urls) {
        const urlobj = new URL(url);
        if (urlobj.host === "www.pixiv.net") {
            const processed_urls = await handle_pixiv(urlobj);
            if (processed_urls) {
                novel_urls.push(...processed_urls);
            }
        } else {
            novel_urls.push(url);
        }
    }
    return novel_urls;
}

async function handle_pixiv(url: URL) {
    if (url.pathname.includes("/novel/series")) {
        const series_id = url.pathname.split("/").at(-1);
        const series_content_titles = (
            await fetch(
                `https://www.pixiv.net/ajax/novel/series/${series_id}/content_titles`
            ).then((res) => res.json())
        ).body;
        const novel_ids = series_content_titles.map(
            (d: { id: string; available: boolean }) =>
                // remove the condition to always return the URL
                true ? `https://www.pixiv.net/novel/show.php?id=${d.id}` : null
        ).filter((d: string | null) => d) as string[];
        return novel_ids;
    } else if (url.pathname.includes("/novel/show")) {
        return [url.toString()];
    }
}
