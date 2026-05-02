const state = {
  messages: [],
  sources: new Map(),
  busy: false,
  status: null,
  apiKey: localStorage.getItem("taylor-openai-key") ?? "",
  selectedFiles: new Set(),
  sessions: [],
  activeSessionId: "",
  auth: {
    required: false,
    ready: false,
    user: null,
    session: null,
    accessToken: "",
    redirectUrl: ""
  },
  supabase: null,
  lookupContext: null,
  currentLookup: null,
  currentReader: {
    passage: null,
    sourceLinks: [],
    selectedText: ""
  }
};

const elements = {
  statusGrid: document.querySelector("#statusGrid"),
  documentList: document.querySelector("#documentList"),
  queryInput: document.querySelector("#queryInput"),
  allowWeb: document.querySelector("#allowWeb"),
  askButton: document.querySelector("#askButton"),
  reindexButton: document.querySelector("#reindexButton"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  keyPanel: document.querySelector("#keyPanel"),
  saveKeyButton: document.querySelector("#saveKeyButton"),
  clearKeyButton: document.querySelector("#clearKeyButton"),
  authPanel: document.querySelector("#authPanel"),
  authEmailInput: document.querySelector("#authEmailInput"),
  signInButton: document.querySelector("#signInButton"),
  signOutButton: document.querySelector("#signOutButton"),
  authStatus: document.querySelector("#authStatus"),
  sessionSelect: document.querySelector("#sessionSelect"),
  sessionTitleInput: document.querySelector("#sessionTitleInput"),
  saveSessionButton: document.querySelector("#saveSessionButton"),
  loadSessionButton: document.querySelector("#loadSessionButton"),
  newExchangeButton: document.querySelector("#newExchangeButton"),
  clearScopeButton: document.querySelector("#clearScopeButton"),
  conversation: document.querySelector("#conversation"),
  sourceDock: document.querySelector("#sourceDock"),
  readerPanel: document.querySelector("#readerPanel")
};

const lookupPopover = document.createElement("div");
lookupPopover.className = "selection-lookup-popover";
lookupPopover.hidden = true;
lookupPopover.innerHTML = `<button type="button">Show original</button>`;
document.body.append(lookupPopover);

elements.apiKeyInput.value = state.apiKey;
await bootstrapAuth();
if (canUseApp()) {
  await refreshStatus();
  await refreshSessions();
} else {
  renderSignedOut();
}

elements.askButton.addEventListener("click", () => submitInquiry());
elements.reindexButton.addEventListener("click", () => refreshCorpus());
elements.saveKeyButton.addEventListener("click", () => saveApiKey());
elements.clearKeyButton.addEventListener("click", () => clearApiKey());
elements.signInButton.addEventListener("click", () => sendSignInLink());
elements.signOutButton.addEventListener("click", () => signOut());
elements.saveSessionButton.addEventListener("click", () => saveSession());
elements.loadSessionButton.addEventListener("click", () => loadSession());
elements.newExchangeButton.addEventListener("click", () => newExchange());
elements.clearScopeButton.addEventListener("click", () => clearScope());
elements.documentList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-file]");
  if (row) toggleDocument(row.dataset.file);
});
elements.queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    submitInquiry();
  }
});
lookupPopover.querySelector("button").addEventListener("mousedown", (event) => {
  event.preventDefault();
  runSelectionLookup();
});

document.addEventListener("click", (event) => {
  const citation = event.target.closest("[data-source-id]");
  if (citation) {
    loadPassage(citation.dataset.sourceId, {
      focusSourcePanel: citation.hasAttribute("data-focus-source")
    });
  }
});
document.addEventListener("mouseup", () => window.setTimeout(refreshSelectionLookup, 0));
document.addEventListener("keyup", () => window.setTimeout(refreshSelectionLookup, 0));
document.addEventListener("scroll", hideLookupPopover, true);

