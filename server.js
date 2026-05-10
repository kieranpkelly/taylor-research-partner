import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCorpusIndex,
  composeLocalAnswer,
  createSearchEngine,
  detectExternalRequest,
  formatSourcesForPrompt,
  getCorpusPaths,
  getPassage,
  loadCorpusIndexFile,
  loadOrBuildCorpusIndex,
  searchCorpus
} from "./lib/corpus.js";
import {
  enrichSourcesWithSourceLinks,
  getSourceLinksForPassage,
  getSourcePilotStatus,
  getSourceWorkForTaylorFile,
  lookupSourcePhrase,
  sourceLinksForResults
} from "./lib/source-pilot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await loadDotEnv(path.join(__dirname, ".env"));

const rootDir = process.env.TAYLOR_CORPUS_DIR
  ? path.resolve(process.env.TAYLOR_CORPUS_DIR)
  : __dirname;
const paths = getCorpusPaths(rootDir);
const port = Number(process.env.PORT ?? 3000);
const publicDir = path.join(__dirname, "public");
const sessionsDir = path.join(paths.cacheDir, "sessions");
const usageLogPath = path.join(paths.cacheDir, "usage-log.md");
const model = process.env.OPENAI_MODEL || "gpt-5.5";
const reasoningEffort = process.env.OPENAI_REASONING_EFFORT || "medium";
const bundledCorpusPath = path.resolve(process.env.CORPUS_INDEX_PATH || path.join(__dirname, "data", "corpus-index.json"));
const useBundledCorpus = parseBoolean(process.env.USE_BUNDLED_CORPUS, false);
const supabaseUrl = trimTrailingSlash(process.env.SUPABASE_URL || "");
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabasePublicKeySafe = isPublicSupabaseClientKey(supabaseAnonKey);
const supabaseReady = Boolean(supabaseUrl && supabasePublicKeySafe && supabaseServiceRoleKey);
const authRequired = parseBoolean(process.env.AUTH_REQUIRED, supabaseReady);
const allowClientApiKeys = parseBoolean(
  process.env.ALLOW_CLIENT_API_KEYS,
  !authRequired && !process.env.OPENAI_API_KEY
);
const allowSupabaseSignups = parseBoolean(process.env.SUPABASE_ALLOW_SIGNUPS, false);
const appUrl = (process.env.APP_URL || "").trim();
const accessRequestsEnabled = parseBoolean(
  process.env.ACCESS_REQUESTS_ENABLED,
  authRequired && supabaseReady
);
const localFileAccess = parseBoolean(process.env.LOCAL_FILE_ACCESS, !authRequired);
const maxOutputTokens = parsePositiveInteger(process.env.OPENAI_MAX_OUTPUT_TOKENS, 12000);
const retryMaxOutputTokens = parsePositiveInteger(
  process.env.OPENAI_RETRY_MAX_OUTPUT_TOKENS,
  Math.max(16000, maxOutputTokens)
);
const outputGuidelinesPath = path.resolve(process.env.OUTPUT_GUIDELINES_PATH || path.join(__dirname, "data", "output-guidelines.md"));

let corpusIndex = useBundledCorpus
  ? await loadCorpusIndexFile(bundledCorpusPath)
  : await loadOrBuildCorpusIndex(paths.rootDir, paths.cacheDir);
let searchEngine = createSearchEngine(corpusIndex);
const outputGuidelines = await loadOutputGuidelines(outputGuidelinesPath);

