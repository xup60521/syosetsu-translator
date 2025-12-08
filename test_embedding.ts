import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import ollama from "ollama";

// Get folder name from command line argument
const folderName = "貴族院編 くまきち"

if (!folderName) {
  console.error("Please provide a folder name as an argument.");
  console.error("Usage: bun test_embedding.ts <folder_name>");
  process.exit(1);
}

const outputDir = join(process.cwd(), "output", folderName);
const outputFile = join(process.cwd(), "embeddings.json");

console.log(`Processing folder: ${outputDir}`);

try {
  // Check if directory exists
  try {
    await readdir(outputDir);
  } catch (e) {
    console.error(`Directory not found: ${outputDir}`);
    process.exit(1);
  }

  const files = await readdir(outputDir);
  const txtFiles = files.filter((file) => file.endsWith(".txt"));

  if (txtFiles.length === 0) {
    console.error("No .txt files found in the specified folder.");
    process.exit(1);
  }

  // Sort files to ensure consistent order
  txtFiles.sort();

  let combinedContent = "";
  console.log(`Found ${txtFiles.length} files. Reading content...`);
  
  for (const file of txtFiles) {
    const content = await readFile(join(outputDir, file), "utf-8");
    combinedContent += content + "\n";
  }

  console.log(`Combined content length: ${combinedContent.length} characters.`);
  console.log("Generating embeddings with model 'mxbai-embed-large'...");

  const response = await ollama.embeddings({
    model: "mxbai-embed-large",
    prompt: combinedContent,
  });

  await Bun.write(outputFile, JSON.stringify(response, null, 2));
  console.log(`Embeddings saved to ${outputFile}`);

} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
