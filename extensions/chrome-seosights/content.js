/* ==========================================================================
   seosights — content script
   Runs on all pages. Read-only — does NOT modify the page.
   Extracts title / meta description / JSON-LD / Open Graph tags,
   and fetches /llms.txt and /robots.txt on demand from the popup.
   ========================================================================== */

(() => {
  "use strict";

  const ORIGIN = (() => {
    try {
      return window.location.origin;
    } catch {
      return null;
    }
  })();

  /* --------------------------------------------------------------------------
     DOM extraction (read-only)
     -------------------------------------------------------------------------- */

  function extractMeta() {
    const title = document.title ? document.title.trim() : "";
    let description = "";
    const metaDesc = document.querySelector('meta[name="description" i]');
    if (metaDesc) description = (metaDesc.getAttribute("content") || "").trim();

    // Open Graph tags
    const og = {};
    document.querySelectorAll('meta[property^="og:" i]').forEach((m) => {
      const key = (m.getAttribute("property") || "").toLowerCase();
      const val = (m.getAttribute("content") || "").trim();
      if (key && val) og[key] = val;
    });

    // Twitter cards
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:" i]').forEach((m) => {
      const key = (m.getAttribute("name") || "").toLowerCase();
      const val = (m.getAttribute("content") || "").trim();
      if (key && val) twitter[key] = val;
    });

    // Canonical
    let canonical = "";
    const canon = document.querySelector('link[rel="canonical" i]');
    if (canon) canonical = (canon.getAttribute("href") || "").trim();

    return { title, description, og, twitter, canonical };
  }

  function extractJsonLd() {
    const blocks = [];
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    scripts.forEach((s) => {
      const raw = (s.textContent || "").trim();
      if (!raw) return;
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      blocks.push({
        raw: raw.slice(0, 2000),
        parsed,
        types: extractSchemaTypes(parsed),
      });
    });
    return {
      jsonLdCount: blocks.length,
      blocks,
    };
  }

  function extractSchemaTypes(parsed) {
    const out = new Set();
    if (!parsed) return [];
    const visit = (n) => {
      if (!n) return;
      if (Array.isArray(n)) {
        n.forEach(visit);
        return;
      }
      if (typeof n === "object") {
        const t = n["@type"] || n["@type"];
        if (t) {
          if (Array.isArray(t)) t.forEach((x) => out.add(String(x)));
          else out.add(String(t));
        }
        // graph-style
        if (Array.isArray(n["@graph"])) n["@graph"].forEach(visit);
      }
    };
    visit(parsed);
    return Array.from(out);
  }

  function extractHeadings() {
    const hs = document.querySelectorAll("h1, h2, h3");
    return {
      h1: Array.from(document.querySelectorAll("h1")).slice(0, 5).map((h) =>
        (h.textContent || "").trim().slice(0, 200)
      ),
      h2Count: document.querySelectorAll("h2").length,
      h3Count: document.querySelectorAll("h3").length,
    };
  }

  /* --------------------------------------------------------------------------
     Same-origin fetches for llms.txt and robots.txt
     -------------------------------------------------------------------------- */

  async function fetchText(path, { timeoutMs = 4000 } = {}) {
    if (!ORIGIN) return { status: "error", text: "", httpStatus: 0 };
    const url = ORIGIN + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });
      const text = await res.text();
      return {
        status: "ok",
        text,
        httpStatus: res.status,
        url: res.url,
        contentType: res.headers.get("content-type") || "",
      };
    } catch (err) {
      return {
        status: "error",
        text: "",
        httpStatus: 0,
        error: String(err && err.message ? err.message : err),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchLlmsTxt() {
    const r = await fetchText("/llms.txt");
    if (r.status === "ok" && r.httpStatus === 200 && r.text.trim()) {
      return "ok";
    }
    if (r.httpStatus === 404) return "missing";
    if (r.status === "error") return "error";
    // 200 but empty / non-text — treat as missing
    return "missing";
  }

  async function fetchRobotsTxt() {
    const r = await fetchText("/robots.txt");
    if (r.status === "ok" && r.httpStatus === 200) {
      return { status: "ok", text: r.text };
    }
    if (r.httpStatus === 404) return { status: "missing", text: "" };
    return { status: "error", text: "" };
  }

  /* --------------------------------------------------------------------------
     Overlay (disabled by default; toggle in options)
     -------------------------------------------------------------------------- */

  let overlayEl = null;

  function paintOverlay(snapshot) {
    // Lazy-load settings to decide whether to render
    try {
      chrome.storage.local.get(["showOverlay"], (s) => {
        if (!s || !s.showOverlay) {
          removeOverlay();
          return;
        }
        renderOverlay(snapshot);
      });
    } catch {
      /* storage unavailable — skip overlay */
    }
  }

  function renderOverlay(snapshot) {
    if (!snapshot) return;
    removeOverlay();
    const el = document.createElement("div");
    el.id = "seosights-overlay";
    el.setAttribute("data-seosights", "overlay");
    const score = snapshot.score != null ? snapshot.score : "—";
    el.innerHTML = `
      <div style="font-weight:800;font-size:13px;background:linear-gradient(135deg,#c084fc,#fbbf24);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">seosights</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">AI Visibility</div>
      <div style="font-size:18px;font-weight:800;color:#fff;margin-top:4px;">${score}<span style="font-size:10px;color:rgba(255,255,255,0.45);">/100</span></div>
    `;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: "2147483647",
      padding: "10px 12px",
      background: "rgba(21, 21, 31, 0.92)",
      border: "1px solid rgba(168, 85, 247, 0.4)",
      borderRadius: "10px",
      backdropFilter: "blur(8px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(168,85,247,0.25)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      pointerEvents: "none",
      maxWidth: "180px",
    });
    try {
      document.documentElement.appendChild(el);
      overlayEl = el;
    } catch {
      /* ignore */
    }
  }

  function removeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
  }

  /* --------------------------------------------------------------------------
     Build the snapshot sent to the popup
     -------------------------------------------------------------------------- */

  async function buildSnapshot() {
    const meta = extractMeta();
    const schema = extractJsonLd();
    const headings = extractHeadings();

    const [llmsTxt, robotsTxtResp] = await Promise.all([
      fetchLlmsTxt(),
      fetchRobotsTxt(),
    ]);

    return {
      url: window.location.href,
      origin: ORIGIN,
      meta,
      schema,
      headings,
      llmsTxt,
      robotsTxt: robotsTxtResp.status,
      robotsTxtText: robotsTxtResp.text || "",
    };
  }

  // Normalize keys for popup (it expects robotsTxt.text or robotsTxt === "missing")
  async function buildPopupResponse() {
    const snap = await buildSnapshot();
    return {
      url: snap.url,
      origin: snap.origin,
      meta: snap.meta,
      schema: snap.schema,
      headings: snap.headings,
      llmsTxt: snap.llmsTxt, // "ok" | "missing" | "error"
      robotsTxt:
        snap.robotsTxt === "ok"
          ? { status: "ok", text: snap.robotsTxtText }
          : snap.robotsTxt, // "missing" | "error"
    };
  }

  /* --------------------------------------------------------------------------
     Message listener
     -------------------------------------------------------------------------- */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== "object") {
      sendResponse({ ok: false, error: "invalid message" });
      return false;
    }

    if (message.type === "SEOSIGHTS_ANALYZE") {
      buildPopupResponse()
        .then((data) => {
          // Also notify background so it can route to popup if reopened
          try {
            chrome.runtime.sendMessage({
              type: "SEOSIGHTS_CONTENT_REPORT",
              data,
            });
          } catch {
            /* ignore */
          }
          sendResponse({ ok: true, ...data });

          // Optional overlay (only if user enabled in options)
          paintOverlay(data);
        })
        .catch((err) => {
          sendResponse({ ok: false, error: String(err) });
        });
      return true; // async
    }

    if (message.type === "SEOSIGHTS_PING") {
      sendResponse({ ok: true, pong: Date.now(), origin: ORIGIN });
      return false;
    }

    if (message.type === "SEOSIGHTS_REMOVE_OVERLAY") {
      removeOverlay();
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  /* --------------------------------------------------------------------------
     On load, send a passive content report to the background (best-effort).
     Popup will request a fresh analysis when opened — this is just a hint.
     -------------------------------------------------------------------------- */

  try {
    // Lightweight passive report (no fetches) so background can warm up.
    const passive = {
      type: "SEOSIGHTS_CONTENT_REPORT",
      data: {
        url: window.location.href,
        origin: ORIGIN,
        meta: extractMeta(),
        schema: extractJsonLd(),
        passive: true,
      },
    };
    chrome.runtime.sendMessage(passive, () => {
      // Swallow lastError — popup may not be listening
      void chrome.runtime.lastError;
    });
  } catch {
    /* ignore */
  }
})();