const researchModes = new Set(["standard", "find-passage", "find-references", "synthesis", "deep-research"]);
const retrievalProfiles = {
  "find-passage": {
    resultLimit: 34,
    latestLimit: 28,
    contextLimit: 8,
    promptSources: 16,
    promptChars: 2200,
    outputTokens: maxOutputTokens,
    sourceDisplayLimit: 16
  },
  "find-references": {
    resultLimit: 72,
    latestLimit: 60,
    contextLimit: 16,
    promptSources: 28,
    promptChars: 1050,
    outputTokens: maxOutputTokens,
    sourceDisplayLimit: 30
  },
  synthesis: {
    resultLimit: 30,
    latestLimit: 24,
    contextLimit: 12,
    promptSources: 12,
    promptChars: 1800,
    outputTokens: maxOutputTokens,
    sourceDisplayLimit: 10
  },
  "deep-research": {
    resultLimit: 80,
    latestLimit: 48,
    contextLimit: 36,
    promptSources: 30,
    promptChars: 1450,
    outputTokens: Math.max(maxOutputTokens, 18000),
    sourceDisplayLimit: 24
  }
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (url.pathname === "/api/auth/config" && request.method === "GET") {
      return sendJson(response, {
        authRequired,
        supabaseReady,
        supabaseUrl: authRequired ? supabaseUrl : "",
        supabaseAnonKey: authRequired && supabasePublicKeySafe ? supabaseAnonKey : "",
        configError: authRequired && !supabasePublicKeySafe
          ? "SUPABASE_ANON_KEY must be a public anon or publishable key, not a secret/service role key."
          : "",
        allowSignups: allowSupabaseSignups,
        accessRequestsEnabled,
        appUrl
      });
    }

    if (url.pathname === "/api/access-request" && request.method === "POST") {
      const body = await readJson(request);
      const result = await saveAccessRequest(body);
      return sendJson(response, result.payload, result.status);
    }

    const auth = await getAuthContext(request);
    if (authRequired && url.pathname.startsWith("/api/") && !auth.user) {
      return sendJson(response, { error: "Sign in required." }, 401);
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      return sendJson(response, {
        documents: corpusIndex.documents,
        documentCount: corpusIndex.documents.length,
        passageCount: corpusIndex.passages.length,
        generatedAt: corpusIndex.generatedAt,
        model,
        reasoningEffort,
        maxOutputTokens,
        aiReady: Boolean(process.env.OPENAI_API_KEY),
        serverKeyReady: Boolean(process.env.OPENAI_API_KEY),
        allowClientApiKeys,
        authRequired,
        canReindex: !useBundledCorpus,
        localFileAccess,
        sourcePilot: getSourcePilotStatus()
      });
    }

    if (url.pathname === "/api/reindex" && request.method === "POST") {
      corpusIndex = await buildCorpusIndex(paths.rootDir, paths.cacheDir);
      searchEngine = createSearchEngine(corpusIndex);
      await logUsage("Corpus refreshed", {
        documentCount: corpusIndex.documents.length,
        passageCount: corpusIndex.passages.length
      }, auth.user);
      return sendJson(response, {
        ok: true,
        documentCount: corpusIndex.documents.length,
        passageCount: corpusIndex.passages.length,
        generatedAt: corpusIndex.generatedAt
      });
    }

    if (url.pathname === "/api/search" && request.method === "POST") {
      const body = await readJson(request);
      const query = String(body.query ?? "").trim();
      if (!query) return sendJson(response, { error: "Missing query." }, 400);

      const selectedFiles = normalizeSelectedFiles(body.selectedFiles);
      const externalAllowed = Boolean(body.allowWeb) || detectExternalRequest(query);
      const researchMode = normalizeResearchMode(body.researchMode);
      const retrieval = retrieveCorpusEvidence({
        query,
        messages: [{ role: "user", content: query }],
        selectedFiles,
        researchMode
      });
      const answer = await answerInquiry({
        query,
        messages: [{ role: "user", content: query }],
        results: retrieval.results,
        externalAllowed,
        apiKey: getRequestApiKey(request),
        selectedFiles,
        researchMode,
        effectiveMode: retrieval.effectiveMode,
        retrievalSummary: retrieval.summary,
        promptOptions: retrieval.promptOptions
      });
      await logUsage("Search submitted", {
        query,
        selectedFiles,
        researchMode,
        effectiveMode: retrieval.effectiveMode,
        resultCount: retrieval.results.length,
        usedAI: answer.usedAI,
        usedWeb: answer.usedWeb
      }, auth.user);
      return sendJson(response, answer);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const body = await readJson(request);
      const messages = Array.isArray(body.messages) ? sanitizeMessages(body.messages) : [];
      const latest = [...messages].reverse().find((message) => message.role === "user");
      const query = latest?.content?.trim();
      if (!query) return sendJson(response, { error: "Missing message." }, 400);

      const selectedFiles = normalizeSelectedFiles(body.selectedFiles);
      const externalAllowed = Boolean(body.allowWeb) || detectExternalRequest(query);
      const researchMode = normalizeResearchMode(body.researchMode);
      const retrieval = retrieveCorpusEvidence({
        query,
        messages,
        selectedFiles,
        researchMode
      });
      const answer = await answerInquiry({
        query,
        messages,
        results: retrieval.results,
        externalAllowed,
        apiKey: getRequestApiKey(request),
        selectedFiles,
        researchMode,
        effectiveMode: retrieval.effectiveMode,
        retrievalSummary: retrieval.summary,
        promptOptions: retrieval.promptOptions
      });
      await logUsage("Conversation turn submitted", {
        query,
        selectedFiles,
        researchMode,
        effectiveMode: retrieval.effectiveMode,
        messageCount: messages.length,
        resultCount: retrieval.results.length,
        usedAI: answer.usedAI,
        usedWeb: answer.usedWeb
      }, auth.user);
      return sendJson(response, answer);
    }

    if (url.pathname === "/api/sessions" && request.method === "GET") {
      return sendJson(response, { sessions: await listSessions(auth.user) });
    }

    if (url.pathname === "/api/sessions" && request.method === "POST") {
      const body = await readJson(request);
      const session = await saveSession(body, auth.user);
      await logUsage("Investigation saved", {
        title: session.title,
        selectedFiles: session.selectedFiles,
        researchMode: normalizeResearchMode(body.researchMode),
        messageCount: session.messages.length
      }, auth.user);
      return sendJson(response, session);
    }

    if (url.pathname.startsWith("/api/sessions/") && request.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/sessions/", ""));
      const session = await readSession(id, auth.user);
      if (!session) return sendJson(response, { error: "Session not found." }, 404);
      await logUsage("Investigation loaded", {
        title: session.title,
        selectedFiles: session.selectedFiles,
        messageCount: session.messages.length
      }, auth.user);
      return sendJson(response, session);
    }

    if (url.pathname === "/api/log" && request.method === "POST") {
      const body = await readJson(request);
      await logUsage(String(body.event ?? "Client event"), body.details ?? {}, auth.user);
      return sendJson(response, { ok: true });
    }

    if (url.pathname.startsWith("/api/passage/") && request.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/passage/", ""));
      const passage = getPassage(searchEngine, id);
      if (!passage) return sendJson(response, { error: "Passage not found." }, 404);
      return sendJson(response, passage);
    }

    if (url.pathname.startsWith("/api/source-links/") && request.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/source-links/", ""));
      return sendJson(response, {
        passageId: id,
        sourceLinks: getSourceLinksForPassage(id)
      });
    }

    if (url.pathname === "/api/source-lookup" && request.method === "POST") {
      const body = await readJson(request);
      const selectedText = String(body.selectedText ?? "").trim();
      const passageId = String(body.passageId ?? "").trim();
      if (!selectedText) return sendJson(response, { error: "Select Taylor text first." }, 400);

      const matches = lookupSourcePhrase({
        selectedText,
        passageId: passageId || undefined,
        limit: 6
      });
      const passage = passageId ? getPassage(searchEngine, passageId) : null;
      const apiKey = getRequestApiKey(request);
      const externalAllowed = Boolean(body.allowWeb);
      let inferredMatch = null;
      let aiError = "";
      if (!matches.length && apiKey) {
        try {
          inferredMatch = await inferOriginalPhrase({
            selectedText,
            passage,
            externalAllowed,
            apiKey
          });
        } catch (error) {
          aiError = error instanceof Error ? error.message : String(error);
        }
      }
      await logUsage("Original-language lookup", {
        selectedText,
        passageId,
        matchCount: matches.length,
        usedAI: Boolean(inferredMatch),
        usedWeb: Boolean(inferredMatch && externalAllowed),
        message: aiError
      }, auth.user);
      return sendJson(response, {
        selectedText,
        passageId: passageId || null,
        matches: inferredMatch ? [inferredMatch] : matches,
        lookupMode: matches.length ? "mapped" : inferredMatch ? "ai-estimate" : "none",
        aiUnavailable: !matches.length && !inferredMatch && !apiKey,
        aiError: aiError || null
      });
    }

    if (url.pathname === "/api/open-file" && request.method === "POST") {
      if (!localFileAccess) return sendJson(response, { error: "Local file access is disabled." }, 403);
      const body = await readJson(request);
      const passage = getPassage(searchEngine, String(body.id ?? ""));
      if (!passage) return sendJson(response, { error: "Passage not found." }, 404);
      spawn("open", [passage.path], { detached: true, stdio: "ignore" }).unref();
      return sendJson(response, { ok: true });
    }

    return serveStatic(url.pathname, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logUsage("Server error", { path: request.url, message });
    sendJson(response, { error: message }, 500);
  }
});

