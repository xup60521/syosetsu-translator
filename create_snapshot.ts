
import fs from "fs/promises";
import path from "path";
import ignore from "ignore";

const SNAPSHOT_FILE = "GEMINI_SNAPSHOT.txt";
const FILE_SEPARATOR = "\n--- FILE_SEPARATOR ---\n";

async function getIgnorePatterns(filePath: string): Promise<string[]> {
    try {
        const content = await fs.readFile(filePath, "utf-8");
        return content.split(/\r?\n/).filter(line => line && !line.startsWith("#"));
    } catch (error) {
        return [];
    }
}

async function createSnapshot() {
    const projectRoot = process.cwd();
    const gitignorePatterns = await getIgnorePatterns(path.join(projectRoot, ".gitignore"));
    const geminiignorePatterns = await getIgnorePatterns(path.join(projectRoot, ".geminiignore"));

    const ig = ignore().add(gitignorePatterns).add(geminiignorePatterns);

    let snapshotContent = "";

    async function traverse(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(projectRoot, fullPath);

            if (ig.ignores(relativePath)) {
                continue;
            }

            if (entry.isDirectory()) {
                await traverse(fullPath);
            } else if (entry.isFile()) {
                if (relativePath === SNAPSHOT_FILE || relativePath === "create_snapshot.ts") {
                    continue;
                }
                const content = await fs.readFile(fullPath, "utf-8");
                snapshotContent += `File: ${relativePath}\n${content.replace(/\s+/g, ' ')}${FILE_SEPARATOR}`;
            }
        }
    }

    await traverse(projectRoot);

    await fs.writeFile(SNAPSHOT_FILE, snapshotContent);
    console.log(`Snapshot created at ${SNAPSHOT_FILE}`);
}

createSnapshot();
