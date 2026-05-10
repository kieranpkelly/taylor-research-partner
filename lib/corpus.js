import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "also",
  "among",
  "and",
  "another",
  "any",
  "are",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "can",
  "could",
  "did",
  "does",
  "each",
  "every",
  "for",
  "from",
  "had",
  "has",
  "have",
  "having",
  "her",
  "here",
  "him",
  "his",
  "how",
  "into",
  "its",
  "itself",
  "may",
  "more",
  "most",
  "much",
  "must",
  "not",
  "now",
  "only",
  "other",
  "our",
  "out",
  "own",
  "same",
  "shall",
  "she",
  "should",
  "such",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "though",
  "through",
  "thus",
  "too",
  "upon",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whose",
  "why",
  "will",
  "with",
  "within",
  "without",
  "would"
]);

const THEME_EXPANSIONS = [
  {
    keys: ["soul", "psyche", "descent", "ascent", "immortality"],
    terms: ["soul", "souls", "psychical", "ascent", "descent", "immortal", "life", "vehicle", "purification"]
  },
  {
    keys: ["theurgy", "ritual", "rites", "symbols", "oracle"],
    terms: ["theurgy", "theurgic", "rites", "symbols", "symbolic", "oracle", "oracles", "divine works", "mysteries"]
  },
  {
    keys: ["one", "unity", "henad", "first principle"],
    terms: ["one", "unity", "unities", "henads", "first cause", "principle", "superessential", "ineffable"]
  },
  {
    keys: ["intellect", "mind", "nous", "intelligible"],
    terms: ["intellect", "intellectual", "intelligible", "mind", "nous", "essence", "being", "paradigm"]
  },
  {
    keys: ["matter", "evil", "privation", "necessity"],
    terms: ["matter", "evil", "privation", "necessity", "form", "discord", "vice", "generation"]
  },
  {
    keys: ["god", "gods", "divinity", "providence"],
    terms: ["god", "gods", "divine", "deity", "providence", "demiurgus", "jupiter", "apollo", "minerva"]
  },
  {
    keys: ["virtue", "ethics", "purification", "contemplation"],
    terms: ["virtue", "virtues", "purification", "purifying", "contemplation", "temperance", "justice", "prudence"]
  },
  {
    keys: ["participation", "procession", "reversion", "emanation"],
    terms: ["participation", "participates", "procession", "proceeds", "progression", "reversion", "returns", "cause"]
  },
  {
    keys: ["love", "beauty", "eros"],
    terms: ["love", "beauty", "beautiful", "eros", "amatory", "desire", "good"]
  },
  {
    keys: ["daemon", "demon", "spirit", "guardian"],
    terms: ["daemon", "daemons", "demon", "demons", "spirit", "guardian", "intermediate"]
  }
];

const CLASSICAL_ALIAS_GROUPS = [
  ["aphrodite", "venus"],
  ["zeus", "jupiter", "jove"],
  ["hera", "juno"],
  ["athena", "minerva", "pallas"],
  ["ares", "mars"],
  ["hephaestus", "hephaistos", "vulcan"],
  ["poseidon", "neptune"],
  ["artemis", "diana"],
  ["hestia", "vesta"],
  ["demeter", "ceres"],
  ["dionysus", "dionysius", "bacchus"],
  ["hermes", "mercury"],
  ["hades", "pluto"],
  ["cronus", "saturn"],
  ["asklepios", "asclepius", "esculapius", "aesculapius"],
  ["eros", "cupid", "love"],
  ["persephone", "proserpine"]
];

