import cliProgress from "cli-progress";

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

export const multibar = new cliProgress.MultiBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: " {bar} | {filename} | {value}/{total}",
    },
    cliProgress.Presets.shades_classic
);