server.listen(port, () => {
  console.log(`Taylor Research Partner is running at http://localhost:${port}`);
  console.log(`Indexed ${corpusIndex.documents.length} documents and ${corpusIndex.passages.length} passages.`);
  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set; the app will use local corpus search only.");
  }
});

function retrieveCorpusEvidence({ query, messages, selectedFiles, researchMode }) {
  const effectiveMode = effectiveResearchMode(researchMode, query);
  const profile = retrievalProfiles[effectiveMode] ?? retrievalProfiles.synthesis;
  const searches = [];
  const quotedPhrases = extractQuotedPhrases(query);

  for (const phrase of quotedPhrases.slice(0, 4)) {
    searches.push({
      query: phrase,
      limit: profile.latestLimit,
      boost: 80,
      reason: "quoted phrase or near-quote from the latest inquiry"
    });
  }

  searches.push({
    query,
    limit: profile.latestLimit,
    boost: latestQueryBoost(effectiveMode),
    reason: "latest inquiry searched directly"
  });

  if (profile.contextLimit > 0 && shouldBlendConversationContext(effectiveMode, messages)) {
    searches.push({
      query: messages
        .slice(-4)
        .map((message) => message.content)
        .join("\n"),
      limit: profile.contextLimit,
      boost: 0,
      reason: "recent conversation context"
    });
  }

  const results = mergeSearchResults(
    searches.flatMap((search) => {
      return searchCorpus(searchEngine, search.query, {
        limit: search.limit,
        files: selectedFiles
      }).map((result) => ({
        ...result,
        score: Number((result.score + search.boost).toFixed(3)),
        searchReason: search.reason
      }));
    }),
    profile.resultLimit
  );

  return {
    results,
    researchMode,
    effectiveMode,
    promptOptions: profile,
    summary: [
      `${results.length} ranked passage${results.length === 1 ? "" : "s"} returned from the corpus.`,
      quotedPhrases.length
        ? `${quotedPhrases.length} quoted phrase${quotedPhrases.length === 1 ? "" : "s"} searched directly before thematic retrieval.`
        : "The latest inquiry was searched directly before any conversation-context search.",
      researchMode === "standard" && effectiveMode !== "synthesis"
        ? `Standard mode inferred ${researchModeLabel(effectiveMode)} from the wording of the inquiry.`
        : ""
    ].filter(Boolean).join(" ")
  };
}

