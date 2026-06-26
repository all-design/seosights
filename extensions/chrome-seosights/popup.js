/* ==========================================================================
   seosights — popup logic
   ========================================================================== */

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "PerplexityBot-User",
  "Google-Extended",
  "Bytespider",
  "Applebot",
  "CCBot",
  "FacebookBot",
  "Meta-ExternalAgent",
];

const SEOSIGHTS_URL = "https://seosights.com/";

/* --------------------------------------------------------------------------
   DOM refs
   -------------------------------------------------------------------------- */

const el = {
  currentUrl: document.getElementById("current-url"),
  urlDot: document.getElementById("url-dot"),
  scoreNumber: document.getElementById("score-number"),
  scoreProgress: document.getElementById("score-progress"),
  scoreVerdict: document.getElementById("score-verdict"),
  scoreHint: document.getElementById("score-hint"),
  checksCount: document.getElementById("checks-count"),
  runAnalysis: document.getElementById("run-analysis"),
  settingsBtn: document.getElementById("settings-btn"),
  checks: {
    llms: {
      status: document.getElementById("status-llms"),
      sub: document.getElementById("sub-llms"),
    },
    schema: {
      status: document.getElementById("status-schema"),
      sub: document.getElementById("sub-schema"),
    },
    robots: {
      status: document.getElementById("status-robots"),
      sub: document.getElementById("sub-robots"),
    },
    meta: {
      status: document.getElementById("status-meta"),
      sub: document.getElementById("sub-meta"),
    },
  },
};

const CIRCUMFERENCE = 263.89; // 2 * Math.PI * 42

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function setCheck(name, state, sub) {
  const node = el.checks[name];
  if (!node) return;
  node.status.className = "status " + state;
  node.status.textContent =
    state === "ok" ? "✓" : state === "fail" ? "✗" : state === "warn" ? "!" : "•";
  if (sub !== undefined) node.sub.textContent = sub;
}

function setScore(score) {
  const s = Math.max(0, Math.min(100, score));
  el.scoreNumber.textContent = String(s);
  const offset = CIRCUMFERENCE * (1 - s / 100);
  el.scoreProgress.style.strokeDashoffset = String(offset);

  let verdict, hint;
  if (s >= 75) {
    verdict = "Excellent";
    hint = "AI models can read and cite this site well.";
  } else if (s >= 50) {
    verdict = "Good";
    hint = "Some gaps — see quick checks below.";
  } else if (s >= 25) {
    verdict = "Needs Work";
    hint = "AI search visibility is limited.";
  } else {
    verdict = "Poor";
    hint = "AI models likely cannot see this site.";
  }
  el.scoreVerdict.textContent = verdict;
  el.scoreHint.textContent = hint;
}

function setChecksCount(passed, total) {
  el.checksCount.textContent = `${passed} / ${total}`;
}

function safeOrigin(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.origin;
  } catch {
    return null;
  }
}

function isAnalyzable(urlStr) {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Analysis
   -------------------------------------------------------------------------- */

function analyzeRobotsTxt(text) {
  // Returns { allowed: bool, disallowedBots: string[], note: string }
  if (!text || !text.trim()) {
    return { allowed: true, disallowedBots: [], note: "empty / none" };
  }
  const lines = text.split(/\r?\n/);
  const disallowed = new Set();
  // Naive parse: track current User-agent groups and any Disallow: /
  let currentAgents = [];
  let anyBlockAll = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith("#")) continue;
    const idx = raw.indexOf(":");
    if (idx === -1) continue;
    const key = raw.slice(0, idx).trim().toLowerCase();
    const val = raw.slice(idx + 1).trim();
    if (key === "user-agent") {
      currentAgents = [val];
      // Multiple consecutive User-agent lines are part of the same group
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (!next) { i++; continue; }
        const nIdx = next.indexOf(":");
        if (nIdx === -1) { i++; continue; }
        const nKey = next.slice(0, nIdx).trim().toLowerCase();
        if (nKey === "user-agent") {
          currentAgents.push(next.slice(nIdx + 1).trim());
          i++;
        } else break;
      }
    } else if (key === "disallow") {
      const isFullBlock = val === "/" || val === "";
      if (val === "/") {
        anyBlockAll = true;
        for (const a of currentAgents) {
          if (a === "*") {
            disallowed.add("* (all bots)");
          } else {
            disallowed.add(a);
          }
        }
      }
    }
  }
  // Detect specific AI bot disallows
  const aiDisallowed = [];
  for (const bot of AI_BOTS) {
    const botLower = bot.toLowerCase();
    for (const a of disallowed) {
      if (a.toLowerCase() === botLower || a.toLowerCase().includes(botLower)) {
        aiDisallowed.push(bot);
      }
    }
  }
  // Also detect explicit Allow for AI bots (overrides Disallow)
  let explicitAllow = false;
  const allowLines = text.split(/\r?\n/).filter((l) => {
    const m = l.match(/^allow\s*:\s*(.+)$/i);
    return m && m[1].trim();
  });
  if (allowLines.length > 0) explicitAllow = true;

  const allowed = !anyBlockAll && aiDisallowed.length === 0;
  let note;
  if (anyBlockAll) {
    note = "all bots blocked";
  } else if (aiDisallowed.length > 0) {
    note = aiDisallowed.slice(0, 2).join(", ") + (aiDisallowed.length > 2 ? ` +${aiDisallowed.length - 2}` : "");
  } else if (explicitAllow) {
    note = "AI-friendly";
  } else {
    note = "no AI blocks";
  }
  return { allowed, disallowedBots: aiDisallowed, note };
}