const TITLE_BY_FILE = new Map(
  Object.entries({
    "01elemnt.doc": "Proclus, The Elements of Theology",
    "02porphy.doc": "Porphyry, Select Works",
    "03plotin.doc": "Plotinus, Selected Works",
    "04godswd.doc": "Sallust on the Gods and the World; Demophilus",
    "05hymnsi.doc": "The Mystical Hymns of Orpheus",
    "06maxtyr.doc": "Maximus Tyrius, The Dissertations",
    "07oracle.doc": "Chaldean Oracles",
    "08pltthe.doc": "Proclus, The Theology of Plato",
    "09plato1.doc": "The Works of Plato, Vol. I",
    "10plato2.doc": "The Works of Plato, Vol. II: The Laws",
    "11plato3.doc": "The Works of Plato, Vol. III: Parmenides",
    "12plato4.doc": "The Works of Plato, Vol. IV: Theaetetus",
    "13plato5.doc": "The Works of Plato, Vol. V",
    "14apulei.doc": "Apuleius, The Metamorphosis",
    "15comtm1.doc": "Proclus, Commentary on the Timaeus, Vol. I",
    "16comtm2.doc": "Proclus, Commentary on the Timaeus, Vol. II",
    "17iambl.doc": "Iamblichus, On the Mysteries",
    "18procl.doc": "Proclus, Providence, Fate, and Evil",
    "19arist1.doc": "The Works of Aristotle, Vol. I",
    "20arist2.doc": "The Works of Aristotle, Vol. II",
    "21arist3.doc": "The Works of Aristotle, Vol. III",
    "22arist4.doc": "The Works of Aristotle, Vol. IV",
    "23arist5.doc": "The Works of Aristotle, Vol. V",
    "24arist6.doc": "The Works of Aristotle, Vol. VI",
    "25arist7.doc": "The Works of Aristotle, Vol. VII",
    "26arist8.doc": "The Works of Aristotle, Vol. VIII",
    "27arist9.doc": "The Works of Aristotle, Vol. IX",
    "28disari.doc": "A Dissertation on the Philosophy of Aristotle",
    "29pro-eu.doc": "Proclus, On Euclid",
    "30theor.doc": "Theoretic Arithmetic",
    "31-32pau.doc": "Pausanias, Description of Greece",
    "33vxian.doc": "Julian, Arguments Against the Christians",
    "index to the tts.doc": "Index to the Thomas Taylor Series"
  })
);

export function getCorpusPaths(rootDir) {
  const resolved = path.resolve(rootDir);
  const cacheDir = path.join(resolved, ".taylor-cache");
  return {
    rootDir: resolved,
    cacheDir,
    indexPath: path.join(cacheDir, "corpus-index.json")
  };
}

export async function loadOrBuildCorpusIndex(rootDir, cacheDir) {
  const paths = getCorpusPaths(rootDir);
  const docFiles = await listDocumentFiles(paths.rootDir);
  const signature = await buildSourceSignature(docFiles);

  try {
    const cached = JSON.parse(await fs.readFile(paths.indexPath, "utf8"));
    if (cached.sourceSignature === signature && Array.isArray(cached.passages)) {
      return cached;
    }
  } catch {
    // Missing or stale cache; rebuild below.
  }

  return buildCorpusIndex(paths.rootDir, cacheDir ?? paths.cacheDir);
}

export async function loadCorpusIndexFile(indexPath) {
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  if (!Array.isArray(index.documents) || !Array.isArray(index.passages)) {
    throw new Error(`Corpus index at ${indexPath} is not valid.`);
  }
  return index;
}

export async function buildCorpusIndex(rootDir, cacheDir) {
  const docFiles = await listDocumentFiles(rootDir);
  const signature = await buildSourceSignature(docFiles);
  const documents = [];
  const passages = [];

  for (const filePath of docFiles) {
    const raw = await extractDocumentText(filePath);
    const text = normalizeExtractedText(raw);
    const stat = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const title = inferTitle(fileName, text);
    const document = {
      file: fileName,
      path: filePath,
      title,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      wordCount: countWords(text)
    };
    documents.push(document);

    const documentPassages = chunkDocument(document, text);
    passages.push(...documentPassages);
  }

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceSignature: signature,
    rootDir,
    documents,
    passages
  };

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(path.join(cacheDir, "corpus-index.json"), JSON.stringify(index));
  return index;
}

