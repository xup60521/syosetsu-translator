import * as fs from "node:fs/promises";
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
    try {
        await fs.mkdir(`./output/${series_title}`, { recursive: true });
    } catch (error) {
        console.error(
            `Error creating directory "./output/${series_title}":`,
            error
        );
        // Handle the error appropriately, perhaps re-throw if it's critical
    }

    fs.writeFile(
        `./output/${series_title}/${indexPrefix}-${title}_translated.txt`,
        content
    );
}