function mergeSearchResults(results, limit) {
  const byId = new Map();
  for (const result of results) {
    const existing = byId.get(result.id);
    if (!existing || result.score > existing.score) {
      byId.set(result.id, result);
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function normalizeResearchMode(mode) {
  const value = String(mode ?? "").trim();
  return researchModes.has(value) ? value : "standard";
}

function effectiveResearchMode(mode, query) {
  const normalized = normalizeResearchMode(mode);
  if (normalized !== "standard") return normalized;

  if (looksLikeReferenceSweep(query)) return "find-references";
  if (looksLikePassageFinding(query)) return "find-passage";
  if (looksLikeDeepResearch(query)) return "deep-research";
  return "synthesis";
}

function looksLikePassageFinding(query) {
  const text = String(query ?? "");
  return (
    extractQuotedPhrases(text).length > 0 ||
    /\b(find|locate|pinpoint|where is|where does|passage|quote|quotation|phrase|footnote|remember|exists|unable to find)\b/i.test(text)
  );
}

function looksLikeReferenceSweep(query) {
  return /\b(all|every|everywhere|references|occurrences|instances|places|catalogue|catalog|list)\b.{0,80}\b(reference|references|occurrence|occurrences|instance|instances|passage|passages|mentions|places)\b/i.test(String(query ?? ""));
}

function looksLikeDeepResearch(query) {
  return /\b(deep|deeper|comprehensive|exhaustive|long-form|long form|essay|full treatment|deep dive|thorough)\b/i.test(String(query ?? ""));
}

function shouldBlendConversationContext(effectiveMode, messages) {
  if (!Array.isArray(messages) || messages.length <= 1) return false;
  return effectiveMode !== "find-passage";
}

function latestQueryBoost(effectiveMode) {
  if (effectiveMode === "find-passage") return 55;
  if (effectiveMode === "find-references") return 20;
  return 28;
}

function extractQuotedPhrases(text) {
  const value = String(text ?? "");
  const phrases = [];
  const patterns = [
    /"([^"]{4,600})"/g,
    /“([^”]{4,600})”/g,
    /`([^`]{4,600})`/g
  ];

  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      const phrase = match[1]?.replace(/\s+/g, " ").trim();
      if (phrase && !phrases.includes(phrase)) phrases.push(phrase);
    }
  }
  return phrases;
}

function researchModeLabel(mode) {
  switch (normalizeResearchMode(mode)) {
    case "find-passage":
      return "Find a passage";
    case "find-references":
      return "Find all references";
    case "synthesis":
      return "Synthesis";
    case "deep-research":
      return "Deep research";
    default:
      return "Standard mode";
  }
}

function modeInstruction(mode) {
  switch (normalizeResearchMode(mode)) {
    case "find-passage":
      return [
        "Mode instruction: Find a passage.",
        "Prioritize pinpointing likely locations over broad analysis. If a quoted or paraphrased passage is found, lead with the strongest passage IDs, confidence, and the exact nearby Taylor wording. Mention important variant wording, such as Greek/Latin deity names versus Taylor's English or Romanized names. Keep commentary brief."
      ].join(" ");
    case "find-references":
      return [
        "Mode instruction: Find all references.",
        "Prioritize a broad, ranked reference map over essay-style interpretation. Group references by work or theme when helpful. If the subject is extremely numerous, say that the list is prioritized rather than exhaustive, and explain the narrowing principle."
      ].join(" ");
    case "deep-research":
      return [
        "Mode instruction: Deep research.",
        "Produce a long-form, carefully structured essay grounded in the corpus. Use extensive citations, distinguish stronger from weaker evidence, and include a final list of further passages to inspect."
      ].join(" ");
    case "synthesis":
      return [
        "Mode instruction: Synthesis.",
        "Give a medium-length treatment of the subject, drawing together the strongest corpus evidence and ending with key references for further reading."
      ].join(" ");
    default:
      return [
        "Mode instruction: Standard mode.",
        "Infer the user's research need from the inquiry and answer in the most useful form."
      ].join(" ");
  }
}

async function answerInquiry({
  query,
  messages,
  results,
  externalAllowed,
  apiKey,
  selectedFiles,
  researchMode,
  effectiveMode,
  retrievalSummary,
  promptOptions
}) {
  const profile = promptOptions ?? retrievalProfiles[effectiveMode] ?? retrievalProfiles.synthesis;
  const sourceLinks = sourceLinksForResults(results);
  const originalLookupMatches = originalLanguageRequested(query)
    ? lookupSourcePhrase({ selectedText: query, limit: 8 })
    : [];

  if (!apiKey) {
    const localAnswer = composeLocalAnswer(query, results);
    return {
      answer: originalLookupMatches.length
        ? `${formatLookupMatchesForLocalAnswer(originalLookupMatches)}\n\n${localAnswer}`
        : localAnswer,
      sources: publicSources(results),
      sourceLinks,
      usedAI: false,
      usedWeb: false,
      researchMode,
      effectiveMode,
      sourceDisplayLimit: profile.sourceDisplayLimit,
      model
    };
  }

  const prompt = [
    `Current inquiry: ${query}`,
    `Corpus scope: ${describeScope(selectedFiles)}.`,
    `Requested research mode: ${researchModeLabel(researchMode)}.`,
    `Effective research mode for this turn: ${researchModeLabel(effectiveMode)}.`,
    `External web permission: ${externalAllowed ? "granted" : "not granted"}.`,
    retrievalSummary ? `Retrieval summary: ${retrievalSummary}` : "",
    "",
    "Retrieved Thomas Taylor corpus passages:",
    formatSourcesForPrompt(results, { maxSources: profile.promptSources, maxChars: profile.promptChars }),
    "",
    originalLookupMatches.length
      ? [
          "Original-language phrase lookup requested by the user:",
          formatLookupMatchesForPrompt(originalLookupMatches)
        ].join("\n")
      : "Original-language phrase lookup was not requested for this turn.",
    "",
    "Conversation so far:",
    formatConversation(messages, { limit: 8, maxChars: 1600 }),
    "",
    modeInstruction(effectiveMode),
    "Answer the current inquiry as a rigorous but conversational research partner. Start with Taylor's corpus, synthesize the theme across works, include short Taylor excerpts where useful, and cite corpus passages with [[source:PASSAGE_ID]]. Do not introduce Greek or Latin unless the current user inquiry explicitly asks about the original wording, translation, or interpretation of a selected phrase. When original-language phrase lookup matches are supplied, keep them subordinate to the Taylor discussion and state confidence clearly. If web access is granted, use it only to enrich or contrast the corpus reading, and keep web citations visible.",
    "Return one complete answer. Do not stop mid-sentence. If the inquiry is broad, give a complete high-level synthesis and propose narrower follow-up paths rather than trying to exhaust every detail."
  ].filter(Boolean).join("\n");

  const ai = await callOpenAI({
    prompt,
    externalAllowed,
    apiKey,
    maxOutputTokens: profile.outputTokens
  });

  return {
    answer: ai.text,
    sources: publicSources(results),
    sourceLinks,
    webSources: ai.webSources,
    usedAI: true,
    usedWeb: externalAllowed,
    researchMode,
    effectiveMode,
    sourceDisplayLimit: profile.sourceDisplayLimit,
    model
  };
}

async function callOpenAI({ prompt, externalAllowed, apiKey, maxOutputTokens }) {
  let payload = createOpenAIPayload({
    prompt,
    externalAllowed,
    effort: reasoningEffort,
    maxOutputTokens
  });

  let data = await sendOpenAIRequest(payload, apiKey);
  let text = extractOutputText(data);
  let incomplete = isIncompleteResponse(data);

  if (!text || incomplete) {
    await logUsage("AI response retry", {
      message: `First response was ${incomplete ? "incomplete" : "empty"}${incompleteReason(data) ? ` (${incompleteReason(data)})` : ""}. Retrying with a larger visible-output budget and lower reasoning effort.`
    });

    payload = createOpenAIPayload({
      prompt: [
        prompt,
        "",
        "Important: a previous attempt did not produce a complete visible answer. Produce the final answer now, in complete sentences, with source citations. Keep it bounded, but do not omit the answer."
      ].join("\n"),
      externalAllowed,
      effort: "low",
      maxOutputTokens: retryMaxOutputTokens
    });
    data = await sendOpenAIRequest(payload, apiKey);
    text = extractOutputText(data);
    incomplete = isIncompleteResponse(data);
  }

  if (!text) {
    throw new Error(
      `OpenAI returned no visible response text${incompleteReason(data) ? ` (${incompleteReason(data)})` : ""}.`
    );
  }

  if (incomplete) {
    text = `${trimToCompleteSentence(text)}\n\n[The model reached its response limit even after retrying. Try a narrower corpus scope or a more specific follow-up for more detail.]`;
  }

  return {
    text,
    webSources: extractWebSources(data)
  };
}

async function inferOriginalPhrase({ selectedText, passage, externalAllowed, apiKey }) {
  const sourceWork = getSourceWorkForTaylorFile(passage?.file);
  const prompt = [
    "The user highlighted a phrase from Thomas Taylor and asked to see the likely original Greek or Latin behind it.",
    "",
    `Highlighted Taylor wording: "${clipText(selectedText, 500)}"`,
    passage
      ? [
          `Taylor passage id: ${passage.id}`,
          `Taylor work: ${passage.title}`,
          `Section: ${passage.section}`,
          `File: ${passage.file}`,
          `Known source work for this file: ${sourceWork ? `${sourceWork.sourceTitle} (${sourceWork.language})` : "not configured"}`,
          `Surrounding Taylor passage: """${clipText(passage.text, 2400)}"""`
        ].join("\n")
      : "No reliable passage context was available.",
    "",
    externalAllowed
      ? "External source search is permitted. Prefer public source editions such as Scaife, Perseus, OpenGreekAndLatin, Internet Archive, or archive.org scans when possible."
      : "External source search is not permitted. Use only the supplied Taylor context and your internal linguistic knowledge, and lower confidence when exact verification is not possible.",
    "",
    "Return only a JSON object with these keys:",
    "language: Greek, Latin, or Unknown.",
    "sourceText: the shortest likely original phrase, or an empty string if you cannot responsibly infer it.",
    "sourceWork: the ancient/source work if identifiable.",
    "sourceRef: book/section/chapter/line reference if identifiable, otherwise a concise uncertainty note.",
    "sourceUrl: a URL only if externally verified or directly known; otherwise an empty string.",
    "confidence: high, medium, low, or unknown.",
    "explanation: one or two sentences explaining why this is the best estimate and what is uncertain.",
    "",
    "Do not hallucinate precision. Prefer 'low' or 'unknown' confidence when the source phrase is only inferred."
  ].join("\n");

  const payload = createOpenAIPayload({
    prompt,
    externalAllowed,
    effort: externalAllowed ? "medium" : "low",
    maxOutputTokens: 2200
  });
  payload.instructions = [
    "You are assisting a Thomas Taylor close-reading tool.",
    "Estimate the original Greek or Latin only when evidence supports it.",
    "Return only valid JSON. Do not wrap it in Markdown."
  ].join("\n");

  const data = await sendOpenAIRequest(payload, apiKey);
  const text = extractOutputText(data);
  const parsed = parseJsonObject(text);
  if (!parsed || !String(parsed.sourceText ?? "").trim()) return null;

  const language = cleanSourceLanguage(parsed.language);
  const confidence = cleanConfidence(parsed.confidence);
  return {
    id: "ai-source-estimate",
    lookupType: "ai-estimate",
    passageId: passage?.id ?? "",
    taylorText: selectedText,
    sourceText: String(parsed.sourceText).trim().slice(0, 1200),
    confidence,
    matchConfidence: confidence,
    sourceRef: String(parsed.sourceRef ?? "Unverified estimate").trim().slice(0, 240) || "Unverified estimate",
    sourceUrl: validHttpUrl(parsed.sourceUrl) ? String(parsed.sourceUrl).trim() : "",
    note: String(parsed.explanation ?? "").trim().slice(0, 900) || "AI-generated best estimate; verify against a critical source edition before relying on it.",
    sourceEdition: {
      workTitle: String(parsed.sourceWork ?? sourceWork?.sourceTitle ?? passage?.title ?? "Source work").trim().slice(0, 160),
      sourceLanguage: language
    },
    searchMethod: externalAllowed ? "AI estimate with external search allowed" : "AI estimate from Taylor context only"
  };
}

function createOpenAIPayload({ prompt, externalAllowed, effort, maxOutputTokens }) {
  const payload = {
    model,
    instructions: [
      "You are Thomas Taylor Research Partner, an intellectually serious conversational assistant for close study of Thomas Taylor's translations, notes, and related Platonist material.",
      "Treat the supplied corpus excerpts as the primary evidence. Do not invent corpus claims beyond the excerpts.",
      "Distinguish Taylor's editorial voice from the ancient authors he translates when the passage makes that clear.",
      "Use clear, clickable corpus citations in this exact format: [[source:PASSAGE_ID]].",
      "When external web search is unavailable, stay inside the corpus and say what outside context could add only when relevant.",
      "Always return a visible answer. Prefer a complete bounded synthesis over an overlong answer that exhausts the response budget.",
      outputGuidelines ? `Follow these project output guidelines unless the user explicitly asks otherwise:\n${outputGuidelines}` : ""
    ].filter(Boolean).join("\n"),
    input: prompt,
    reasoning: { effort },
    max_output_tokens: maxOutputTokens
  };

  if (externalAllowed) {
    payload.tools = [
      {
        type: "web_search",
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          country: "GB",
          timezone: "Europe/London"
        }
      }
    ];
    payload.tool_choice = "auto";
    payload.include = ["web_search_call.action.sources"];
  }

  return payload;
}

async function sendOpenAIRequest(payload, apiKey) {
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    throw new Error(`OpenAI API request failed (${apiResponse.status}): ${detail}`);
  }

  return apiResponse.json();
}

function getRequestApiKey(request) {
  const header = request.headers["x-openai-api-key"];
  const requestKey = Array.isArray(header) ? header[0] : header;
  return (process.env.OPENAI_API_KEY || (allowClientApiKeys ? requestKey : "") || "").trim();
}

async function getAuthContext(request) {
  if (!authRequired) return { user: null, token: "" };
  const authHeader = request.headers.authorization || "";
  const token = String(Array.isArray(authHeader) ? authHeader[0] : authHeader)
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token || !supabaseReady) return { user: null, token: "" };

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) return { user: null, token: "" };
    const user = await response.json();
    return {
      user: {
        id: String(user.id ?? ""),
        email: String(user.email ?? "")
      },
      token
    };
  } catch {
    return { user: null, token: "" };
  }
}

function parseJsonObject(text) {
  const value = String(text ?? "").trim();
  if (!value) return null;
  const candidates = [
    value,
    value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()
  ];
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(value.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      // Try the next plausible JSON slice.
    }
  }
  return null;
}

function cleanSourceLanguage(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("latin")) return "Latin";
  if (normalized.includes("greek")) return "Greek";
  return "Unknown";
}

function cleanConfidence(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return "unknown";
}

function validHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSelectedFiles(files) {
  if (!Array.isArray(files)) return [];
  const known = new Set(corpusIndex.documents.map((document) => document.file));
  return [...new Set(files.map(String))].filter((file) => known.has(file));
}

function describeScope(selectedFiles = []) {
  if (!selectedFiles.length) return "whole corpus";
  const titles = selectedFiles.map((file) => {
    const document = corpusIndex.documents.find((item) => item.file === file);
    return document?.title ?? file;
  });
  return `${titles.length} selected work${titles.length === 1 ? "" : "s"}: ${titles.join("; ")}`;
}

function originalLanguageRequested(text) {
  return /\b(greek|latin|original|source\s+wording|underlying|translated|translation|rendering|phrase|word)\b/i.test(text);
}

function formatLookupMatchesForPrompt(matches) {
  if (!matches.length) return "No phrase-level original-language match was found in the pilot.";
  return matches
    .map((match, index) => {
      const edition = match.sourceEdition ?? {};
      return [
        `Phrase match ${index + 1}:`,
        `Taylor wording: "${match.taylorText}"`,
        `${edition.sourceLanguage ?? "Source"}: "${match.sourceText}"`,
        `Source edition: ${edition.workTitle ?? "unknown edition"}`,
        `Source reference: ${match.sourceRef}`,
        `Confidence: ${match.matchConfidence ?? match.confidence}`,
        `Note: ${match.note}`,
        `Taylor passage: [[source:${match.passageId}]]`
      ].join("\n");
    })
    .join("\n\n");
}

function formatLookupMatchesForLocalAnswer(matches) {
  const lines = matches.slice(0, 4).map((match) => {
    const language = match.sourceEdition?.sourceLanguage ?? "Source";
    return `- "${match.taylorText}" likely reflects ${language}: "${match.sourceText}" (${match.matchConfidence ?? match.confidence} confidence) [[source:${match.passageId}]]`;
  });
  return [
    "Original-language phrase lookup:",
    lines.join("\n")
  ].join("\n\n");
}

function useSupabaseStorage(user) {
  return supabaseReady && Boolean(user?.id);
}

async function supabaseRest(pathAndQuery, options = {}) {
  const url = `${supabaseUrl}/rest/v1/${pathAndQuery}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

async function logUsage(event, details = {}, user = null) {
  try {
    if (useSupabaseStorage(user)) {
      await supabaseRest("taylor_usage_log", {
        method: "POST",
        body: {
          user_id: user.id,
          event,
          details,
          comment: usageComment(event, details),
          improvement_thought: improvementThought(event, details)
        },
        prefer: "return=minimal"
      });
      return;
    }

    await fs.mkdir(paths.cacheDir, { recursive: true });
    await fs.appendFile(usageLogPath, formatUsageEntry(event, details));
  } catch (error) {
    console.warn("Could not write usage log:", error);
  }
}

async function saveAccessRequest(body) {
  if (!accessRequestsEnabled || !supabaseReady) {
    return {
      status: 503,
      payload: { error: "Access requests are not configured yet." }
    };
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return {
      status: 400,
      payload: { error: "Enter a complete email address." }
    };
  }

  const existing = await supabaseRest(
    `taylor_access_requests?select=id,status&email=eq.${encodeURIComponent(email)}&limit=1`
  );
  if (existing.length) {
    return {
      status: 200,
      payload: {
        ok: true,
        message: "Your access request is already on the review list."
      }
    };
  }

  await supabaseRest("taylor_access_requests", {
    method: "POST",
    body: {
      email,
      name: cleanShortText(body.name, 120),
      note: cleanShortText(body.note, 1000),
      status: "pending"
    },
    prefer: "return=minimal"
  });

  return {
    status: 200,
    payload: {
      ok: true,
      message: "Access request received."
    }
  };
}

function formatUsageEntry(event, details) {
  const lines = [
    `## ${new Date().toISOString()} - ${event}`,
    "",
    `Comment: ${usageComment(event, details)}`,
    `Improvement thought: ${improvementThought(event, details)}`
  ];

  if (details.query) lines.push(`Query: ${JSON.stringify(details.query)}`);
  if (details.title) lines.push(`Investigation: ${details.title}`);
  if (details.researchMode) lines.push(`Mode: ${researchModeLabel(details.researchMode)}`);
  if (details.effectiveMode && details.effectiveMode !== details.researchMode) {
    lines.push(`Effective mode: ${researchModeLabel(details.effectiveMode)}`);
  }
  if (details.selectedFiles) lines.push(`Scope: ${describeScope(details.selectedFiles)}`);
  if (typeof details.messageCount === "number") lines.push(`Conversation length: ${details.messageCount} messages`);
  if (typeof details.resultCount === "number") lines.push(`Retrieved passages: ${details.resultCount}`);
  if (typeof details.usedAI === "boolean") lines.push(`AI synthesis: ${details.usedAI ? "active" : "local search only"}`);
  if (typeof details.usedWeb === "boolean") lines.push(`External web: ${details.usedWeb ? "used or available" : "off"}`);
  if (details.message) lines.push(`Detail: ${details.message}`);

  return `${lines.join("\n")}\n\n`;
}

function usageComment(event, details) {
  if (event.includes("saved")) return "The user is preserving a line of inquiry for later continuation.";
  if (event.includes("loaded")) return "The user is returning to prior work rather than starting from scratch.";
  if (event.includes("summary")) return "The user is turning an exploratory exchange into a reusable research note.";
  if (event.includes("scope")) return "The user is shaping the corpus boundary before asking the model to reason.";
  if (details.query) return "The user is probing the Taylor corpus with a thematic or textual inquiry.";
  return "The app recorded a maintenance or navigation event.";
}

function improvementThought(event, details) {
  if (details.resultCount === 0) return "Consider adding richer synonym expansion or an AI-assisted query planner for sparse searches.";
  if (details.selectedFiles?.length) return "Scoped work is useful; a future enhancement could save named corpus subsets.";
  if (details.messageCount > 12) return "Long investigations may benefit from an automatically maintained research brief as memory.";
  if (details.usedWeb) return "External enrichment may need clearer source comparison and separation from Taylor corpus evidence.";
  if (event.includes("saved")) return "Saved investigations could later support tags, annotations, and export formats.";
  return "Continue watching for repeated patterns in queries and missed source cards.";
}

async function listSessions(user = null) {
  if (useSupabaseStorage(user)) {
    const rows = await supabaseRest(
      `taylor_sessions?select=id,title,created_at,updated_at,selected_files,allow_web,messages&user_id=eq.${encodeURIComponent(user.id)}&order=updated_at.desc`
    );
    return rows.map(dbSessionMetadata);
  }

  try {
    await fs.mkdir(sessionsDir, { recursive: true });
    const files = await fs.readdir(sessionsDir);
    const sessions = [];
    for (const file of files.filter((name) => name.endsWith(".json"))) {
      try {
        const session = JSON.parse(await fs.readFile(path.join(sessionsDir, file), "utf8"));
        sessions.push(sessionMetadata(session));
      } catch {
        // Ignore unreadable session files.
      }
    }
    return sessions.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  } catch {
    return [];
  }
}

async function saveSession(body, user = null) {
  const now = new Date().toISOString();
  const messages = Array.isArray(body.messages) ? sanitizeMessages(body.messages) : [];
  const selectedFiles = normalizeSelectedFiles(body.selectedFiles);
  const existingId = safeSessionId(body.id);
  const session = {
    id: existingId || createSessionId(),
    title: cleanSessionTitle(body.title, messages),
    createdAt: body.createdAt || now,
    updatedAt: now,
    selectedFiles,
    researchMode: normalizeResearchMode(body.researchMode),
    allowWeb: Boolean(body.allowWeb),
    messages
  };

  if (useSupabaseStorage(user)) {
    const rows = await supabaseRest("taylor_sessions?on_conflict=id", {
      method: "POST",
      body: {
        id: session.id,
        user_id: user.id,
        title: session.title,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        selected_files: selectedFiles,
        allow_web: session.allowWeb,
        messages
      },
      prefer: "resolution=merge-duplicates,return=representation"
    });
    return dbSessionToPublic(rows[0] ?? { ...session, user_id: user.id });
  }

  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(sessionPath(session.id), JSON.stringify(session, null, 2));
  return session;
}

async function readSession(id, user = null) {
  const safeId = safeSessionId(id);
  if (!safeId) return null;

  if (useSupabaseStorage(user)) {
    const rows = await supabaseRest(
      `taylor_sessions?select=id,title,created_at,updated_at,selected_files,allow_web,messages&user_id=eq.${encodeURIComponent(user.id)}&id=eq.${encodeURIComponent(safeId)}&limit=1`
    );
    return rows[0] ? dbSessionToPublic(rows[0]) : null;
  }

  try {
    return JSON.parse(await fs.readFile(sessionPath(safeId), "utf8"));
  } catch {
    return null;
  }
}

function sessionMetadata(session) {
  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    selectedFiles: session.selectedFiles ?? [],
    researchMode: session.researchMode ?? "standard",
    messageCount: Array.isArray(session.messages) ? session.messages.length : 0
  };
}