export function createSearchEngine(index) {
  const passageStats = [];
  const documentFrequency = new Map();
  let totalLength = 0;

  for (const passage of index.passages) {
    const tokens = tokenize(`${passage.title} ${passage.section} ${passage.text}`);
    const termCounts = new Map();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
    }
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
    totalLength += tokens.length;
    passageStats.push({
      length: tokens.length || 1,
      termCounts
    });
  }

  return {
    ...index,
    passageStats,
    documentFrequency,
    averageLength: totalLength / Math.max(1, index.passages.length)
  };
}

export function searchCorpus(engine, query, options = {}) {
  const limit = options.limit ?? 18;
  const selectedFiles = Array.isArray(options.files) && options.files.length
    ? new Set(options.files)
    : null;
  const selectedTitleTokens = selectedFiles ? titleTokensForSelectedFiles(engine, selectedFiles) : new Set();
  const expanded = expandQuery(query);
  const rawQueryTokens = filterScopedTitleTokens(tokenize(query), selectedTitleTokens);
  const contentPhrase = rawQueryTokens.join(" ");
  const queryTokens = filterScopedTitleTokens(tokenize(expanded.join(" ")), selectedTitleTokens);
  const uniqueQueryTokens = [...new Set(queryTokens)];
  const normalizedQueryVariants = queryVariants(query);
  const totalPassages = engine.passages.length || 1;
  const k1 = 1.45;
  const b = 0.72;

  const scored = engine.passages.map((passage, index) => {
    if (selectedFiles && !selectedFiles.has(passage.file)) return null;

    const stats = engine.passageStats[index];
    let score = 0;

    for (const token of uniqueQueryTokens) {
      const tf = stats.termCounts.get(token) ?? 0;
      if (!tf) continue;
      const df = engine.documentFrequency.get(token) ?? 0;
      const idf = Math.log(1 + (totalPassages - df + 0.5) / (df + 0.5));
      const denominator = tf + k1 * (1 - b + b * (stats.length / engine.averageLength));
      score += idf * ((tf * (k1 + 1)) / denominator);
    }

    const haystack = normalizeForMatching(
      `${passage.title} ${passage.section} ${passage.text}`
    );
    for (const normalizedQuery of normalizedQueryVariants) {
      if (normalizedQuery.length > 4 && haystack.includes(normalizedQuery)) {
        const phraseWords = normalizedQuery.split(/\s+/).length;
        score += 20 + Math.min(45, phraseWords * 2.5);
        break;
      }
    }

    if (rawQueryTokens.length >= 4) {
      const matchedTokens = rawQueryTokens.filter((token) => stats.termCounts.has(token)).length;
      const coverage = matchedTokens / rawQueryTokens.length;
      if (coverage >= 0.68) {
        score += coverage * 16 + Math.min(16, matchedTokens);
      }
    }

    if (rawQueryTokens.length > 1) {
      const haystackContent = tokenize(`${passage.title} ${passage.section} ${passage.text}`).join(" ");
      if (haystackContent.includes(contentPhrase)) {
        score += 10 + rawQueryTokens.length;
      }
    }

    const titleSection = normalizeForMatching(`${passage.title} ${passage.section}`);
    for (const token of uniqueQueryTokens) {
      if (titleSection.includes(token)) score += 0.75;
    }

    if (/\b(index|contents)\b/i.test(passage.section) || /^index\b/i.test(passage.title)) {
      score *= 0.18;
    }

    return { passage, score };
  });

  return scored
    .filter(Boolean)
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ passage, score }) => ({
      id: passage.id,
      title: passage.title,
      file: passage.file,
      section: passage.section,
      chunkIndex: passage.chunkIndex,
      score: Number(score.toFixed(3)),
      excerpt: makeExcerpt(passage.text, query),
      text: passage.text
    }));
}

