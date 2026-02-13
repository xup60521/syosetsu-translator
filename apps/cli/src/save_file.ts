import * as fs from "node:fs/promises";
export async function save_file({
    series_title_and_author,
    title,
    indexPrefix,
    content,
    folder_id,
    istranslated = true,
}: {
    series_title_and_author: string;
    title: string;
    indexPrefix: string;
    content: string;
    folder_id: string;
    istranslated?: boolean;
}) {
    try {
        await ensureDir(`./${folder_id}/${series_title_and_author}`);
    } catch (error) {
        console.error(
            `Error ensuring directory "./${folder_id}/${series_title_and_author}":`,
            error
        );
    }
    const file_path_and_name = `./${folder_id}/${series_title_and_author}/${indexPrefix}-${title}${istranslated ? "_translated" : ""}.txt`;
    fs.writeFile(
        file_path_and_name,
        content
    );
}

async function ensureDir(path: string) {
    try {
        const stats = await fs.stat(path);
        if (!stats.isDirectory()) {
            throw new Error(`"${path}" exists and is not a directory.`);
        }
        // Directory exists, nothing to do
    } catch (err: any) {
        if (err.code === "ENOENT") {
            // Path does not exist, safe to create
            await fs.mkdir(path, { recursive: true });
        } else {
            // Some other error (e.g., permission denied)
            throw err;
        }
    }
}