async function bootstrapAuth() {
  const config = await getJson("/api/auth/config");
  state.auth.required = Boolean(config.authRequired);
  state.auth.ready = true;
  state.auth.redirectUrl = config.appUrl || window.location.origin;

  if (!state.auth.required) {
    renderAuthState();
    return;
  }

  if (!config.supabaseReady || config.configError) {
    elements.authPanel.hidden = false;
    elements.authStatus.textContent = config.configError || "Authentication is not configured correctly.";
    renderSignedOut();
    return;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  });

  const { data } = await state.supabase.auth.getSession();
  setAuthSession(data.session ?? null);
  state.supabase.auth.onAuthStateChange((_event, session) => {
    const wasSignedOut = !state.auth.user;
    setAuthSession(session);
    renderAuthState();
    if (wasSignedOut && session) initializeAuthenticatedApp();
  });
  renderAuthState();
}

function setAuthSession(session) {
  state.auth.session = session;
  state.auth.user = session?.user ?? null;
  state.auth.accessToken = session?.access_token ?? "";
}

function canUseApp() {
  return !state.auth.required || Boolean(state.auth.user);
}

async function initializeAuthenticatedApp() {
  await refreshStatus();
  await refreshSessions();
  renderAuthState();
}

function renderSignedOut() {
  if (state.auth.required && !state.auth.user && !isSignInPage()) {
    window.location.replace("/signin");
    return;
  }

  elements.statusGrid.innerHTML = `
    <div>
      <dt>Corpus</dt>
      <dd>Sign in to begin</dd>
    </div>
  `;
  elements.documentList.innerHTML = "";
  elements.sourceDock.innerHTML = "";
  elements.readerPanel.innerHTML = `<div class="reader-empty"><p>Select a passage.</p></div>`;
  elements.conversation.innerHTML = `<div class="empty-state"><p>Sign in to continue.</p></div>`;
  setButtons(false);
  elements.askButton.disabled = true;
}

function renderAuthState() {
  elements.authPanel.hidden = !state.auth.required;
  if (!state.auth.required) return;

  const email = state.auth.user?.email ?? "";
  elements.signOutButton.hidden = !state.auth.user;
  elements.authEmailInput.hidden = Boolean(state.auth.user);
  elements.signInButton.hidden = Boolean(state.auth.user);
  elements.authStatus.textContent = state.auth.user ? `Signed in as ${email}` : "Use your invited email address.";
}

async function sendSignInLink() {
  if (!state.supabase) return;
  const email = elements.authEmailInput.value.trim();
  if (!isLikelyEmail(email)) {
    elements.authStatus.textContent = "Enter your complete invited email address.";
    return;
  }

  elements.signInButton.disabled = true;
  elements.authStatus.textContent = "Sending sign-in link...";
  try {
    const { error } = await state.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: state.auth.redirectUrl || window.location.origin
      }
    });
    if (error) throw error;
    elements.authStatus.textContent = "Check your email for a sign-in link.";
  } catch (error) {
    elements.authStatus.textContent = friendlyAuthError(error);
  } finally {
    elements.signInButton.disabled = false;
  }
}

async function signOut() {
  if (state.supabase) await state.supabase.auth.signOut();
  setAuthSession(null);
  newExchange();
  renderSignedOut();
  renderAuthState();
  if (state.auth.required) window.location.assign("/signin");
}

async function submitInquiry() {
  const query = elements.queryInput.value.trim();
  if (!query || state.busy || !canUseApp()) return;

  elements.queryInput.value = "";
  state.messages.push({ role: "user", content: query });
  renderMessage("user", query);
  const pending = renderThinkingMessage("Searching and composing a complete answer");

  state.busy = true;
  setButtons(false);
  try {
    const result = await postJson("/api/chat", {
      messages: messagesForRequest(),
      allowWeb: elements.allowWeb.checked,
      selectedFiles: selectedFilesArray()
    });
    pending.remove();
    state.messages.push({ role: "assistant", content: result.answer });
    renderMessage("assistant", result.answer);
    renderSources(result.sources ?? [], result.webSources ?? []);
    noteModelState(result);
  } catch (error) {
    pending.remove();
    renderMessage("assistant", `I hit a problem: ${error.message}`);
  } finally {
    state.busy = false;
    setButtons(true);
  }
}

