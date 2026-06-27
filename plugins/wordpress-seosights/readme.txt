=== seosights for WordPress ===
Contributors: seosights
Tags: seo, aeo, geo, llms.txt, json-ld, schema, ai, robots.txt, gptbot, claudebot, perplexitybot
Requires at least: 5.8
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The Operating System for AI Search — auto-generate /llms.txt, inject JSON-LD schema, configure robots.txt rules for AI crawlers, and sync site stats to your seosights dashboard.

== Description ==

**seosights for WordPress** is the on-site companion to the seosights platform — the operating system for AI search. It unifies SEO (search engine optimization), AEO (answer engine optimization), and GEO (generative engine optimization) into a single workflow that turns your WordPress site into an AI-crawler-friendly destination.

Once installed and connected to your seosights account, the plugin:

* **Auto-generates and serves `/llms.txt`** for AI crawlers like GPTBot (OpenAI/ChatGPT), ClaudeBot (Anthropic/Claude) and PerplexityBot. The file follows the [llmstxt.org](https://llmstxt.org) convention and is built from your site name, tagline, summary and key URLs.
* **Injects JSON-LD schema** (Organization, WebSite, Article) into the `<head>` of every page so AI crawlers and search engines can parse your site's structure.
* **Configures robots.txt rules per AI bot** — allow or disallow GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot from a single settings screen. Rules are appended to WordPress's virtual robots.txt via the `robots_txt` filter.
* **Syncs site stats daily** to your seosights dashboard — post/page/comment counts, plugin version, enabled features — so your account always has an up-to-date view of each connected site.

All settings live under **Tools → seosights** in wp-admin and require the `manage_options` capability. All admin forms use nonces and the WordPress Settings API; all output is escaped and all input is sanitized.

= Key features =

* `/llms.txt` generator served at the site root via a WordPress rewrite rule (no template file needed).
* JSON-LD `@graph` with Organization + WebSite always, plus Article on single posts.
* Per-bot allow/disallow radios for the five most important AI crawlers.
* Daily WP-Cron job (reschedules on activation, cleared on deactivation + uninstall).
* "Test Connection" button that calls the seosights API to verify your API key before saving.
* Status panel showing the live llms.txt URL, robots.txt mode (virtual vs physical), schema state, and stats sync state.
* Zero external asset files — uses bundled WordPress scripts and inline styles.

== Installation ==

This section describes how to install the plugin manually.

= Manual installation =

1. Upload the `wordpress-seosights` folder to the `/wp-content/plugins/` directory (or install the ZIP via **Plugins → Add New → Upload Plugin**).
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Tools → seosights**.
4. Paste your seosights API key (get one at https://seosights.com/dashboard).
5. Click **Test Connection** to verify the key.
6. Toggle the features you want (llms.txt, JSON-LD schema, daily stats sync).
7. Configure allow/disallow for each AI bot.
8. Click **Save Changes**.

On activation the plugin will:

* Seed the default settings (llms.txt + schema + stats enabled, all bots allowed).
* Register the `/llms.txt` rewrite rule and flush rewrite rules.
* Schedule the daily stats sync cron.

On deactivation the rewrite rules are flushed and the cron is cleared. On uninstall (delete) the `seosights_settings` option is removed and the cron is unscheduled.

= Server requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* The `robots_txt` filter only applies when there is **no physical `robots.txt` file** in your site root. The plugin will surface a warning in the admin UI if it detects one.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign in at https://seosights.com/dashboard and copy your API key into the plugin settings page under **Tools → seosights**.

= What is llms.txt? =

`llms.txt` is a proposed standard (see https://llmstxt.org) for serving a concise, markdown-formatted overview of a website at the path `/llms.txt`. The file is intended to help large language models and AI crawlers understand what a site is about and which URLs matter most. The seosights plugin auto-generates this file from your WordPress site name, tagline, summary and key URLs.

= Why isn't my robots.txt being modified? =

WordPress serves a virtual robots.txt via `do_robots()`. If you (or your host) placed a physical `robots.txt` file in your site root, the virtual one is bypassed and the plugin's AI bot rules won't be applied. The admin status panel will display a warning when this is the case. To use the plugin's rules, delete the physical `robots.txt` file (or manually merge the AI bot rules into it).

= Which AI crawlers can I control? =

By default the plugin exposes five:

* **GPTBot** — OpenAI / ChatGPT
* **ClaudeBot** — Anthropic / Claude
* **PerplexityBot** — Perplexity
* **Google-Extended** — Google Gemini
* **CCBot** — Common Crawl

Each can be set to Allow or Disallow from the settings page.

= What data is sent to seosights? =

The daily stats sync sends:

* Site URL and name
* WordPress version, PHP version, plugin version
* Post count, page count, comment count, user count
* Which features are enabled (llms.txt, schema) and your bot rule configuration
* A MySQL timestamp

No post content, user PII, or password hashes are ever sent. The request uses `wp_remote_post` with a Bearer-token Authorization header.

= Is the plugin compatible with caching plugins? =

Yes. The `/llms.txt` response is served with `nocache_headers()`, so most caching plugins (WP Super Cache, W3 Total Cache, LiteSpeed Cache) will skip caching it. If you use a full-page CDN cache (Cloudflare, etc.) you may want to add a cache-bypass rule for `/llms.txt`.

== Screenshots ==

1. **Settings page** — Tools → seosights shows the status panel (llms.txt URL, robots.txt mode, schema state, stats sync state), API key field with Test Connection button, feature checkboxes, site summary field, and per-bot Allow/Disallow radios.
2. **Status panel** — At-a-glance badges showing which features are active and whether a physical robots.txt is overriding the plugin's virtual rules.
3. **AI crawler rules** — Five-row radio grid for GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot.
4. **Test Connection** — Click the button to verify your API key against the seosights API before saving.

== Changelog ==

= 1.0.0 =
* Initial release.
* Auto-generate and serve `/llms.txt` via a WordPress rewrite rule.
* Inject JSON-LD Organization, WebSite, and Article schema into `wp_head`.
* Configure per-bot Allow/Disallow rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot via the `robots_txt` filter.
* Daily WP-Cron job that POSTs site stats to the seosights API.
* Admin UI under Tools → seosights with nonce + `manage_options` capability checks.
* Test Connection AJAX action that verifies the API key.
* Activation / deactivation / uninstall hooks that manage options, rewrite rules, and cron schedules.

== Upgrade Notice ==

= 1.0.0 =
First public release of the seosights WordPress plugin.
