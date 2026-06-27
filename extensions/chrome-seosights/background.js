/* ==========================================================================
   seosights — background service worker (Manifest V3)
   ========================================================================== */

const DEFAULT_SETTINGS = {
  apiKey: "",
  showOverlay: false,
  lastAnalyzedUrl: "",
  installDate: null,
  version: "1.0.0",
};

/* --------------------------------------------------------------------------
   Install / startup
   -------------------------------------------------------------------------- */

chrome.runtime.onInstalled.addListener(async (details) => {
  // Seed default settings (without overwriting existing keys)
  try {
    const current = await chrome.storage.local.get(null);
    const merged = { ...DEFAULT_SETTINGS, ...current };
    if (details.reason === "install") {
      merged.installDate = new Date().toISOString();
    }
    merged.version = chrome.runtime.getManifest().version;
    await chrome.storage.local.set(merged);
    console.log("[seosights] extension installed/updated", details.reason);
  } catch (err) {
    console.error("[seosights] failed to seed settings", err);
  }

  // Open a welcome tab on first install (silent on updates)
  if (details.reason === "install") {
    try {
      await chrome.tabs.create({
        url: "https://seosights.com/?from=extension",
      });
    } catch {
      /* ignore */
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[seosights] browser startup — service worker ready");
});

/* --------------------------------------------------------------------------
   Message router
   -------------------------------------------------------------------------- */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    sendResponse({ ok: false, error: "invalid message" });
    return false;
  }

  switch (message.type) {
    case "SEOSIGHTS_PING":
      sendResponse({ ok: true, pong: Date.now() });
      return false;

    case "SEOSIGHTS_GET_SETTINGS":
      chrome.storage.local
        .get(DEFAULT_SETTINGS)
        .then((s) => sendResponse({ ok: true, settings: s }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;

    case "SEOSIGHTS_SET_SETTINGS":
      chrome.storage.local
        .set(message.payload || {})
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;

    case "SEOSIGHTS_CONTENT_REPORT":
      // Forward content-script extractions to the popup if it's open
      try {
        chrome.runtime
          .sendMessage({
            type: "SEOSIGHTS_CONTENT_REPORT_FORWARD",
            data: message.data,
            tab: sender.tab
              ? { id: sender.tab.id, url: sender.tab.url }
              : null,
          })
          .catch(() => {
            /* popup likely closed — ignore */
          });
      } catch {
        /* ignore */
      }
      sendResponse({ ok: true });
      return false;

    case "SEOSIGHTS_OPEN_DASHBOARD":
      {
        const target = message.url ? encodeURIComponent(message.url) : "";
        const dashUrl = target
          ? `https://seosights.com/?url=${target}`
          : "https://seosights.com/";
        chrome.tabs.create({ url: dashUrl }).finally(() =>
          sendResponse({ ok: true })
        );
      }
      return true;

    default:
      sendResponse({ ok: false, error: "unknown message type" });
      return false;
  }
});

/* --------------------------------------------------------------------------
   Action click fallback (if popup fails to open)
   -------------------------------------------------------------------------- */

chrome.action.onClicked.addListener(async (tab) => {
  // This only fires when no default_popup is set — kept as a safety net.
  if (!tab || !tab.url) return;
  const target = encodeURIComponent(tab.url);
  await chrome.tabs.create({ url: `https://seosights.com/?url=${target}` });
});
