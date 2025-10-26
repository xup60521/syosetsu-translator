import type { SeriesDataD } from "./series_data";
import series_data from "./series_data.json";
import fs from "fs/promises";

const data = series_data as SeriesDataD[];
const currentSeries = await getAllDirectoryNames("./output");
const currentSeriesSet = new Set(currentSeries);

const windowsFileEscapeRegex = /[<>:"/\\|?*]/g;
const allseriesdataSet = new Set(
    data
        .filter((d) => d.aiType === 0)
        .filter((d) => d.wordCount > 100000)
        .map((d) => {
            return {
                series_name: d.title
                    .replaceAll(windowsFileEscapeRegex, " ")
                    .trim(),
                series_name_and_author: `${d.title} ${d.userName}`
                    .replaceAll(windowsFileEscapeRegex, " ")
                    .trim(),
                url: `https://www.pixiv.net/novel/series/${d.id}`,
            };
        })
);

console.log(Array.from(allseriesdataSet).length);
console.log(Array.from(currentSeriesSet).length);
// In current series, filter those that appears in allseriesdataSet of either series_name or series_name_and_author
const missingSeries = Array.from(allseriesdataSet).filter(
    (d) =>
        !currentSeriesSet.has(d.series_name) &&
        !currentSeriesSet.has(d.series_name_and_author)
);
console.log("Missing series count:", missingSeries.length);
console.log(missingSeries.map((d) => ({name: d.series_name_and_author, url: d.url})));
// save formated json as "missing_series.json"
await fs.writeFile(
    "missing_series.json",
    JSON.stringify(missingSeries, null, 2),
    "utf-8"
);

async function getAllDirectoryNames(path: string) {
    try {
        const entries = await fs.readdir(path, { withFileTypes: true });
        const directoryNames = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                directoryNames.push(entry.name);
            }
        }
        return directoryNames;
    } catch (error) {
        console.error(`Error reading directory at ${path}:`, error);
        throw error; // Re-throw to allow caller to handle
    }
}
