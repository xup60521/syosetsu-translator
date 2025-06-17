import fs from "node:fs/promises";
export async function handle_file({
    series_title,
    title,
    indexPrefix,
    content,
}: {
    series_title: string;
    title: string;
    indexPrefix: string;
    content: string;
}) {
    if (!(await fs.exists(`./output/${series_title}`))) {
        await fs.mkdir(`./output/${series_title}`, { recursive: true });
    }

    fs.writeFile(
        `./output/${series_title}/${indexPrefix}-${title}_translated.txt`,
        content
    );
}