async function refreshCorpus() {
  if (state.busy) return;
  state.busy = true;
  setButtons(false);
  elements.reindexButton.textContent = "Refreshing...";
  try {
    await postJson("/api/reindex", {});
    await refreshStatus();
    renderMessage("assistant", "The corpus index has been refreshed.");
  } catch (error) {
    renderMessage("assistant", `I could not refresh the corpus: ${error.message}`);
  } finally {
    state.busy = false;
    setButtons(true);
    elements.reindexButton.textContent = "Refresh corpus";
  }
}

async function refreshStatus() {
  const status = await getJson("/api/status");
  state.status = status;
  applyServerMode(status);
  renderStatus();
  renderDocumentList();
}

function applyServerMode(status) {
  elements.keyPanel.hidden = !status.allowClientApiKeys;
  elements.reindexButton.hidden = !status.canReindex;
}

function renderStatus() {
  const status = state.status;
  if (!status) return;
  elements.statusGrid.innerHTML = `
    <div>
      <dt>Corpus</dt>
      <dd>${status.documentCount} works, ${status.passageCount} passages</dd>
    </div>
    <div>
      <dt>Scope</dt>
      <dd>${escapeHtml(scopeText())}</dd>
    </div>
  `;
}

function renderDocumentList() {
  const status = state.status;
  if (!status) return;
  elements.documentList.innerHTML = status.documents
    .map(
      (doc) => `
        <button class="doc-row ${state.selectedFiles.has(doc.file) ? "selected" : ""}" type="button" data-file="${escapeAttribute(doc.file)}" title="${escapeHtml(doc.file)}">
          ${escapeHtml(doc.title)}
        </button>
      `
    )
    .join("");
}

function toggleDocument(file) {
  if (state.selectedFiles.has(file)) {
    state.selectedFiles.delete(file);
  } else {
    state.selectedFiles.add(file);
  }
  renderStatus();
  renderDocumentList();
  logClientEvent("Corpus scope changed", { selectedFiles: selectedFilesArray() });
}

function clearScope() {
  state.selectedFiles.clear();
  renderStatus();
  renderDocumentList();
  logClientEvent("Corpus scope changed", { selectedFiles: [] });
}

function selectedFilesArray() {
  return [...state.selectedFiles];
}

function messagesForRequest() {
  const maxMessages = 14;
  if (state.messages.length <= maxMessages) return state.messages;

  const omitted = state.messages.length - maxMessages;
  return [
    {
      role: "assistant",
      content: `${omitted} earlier message${omitted === 1 ? " is" : "s are"} retained in the visible saved exchange but omitted from this request so the investigation can continue reliably. Use the recent exchange below as context.`
    },
    ...state.messages.slice(-maxMessages)
  ];
}

function scopeText() {
  const count = state.selectedFiles.size;
  if (!count) return "Whole corpus";
  return `${count} selected`;
}

function saveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  state.apiKey = key;
  if (key) {
    localStorage.setItem("taylor-openai-key", key);
    renderMessage("assistant", "AI synthesis is active for this browser.");
  } else {
    localStorage.removeItem("taylor-openai-key");
    renderMessage("assistant", "AI synthesis is paused.");
  }
  refreshStatus();
}

function clearApiKey() {
  state.apiKey = "";
  elements.apiKeyInput.value = "";
  localStorage.removeItem("taylor-openai-key");
  renderMessage("assistant", "The browser API key has been cleared.");
  refreshStatus();
}

async function refreshSessions() {
  try {
    const payload = await getJson("/api/sessions");
    state.sessions = payload.sessions ?? [];
    renderSessionSelect();
  } catch {
    state.sessions = [];
    renderSessionSelect();
  }
}

