# Seosights — Kompletna Dokumentacija Aplikacije

**Verzija:** 0.2.0  
**Datum:** Mart 2025  
**Domen:** https://seosights.com  
**Tagline:** *The Operating System for AI Visibility*

---

## Sadržaj

1. [Pregled Projekta](#1-pregled-projekta)
2. [Tehnološki Stack](#2-tehnološki-stack)
3. [Arhitektura Sistema](#3-arhitektura-sistema)
4. [Baza Podataka (Prisma Schema)](#4-baza-podataka-prisma-schema)
5. [API Reference (70+ Endpointa)](#5-api-reference-70-endpointa)
6. [8-Agent SEO Analizni Sistem](#6-8-agent-seo-analizni-sistem)
7. [AI Router — Smart Model Routing](#7-ai-router--smart-model-routing)
8. [Autentifikacija & Autorizacija](#8-autentifikacija--autorizacija)
9. [Billing & Stripe Integracija](#9-billing--stripe-integracija)
10. [Plan Limits & Kill-Switch](#10-plan-limits--kill-switch)
11. [Rate Limiting & Middleware](#11-rate-limiting--middleware)
12. [Superadmin Panel](#12-superadmin-panel)
13. [P0 Moduli (AI Visibility)](#13-p0-moduli-ai-visibility)
14. [P1 Moduli (Sledeći Sprint)](#14-p1-moduli-sledeći-sprint)
15. [Landing Page & Marketing](#15-landing-page--marketing)
16. [Mini Servisi](#16-mini-servisi)
17. [Chrome Ekstenzija](#17-chrome-ekstenzija)
18. [WordPress Plugin](#18-wordpress-plugin)
19. [Komponente (130+ React)](#19-komponente-130-react)
20. [State Management](#20-state-management)
21. [Scraping Arhitektura](#21-scraping-arhitektura)
22. [Email & Webhook Sistem](#22-email--webhook-sistem)
23. [Affiliate Program](#23-affiliate-program)
24. [CMS Integracija](#24-cms-integracija)
25. [Deployment & DevOps](#25-deployment--devops)
26. [Konfiguracija (Environment Variables)](#26-konfiguracija-environment-variables)
27. [Folder Struktura](#27-folder-struktura)
28. [Razvojni Workflow](#28-razvojni-workflow)

---

## 1. Pregled Projekta

**Seosights** je SaaS platforma za AI Visibility — pomaže kompanijama da prate, mere i poboljšavaju svoju vidljivost u AI pretraživačima (ChatGPT, Claude, Gemini, Perplexity, Copilot). Platforma koristi 8-agent AI sistem za kompletnu SEO/AEO/GEO analizu web sajta.

### Ključne Mogućnosti

| Mogućnost | Opis |
|-----------|------|
| **AI Visibility Score** | Real-time scoring 0-100 po AI engine-u |
| **8-Agent SEO Audit** | Master Director + 7 sub-agenta za kompletnu analizu |
| **Smart AI Router** | Automatski bira najbolji LLM model po zadatku i tier-u |
| **AI Visibility Replay™** | Timeline replay svih promena vidljivosti |
| **AI Recommendation Recorder™** | Snimanje diff-ova AI preporuka pre i posle |
| **Auto Execute™** | Automatsko izvršavanje fix-ova na WordPress/Webflow/Shopify |
| **ROI Opportunity Queue™** | Prioritizovani queue akcija po ROI score-u |
| **Email Digest** | "What changed overnight?" dnevni/weekly/monthly digest |
| **Competitor Race** | Upoređenje AI vidljivosti sa konkurencijom |
| **Affiliate System** | 5-tier provizija (10%→50%), lifetime recurring |
| **Agency White-Label** | Pro plan sa custom brendiranjem |
| **Chrome Extension** | AI Visibility score u browser-u |
| **WordPress Plugin** | Direktna integracija sa WP sajtovima |

---

## 2. Tehnološki Stack

### Core Framework
| Tehnologija | Verzija | Namena |
|-------------|---------|--------|
| **Next.js** | 16.x | App Router, SSR/SSG, API Routes |
| **React** | 19.x | UI biblioteka |
| **TypeScript** | 5.x | Tipizirani JavaScript |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | New York | Komponentna biblioteka (45+ komponenti) |

### Backend & Data
| Tehnologija | Namena |
|-------------|--------|
| **Prisma ORM** | Database ORM (SQLite lokalno, Turso produkcija) |
| **SQLite / Turso** | Baza podataka (libsql) |
| **BullMQ + ioredis** | Background job queue za audit worker |
| **Socket.IO** | Real-time WebSocket komunikacija |

### AI & LLM
| Provider | Modeli | Namena |
|----------|--------|--------|
| **Groq** | Llama 3.1 70B, 8B, Mixtral | Ultra-fast free inference |
| **Google Gemini** | Flash 1.5, Pro 1.5 | Free tier, huge context |
| **OpenRouter** | DeepSeek V3, Llama 3.1 | Free model routing |
| **OpenAI** | GPT-4o, GPT-4o-mini | Paid, highest quality |
| **ZAI SDK** | Default | Sandbox fallback |
| **Ollama** | Llama 3 | Local fallback |

### Payments & Communication
| Tehnologija | Namena |
|-------------|--------|
| **Stripe** | Billing, checkout, portal, webhooks |
| **Resend** | Email slanje (digest, notifikacije) |

### State & Forms
| Tehnologija | Namena |
|-------------|--------|
| **Zustand 5** | Globalni client state |
| **TanStack Query 5** | Server state management |
| **React Hook Form 7** | Form handling |
| **Zod 4** | Schema validacija |

### Ostalo
| Tehnologija | Namena |
|-------------|--------|
| **Framer Motion** | Animacije i tranzicije |
| **Recharts 2** | Chart biblioteka |
| **Lucide React** | Ikonice |
| **Puppeteer** | Web scraping |
| **jsPDF** | PDF generacija izveštaja |
| **Sharp** | Image processing |

---

## 3. Arhitektura Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      SEOSIGHTS ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Browser  │───▶│  Next.js 16  │───▶│   API Routes     │   │
│  │ (React)  │◀───│  App Router  │◀───│   (70+ endpoints)│   │
│  └──────────┘    └──────────────┘    └────────┬─────────┘   │
│       │                                        │              │
│       │  Socket.IO                   ┌─────────▼──────────┐  │
│       ├──────────────────────────────▶│  Prisma ORM        │  │
│       │  (XTransformPort=3003)        │  (SQLite/Turso)    │  │
│       │                               └─────────┬──────────┘  │
│       │                                         │              │
│  ┌────▼──────────┐    ┌──────────────┐   ┌─────▼───────────┐ │
│  │ agent-stream  │    │ audit-worker │   │  AI Router      │ │
│  │ (port 3003)   │    │ (port 3004)  │   │  (6 providers)  │ │
│  │ Socket.IO WS  │    │ BullMQ + Redis│   │  Task-based     │ │
│  │ Live progress │    │ Background    │   │  Tier-gated     │ │
│  └───────────────┘    └──────────────┘   └─────────────────┘ │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ Chrome Ext.   │  │ WordPress Pl. │  │  Stripe Billing   │ │
│  │ AI Visibility │  │ Auto Execute  │  │  4 Tier System    │ │
│  └───────────────┘  └───────────────┘  └──────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Caddy Gateway (:81)                  │  │
│  │  Default → :3000 | XTransformPort=3003 → agent-stream  │  │
│  │                    XTransformPort=3004 → audit-worker   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Korisnik** otvara stranicu → Next.js SSR/CSR
2. **Analiza** → `POST /api/analyze` ili `POST /api/audit/run`
3. **Scraper** skida stranicu jednom ("Scrape Once, Read Many")
4. **AI Router** bira optimalni LLM po task type + tier
5. **8 Agenata** procesiraju u 2 batch-a (Strategy → Audit)
6. **WebSocket** šalje live progress preko agent-stream (port 3003)
7. **Rezultat** se čuva u DB + generiše PDF izveštaj
8. **Webhook/Email** obaveštava korisnika

---

## 4. Baza Podataka (Prisma Schema)

### Modeli (30 ukupno)

#### Core Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **User** | Korisnik sa rolom i tier-om | email, role, tier, stripeCustomerId, agencyName |
| **Session** | JWT sesija (7-dnevni exp.) | token, userId, expiresAt |
| **Analysis** | SEO/AEO/GEO analiza | url, domain, status, mode, result |
| **Project** | Multi-projekt tracking | url, domain, executionMode |

#### AI Agent Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **AgentLog** | Log svakog agent izvršenja | agentId, tokensUsed, costUsd, model |
| **AgentPrompt** | Konfigurabilni agent prompt-ovi | systemPrompt, userPromptTemplate, model |
| **Approval** | Human-in-the-loop odobrenja | actionType, actionData, status |
| **TokenUsage** | Dnevni agregat token potrošnje | totalTokens, estimatedCostUsd |
| **TokenUsageLog** | Individualni token log | modelUsed, costUsd, agentName |

#### AI Visibility Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **VisibilitySnapshot** | AI Visibility Score snapshot | overallScore, perEngine, capturedAt |
| **CitationEvent** | AI citiranje događaji | engine, eventType, delta, prompt |
| **FeedItem** | Real-time vidljivost feed | itemType, severity, isRead |
| **VisibilityAlert** | Monitoring alert-ovi | alertType, severity, isRead |
| **IndustryBenchmark** | Industrijski benchmark-ovi | industry, avgAIVisibility, perEngine |

#### P1 Feature Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **ReplaySession** | AI Visibility Replay timeline | startDate, endDate, highlights |
| **RecommendationSnapshot** | AI preporuka snapshot | prompt, engines, overallScore |
| **RecommendationDiff** | Before/after diff | changes, severity, summary |
| **ActionItem** | AI-generisane akcije sa ROI | priority, roiScore, autoExecuteEnabled |
| **AutoExecution** | Automatsko izvršavanje | platform, actionType, status, rollbackPayload |
| **EmailDigest** | Digest email-ovi | digestType, scoreDelta, citationsGained |

#### Superadmin Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **AnalyticsEvent** | Event tracking | event, userId, metadata, createdAt |
| **DailyMetric** | Dnevne metrike | visitors, mrr, d1Retention, d7Retention |

#### Poslovni Modeli

| Model | Opis | Ključna Polja |
|-------|------|---------------|
| **Affiliate** | Affiliate program | affiliateCode, totalEarningsUsd |
| **AffiliateReferral** | Referral tracking | status, firstPaymentAt |
| **AffiliatePayout** | Isplate | amountUsd, percentageApplied, stripeTransferId |
| **WebhookConfig** | Webhook integracije | type (slack/discord/custom), url, events |
| **SystemSetting** | Superadmin konfiguracija | key, value, isSecret, category |
| **Lead** | Lead capture | name, email, website |
| **Post** | Blog post-ovi | title, content, published |
| **PromptTemplate** | Prompt biblioteka | industry, category, prompt |

### Enum Vrednosti

```
User.role:          user | agency | affiliate | superadmin
User.tier:          free_trial | starter | pro | managed
User.subscriptionStatus: free_trial | active | past_due | canceled

Analysis.status:    pending | running | completed | failed
Analysis.mode:      auto-pilot | co-pilot

ActionItem.status:  pending | in_progress | completed | dismissed | queued | auto_executing | auto_executed | auto_failed
ActionItem.priority: low | medium | high | critical

AutoExecution.platform: wordpress | webflow | shopify | custom
AutoExecution.status: pending | executing | success | failed | rolled_back

EmailDigest.digestType: overnight | weekly | monthly
EmailDigest.status: pending | sent | failed

AnalyticsEvent.event: started_audit | completed_audit | viewed_replay | opened_diff | connected_wordpress | executed_fix | opened_digest | clicked_upgrade | connected_gsc | registered | activated | paid

CitationEvent.engine: chatgpt | claude | gemini | perplexity | copilot
CitationEvent.eventType: cited | uncited | rank_up | rank_down | first_mention | competitor_overtake

FeedItem.itemType: citation_gained | citation_lost | rank_change | competitor_alert | new_entity | score_milestone | ai_discovery
FeedItem.severity: info | warning | positive | critical
```

---

## 5. API Reference (70+ Endpointa)

### Autentifikacija

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/auth/login` | POST | Login sa email/password |
| `/api/auth/register` | POST | Registracija novog korisnika |
| `/api/auth/register/agency` | POST | Registracija agencije |
| `/api/auth/me` | GET | Trenutni korisnik |
| `/api/auth/logout` | POST | Logout |
| `/api/superadmin/auth` | POST | Superadmin autentifikacija |
| `/api/superadmin/check` | GET | Provera superadmin statusa |

### Analiza & Audit

| Endpoint | Method | Opis | Timeout |
|----------|--------|------|---------|
| `/api/analyze` | POST | Glavna SEO/AEO/GEO analiza | 300s |
| `/api/quick-audit` | POST | Brzi audit | 60s |
| `/api/audit/run` | POST | Pokretanje background audit job-a | 300s |
| `/api/audit/[jobId]` | GET | Status audit job-a | 10s |
| `/api/analysis/[id]` | GET | Preuzimanje analize po ID | 10s |
| `/api/analysis/[id]/download-pdf` | GET | Download PDF izveštaja | 30s |
| `/api/report` | POST | Generisanje izveštaja | 60s |

### AI Visibility

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/ai/visibility-score` | GET | AI Visibility Score (0-100) |
| `/api/ai/visibility-replay` | GET | Timeline replay vidljivosti |
| `/api/ai/visibility-forecast` | GET | Prognoza score-a |
| `/api/ai/feed` | GET | Real-time vidljivost feed |
| `/api/ai/diff` | GET | Preporuka diff-ovi |
| `/api/ai/benchmarks` | GET | Industrijski benchmark-ovi |
| `/api/ai/index-status` | GET | AI index status |
| `/api/ai/entity-health` | GET | Entity health scoring |
| `/api/ai/citation-explorer` | GET | Citat exploracija |
| `/api/ai/influence-graph` | GET | Graf uticaja |
| `/api/ai/content-gap` | GET | Content gap analiza |

### AI Akcije & Strategija

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/ai/mission-control` | GET | Mission control panel |
| `/api/ai/action-center` | GET | Akcioni itemi |
| `/api/ai/opportunity-finder` | GET | Pretraga prilika |
| `/api/ai/opportunity-queue` | GET | Prioritizovani queue |
| `/api/ai/auto-execute` | POST | Auto-izvršavanje akcija |
| `/api/ai/recommendation-simulator` | POST | Simulacija AI preporuka |
| `/api/ai/recommendation-recorder` | POST | Snimanje preporuka |
| `/api/ai/recommendation-history` | GET | Istorija preporuka |
| `/api/ai/prompt-library` | GET | Prompt template biblioteka |
| `/api/ai/competitor-race` | GET | Trka sa konkurencijom |
| `/api/ai/competitor-war-room` | GET | War room analiza |
| `/api/ai/revenue-calculator` | GET | Kalkulator uticaja na prihod |
| `/api/ai/digest` | POST | Generisanje email digest-a |

### Dashboard Widgeti

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/dashboard/one-click-fix` | POST | One-click SEO fix-ovi |
| `/api/dashboard/crawl-logs` | GET | Crawl log-ovi |
| `/api/dashboard/content-simulator` | POST | Simulacija sadržaja |
| `/api/dashboard/entity-graph` | GET | Entity graf podaci |
| `/api/dashboard/competitor-citation` | GET | Konkurentski citati |
| `/api/dashboard/prompt-rank` | GET | Prompt rangiranje |

### Billing (Stripe)

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/stripe/checkout` | POST | Kreiranje Stripe checkout |
| `/api/billing/create-checkout-session` | POST | Checkout sesija |
| `/api/billing/portal` | POST | Billing portal |
| `/api/billing/subscription` | GET | Status pretplate |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### Webhooks

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/webhooks` | GET/POST | Lista/Kreiranje webhook-a |
| `/api/webhooks/[id]` | GET/PUT/DELETE | CRUD za webhook |

### CMS Integracija

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/cms/publish` | POST | Publikovanje na CMS |
| `/api/cms/save-credentials` | POST | Čuvanje CMS kredencijala |
| `/api/cms/test-connection` | POST | Test CMS konekcije |

### Superadmin

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/superadmin/ceo-metrics` | GET | CEO dashboard metrike |
| `/api/superadmin/retention` | GET | D1/D7/D30 retention podaci |
| `/api/superadmin/activation` | GET | Aktivacioni funnel podaci |
| `/api/superadmin/events` | GET/POST | Analytics eventi |
| `/api/superadmin/p1-overview` | GET | P1 feature overview |
| `/api/superadmin/settings` | GET/PUT | Sistemska podešavanja |

### Admin

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/admin/analyses` | GET | Lista analiza |
| `/api/admin/users` | GET | Lista korisnika |
| `/api/admin/tokens` | GET | Token potrošnja |
| `/api/admin/prompts` | GET/PUT | Agent prompt upravljanje |
| `/api/admin/client-zero` | GET | Client zero (churn) podaci |
| `/api/admin/outreach-queue` | GET | Backlink outreach queue |
| `/api/admin/content-queue` | GET | Content publishing queue |
| `/api/admin/fallback-history` | GET | AI fallback istorija |

### Affiliate

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/affiliate/register` | POST | Registracija kao affiliate |
| `/api/affiliate/stats` | GET | Statistika zarade |
| `/api/affiliate/validate` | GET | Validacija affiliate koda |

### Cron Job-ovi

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/cron/auto-publish` | POST | Auto-publikovanje sadržaja |
| `/api/cron/cluster-map` | POST | Ažuriranje cluster mape |
| `/api/cron/auto-outreach` | POST | Auto outreach izvršavanje |
| `/api/cron/digest` | POST | Slanje email digest-a |

### Ostalo

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/limits` | GET | Provera plan limita |
| `/api/leads` | POST | Lead capture |
| `/api/alerts` | GET | Alert upravljanje |
| `/api/alerts/check` | GET | Provera novih alert-a |
| `/api/approvals` | GET | Approval upravljanje |
| `/api/approvals/[id]` | PUT | Akcija na approval-u |
| `/api/gsc` | POST | Google Search Console konekcija |
| `/api/gsc/data` | GET | GSC podaci |
| `/api/agency` | GET/PUT | Agency upravljanje |
| `/api/live/stats` | GET | Live statistike |
| `/api/live/activity` | GET | Live aktivnost feed |
| `/api/generate-llms-txt` | POST | Generisanje llms.txt fajla |
| `/api/route` | GET | Health check |

---

## 6. 8-Agent SEO Analizni Sistem

### Hub-and-Spoke Protokol

```
                    ┌─────────────────┐
                    │  Master Director │
                    │   (Orkestrator)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐      │      ┌───────▼───────┐
     │ Batch 1       │      │      │ Batch 2       │
     │ (Strategy)    │      │      │ (Audit)       │
     ├───────────────┤      │      ├───────────────┤
     │ Keyword       │      │      │ On-Page       │
     │ Researcher    │      │      │ Auditor       │
     │               │      │      │               │
     │ Competitor    │      │      │ Link          │
     │ Analyst       │      │      │ Strategist    │
     │               │      │      │               │
     │ Content       │      │      │ Tech & Schema │
     │ Architect     │      │      │ Auditor       │
     └───────────────┘      │      │               │
                            │      │ Backlink      │
                            │      │ Prospector    │
                            │      └───────────────┘
                            │
                    ┌───────▼────────┐
                    │ Final Assembled│
                    │    Report      │
                    └────────────────┘
```

### Agent Detalji

| Agent ID | Ime | Batch | Opis |
|----------|-----|-------|------|
| `master-director` | Master Director | - | Orkestrator, dispatch-uje task_scope svakom agentu |
| `keyword-researcher` | Keyword Researcher | 1 | Keyword analiza, volumen, difficulty |
| `competitor-analyst` | Competitor Analyst | 1 | Konkurentska analiza, gap-ovi |
| `content-architect` | Content Architect | 1 | Topik klasteri, content arhitektura |
| `on-page-auditor` | On-Page Auditor | 2 | Meta tag-ovi, heading-i, kvalitet |
| `link-strategist` | Link Strategist | 2 | Internal/external link strategija |
| `tech-schema-auditor` | Tech & Schema Auditor | 2 | Schema markup, robots.txt, brzina |
| `backlink-prospector` | Backlink Prospector | 2 | Backlink prilike, outreach |

### 4-Step JSON Protokol

1. **Frontend** šalje `AnalysisInitPayload` → Backend inicijalizuje
2. **Master Director** dispatch-uje `task_scope` svakom sub-agentu
3. **Sub-agenti** vraćaju strict `AgentResponse` (findings + recommended_actions)
4. **Master Director** sastavlja `FinalAssembledReport` → Baza

### Kontekst Optimizacija ("Scrape Once, Read Many")

Svaki agent prima samo kontekst koji mu treba:

| Agent | Kontekst |
|-------|----------|
| Keyword Researcher | meta_data, raw_text_content, search_context |
| Competitor Analyst | meta_data, search_context |
| Content Architect | meta_data, raw_text_content, structured_elements |
| On-Page Auditor | meta_data, raw_text_content, structured_elements |
| Link Strategist | structured_elements.links |
| Tech & Schema | meta_data, structured_elements.schema_markup |
| Backlink Prospector | search_context |

---

## 7. AI Router — Smart Model Routing

### Task-Based Model Selection

| Task | Najbolji Model | Zašto |
|------|----------------|-------|
| `scoring` | Gemini Flash | Brz, jeftin, dobar sa brojevima |
| `entity_extraction` | Groq Llama 3.1 70B | Brz, strukturirani output |
| `summarization` | Groq Llama 3.1 70B | Brzina + kvalitet |
| `long_report` | Gemini Pro | Huge context window (2M) |
| `strategy` | OpenAI GPT-4o | Najbolje rezonovanje |
| `code` | DeepSeek V3 | Code-specijalizovan |
| `reasoning` | OpenAI GPT-4o | Complex chain-of-thought |
| `classification` | Groq Llama 3.1 8B | Brza klasifikacija |
| `chat` | Groq Llama 3.1 70B | Brzina + kvalitet |
| `embedding` | Gemini Flash | Embedding generacija |

### Tier-Based Budget Engine

| Tier | Dozvoljeni Provider-i | Max Cost/Call | Prefer Free |
|------|----------------------|---------------|-------------|
| `free_trial` | Groq, Gemini, OpenRouter, ZAI, Ollama | $0.00 | Da |
| `starter` | Groq, Gemini, OpenRouter, ZAI, Ollama | $0.00 | Da |
| `pro` | Svi + OpenAI | $0.05 | Ne |
| `managed` | Svi + OpenAI | $0.50 | Ne |

### Fallback Chain

```
Groq → Gemini → OpenRouter → OpenAI → ZAI → Ollama → Simulation
```

Ako svi provider-i ne uspeju, vraća se `status: "simulation"` sa hardkodiranim podacima.

### Data Status Flag-ovi

| Status | Značenje |
|--------|----------|
| `live` | Realan LLM odgovor |
| `estimated` | LLM odgovor sa značajnom obradom |
| `simulation` | Hardkodirani fallback podaci |

---

## 8. Autentifikacija & Autorizacija

### JWT Sesije (jose + bcrypt)

- **Algoritam:** HS256
- **Trajanje:** 7 dana
- **Storage:** Cookie `seosights_session`
- **Tier Cookie:** `seosights_tier` (plain string: "pro", "starter", itd.)

### Role-ovi

| Role | Pristup |
|------|---------|
| `user` | Standardni korisnik, audit, dashboard |
| `agency` | Multi-brand dashboard, white-label |
| `affiliate` | Affiliate portal, statistika |
| `superadmin` | CEO/Retention/Activation dashboard, settings |

### Flow

1. `POST /api/auth/register` → Kreira User + Session → Vraća token cookie
2. `POST /api/auth/login` → Proverava bcrypt hash → Vraća token cookie
3. `GET /api/auth/me` → Dekoduje JWT → Vraća korisnika
4. `POST /api/auth/logout` → Briše session iz DB + cookie

---

## 9. Billing & Stripe Integracija

### Planovi

| Plan | Cena/mes | Max Domena | Audit/mes | Token Cap | White-Label | API |
|------|----------|------------|-----------|-----------|-------------|-----|
| **Free Trial** | $0 | 1 | 3 | $2 | Ne | Ne |
| **Starter** | $9.90 | 1 | 10 | $5 | Ne | Ne |
| **Pro** | $79 | 20 | 100 | $40 | Da | Da |
| **Managed** | $199 | 999 | 9999 | $150 | Da | Da |

### Stripe Flow

1. `POST /api/stripe/checkout` → Kreira Checkout Session sa Price ID
2. Korisnik plaća na Stripe → Webhook `checkout.session.completed`
3. `POST /api/webhooks/stripe` → Kreira/aktivira User subscription
4. `POST /api/billing/portal` → Redirect na Stripe Customer Portal

### Price ID-jevi (Environment Varijable)

```
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_MANAGED_PRICE_ID=price_xxx
```

---

## 10. Plan Limits & Kill-Switch

### Limit Dimenzije

| Dimenzija | Opis |
|-----------|------|
| `max_domains` | Broj web sajtova (projekata) |
| `max_tracked_queries` | Broj keyword/phrase upita |
| `max_audits_per_month` | Broj kompletnih 8-agent audit-a |
| `agents_enabled` | Koji agenti su dostupni |
| `allow_white_label` | White-label izveštaji |
| `monthly_cost_cap` | Max USD za LLM token-e mesečno |
| `priority_support` | Prioritetni support |
| `api_access` | API pristup za integracije |

### Kill-Switch Logika

Pre svakog sub-agent LLM poziva:

1. Sumiraj `cost_usd` iz `token_usage_logs` za tekući mesec
2. Uporedi sa `monthly_cost_cap` za korisnikov tier
3. Ako cap prekoračen → **PAUZIRAJ** agente, obavesti korisnika

**Primer:** Starter ($9.90/mes) → $5 cap. Ako su agenti već potrošili $5.01, sistem pauzira i prikazuje "Upgrade to Pro".

### API za Proveru

```typescript
// Provera svih limita odjednom
const result = await checkAllLimits(userId)
// result.allowed, result.checks.subscription, result.checks.auditLimit, result.checks.costCap
```

---

## 11. Rate Limiting & Middleware

### Per-Minute Rate Limiting

| Tier | Req/min |
|------|---------|
| `free_trial` | 10 |
| `starter` | 30 |
| `pro` | 100 |
| `managed` | 300 |
| `superadmin` | 1000 |

### Daily Audit Limit

- **Besplatni/neregistrovani:** 3 audit-a po IP dnevno
- **Plaćeni korisnici:** Bez dnevnog limita

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710000000
X-DailyAudit-Limit: 3
X-DailyAudit-Remaining: 1
```

### Isključeni iz Rate Limiting-a

- `/api/webhooks/*` — Imaju sopstvenu auth (signatures)
- `/api/auth/*` — Ne smeju biti agresivno limitirani
- `/api/route` — Health check

---

## 12. Superadmin Panel

### Dashboard-ovi

#### CEO Dashboard
Funnel metrike u realnom vremenu:

```
Visitors Today → Free Audits → Registrations → Completed Audits → Activated Users → Paid Users → MRR
```

API: `GET /api/superadmin/ceo-metrics`

#### Retention Dashboard
D1, D7, D30 retention koorti:

```
"Ako D1 nije iznad 40%, ništa drugo nije bitno."
```

API: `GET /api/superadmin/retention`

#### Activation Dashboard
Aktivacioni funnel:

```
Audit → Connect GSC → Execute Fix → Return Tomorrow
```

API: `GET /api/superadmin/activation`

#### Event Tracker
Svi korisnički eventi u realnom vremenu:

| Event | Opis |
|-------|------|
| `started_audit` | Korisnik započeo audit |
| `completed_audit` | Audit završen |
| `viewed_replay` | Pregledan Visibility Replay |
| `opened_diff` | Otvoren Recommendation Diff |
| `connected_wordpress` | Povezan WordPress |
| `executed_fix` | Izvršen Auto Fix |
| `opened_digest` | Otvoren Email Digest |
| `clicked_upgrade` | Klik na Upgrade |
| `connected_gsc` | Povezan Google Search Console |
| `registered` | Novi korisnik |
| `activated` | Korisnik aktiviran |
| `paid` | Korisnik platio |

API: `GET/POST /api/superadmin/events`

#### P1 Overview
Pregled P1 feature metrika.

API: `GET /api/superadmin/p1-overview`

### Pristup

- URL: `/superadmin-portal`
- Login: `/superadmin-portal/login`
- Auth: `POST /api/superadmin/auth`
- Provera: `GET /api/superadmin/check`

---

## 13. P0 Moduli (AI Visibility)

Ovo su core dashboard widgeti koji koriste realne podatke iz baze:

| Widget | Opis | API |
|--------|------|-----|
| **AI Mission Control** | Centralni kontrolni panel | `/api/ai/mission-control` |
| **AI Diff** | Preporučeni diff-ovi pre/posle | `/api/ai/diff` |
| **Competitor Race** | Upoređenje sa konkurencijom | `/api/ai/competitor-race` |
| **Sticky AI Visibility Score** | Score koji prati korisnika | `/api/ai/visibility-score` |
| **AI Index Status** | Da li je sajt indeksiran | `/api/ai/index-status` |

---

## 14. P1 Moduli (Sledeći Sprint)

| Feature | Opis | Status |
|---------|------|--------|
| **AI Visibility Replay™** | Timeline replay svih promena | Landing → Full funkcionalan |
| **AI Recommendation Recorder™** | Snimanje diff-ova AI preporuka | Landing → Full funkcionalan |
| **Auto Execute™** | Automatsko izvršavanje na WP/Webflow | Landing → Full funkcionalan |
| **ROI Opportunity Queue™** | Prioritizovani queue po ROI | Landing → Full funkcionalan |
| **Email Digest** | "What changed overnight?" | Landing → Full funkcionalan |

### P1 DB Modeli

Svi P1 modeli su već u Prisma schema-i:
- `ReplaySession` — Replay timeline sesije
- `RecommendationSnapshot` — Snapshot AI preporuka
- `RecommendationDiff` — Before/after diff
- `ActionItem` — Akcije sa ROI scoring
- `AutoExecution` — Automatsko izvršavanje
- `EmailDigest` — Digest email-ovi

---

## 15. Landing Page & Marketing

### Sekcije (40+ komponenti)

| Sekcija | Komponenta | Opis |
|---------|------------|------|
| Hero | `HeroSection` | Main CTA sa URL input-om |
| Features | `FeaturesSection` | Ključne mogućnosti |
| How It Works | `HowItWorksSection` | 3-koraka proces |
| Stats | `StatsSection` | Brojevi i metrike |
| Social Proof | `SocialProofSection` | Testimonial-i |
| Pricing | `PricingSection` | 4 plana |
| Comparison | `ComparisonSection` | Seosights vs konkurencija |
| Integrations | `IntegrationsSection` | CMS/platform integracije |
| CTA | `CTASection` | Finalni call-to-action |
| Free Tools | `FreeToolsSection` | Besplatni SEO alati |
| Build in Public | `BuildInPublicSection` | Transparentni razvoj |
| June Stack | `JuneStackSection` | Tech stack |
| Agent OS | `AgentOSSection` | 8-Agent sistem |
| Roadmap | `RoadmapChecklist` | Razvojni roadmap |

### AI Visibility Landing Sekcije

| Sekcija | Opis |
|---------|------|
| `AIVisibilityScoreSection` | AI Visibility Score objašnjenje |
| `AIVisibilityTimeline` | Timeline promena |
| `AIVisibilityMap` | Vizuelna mapa vidljivosti |
| `AIVisibilityForecast` | Prognoza score-a |
| `AIVisibilityReplay` | Replay feature preview |
| `AIStickyScore` | Sticky score widget |
| `AIDiff` | Diff preview |
| `AIDailyFeedSection` | Daily feed preview |
| `AIRevenueCalculator` | Kalkulator prihoda |
| `AIRecommendationSimulator` | Simulacija preporuka |
| `AIRecommendationRecorder` | Recorder preview |
| `AIMissionControl` | Mission control preview |
| `AIActionCenterSection` | Action center preview |
| `AIAutoExecute` | Auto Execute preview |
| `AICompetitorRace` | Competitor race preview |
| `AICompetitorWarRoom` | War room preview |
| `AIInfluenceGraph` | Influence graf |
| `AICitationExplorer` | Citat explorer |
| `AIIndexStatus` | Index status |
| `AIOpportunityFinder` | Opportunity finder |
| `AIOpportunityQueue` | Queue preview |
| `AIEmailDigest` | Digest preview |

---

## 16. Mini Servisi

### agent-stream (Port 3003)

**Svrha:** Real-time WebSocket server za live agent progress streaming.

| Endpoint | Method | Opis |
|----------|--------|------|
| `/` (Socket.IO) | WS | WebSocket konekcija |
| `/emit` | POST | Emitovanje event-a |
| `/health` | GET | Health check |
| `/sessions/:id` | GET | Sesija detalji |

**Event-ovi:**

| Event | Opis |
|-------|------|
| `agent:start` | Agent počeo rad |
| `agent:progress` | Progress update |
| `agent:complete` | Agent završio |
| `agent:error` | Agent greška |
| `analysis:start` | Analiza počela |
| `analysis:complete` | Analiza završena |
| `analysis:error` | Analiza greška |
| `session:replay` | Late-joiner replay |

**In-Memory Store:** Last 100 events po sesiji, 2-satni TTL.

### audit-worker (Port 3004)

**Svrha:** Background worker koji pokreće 8 AI agenata za SEO analizu.

**Pattern:** BullMQ Producer-Worker
1. Next.js API kreira `Analysis` record → Dodaje job u BullMQ queue
2. Worker pokupi job → Pokreće agente → Komunicira preko DB + WebSocket

**Faze:**
1. Data Gathering → Scraping
2. Strategy → Batch 1 agenti
3. Audit → Batch 2 agenti
4. Structure → Topik klasteri
5. Creative → Content brief-ovi
6. Measure → KPI tracking

---

## 17. Chrome Ekstenzija

**Lokacija:** `extensions/chrome-seosights/`

| Fajl | Opis |
|------|------|
| `manifest.json` | Extension manifest (Manifest V3) |
| `background.js` | Service worker za background task-ove |
| `content.js` | Content script — injektuje se u stranice |
| `popup.js` | Popup UI logika |
| `options.js` | Options page logika |
| `popup.html` | Popup HTML |
| `options.html` | Options HTML |
| `styles.css` | Stilovi |

**Mogućnosti:**
- AI Visibility Score prikaz u browser-u
- Entity Score za trenutnu stranicu
- Quick audit pokretanje
- Notifikacije za promene score-a

---

## 18. WordPress Plugin

**Lokacija:** `plugins/wordpress-seosights/`

| Fajl | Opis |
|------|------|
| `seosights.php` | Glavni plugin fajl |
| `uninstall.php` | Cleanup pri deinstalaciji |
| `readme.txt` | WordPress.org readme |
| `includes/class-seosights-core.php` | Core funkcionalnost |
| `includes/class-seosights-admin.php` | Admin panel |
| `includes/class-seosights-api.php` | API komunikacija |

**Mogućnosti:**
- Auto Execute — direktno izvršavanje SEO fix-ova
- Schema markup dodavanje
- robots.txt ažuriranje
- Content publikovanje
- llms.txt generisanje

---

## 19. Komponente (130+ React)

### Po Kategoriji

| Kategorija | Broj | Ključne Komponente |
|------------|------|-------------------|
| **UI (shadcn)** | 45 | Button, Card, Dialog, Form, Table, Tabs, Toast, Tooltip, Chart, etc. |
| **Landing** | 40+ | HeroSection, FeaturesSection, PricingSection, AI* sekcije |
| **Dashboard** | 30 | KPIWidgets, MissionControlPanel, CompetitorRacePanel, etc. |
| **Superadmin** | 7 | CEODashboard, RetentionDashboard, ActivationDashboard, etc. |
| **Auth** | 2 | RegistrationDialog, AgencyRegistrationDialog |
| **Billing** | 1 | PricingCard |
| **Site** | 5 | SiteHeader, SiteFooter, SiteShell, NewsletterForm, IconRenderer |

### Dashboard Widgeti (Detalji)

| Widget | Opis | Ključna Funkcionalnost |
|--------|------|----------------------|
| `KPIWidgets` | SEO/AEO/GEO score kartice | Score prikaz, trend strelice |
| `MissionControlPanel` | Centralni komandni centar | Status agenata, progress |
| `AIVisibilityChart` | Graf vidljivosti | Line chart po engine-u |
| `AIVisibilityFeed` | Live feed događaja | Real-time notifikacije |
| `CompetitorRacePanel` | Upoređenje sa konkurencijom | Bar chart, gap analiza |
| `DiffPanel` | Pre/posle diff-ovi | Side-by-side prikaz |
| `EntityGraphBuilder` | Entity graf | Vizuelni graf entiteta |
| `EntityHealth` | Entity zdravlje | Score po dimenzijama |
| `GSCPanel` | Google Search Console | Podaci iz GSC |
| `IndexStatusPanel` | Index status | ChatGPT/Claude/Gemini status |
| `IndustryBenchmarks` | Industrijski benchmark-ovi | Upoređenje sa industrijom |
| `LiveAgentStatus` | Status agenata | Live progress bar-ovi |
| `OneClickFix` | One-click SEO fix | Lista predloženih fix-ova |
| `PromptRankTracker` | Prompt rangiranje | Praćenje pozicija |
| `StickyScoreWidget` | Sticky score | Floating AI Visibility Score |
| `StrategyRoadmap` | Strategijski roadmap | 12-mesečni plan |
| `UsageIndicator` | Korišćenje resursa | Progres bar za limit |
| `WebhooksPanel` | Webhook upravljanje | CRUD za webhook-e |
| `CitationVelocityHeatmap` | Heatmap citata | Vizuelni heatmap |
| `CompetitorCitationGap` | Gap analiza | Citat gap sa konkurencijom |
| `CMSIntegrationPanel` | CMS integracija | WordPress/Webflow konekcija |
| `AgencySettingsPanel` | Agency podešavanja | White-label konfiguracija |
| `MultiBrandDashboard` | Multi-brand prikaz | Switch između brendova |
| `AdvancedAITools` | Napredni AI alati | Simulator, kalkulator |
| `AiffiliatePortal` | Affiliate portal | Zarada, referral-i |
| `PendingApprovalsPanel` | Pending odobrenja | Human-in-the-loop |
| `AICrawlLogs` | AI crawl log-ovi | Log analizator |
| `AIContentGap` | Content gap analiza | AI-generated gap-ovi |
| `AIContentSimulator` | Content simulator | Simulacija sadržaja |
| `AIActionCenter` | Akcioni centar | Lista AI predloga |

---

## 20. State Management

### Zustand Global Store

**Lokacija:** `src/lib/store.ts`

```typescript
interface AppState {
  view: 'landing' | 'analyzing' | 'dashboard'  // Trenutni view
  targetUrl: string                              // URL za analizu
  targetMarket: string                           // Tržište (default: 'Global')
  analysis: SEOAnalysis | null                   // Rezultat analize
  analysisProgress: number                       // 0-100 progres
  analysisStep: string                           // Trenutni korak
  analysisError: string                          // Greška
  activeAgent: string | null                     // Aktivni agent
  sessionId: string                              // Sesija ID
  mode: 'auto-pilot' | 'co-pilot'              // Režim rada
  pendingApprovals: Approval[]                   // Human-in-the-loop
  currentAnalysisId: string | null               // ID trenutne analize
  analysisEngine: 'sse' | 'queue'               // Engine (SSE vs BullMQ)
  jobId: string | null                           // BullMQ job ID
  jobStatus: 'idle' | 'queued' | 'active' | 'completed' | 'failed' | 'unknown'
}
```

### SEOAnalysis Tip (Kompletna Struktura)

Analiza sadrži:

| Sekcija | Opis |
|---------|------|
| `overallScores` | SEO, AEO, GEO, Combined score (0-100) |
| `audit` | Technical SEO, Crawlability, PageSpeed, Indexation, AEO Readiness, GEO Visibility |
| `eeat` | E-E-A-T analiza (Experience, Expertise, Authoritativeness, Trustworthiness) |
| `geoCitability` | 5 dimenzije citabilnosti za GEO |
| `aiCrawler` | AI bot pristup, robots.txt, llms.txt, JS rendering |
| `brandMentions` | Brand mention score, platform presence |
| `contentQuality` | AI pattern risk, humanization tips |
| `parasiteRisk` | Parasite SEO risk assessment |
| `localSEO` | GBP signals, NAP consistency, reviews |
| `sxo` | Search Experience Optimization |
| `structure` | Topic clusters, keyword gaps, content architecture, schema recommendations |
| `creative` | Content briefs, on-page optimizations, answer blocks |
| `measure` | KPI tracking, competitor benchmarks, weekly actions |
| `deepStrategy` | Technical implementations, backlink outreach, content calendar |
| `summary` | Executive summary |
| `executiveActions` | Top 5 prioritizovanih akcija |

---

## 21. Scraping Arhitektura

### "Scrape Once, Read Many"

**Lokacija:** `src/lib/scraper.ts` (808 linija)

**Princip:**
1. Scrape website JEDNOM → Očisti HTML → Strukturirani JSON
2. Keširaj (in-memory / Redis) → Svi agenti čitaju iz keša
3. Svaki agent dobija samo kontekst koji mu treba → Do 70% manje token-a

### ScrapedSharedContext Struktura

```typescript
interface ScrapedSharedContext {
  meta_data: {
    title, description, robots_txt, llms_txt_exists, url, domain
  }
  raw_text_content: string           // Max 6000 chars
  structured_elements: {
    headings: Record<string, string[]>
    links: string[]
    schema_markup: {
      has_faq, has_organization, has_article, has_product,
      has_local_business, detected_types
    }
  }
  search_context: {
    competitor_results: Array<{name, url, snippet}>
    ai_citation_results: Array<{name, url, snippet}>
    local_seo_results: Array<{name, url, snippet}>
  }
}
```

---

## 22. Email & Webhook Sistem

### Email (Resend)

**Lokacija:** `src/lib/email.ts`

- **Provider:** Resend
- **Tipovi:** Digest, notifikacije, welcome, upgrade
- **Digest tipovi:** overnight, weekly, monthly

### Webhook Dispatcher

**Lokacija:** `src/lib/webhook-dispatcher.ts`

Podržani tip-ovi:
- `slack` — Slack incoming webhook
- `discord` — Discord webhook
- `custom` — Custom HTTP endpoint

Event-ovi za webhook:
- `analysis.completed`
- `visibility.score_changed`
- `citation.gained` / `citation.lost`
- `alert.triggered`
- `auto_execute.success` / `auto_execute.failed`

---

## 23. Affiliate Program

**Lokacija:** `src/lib/affiliate.ts`

### 5-Tier Komisiona Struktura

| Tier | Aktivnih Referral-a | Provizija |
|------|---------------------|-----------|
| 1 | 1-10 | 10% |
| 2 | 11-25 | 20% |
| 3 | 26-50 | 30% |
| 4 | 51-100 | 40% |
| 5 | 100+ | 50% |

### Karakteristike

- **Lifetime recurring** — Provizija se nastavlja dok korisnik plaća
- **Stripe Transfers** — Automatske isplate preko Stripe Connect
- **Affiliate Code** — Custom kod (npr. "marko10")
- **Landing Page** — `/affiliates` sa prijavom i statistikom

---

## 24. CMS Integracija

**Lokacija:** `src/lib/cms-publish.ts`

### Podržane Platforme

| Platform | Status | Mogućnosti |
|----------|--------|------------|
| **WordPress** | Aktivan | Schema, meta tag-ovi, robots.txt, content publish |
| **Webflow** | Aktivan | Meta tag-ovi, content update |
| **Shopify** | Aktivan | Product schema, meta description |

### API Endpoints

- `POST /api/cms/publish` — Publikovanje na CMS
- `POST /api/cms/save-credentials` — Čuvanje API kredencijala
- `POST /api/cms/test-connection` — Test konekcije

---

## 25. Deployment & DevOps

### Vercel Deployment

- **Auto-deploy** sa GitHub push na `main` branch
- **vercel.json** konfiguracija za duge timeout-e (300s za analizu)

### Caddy Gateway

**Lokacija:** `Caddyfile`

```caddy
:81 {
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

### Port Mapiranje

| Port | Servis |
|------|--------|
| 81 | Caddy Gateway (externi) |
| 3000 | Next.js App |
| 3003 | agent-stream (Socket.IO) |
| 3004 | audit-worker (BullMQ) |

### XTransformPort Pravilo

Svi API zahtevi ka drugim portovima MORAJU koristiti `?XTransformPort=PORT` query parametar:

```
✅ /api/test?XTransformPort=3030
❌ http://localhost:3030/api/test
```

Za WebSocket:
```
✅ io("/?XTransformPort=3003")
❌ io("http://localhost:3003")
```

---

## 26. Konfiguracija (Environment Variables)

### Obavezne

| Varijabla | Opis |
|-----------|------|
| `DATABASE_URL` | SQLite/Turso konekcioni string |
| `JWT_SECRET` | Tajni ključ za JWT token-e |
| `STRIPE_SECRET_KEY` | Stripe API tajni ključ |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID za Starter |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID za Pro |
| `STRIPE_MANAGED_PRICE_ID` | Stripe Price ID za Managed |

### AI Provider Ključevi

| Varijabla | Opis |
|-----------|------|
| `GROQ_API_KEY` | Groq API ključ (free tier) |
| `GEMINI_API_KEY` | Google Gemini API ključ |
| `OPENROUTER_API_KEY` | OpenRouter API ključ |
| `OPENAI_API_KEY` | OpenAI API ključ (paid) |

### Ostalo

| Varijabla | Opis |
|-----------|------|
| `RESEND_API_KEY` | Resend email API ključ |
| `REDIS_URL` | Redis konekcioni string (BullMQ) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook tajna |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

### DB-Backed Settings (SystemSetting Model)

Svi ovi mogu biti prebrisani iz Superadmin Settings panela:

- `stripe_secret_key`
- `stripe_starter_price_id`
- `stripe_pro_price_id`
- `stripe_managed_price_id`
- `openai_api_key`
- `groq_api_key`
- `gemini_api_key`
- `resend_api_key`

---

## 27. Folder Struktura

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (dark theme, AuthProvider, JSON-LD)
│   ├── page.tsx                            # Home → Superadmin dashboard
│   ├── globals.css                         # Global styles
│   ├── blog/                               # Blog sekcija
│   │   ├── page.tsx + blog-hub-client.tsx
│   │   └── [slug]/page.tsx + blog-post-client.tsx
│   ├── pricing/                            # Pricing stranica
│   ├── affiliates/                         # Affiliate stranica
│   ├── free-ai-seo-tools/                  # Besplatni alati
│   │   ├── page.tsx + free-tools-hub-client.tsx
│   │   └── [slug]/page.tsx + tool-page-client.tsx
│   ├── superadmin-portal/                  # Superadmin panel
│   │   ├── page.tsx
│   │   └── login/page.tsx
│   └── api/                                # 70+ API endpoint-a
│       ├── auth/                           # Autentifikacija
│       ├── ai/                             # AI Visibility & Akcije
│       ├── admin/                          # Admin upravljanje
│       ├── superadmin/                     # Superadmin dashboard-i
│       ├── billing/                        # Stripe billing
│       ├── webhooks/                       # Webhook upravljanje
│       ├── cms/                            # CMS integracija
│       ├── affiliate/                      # Affiliate program
│       ├── cron/                           # Cron job-ovi
│       ├── dashboard/                      # Dashboard widget-i
│       └── ...                             # Ostali endpoint-i
│
├── components/
│   ├── ui/                                 # 45 shadcn/ui komponenti
│   ├── landing/                            # 40+ landing sekcija
│   ├── dashboard/                          # 30 dashboard widget-a
│   ├── superadmin/                         # 7 admin komponenti
│   ├── auth/                               # 2 auth komponente
│   ├── billing/                            # 1 billing komponenta
│   └── site/                               # 5 site komponenti
│
├── lib/
│   ├── db.ts                               # Prisma client
│   ├── auth.ts                             # JWT auth (jose + bcrypt)
│   ├── auth-context.tsx                    # React auth provider
│   ├── ai-router.ts                        # Smart LLM routing
│   ├── agents.ts                           # 8-Agent definicije
│   ├── agent-protocol.ts                   # Agent komunikacioni protokol
│   ├── agent-fallback.ts                   # Ollama local fallback
│   ├── scraper.ts                          # "Scrape Once, Read Many"
│   ├── store.ts                            # Zustand global state
│   ├── stripe.ts                           # Stripe billing
│   ├── redis.ts                            # Redis/ioredis client
│   ├── email.ts                            # Email (Resend)
│   ├── pdf-generator.ts                    # jsPDF izveštaji
│   ├── utils.ts                            # cn() utility
│   ├── settings.ts                         # DB-backed settings
│   ├── plan-limits.ts                      # Tier limits + Kill-Switch
│   ├── webhook-dispatcher.ts               # Webhook dispatch
│   ├── cms-publish.ts                      # CMS publishing
│   ├── affiliate.ts                        # Affiliate logika
│   ├── audit-queue.ts                      # BullMQ job queue
│   ├── token-tracker.ts                    # Token usage tracking
│   ├── shared-context.ts                   # Shared agent kontekst
│   ├── client-zero-topics.ts               # Client zero (churn)
│   └── zai.ts                              # ZAI SDK wrapper
│
├── hooks/
│   ├── use-toast.ts                        # Toast hook
│   └── use-mobile.ts                       # Mobile detection
│
├── data/
│   ├── blog-posts.ts                       # Statički blog podaci
│   └── free-tools.ts                       # Besplatni alati listing
│
└── middleware.ts                            # Rate limiting + daily audit limit
```

---

## 28. Razvojni Workflow

### Komande

| Komanda | Opis |
|---------|------|
| `bun run dev` | Pokreće dev server na portu 3000 |
| `bun run build` | Produktivni build (standalone) |
| `bun run lint` | ESLint provera |
| `bun run db:push` | Push schema u bazu |
| `bun run db:generate` | Generiše Prisma client |
| `bun run db:migrate` | Pokreće migracije |
| `bun run db:seed` | Seed-uje bazu |

### Mini Servisi

```bash
cd mini-services/agent-stream && bun run dev   # Port 3003
cd mini-services/audit-worker && bun run dev   # Port 3004
```

### Git Workflow

```bash
git add .
git commit -m "feat: opis"
git push origin main  # Auto-deploy na Vercel
```

### Build Provera

```bash
bun run lint           # ESLint
bun run db:push        # Schema sync
```

---

## Statistika Projekta

| Metrika | Vrednost |
|---------|----------|
| **API Endpoint-i** | 70+ |
| **Prisma Modeli** | 30 |
| **React Komponente** | 130+ |
| **Landing Sekcije** | 40+ |
| **Dashboard Widget-i** | 30 |
| **UI Komponente (shadcn)** | 45 |
| **Mini Servisi** | 2 |
| **Browser Ekstenzije** | 1 |
| **WordPress Plugin** | 1 |
| **LLM Provider-i** | 6 |
| **Linija Koda** | ~25,000+ |

---

*Dokumentacija generisana automatski za Seosights v0.2.0*
*Poslednje ažuriranje: Mart 2025*