function titleTokensForSelectedFiles(engine, selectedFiles) {
  const tokens = new Set();
  for (const document of engine.documents ?? []) {
    if (!selectedFiles.has(document.file)) continue;
    for (const token of tokenize(`${document.title} ${document.file}`)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function filterScopedTitleTokens(tokens, selectedTitleTokens) {
  if (!selectedTitleTokens.size) return tokens;
  const filtered = tokens.filter((token) => !selectedTitleTokens.has(token));
  return filtered.length ? filtered : tokens;
}

export function getPassage(engine, id) {
  const passage = engine.passages.find((item) => item.id === id);
  if (!passage) return null;
  const sameFile = engine.passages.filter((item) => item.file === passage.file);
  const position = sameFile.findIndex((item) => item.id === id);
  return {
    ...passage,
    previousId: sameFile[position - 1]?.id ?? null,
    nextId: sameFile[position + 1]?.id ?? null
  };
}

export function formatSourcesForPrompt(results, options = {}) {
  const maxSources = typeof options === "number" ? options : options.maxSources ?? 10;
  const maxChars = typeof options === "number" ? 2600 : options.maxChars ?? 1800;

  return results
    .slice(0, maxSources)
    .map((source, index) => {
      const text = source.text.length > maxChars ? `${source.text.slice(0, maxChars)}...` : source.text;
      return [
        `Source ${index + 1}: [[source:${source.id}]]`,
        `Work: ${source.title}`,
        `File: ${source.file}`,
        `Section: ${source.section}`,
        source.searchReason ? `Retrieval note: ${source.searchReason}` : "",
        `Excerpt: """${text}"""`
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function composeLocalAnswer(query, results) {
  if (!results.length) {
    return [
      "I could not find a strong local match in the Taylor corpus for that wording.",
      "Try a related Taylor or Platonic term, or enable the AI layer for broader thematic expansion."
    ].join("\n\n");
  }

  const works = [...new Set(results.slice(0, 8).map((source) => source.title))];
  const top = results.slice(0, 5).map((source) => {
    return `- ${source.title}, ${source.section} [[source:${source.id}]]: "${source.excerpt}"`;
  });

  return [
    `Local corpus search found the strongest evidence for "${query}" in ${works.join(", ")}.`,
    "The most relevant passages are:",
    top.join("\n"),
    "Set `OPENAI_API_KEY` to turn these results into a conversational synthesis."
  ].join("\n\n");
}

export function detectExternalRequest(text) {
  return /\b(search|look|check|consult|use)\b[^.?!]{0,40}\b(web|internet|online|external|outside|scholarship|secondary sources)\b/i.test(
    text
  );
}

async function listDocumentFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.doc$/i.test(name))
    .filter((name) => !name.startsWith("~$"))
    .sort(naturalSort)
    .map((name) => path.join(rootDir, name));
}

async function buildSourceSignature(filePaths) {
  const hash = crypto.createHash("sha256");
  for (const filePath of filePaths) {
    const stat = await fs.stat(filePath);
    hash.update(path.basename(filePath));
    hash.update(String(stat.size));
    hash.update(String(stat.mtimeMs));
  }
  return hash.digest("hex");
}

async function extractDocumentText(filePath) {
  let textutilError = null;
  try {
    const { stdout } = await execFileAsync(
      "/usr/bin/textutil",
      ["-convert", "txt", "-stdout", filePath],
      { maxBuffer: 200 * 1024 * 1024 }
    );
    if (startsReadably(stdout) || isShortReadableText(stdout)) return stdout;
  } catch (error) {
    textutilError = error;
  }

  try {
    const { stdout } = await execFileAsync("/usr/bin/strings", [filePath], {
      maxBuffer: 200 * 1024 * 1024
    });
    const filtered = filterStringsOutput(stdout);
    if (countWords(filtered) > 500) return filtered;
  } catch {
    // Fall through to the textutil error below.
  }

  const message = textutilError instanceof Error ? textutilError.message : "unreadable text output";
  throw new Error(`Could not extract ${path.basename(filePath)}: ${message}`);
}

function normalizeExtractedText(raw) {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/(?:[tf])?xe\s+"[^"]*"/gi, "")
    .replace(/\btc\s+\\l\s+\d+\s+"[^"]*"/gi, "")
    .replace(/\bpageref\s+[A-Za-z0-9_?]+/gi, "")
    .replace(/\bPRIVATE\b/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n\s*page\s+\\\*\s+arabic\d+\s*/gi, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function inferTitle(fileName, text) {
  const mapped = TITLE_BY_FILE.get(fileName.toLowerCase());
  if (mapped) return mapped;

  const lines = text
    .split("\n")
    .map((line) => cleanHeading(line))
    .filter(Boolean)
    .filter((line) => !/^n\.?b\.?/i.test(line))
    .slice(0, 8);

  const chosen = lines.find((line) => line.length > 5 && !/^page\b/i.test(line)) ?? fileName;
  return titleCase(
    chosen
      .replace(/PRIVATE\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function chunkDocument(document, text) {
  const blocks = splitBlocks(text);
  const passages = [];
  let currentSection = "Opening";
  let chunkParts = [];
  let chunkWordCount = 0;
  let chunkIndex = 1;
  let startWord = 0;
  let runningWords = 0;

  const flush = () => {
    const chunkText = chunkParts.join("\n\n").trim();
    if (!chunkText) return;
    passages.push({
      id: `${slugify(document.file)}-${String(chunkIndex).padStart(4, "0")}`,
      file: document.file,
      path: document.path,
      title: document.title,
      section: currentSection,
      chunkIndex,
      startWord,
      wordCount: chunkWordCount,
      text: chunkText
    });
    chunkIndex += 1;
    startWord = runningWords;
    chunkParts = [];
    chunkWordCount = 0;
  };

  for (const block of blocks) {
    const pieces = splitLongBlock(block, 380);
    for (const piece of pieces) {
      const cleaned = piece.trim();
      if (!cleaned) continue;
      if (isLikelyHeading(cleaned)) {
        if (chunkWordCount > 0) flush();
        currentSection = titleCase(cleanHeading(cleaned));
      }

      const words = countWords(cleaned);
      if (chunkWordCount > 0 && chunkWordCount + words > 760) {
        flush();
      }
      chunkParts.push(cleaned);
      chunkWordCount += words;
      runningWords += words;
    }
  }

  flush();
  return passages;
}

function splitBlocks(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitLongBlock(block, maxWords) {
  const words = block.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [block];

  const pieces = [];
  for (let i = 0; i < words.length; i += maxWords) {
    pieces.push(words.slice(i, i + maxWords).join(" "));
  }
  return pieces;
}

function isLikelyHeading(text) {
  const cleaned = cleanHeading(text);
  if (!cleaned || cleaned.length > 140) return false;
  if (/^(book|chapter|section|proposition|definition|preface|introduction|hymn|argument|note|notes)\b/i.test(cleaned)) {
    return true;
  }
  const letters = cleaned.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;
  const uppercase = letters.replace(/[^A-Z]/g, "").length;
  return uppercase / letters.length > 0.72;
}

function cleanHeading(text) {
  return text
    .replace(/(?:[tf])?xe\s+"[^"]*"/gi, "")
    .replace(/\btc\s+\\l\s+\d+\s+"[^"]*"/gi, "")
    .replace(/\bPRIVATE\b/g, "")
    .replace(/[_*]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\d+\s*/, "")
    .trim();
}

function startsReadably(text) {
  const sample = text.slice(0, 5000);
  const words = countWords(sample);
  const common = (sample.match(/\b(the|and|of|to|in|soul|god|book|introduction)\b/gi) ?? []).length;
  const controls = (sample.match(/[\u0000-\u0008\u000B-\u001F\uFFFD]/g) ?? []).length;
  return words > 80 && common > 4 && controls / Math.max(1, sample.length) < 0.015;
}

function isShortReadableText(text) {
  const sample = text.slice(0, 5000);
  const words = countWords(sample);
  const letters = (sample.match(/[\p{L}]/gu) ?? []).length;
  const controls = (sample.match(/[\u0000-\u0008\u000B-\u001F\uFFFD]/g) ?? []).length;
  return words >= 5 && words < 500 && letters > 20 && controls / Math.max(1, sample.length) < 0.015;
}

function filterStringsOutput(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isReadableLine)
    .join("\n");
}

function isReadableLine(line) {
  if (!line || line.length < 3) return false;
  if (/^(Microsoft|Equation|Word\.Document|MSWordDoc|Normal|HP LaserJet|Prometheus Trust|Title)$/i.test(line)) {
    return false;
  }
  if (/^[^A-Za-z\u0370-\u03FF]{1,24}$/.test(line)) return false;

  const letters = (line.match(/[\p{L}]/gu) ?? []).length;
  if (letters < 2) return false;

  const good = (
    line.match(/[\p{L}\p{N}\s.,;:'"?!()[\]{}\-_—–&*†‡§¶+\/\\|]/gu) ?? []
  ).length;
  return good / Math.max(1, line.length) > 0.76;
}

function tokenize(text) {
  return normalizeForMatching(text)
    .split(/\s+/)
    .map(stem)
    .filter((token) => token.length > 2)
    .filter((token) => !STOP_WORDS.has(token));
}

function stem(token) {
  if (token.length > 6 && token.endsWith("ingly")) return token.slice(0, -5);
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("tion")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function expandQuery(query) {
  const lower = query.toLowerCase();
  const expansions = [query];
  for (const group of THEME_EXPANSIONS) {
    if (group.keys.some((key) => lower.includes(key))) {
      expansions.push(...group.terms);
    }
  }
  for (const group of CLASSICAL_ALIAS_GROUPS) {
    if (group.some((term) => wordMatch(lower, term))) {
      expansions.push(...group);
    }
  }
  return expansions;
}

function queryVariants(query) {
  return [...new Set(expandAliasVariants(query).map(normalizeForMatching))]
    .filter((variant) => variant.length > 4)
    .slice(0, 28);
}

function expandAliasVariants(text) {
  const variants = new Set([String(text ?? "")]);

  for (const group of CLASSICAL_ALIAS_GROUPS) {
    const current = [...variants];
    for (const variant of current) {
      for (const term of group) {
        if (!wordMatch(variant, term)) continue;
        for (const alternative of group) {
          if (alternative === term) continue;
          variants.add(replaceWord(variant, term, alternative));
          if (variants.size >= 40) return [...variants];
        }
      }
    }
  }

  return [...variants];
}

function wordMatch(text, word) {
  return wordRegex(word).test(String(text ?? ""));
}

function replaceWord(text, word, replacement) {
  return String(text ?? "").replace(wordRegex(word, "gi"), replacement);
}

function wordRegex(word, flags = "i") {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, flags);
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeForMatching(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(text, query, maxLength = 680) {
  const normalizedText = normalizeForMatching(text);
  const queryTokens = tokenize(query);
  let bestIndex = -1;

  for (const token of queryTokens) {
    const index = normalizedText.indexOf(token);
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;

  if (bestIndex === -1) {
    return `${compact.slice(0, maxLength).trim()}...`;
  }

  const ratio = bestIndex / Math.max(1, normalizedText.length);
  const approximateIndex = Math.floor(ratio * compact.length);
  const start = Math.max(0, approximateIndex - Math.floor(maxLength / 2));
  const end = Math.min(compact.length, start + maxLength);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compact.length ? "..." : "";
  return `${prefix}${compact.slice(start, end).trim()}${suffix}`;
}

function countWords(text) {
  const match = text.match(/\b[\p{L}\p{N}'-]+\b/gu);
  return match ? match.length : 0;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\.doc$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(text) {
  const small = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);
  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && small.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
