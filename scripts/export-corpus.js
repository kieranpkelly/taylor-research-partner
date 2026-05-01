import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCorpusIndex, getCorpusPaths, loadOrBuildCorpusIndex } from "../lib/corpus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const paths = getCorpusPaths(rootDir);
const outputPath = path.join(rootDir, "data", "corpus-index.json");

const index = process.argv.includes("--fresh")
  ? await buildCorpusIndex(paths.rootDir, paths.cacheDir)
  : await loadOrBuildCorpusIndex(paths.rootDir, paths.cacheDir);

const exported = {
  ...index,
  rootDir: "",
  documents: index.documents.map(({ path: _path, ...document }) => document),
  passages: index.passages.map(({ path: _path, ...passage }) => passage)
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(exported));

console.log(`Exported ${exported.documents.length} documents and ${exported.passages.length} passages to ${outputPath}`);
