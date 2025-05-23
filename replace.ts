import type { CheerioAPI } from "cheerio";
import { replace_keywords } from "./replace_keywords";
import { promises as fs } from "fs";
import path from "path";

export async function replace_words(str: string) {
    for (const [key, value] of Object.entries(replace_keywords).sort(
        (a, b) => b[0].length - a[0].length
    ) as [string, string][]) {
        str = str.replaceAll(key, value);
    }
    return str;
}

// Change this to your folder path

// Function to replace text in all .txt files in a given directory
export async function replaceTextInFiles() {
    await new Promise((resolve) => setTimeout(() => resolve(undefined), 100));
    const directory = "./output";
    try {
        await processDirectory(directory);
    } catch (err) {
        console.error("Error:", err);
    }
}

async function processDirectory(directory: string) {
    // Use withFileTypes to get Dirent objects that can tell whether the item is a file or directory.
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            // Recursively process subdirectory
            await processDirectory(fullPath);
        } else if (entry.isFile() && path.extname(entry.name) === ".txt") {
            const data = await fs.readFile(fullPath, "utf8");

            // Replace the text using your replace_words function
            const result = await replace_words(data);

            // Write the modified content back to the file
            await fs.writeFile(fullPath, result, "utf8");
            console.log(`Replaced text in: ${fullPath}`);
        }
    }
}