function renderSessionSelect() {
  const options = [
    `<option value="">Saved exchanges</option>`,
    ...state.sessions.map((session) => {
      const date = session.updatedAt ? new Date(session.updatedAt).toLocaleString() : "";
      return `<option value="${escapeAttribute(session.id)}">${escapeHtml(session.title)}${date ? ` · ${escapeHtml(date)}` : ""}</option>`;
    })
  ];
  elements.sessionSelect.innerHTML = options.join("");
  elements.sessionSelect.value = state.activeSessionId;
}

async function saveSession() {
  if (state.busy || state.messages.length === 0) {
    renderMessage("assistant", "There is no exchange to save yet.");
    return;
  }

  state.busy = true;
  setButtons(false);
  try {
    const session = await postJson("/api/sessions", {
      id: state.activeSessionId,
      title: elements.sessionTitleInput.value.trim(),
      messages: state.messages,
      selectedFiles: selectedFilesArray(),
      allowWeb: elements.allowWeb.checked
    });
    state.activeSessionId = session.id;
    elements.sessionTitleInput.value = session.title;
    await refreshSessions();
    renderMessage("assistant", `Saved: ${session.title}`);
  } catch (error) {
    renderMessage("assistant", `I could not save this exchange: ${error.message}`);
  } finally {
    state.busy = false;
    setButtons(true);
  }
}

async function loadSession() {
  const id = elements.sessionSelect.value;
  if (!id || state.busy) return;

  state.busy = true;
  setButtons(false);
  try {
    const session = await getJson(`/api/sessions/${encodeURIComponent(id)}`);
    state.activeSessionId = session.id;
    state.messages = session.messages ?? [];
    state.selectedFiles = new Set(session.selectedFiles ?? []);
    elements.allowWeb.checked = Boolean(session.allowWeb);
    elements.sessionTitleInput.value = session.title ?? "";
    elements.conversation.innerHTML = "";
    for (const message of state.messages) renderMessage(message.role, message.content);
    if (!state.messages.length) {
      elements.conversation.innerHTML = `<div class="empty-state"><p>Ready.</p></div>`;
    }
    renderStatus();
    renderDocumentList();
    renderSources([], []);
  } catch (error) {
    renderMessage("assistant", `I could not load that exchange: ${error.message}`);
  } finally {
    state.busy = false;
    setButtons(true);
  }
}

function newExchange() {
  state.messages = [];
  state.sources.clear();
  state.activeSessionId = "";
  state.lookupContext = null;
  state.currentLookup = null;
  state.currentReader = { passage: null, sourceLinks: [], selectedText: "" };
  elements.sessionSelect.value = "";
  elements.sessionTitleInput.value = "";
  elements.conversation.innerHTML = `<div class="empty-state"><p>Ready.</p></div>`;
  renderSources([], []);
  logClientEvent("New exchange started", { selectedFiles: selectedFilesArray() });
}

function renderMessage(role, content, loading = false) {
  const empty = elements.conversation.querySelector(".empty-state");
  if (empty) empty.remove();

  const node = document.createElement("article");
  node.className = `message ${role}`;
  node.innerHTML = `
    <div class="message-label">${role === "user" ? "You" : "Research Partner"}</div>
    <div class="message-body ${loading ? "loading" : ""}">${renderRichText(content)}</div>
  `;
  elements.conversation.append(node);
  elements.conversation.scrollTop = elements.conversation.scrollHeight;
  return node;
}

function renderThinkingMessage(label) {
  const node = renderMessage("assistant", "", true);
  node.querySelector(".message-body").innerHTML = thinkingMarkup(label);
  return node;
}

function thinkingMarkup(label) {
  return `
    <div class="thinking-row">
      <span class="thinking-orb" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
      <span class="thinking-dots" aria-hidden="true"><span></span><span></span><span></span></span>
    </div>
  `;
}