function dbSessionMetadata(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    selectedFiles: row.selected_files ?? [],
    researchMode: row.research_mode ?? "standard",
    messageCount: Array.isArray(row.messages) ? row.messages.length : 0
  };
}

function dbSessionToPublic(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    selectedFiles: row.selected_files ?? row.selectedFiles ?? [],
    researchMode: row.research_mode ?? row.researchMode ?? "standard",
    allowWeb: Boolean(row.allow_web ?? row.allowWeb),
    messages: Array.isArray(row.messages) ? row.messages : []
  };
}

function createSessionId() {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `${stamp}-${crypto.randomUUID().slice(0, 8)}`;
}

function cleanSessionTitle(title, messages) {
  const provided = String(title ?? "").trim();
  if (provided) return provided.slice(0, 90);
  const firstUser = messages.find((message) => message.role === "user")?.content ?? "Taylor investigation";
  return firstUser.replace(/\s+/g, " ").slice(0, 90);
}

function safeSessionId(id) {
  const value = String(id ?? "").trim();
  return /^[a-z0-9-]{10,80}$/i.test(value) ? value : "";
}

function sessionPath(id) {
  return path.join(sessionsDir, `${id}.json`);
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const parts = [];
  for (const item of data.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n\n").trim();
}

function extractWebSources(data) {
  const sources = [];
  const seen = new Set();

  for (const item of data.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      if (!source.url || seen.has(source.url)) continue;
      seen.add(source.url);
      sources.push({
        title: source.title ?? source.url,
        url: source.url
      });
    }

    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation" || !annotation.url || seen.has(annotation.url)) continue;
        seen.add(annotation.url);
        sources.push({
          title: annotation.title ?? annotation.url,
          url: annotation.url
        });
      }
    }
  }

  return sources;
}