function computeScore(results) {
  let score = 0;
  if (results.llms.present) score += 25;
  if (results.schema.present) score += 25;
  if (results.robots.allowed) score += 25;
  if (results.meta.present) score += 25;
  return score;
}

/* --------------------------------------------------------------------------
   Messaging with content script
   -------------------------------------------------------------------------- */

function requestContentAnalysis(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "SEOSIGHTS_ANALYZE", bots: AI_BOTS },
      (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message || "content script not reachable"));
          return;
        }
        if (!response) {
          reject(new Error("no response from content script"));
          return;
        }
        resolve(response);
      }
    );
  });
}

/* --------------------------------------------------------------------------
   UI flow
   -------------------------------------------------------------------------- */

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function run() {
  // Reset UI
  setScore(0);
  el.scoreVerdict.textContent = "Analyzing…";
  el.scoreHint.textContent = "Running quick checks…";
  Object.keys(el.checks).forEach((k) => {
    setCheck(k, "pending", "checking…");
  });
  setChecksCount(0, 4);

  const tab = await getCurrentTab();
  if (!tab || !isAnalyzable(tab.url)) {
    el.currentUrl.textContent = tab && tab.url ? tab.url : "(no URL)";
    el.urlDot.style.background = "var(--text-dim)";
    el.urlDot.style.boxShadow = "none";
    el.scoreVerdict.textContent = "Cannot analyze this page";
    el.scoreHint.textContent = "Open a regular http(s) page.";
    Object.keys(el.checks).forEach((k) => setCheck(k, "pending", "n/a"));
    el.runAnalysis.disabled = true;
    el.runAnalysis.style.opacity = "0.5";
    return;
  }

  el.currentUrl.textContent = tab.url;

  let data;
  try {
    data = await requestContentAnalysis(tab.id);
  } catch (err) {
    el.urlDot.style.background = "var(--rose)";
    el.urlDot.style.boxShadow = "0 0 8px var(--rose)";
    el.scoreVerdict.textContent = "Reload page to analyze";
    el.scoreHint.textContent =
      "Content script not loaded. Refresh the tab, then reopen this popup.";
    Object.keys(el.checks).forEach((k) => setCheck(k, "pending", "—"));
    return;
  }

  el.urlDot.style.background = "var(--emerald)";
  el.urlDot.style.boxShadow = "0 0 8px var(--emerald)";

  renderResults(data);
}

function renderResults(data) {
  const results = {
    llms: { present: false, sub: "" },
    schema: { present: false, sub: "" },
    robots: { allowed: false, sub: "" },
    meta: { present: false, sub: "" },
  };

  // llms.txt
  if (data.llmsTxt === "ok") {
    results.llms.present = true;
    results.llms.sub = "found";
  } else if (data.llmsTxt === "missing") {
    results.llms.present = false;
    results.llms.sub = "404";
  } else {
    results.llms.present = false;
    results.llms.sub = "n/a";
  }
  setCheck("llms", results.llms.present ? "ok" : "fail", results.llms.sub);

  // Schema
  const schemaCount = data.schema && data.schema.jsonLdCount ? data.schema.jsonLdCount : 0;
  results.schema.present = schemaCount > 0;
  results.schema.sub = schemaCount > 0 ? `${schemaCount} block${schemaCount === 1 ? "" : "s"}` : "none";
  setCheck("schema", results.schema.present ? "ok" : "fail", results.schema.sub);

  // robots.txt — content.js returns either { status: "ok", text } or the
  // strings "missing" / "error". A missing robots.txt means all bots allowed
  // by convention; an error means we couldn't tell (default to allowed).
  let robots;
  if (data.robotsTxt && typeof data.robotsTxt === "object" && data.robotsTxt.status === "ok") {
    robots = analyzeRobotsTxt(data.robotsTxt.text);
  } else if (data.robotsTxt === "missing") {
    robots = { allowed: true, note: "404 (allowed)" };
  } else if (data.robotsTxt === "error") {
    robots = { allowed: true, note: "fetch failed" };
  } else {
    robots = { allowed: false, note: "n/a" };
  }
  results.robots.allowed = robots.allowed;
  results.robots.sub = robots.note || (robots.allowed ? "ok" : "blocked");
  setCheck("robots", robots.allowed ? "ok" : "fail", results.robots.sub);

  // Meta description
  const meta = data.meta && data.meta.description ? data.meta.description : "";
  const metaLen = meta.length;
  if (metaLen === 0) {
    results.meta.present = false;
    results.meta.sub = "missing";
    setCheck("meta", "fail", "missing");
  } else if (metaLen < 50) {
    results.meta.present = false;
    results.meta.sub = `${metaLen} chars`;
    setCheck("meta", "warn", `${metaLen} chars`);
  } else {
    results.meta.present = true;
    results.meta.sub = `${metaLen} chars`;
    setCheck("meta", "ok", `${metaLen} chars`);
  }

  // Score
  const score = computeScore(results);
  setScore(score);

  // Count passed (meta counts as passed only if ok)
  let passed = 0;
  if (results.llms.present) passed++;
  if (results.schema.present) passed++;
  if (results.robots.allowed) passed++;
  if (results.meta.present) passed++;
  setChecksCount(passed, 4);
}

/* --------------------------------------------------------------------------
   Event handlers
   -------------------------------------------------------------------------- */

el.runAnalysis.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const target = tab && isAnalyzable(tab.url) ? encodeURIComponent(tab.url) : "";
  const url = target ? `${SEOSIGHTS_URL}?url=${target}` : SEOSIGHTS_URL;
  chrome.tabs.create({ url });
  window.close();
});

el.settingsBtn.addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
  window.close();
});

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", run);