function renderSources(sources, webSources) {
  state.sources.clear();
  for (const source of sources) state.sources.set(source.id, source);

  const corpusCards = sources.slice(0, 10).map((source) => {
    return `
      <article class="source-card" id="card-${escapeAttribute(source.id)}">
        <h3>${escapeHtml(source.title)}</h3>
        <div class="source-meta">
          ${escapeHtml(source.section)} · ${escapeHtml(source.file)}
          ${source.sourceAlignmentCount ? ` · ${escapeHtml(source.sourceLanguages.join("/") || "Source")} phrase lookup` : ""}
        </div>
        <p class="source-excerpt" data-passage-id="${escapeAttribute(source.id)}">${escapeHtml(source.excerpt)}</p>
        <div class="source-actions">
          <button type="button" data-source-id="${escapeAttribute(source.id)}">Read passage</button>
          ${state.status?.localFileAccess ? `<button type="button" data-open-file="${escapeAttribute(source.id)}">Open file</button>` : ""}
        </div>
      </article>
    `;
  });

  const webCards = webSources.slice(0, 6).map((source) => {
    return `
      <article class="source-card">
        <h3>${escapeHtml(source.title)}</h3>
        <div class="source-meta">External source</div>
        <p class="source-excerpt">
          <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.url)}</a>
        </p>
      </article>
    `;
  });

  elements.sourceDock.innerHTML = [...corpusCards, ...webCards].join("");

  elements.sourceDock.querySelectorAll("[data-open-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.textContent = "Opening...";
      try {
        await postJson("/api/open-file", { id: button.dataset.openFile });
        button.textContent = "Opened";
      } catch {
        button.textContent = "Could not open";
      }
      setTimeout(() => {
        button.textContent = "Open file";
      }, 1200);
    });
  });
}

async function loadPassage(id, options = {}) {
  const [passage, sourcePayload] = await Promise.all([
    getJson(`/api/passage/${encodeURIComponent(id)}`),
    getJson(`/api/source-links/${encodeURIComponent(id)}`)
  ]);
  const sourceLinks = sourcePayload.sourceLinks ?? [];
  state.currentReader = {
    passage,
    sourceLinks,
    selectedText: ""
  };

  elements.readerPanel.innerHTML = `
    <div class="reader-title">
      <h2>${escapeHtml(passage.title)}</h2>
      <p>${escapeHtml(passage.section)} · ${escapeHtml(passage.file)}</p>
    </div>
    <div class="reader-actions">
      ${state.status?.localFileAccess ? `<button type="button" data-reader-open="${escapeAttribute(passage.id)}">Open Word file</button>` : ""}
      ${
        passage.previousId
          ? `<button type="button" data-source-id="${escapeAttribute(passage.previousId)}">Previous</button>`
          : ""
      }
      ${
        passage.nextId
          ? `<button type="button" data-source-id="${escapeAttribute(passage.nextId)}">Next</button>`
          : ""
      }
    </div>
    <div class="passage-text" data-reader-text>${escapeHtml(passage.text)}</div>
    <div class="source-link-panel" data-source-link-panel>
      ${renderSourceLinkPanel(sourceLinks)}
    </div>
  `;

  const openButton = elements.readerPanel.querySelector("[data-reader-open]");
  openButton?.addEventListener("click", async () => {
    await postJson("/api/open-file", { id });
  });

  const passageText = elements.readerPanel.querySelector("[data-reader-text]");
  passageText?.addEventListener("mouseup", rememberReaderSelection);
  passageText?.addEventListener("keyup", rememberReaderSelection);
  wireLookupDiscussionButtons();

  if (options.focusSourcePanel) {
    elements.readerPanel.querySelector("[data-source-link-panel]")?.scrollIntoView({
      block: "start",
      behavior: "smooth"
    });
  }
}

function rememberReaderSelection() {
  const passageText = elements.readerPanel.querySelector("[data-reader-text]");
  const selected = selectedTextInside(passageText);
  state.currentReader.selectedText = selected;
}

