import { replace_keywords } from "./replace_keywords";
import { promises as fs } from "fs";
import path from "path";

type IdentifyProperties = {
    series_title: string;
    title: string;
    tags?: string[];
};


/**
 * Replaces specific keywords in the input string based on the provided identification properties.
 *
 * The function checks for the presence of series names in the `tags`, `series_title`, `title`, or the input string itself.
 * If a match is found, it replaces all occurrences of the corresponding keywords (sorted by key length descending)
 * with their mapped values from the `replace_keywords` object.
 *
 * @param str - The input string in which to perform replacements.
 * @param identify_properties - Optional properties used to identify which keyword replacements to apply.
 * @returns A promise that resolves to the string with the appropriate keywords replaced.
 */
export async function replace_words(
    str: string,
    identify_properties?: IdentifyProperties
): Promise<string> {
    const { series_title, title, tags } = identify_properties || {};
    const novelSeriesList = Object.keys(replace_keywords);
    novelSeriesList.forEach((series_name) => {
        if (tags?.includes(series_name)) {
            // check if series_name is in tags
            for (const [key, value] of Object.entries(
                replace_keywords[series_name]
            ).sort((a, b) => b[0].length - a[0].length) as [string, string][]) {
                str = str.replaceAll(key, value);
            }
        } else if (series_title?.includes(series_name)) {
            // if series_title includes series_name, replace all keywords
            for (const [key, value] of Object.entries(
                replace_keywords[series_name]
            ).sort((a, b) => b[0].length - a[0].length) as [string, string][]) {
                str = str.replaceAll(key, value);
            }
        } else if (title?.includes(series_name)) {
            // if title includes series_name, replace all keywords
            for (const [key, value] of Object.entries(
                replace_keywords[series_name]
            ).sort((a, b) => b[0].length - a[0].length) as [string, string][]) {
                str = str.replaceAll(key, value);
            }
        } else if (str.includes(series_name)) {
            // if str includes series_name, replace all keywords
            for (const [key, value] of Object.entries(
                replace_keywords[series_name]
            ).sort((a, b) => b[0].length - a[0].length) as [string, string][]) {
                str = str.replaceAll(key, value);
            }
        }
    });
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
