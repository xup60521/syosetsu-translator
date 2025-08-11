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
        await ensureDir(`./output/${series_title}`);
    } catch (error) {
        console.error(
            `Error ensuring directory "./output/${series_title}":`,
            error
        );
    }
    const file_path_and_name = `./output/${series_title}/${indexPrefix}-${title}_translated.txt`;
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