function renderSourceLinkPanel(sourceLinks) {
  if (!sourceLinks.length) {
    return `
      <div class="source-link-empty">
        <p>No original-language phrase lookup has been mapped for this Taylor passage yet.</p>
      </div>
    `;
  }

  const phraseCount = sourceLinks.reduce((total, link) => total + (link.phraseCount ?? 0), 0);
  const cards = sourceLinks.map((link) => {
    const edition = link.sourceEdition ?? {};
    return `
      <article class="source-link-card compact">
        <div class="source-link-head">
          <h3>${escapeHtml(link.title)}</h3>
          <span>${escapeHtml(link.phraseCount ?? 0)} phrases</span>
        </div>
        <div class="source-link-meta">
          ${escapeHtml(edition.sourceLanguage ?? "Source")} · ${escapeHtml(link.sourceRef)}
        </div>
        <div class="source-link-edition">
          ${escapeHtml(edition.workTitle ?? "")}${edition.editor ? ` · ${escapeHtml(edition.editor)}` : ""}
        </div>
        <div class="source-link-actions">
          <a href="${escapeAttribute(link.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>
          <a href="${escapeAttribute(edition.scaifeUrl ?? link.sourceUrl)}" target="_blank" rel="noreferrer">Open Scaife</a>
        </div>
      </article>
    `;
  });

  return `
    <div class="source-link-summary">
      <h3>Original-language lookup</h3>
      <p>${phraseCount} mapped phrase${phraseCount === 1 ? "" : "s"} in this passage. Highlight Taylor wording and choose "Show original" to estimate the underlying Greek or Latin.</p>
    </div>
    ${cards.join("")}
  `;
}

function refreshSelectionLookup() {
  const context = currentTaylorSelectionContext();
  if (!context) {
    hideLookupPopover();
    return;
  }
  state.lookupContext = context;
  const rect = context.rect;
  lookupPopover.style.left = `${Math.min(window.innerWidth - 154, Math.max(8, rect.left + rect.width / 2 - 60))}px`;
  lookupPopover.style.top = `${Math.max(8, rect.top - 42)}px`;
  lookupPopover.hidden = false;
}

function hideLookupPopover() {
  lookupPopover.hidden = true;
}

