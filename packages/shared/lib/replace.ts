import { replace_keywords } from "./replace_keywords";

type IdentifyProperties = {
    series_title_and_author: string;
    title: string;
    tags?: string[];
};


/**
 * Replaces specific keywords in the input string based on the provided identification properties.
 *
 * The function checks for the presence of series names in the `tags`, `series_title_and_author`, `title`, or the input string itself.
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
    const { series_title_and_author, title, tags } = identify_properties || {};
    const novelSeriesList = Object.keys(replace_keywords);
    novelSeriesList.forEach((series_name) => {
        if (tags?.includes(series_name)) {
            // check if series_name is in tags
            for (const [key, value] of Object.entries(
                replace_keywords[series_name]
            ).sort((a, b) => b[0].length - a[0].length) as [string, string][]) {
                str = str.replaceAll(key, value);
            }
        } else if (series_title_and_author?.includes(series_name)) {
            // if series_title_and_author includes series_name, replace all keywords
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