function publicSources(results) {
  return enrichSourcesWithSourceLinks(results.map(({ text, ...source }) => source));
}

function sanitizeMessages(messages) {
  return messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").slice(0, 12000)
    }))
    .filter((message) => message.content.trim());
}

function formatConversation(messages, options = {}) {
  const limit = options.limit ?? 8;
  const maxChars = options.maxChars ?? 1600;
  const omitted = Math.max(0, messages.length - limit);
  const recent = messages.slice(-limit).map((message) => {
    return `${message.role.toUpperCase()}: ${clipText(message.content, maxChars)}`;
  });

  if (omitted) {
    recent.unshift(
      `SYSTEM NOTE: ${omitted} earlier message${omitted === 1 ? " is" : "s are"} omitted from this model prompt to keep the investigation running reliably. The visible app transcript and saved exchange still retain the full conversation.`
    );
  }

  return recent.join("\n\n");
}

function clipText(text, maxChars) {
  const value = String(text ?? "");
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars).trim()}...`;
}

function isIncompleteResponse(data) {
  if (data?.status === "incomplete") return true;
  if (data?.incomplete_details) return true;
  return (data?.output ?? []).some((item) => item.status === "incomplete");
}

function incompleteReason(data) {
  return (
    data?.incomplete_details?.reason ??
    (data?.output ?? []).find((item) => item.status === "incomplete")?.incomplete_details?.reason ??
    ""
  );
}

function trimToCompleteSentence(text) {
  const trimmed = String(text ?? "").trim();
  const lastStop = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf("?"),
    trimmed.lastIndexOf("!")
  );
  if (lastStop > Math.max(80, trimmed.length * 0.65)) return trimmed.slice(0, lastStop + 1);
  return trimmed;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 254) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanShortText(value, maxLength) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isPublicSupabaseClientKey(value) {
  const key = String(value ?? "").trim();
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  if (key.startsWith("sb_secret_")) return false;

  const [, payload] = key.split(".");
  if (!payload) return false;
  try {
    const decoded = JSON.parse(Buffer.from(base64UrlToBase64(payload), "base64").toString("utf8"));
    return decoded.role === "anon";
  } catch {
    return false;
  }
}

function base64UrlToBase64(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
}

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function serveStatic(urlPath, response) {
  const routeAliases = {
    "/signin": "/signin.html",
    "/request-access": "/request-access.html"
  };
  const safePath = routeAliases[urlPath] ?? (urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath));
  const filePath = path.normalize(path.join(publicDir, safePath));
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": "no-store"
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function loadOutputGuidelines(filePath) {
  try {
    return (await fs.readFile(filePath, "utf8")).trim();
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Could not read output guidelines:", error);
    }
    return "";
  }
}

async function loadDotEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (process.env[key]) continue;
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env is optional.
  }
}