async function runSelectionLookup() {
  const context = state.lookupContext ?? currentTaylorSelectionContext();
  if (!context?.selectedText) return;
  hideLookupPopover();

  const panel = elements.readerPanel.querySelector("[data-source-link-panel]");
  if (panel && context.passageId === state.currentReader.passage?.id) {
    panel.innerHTML = thinkingMarkup("Checking mapped phrases and source search");
  } else {
    elements.readerPanel.innerHTML = `
      <div class="reader-title">
        <h2>Original-language lookup</h2>
        <p>Checking mapped phrases and source search</p>
      </div>
      ${thinkingMarkup("Looking for the underlying phrase")}
    `;
  }

  try {
    const lookup = await postJson("/api/source-lookup", {
      selectedText: context.selectedText,
      passageId: context.passageId,
      allowWeb: elements.allowWeb.checked
    });
    state.currentLookup = lookup;
    renderLookupResult(lookup, context);
    logClientEvent("Original-language lookup viewed", {
      selectedText: context.selectedText,
      passageId: context.passageId,
      matchCount: lookup.matches?.length ?? 0
    });
  } catch (error) {
    elements.readerPanel.innerHTML = `
      <div class="reader-title">
        <h2>Original-language lookup</h2>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

function renderLookupResult(lookup, context) {
  const html = renderLookupCards(lookup);
  const panel = elements.readerPanel.querySelector("[data-source-link-panel]");
  if (panel && context.passageId === state.currentReader.passage?.id) {
    panel.innerHTML = html;
  } else {
    elements.readerPanel.innerHTML = `
      <div class="reader-title">
        <h2>Original-language lookup</h2>
        <p>${context.passageId ? escapeHtml(context.passageId) : "Best available pilot match"}</p>
      </div>
      ${html}
    `;
  }
  wireLookupDiscussionButtons();
}

function renderLookupCards(lookup) {
  const selected = lookup.selectedText ?? "";
  if (!lookup.matches?.length) {
    const message = lookup.aiError
      ? `The dynamic lookup could not complete: ${lookup.aiError}`
      : lookup.aiUnavailable
      ? "The current pilot does not yet contain a mapped phrase for that wording. Add an OpenAI API key to enable a best-effort AI lookup, and turn on External sources if you want it to search online editions."
      : "The app could not produce a responsible Greek or Latin estimate for that wording.";
    return `
      <div class="source-link-panel">
        <div class="source-link-summary">
          <h3>No source estimate yet</h3>
          <p>Selection: "${escapeHtml(clipForUi(selected, 160))}"</p>
        </div>
        <div class="source-link-empty">
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  const cards = lookup.matches.map((match) => {
    const edition = match.sourceEdition ?? {};
    return `
      <article class="source-link-card lookup-card">
        <div class="source-link-head">
          <h3>${escapeHtml(match.taylorText)}</h3>
          <span>${escapeHtml(match.lookupType === "ai-estimate" ? `AI: ${match.matchConfidence ?? match.confidence}` : `${match.matchConfidence ?? match.confidence} confidence`)}</span>
        </div>
        <div class="source-link-meta">
          ${escapeHtml(edition.sourceLanguage ?? "Source")} · ${escapeHtml(match.sourceRef)}
        </div>
        <div class="source-phrase" lang="${edition.sourceLanguage === "Latin" ? "la" : "grc"}">${escapeHtml(match.sourceText)}</div>
        <div class="source-note">
          ${escapeHtml(match.note)}
          ${match.searchMethod ? `<br>${escapeHtml(match.searchMethod)}.` : ""}
          ${match.lookupType === "ai-estimate" ? "<br>Verify before treating this as an exact alignment." : ""}
        </div>
        <div class="source-link-actions">
          ${match.sourceUrl ? `<a href="${escapeAttribute(match.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
          <button type="button" data-discuss-lookup="${escapeAttribute(match.id)}">Discuss translation</button>
        </div>
      </article>
    `;
  });

  return `
    <div class="source-link-panel">
      <div class="source-link-summary">
        <h3>${lookup.lookupMode === "ai-estimate" ? "Best AI estimate" : "Best mapped estimate"}</h3>
        <p>Selection: "${escapeHtml(clipForUi(selected, 160))}"</p>
      </div>
      ${cards.join("")}
    </div>
  `;
}

function wireLookupDiscussionButtons() {
  elements.readerPanel.querySelectorAll("[data-discuss-lookup]").forEach((button) => {
    button.addEventListener("click", () => stageLookupDiscussion(button.dataset.discussLookup));
  });
}

function stageLookupDiscussion(matchId) {
  const match = state.currentLookup?.matches?.find((item) => item.id === matchId);
  if (!match) return;
  const edition = match.sourceEdition ?? {};
  elements.queryInput.value = [
    "Discuss Taylor's translation of this selected wording.",
    "",
    `Taylor selection: "${clipForUi(state.currentLookup?.selectedText || match.taylorText, 900)}"`,
    "",
    `Likely ${edition.sourceLanguage ?? "source"} phrase (${edition.workTitle ?? "source edition"}, ${match.sourceRef}; ${match.matchConfidence ?? match.confidence} confidence):`,
    match.sourceText,
    "",
    `${match.lookupType === "ai-estimate" ? "Taylor phrase" : "Mapped Taylor phrase"}: "${match.taylorText}"`,
    "",
    "Keep the discussion anchored in Taylor's wording, and explain what the source phrase may clarify about his translation choices."
  ].join("\n");
  elements.queryInput.focus();
  logClientEvent("Original-language phrase discussion staged", {
    phraseId: match.id,
    passageId: match.passageId,
    selectedText: state.currentLookup?.selectedText ?? ""
  });
}

function currentTaylorSelectionContext() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
  const selectedText = selection.toString().replace(/\s+/g, " ").trim();
  if (selectedText.length < 3) return null;

  const range = selection.getRangeAt(0);
  const element = elementFromNode(range.commonAncestorContainer);
  if (!element || elements.queryInput.contains(element)) return null;

  const readerText = element.closest("[data-reader-text]");
  if (readerText) {
    return {
      selectedText,
      passageId: state.currentReader.passage?.id ?? "",
      rect: range.getBoundingClientRect()
    };
  }

  const excerpt = element.closest("[data-passage-id]");
  if (excerpt) {
    return {
      selectedText,
      passageId: excerpt.dataset.passageId ?? "",
      rect: range.getBoundingClientRect()
    };
  }

  const messageBody = element.closest(".message.assistant .message-body");
  if (messageBody) {
    return {
      selectedText,
      passageId: nearestCitationId(element) ?? "",
      rect: range.getBoundingClientRect()
    };
  }

  return null;
}

function nearestCitationId(element) {
  const block = element.closest("li, p, .message-body");
  const citation = block?.querySelector("[data-source-id]");
  return citation?.dataset.sourceId ?? "";
}

function elementFromNode(node) {
  return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement ?? null;
}

function selectedTextInside(container) {
  if (!container) return "";
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return "";
  if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return "";
  return selection.toString().replace(/\s+/g, " ").trim();
}

function noteModelState(result) {
  if (!result.usedAI) {
    const node = document.createElement("p");
    node.className = "notice";
    node.textContent = "Add an OpenAI API key in the sidebar to enable AI synthesis.";
    elements.conversation.lastElementChild?.querySelector(".message-body")?.append(node);
  }
}

function setButtons(enabled) {
  elements.askButton.disabled = !enabled;
  elements.reindexButton.disabled = !enabled;
  elements.saveSessionButton.disabled = !enabled;
  elements.loadSessionButton.disabled = !enabled;
  elements.newExchangeButton.disabled = !enabled;
  elements.askButton.textContent = enabled ? "Investigate" : "Thinking...";
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: authHeaders()
  });
  if (response.status === 401) {
    handleAuthExpired();
    throw new Error("Sign in required.");
  }
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postJson(url, body) {
  const headers = { "Content-Type": "application/json" };
  if (state.apiKey) headers["X-OpenAI-API-Key"] = state.apiKey;
  Object.assign(headers, authHeaders());
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (response.status === 401) {
    handleAuthExpired();
  }
  if (!response.ok) throw new Error(payload.error ?? text);
  return payload;
}

function authHeaders() {
  return state.auth.accessToken ? { Authorization: `Bearer ${state.auth.accessToken}` } : {};
}

function handleAuthExpired() {
  if (!state.auth.required) return;
  setAuthSession(null);
  renderSignedOut();
  renderAuthState();
}

function isSignInPage() {
  return window.location.pathname === "/signin" || window.location.pathname === "/signin.html";
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function friendlyAuthError(error) {
  const message = String(error?.message ?? error ?? "");
  if (/signups?\s+not\s+allowed|otp|not\s+found/i.test(message)) {
    return "That email is not on the approved private-access list yet.";
  }
  return message || "Could not send sign-in link.";
}

async function logClientEvent(event, details) {
  try {
    await postJson("/api/log", { event, details });
  } catch {
    // Logging should never interrupt the research flow.
  }
}

function renderRichText(text) {
  const withCitations = escapeHtml(text).replace(
    /\[\[source:([a-z0-9-]+)\]\]/gi,
    (_match, id) => `<button type="button" class="citation" data-source-id="${escapeAttribute(id)}">${escapeHtml(id)}</button>`
  );

  const linked = withCitations
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  return linked
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
        return `<ul>${lines
          .map((line) => `<li>${line.replace(/^[-*]\s+/, "")}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${lines.join("<br>")}</p>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function normalizeForMatching(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clipForUi(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
