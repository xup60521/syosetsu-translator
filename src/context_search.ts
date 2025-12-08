import { embed, embedMany, type EmbeddingModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { select, input, confirm } from "@inquirer/prompts";
import fs from "fs/promises";
import path from "path";
import { getModelList } from "./model_list";
import cliProgress from "cli-progress";
import { Ollama } from "ollama";

// Ollama backend shows 
// `decode: cannot decode batches with this context (use llama_encode() instead)`
// But that just ollama being noisy since it returns 200 and the ollama sdk doesn't throw an error
// Just ignore it

// Type definitions
type EmbeddingRecord = {
    file: string;
    text: string;
    embedding: number[];
};

interface Embedder {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}

const EMBEDDINGS_FILE = "embeddings.json";

// Main entry point
export async function contextSearch() {
    const action = await select({
        message: "Context Search Options",
        choices: [
            { name: "Search", value: "search" },
            { name: "Update Index (Re-index all files)", value: "index" },
            { name: "Back", value: "back" },
        ],
    });

    if (action === "back") return;

    if (action === "index") {
        await indexFiles();
    } else if (action === "search") {
        await searchQuery();
    }
}

async function getEmbedder(): Promise<Embedder> {
    const provider = await select({
        message: "Select Embedding Provider",
        choices: [
            { name: "Ollama (Recommended for local)", value: "ollama" },
            { name: "Google Gemini", value: "google" },
            { name: "OpenAI", value: "openai" },
        ],
    });

    if (provider === "ollama") {
        const ollama = new Ollama();
        const modelName = await input({
            message: "Enter Ollama embedding model name (default: nomic-embed-text)",
            default: "nomic-embed-text",
        });
        
        return {
            embed: async (text) => {
                const response = await ollama.embeddings({ model: modelName, prompt: text });
                return response.embedding;
            },
            embedBatch: async (texts) => {
                const embeddings: number[][] = [];
                for (const text of texts) {
                    const response = await ollama.embeddings({ model: modelName, prompt: text });
                    embeddings.push(response.embedding);
                }
                return embeddings;
            }
        };
    } else if (provider === "google") {
        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_KEY_0 || process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_2,
        });
        const model = google.textEmbeddingModel("text-embedding-004");
        return createAiSdkEmbedder(model);
    } else if (provider === "openai") {
        const openai = createOpenAI({
            apiKey: process.env.OPENAI_KEY,
        });
        const model = openai.textEmbeddingModel("text-embedding-3-small");
        return createAiSdkEmbedder(model);
    }
    
    throw new Error("Invalid provider");
}

function createAiSdkEmbedder(model: EmbeddingModel<string>): Embedder {
    return {
        embed: async (text) => {
            const { embedding } = await embed({ model, value: text });
            return embedding;
        },
        embedBatch: async (texts) => {
            const { embeddings } = await embedMany({ model, values: texts });
            return embeddings;
        }
    };
}

async function indexFiles() {
    console.log("Initializing embedding model...");
    const embedder = await getEmbedder();

    console.log("Scanning series folders in ./output...");
    const seriesFolders = await getSeriesFolders("./output");
    console.log(`Found ${seriesFolders.length} series.`);

    const records: EmbeddingRecord[] = [];
    
    // Progress bar for indexing
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(seriesFolders.length, 0);

    for (const folder of seriesFolders) {
        const files = await getTxtFiles(folder);
        if (files.length === 0) {
            bar.increment();
            continue;
        }

        let combinedContent = "";
        for (const file of files) {
            const content = await fs.readFile(file, "utf-8");
            combinedContent += content + "\n";
        }

        // Chunk the combined content because of model limit (512)
        const chunks = chunkText(combinedContent, 512, 50);

        try {
            // Embed all chunks
            const embeddings = await embedder.embedBatch(chunks);

            for (let i = 0; i < chunks.length; i++) {
                records.push({
                    file: folder, // Storing folder path as "file" identifier
                    text: chunks[i], 
                    embedding: embeddings[i],
                });
            }
        } catch (error) {
            console.error(`Error embedding series ${folder}:`, error);
        }
        bar.increment();
    }
    bar.stop();

    await fs.writeFile(EMBEDDINGS_FILE, JSON.stringify(records, null, 2));
    console.log(`Index saved to ${EMBEDDINGS_FILE}`);
}

async function searchQuery() {
    let records: EmbeddingRecord[] = [];
    try {
        const data = await fs.readFile(EMBEDDINGS_FILE, "utf-8");
        records = JSON.parse(data);
    } catch (e) {
        console.error("Index file not found. Please run 'Update Index' first.");
        return;
    }

    const embedder = await getEmbedder();
    
    while (true) {
        const query = await input({ message: "Enter search query (or 'exit' to quit):" });
        if (query.toLowerCase() === "exit") break;

        const embedding = await embedder.embed(query);

        const results = records
            .map(record => ({
                ...record,
                similarity: cosineSimilarity(embedding, record.embedding),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        console.log("\nTop Results:");
        // Deduplicate series in results if multiple chunks from same series match?
        // For now, just show them as is, or maybe show unique series.
        // Let's show unique series to avoid clutter.
        const seenSeries = new Set<string>();
        let count = 0;
        
        for (const result of results) {
            if (seenSeries.has(result.file)) continue;
            seenSeries.add(result.file);
            
            const seriesName = path.basename(result.file);
            console.log(`\n[Score: ${result.similarity.toFixed(4)}] Series: ${seriesName}`);
            console.log(`Snippet: ${result.text.slice(0, 100).replace(/\n/g, " ")}...`);
            
            count++;
            if (count >= 5) break;
        }
        console.log("\n");
    }
}

// Helper functions

async function getSeriesFolders(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const folders: string[] = [];
    for (const dirent of dirents) {
        if (dirent.isDirectory()) {
            folders.push(path.resolve(dir, dirent.name));
        }
    }
    return folders;
}

async function getTxtFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const dirent of dirents) {
        if (dirent.isFile() && dirent.name.endsWith(".txt")) {
            files.push(path.resolve(dir, dirent.name));
        }
    }
    return files;
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
