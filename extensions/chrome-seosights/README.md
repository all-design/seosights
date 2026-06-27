# seosights — AI Search Visibility Checker (Chrome Extension)

A Manifest V3 Chrome extension that lets you check any website's **AI search visibility** (SEO + AEO + GEO) in one click — right from the toolbar.

This is the companion extension for [seosights.com](https://seosights.com), the operating system for AI search.

---

## Features

- **One-click AI Visibility Score** — click the extension icon on any website to see a 0–100 score that combines SEO + AEO + GEO signals.
- **Quick checks** — see at a glance whether the current page has:
  - `llms.txt` present
  - Schema.org / JSON-LD markup
  - AI bots allowed in `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bytespider, Applebot, CCBot, etc.)
  - A usable meta description (warns if `<50` chars)
- **Run Full Analysis** — one click opens `https://seosights.com/?url=<current-url>` in a new tab, pre-filling the dashboard with the page you were just looking at.
- **Read-only content script** — the extension extracts `<title>`, meta description, JSON-LD blocks, Open Graph / Twitter card tags, canonical link, and heading counts. It does **not** modify the page.
- **Optional overlay** — enable in Settings to show a small AI-visibility badge in the corner of every page.
- **Local API key storage** — paste your seosights API key in Settings; it's stored in `chrome.storage.local` and never leaves your browser.

---

## Installation (Load Unpacked)

1. Download or clone this folder so you have `extensions/chrome-seosights/` locally.
2. Add an icon file: save a `512×512` PNG as `icon.png` in this folder (the manifest references `icon.png` for the 16/48/128 sizes). If you skip this step, Chrome will show a generic puzzle-piece icon — the extension still works.
3. Open `chrome://extensions` in Chrome (or any Chromium browser: Edge, Brave, Arc, Vivaldi).
4. Toggle on **Developer mode** (top-right).
5. Click **Load unpacked** and select the `extensions/chrome-seosights/` folder.
6. The seosights icon will appear in your toolbar. Pin it for easy access.

> After install, refresh any already-open tabs so the content script can attach.

---

## How to use

1. Browse to any website (e.g. `https://example.com`).
2. Click the seosights icon.
3. The popup fetches `/llms.txt` and `/robots.txt` (same-origin, via the content script) and reads the DOM.
4. Review your 0–100 AI Visibility Score and the four quick checks.
5. Click **Run Full Analysis on seosights.com** to deep-dive in the dashboard.

---

## File structure

```
chrome-seosights/
├── manifest.json    # Manifest V3 config
├── popup.html       # 380×480 popup UI
├── popup.js         # Popup logic — fetches results, renders score
├── background.js    # Service worker — default settings, message router
├── content.js       # Read-only DOM extraction + same-origin fetches
├── options.html     # Settings page (API key, overlay toggle)
├── options.js       # Settings logic
├── styles.css       # Shared dark-theme styles (popup + options)
├── README.md        # This file
└── icon.png         # Toolbar icon (add this — see Install step 2)
```

---

## Permissions explained

| Permission | Why we need it |
|---|---|
| `activeTab` | Read the URL and tab info of the page you're currently viewing when you click the icon. No persistent access. |
| `storage` | Persist your settings (API key, overlay toggle, install date) in `chrome.storage.local`. |
| `host_permissions: https://seosights.com/*` | Open the seosights dashboard in a new tab with the current URL pre-filled. The extension does **not** silently access seosights.com or any other site. |
| `content_scripts on <all_urls>` | The read-only content script extracts on-page signals (title, meta, JSON-LD, OG tags) and, same-origin, fetches `/llms.txt` and `/robots.txt` for the site you're viewing. No data is sent anywhere except back to the popup and (optionally, when you click the CTA) to `seosights.com` in a new tab. |

No `tabs` permission, no `webRequest`, no `cookies`, no `history` — by design.

---

## How the score is computed

Each of the four quick checks is worth **25 points**:

| Check | Pass condition |
|---|---|
| `llms.txt` present | `GET /llms.txt` returns `200` with non-empty body |
| Schema markup | At least one `<script type="application/ld+json">` block exists |
| AI bots allowed in `robots.txt` | `robots.txt` exists and does not `Disallow: /` for any of: GPTBot, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Google-Extended, Bytespider, Applebot, CCBot, FacebookBot, Meta-ExternalAgent |
| Meta description | A `<meta name="description">` exists with ≥ 50 characters (warns below 50, fails if missing) |

The 0–100 score is the simple sum. Verdicts: **Excellent** (75–100), **Good** (50–74), **Needs Work** (25–49), **Poor** (0–24).

---

## Privacy

- The extension **never** transmits page content to any third party.
- The only outbound network requests are same-origin `GET /llms.txt` and `GET /robots.txt` from the page you're viewing (these go to the site you're already on, not to seosights).
- When you click **Run Full Analysis**, your current URL is appended as `?url=…` to `https://seosights.com` — exactly as if you typed it yourself.
- Your API key and settings live in `chrome.storage.local` and stay on this device/profile.

---

## Development notes

- Pure vanilla JS — no build step, no framework, no bundler.
- Manifest V3 service worker (`background.js`) — registered in `manifest.json`.
- Content script uses an IIFE + `"use strict"` and is read-only (no DOM mutations except the optional, user-enabled overlay badge).
- All cross-component messaging uses `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage` with `chrome.runtime.lastError` guards.

---

## Roadmap

- [ ] Real API integration with seosights.com (replace mock scoring with server-side AI visibility score)
- [ ] Highlight JSON-LD blocks inline on the page
- [ ] Per-bot crawlability overlay (green/red dots next to AI bot names)
- [ ] Sync settings across devices via `chrome.storage.sync`
- [ ] Right-click context menu: "Analyze this page with seosights"

---

## License

Same as the seosights main app. See the project root.
