import path from "node:path";
import { buildCorpusIndex, getCorpusPaths } from "../lib/corpus.js";

const rootDir = process.env.TAYLOR_CORPUS_DIR
  ? path.resolve(process.env.TAYLOR_CORPUS_DIR)
  : process.cwd();

const paths = getCorpusPaths(rootDir);
const index = await buildCorpusIndex(paths.rootDir, paths.cacheDir);

console.log(
  `Indexed ${index.documents.length} documents into ${index.passages.length} passages.`
);
console.log(paths.indexPath);
