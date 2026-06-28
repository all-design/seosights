const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableOfContents, SectionType, NumberFormat,
  TabStopPosition, TabStopType
} = require("docx");
const fs = require("fs");

// ═══════════════════════════════════════════════════════════════
// PALETTE — DM-1 Deep Cyan (Tech/AI) with emerald-green custom theme
// ═══════════════════════════════════════════════════════════════
const P = {
  primary: "#0B1C2C",
  body: "#1A2B40",
  secondary: "#5A6A80",
  accent: "#10B981",     // Emerald green — Seosights brand
  surface: "#ECFDF5",    // Very light emerald
  // Cover
  bg: "0B1C2C",
  coverTitle: "FFFFFF",
  coverSubtitle: "B0B8C0",
  coverMeta: "90989F",
  coverFooter: "687078",
  // Table
  tableHeaderBg: "065F46",   // Dark emerald
  tableHeaderText: "FFFFFF",
  tableAccentLine: "10B981",
  tableInnerLine: "C6D9D0",
  tableSurface: "F0FDF4",
  // Code
  codeBg: "F1F5F9",
  codeText: "1E293B",
};

const c = (hex) => hex.replace("#", "");

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function safeText(val, placeholder) {
  if (val === undefined || val === null || val === "" || String(val) === "NaN") {
    return placeholder || "";
  }
  return String(val);
}

function heading(text, level = HeadingLevel.HEADING_1) {
  const sizeMap = {
    [HeadingLevel.HEADING_1]: 32,
    [HeadingLevel.HEADING_2]: 28,
    [HeadingLevel.HEADING_3]: 24,
  };
  const size = sizeMap[level] || 28;
  return new Paragraph({
    heading: level,
    spacing: {
      before: level === HeadingLevel.HEADING_1 ? 480 : level === HeadingLevel.HEADING_2 ? 360 : 240,
      after: 120,
      line: Math.ceil((size / 2) * 23),
      lineRule: "atLeast"
    },
    keepNext: true,
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: size,
      color: c(P.primary),
      font: { ascii: "Times New Roman", eastAsia: "SimHei" }
    })],
  });
}

function bodyText(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({
      text: safeText(text),
      size: 24,
      color: c(P.body),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    })],
  });
}

function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: 24,
      color: c(P.body),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    })],
  });
}

function bodyMixed(runs) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: runs.map(r => {
      if (typeof r === 'string') {
        return new TextRun({
          text: r,
          size: 24,
          color: c(P.body),
          font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
        });
      }
      return new TextRun({
        text: safeText(r.text),
        bold: r.bold || false,
        italics: r.italics || false,
        size: 24,
        color: c(P.body),
        font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
      });
    }),
  });
}

function bulletItem(text, bold_prefix) {
  const children = [];
  if (bold_prefix) {
    children.push(new TextRun({
      text: safeText(bold_prefix),
      bold: true,
      size: 24,
      color: c(P.body),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    }));
  }
  children.push(new TextRun({
    text: safeText(text),
    size: 24,
    color: c(P.body),
    font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
  }));
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 40 },
    indent: { left: 360 },
    children,
  });
}

function codeBlock(lines) {
  const paragraphs = [];
  for (const line of lines) {
    paragraphs.push(new Paragraph({
      spacing: { line: 276, after: 0 },
      indent: { left: 240 },
      shading: { type: ShadingType.CLEAR, fill: c(P.codeBg) },
      children: [new TextRun({
        text: safeText(line),
        size: 20,
        color: c(P.codeText),
        font: { ascii: "Consolas", eastAsia: "Consolas" }
      })],
    }));
  }
  // Add a small spacer after code block
  paragraphs.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  return paragraphs;
}

function spacer(h = 120) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

// ═══════════════════════════════════════════════════════════════
// TABLE BUILDER — Horizontal-Only Business style with emerald theme
// ═══════════════════════════════════════════════════════════════

function makeTable(headers, rows, colWidths) {
  const numCols = headers.length;
  const widths = colWidths || headers.map(() => Math.floor(100 / numCols));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: P.tableHeaderBg },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 276 },
        children: [new TextRun({
          text: safeText(h),
          bold: true,
          size: 21,
          color: P.tableHeaderText,
          font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
        })]
      })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.PERCENTAGE },
      shading: ri % 2 === 0
        ? { type: ShadingType.CLEAR, fill: P.tableSurface }
        : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      margins: { top: 50, bottom: 50, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 276 },
        children: [new TextRun({
          text: safeText(cell),
          size: 21,
          color: c(P.body),
          font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
        })]
      })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.tableAccentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.tableAccentLine },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.tableInnerLine },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ═══════════════════════════════════════════════════════════════
// COVER PAGE — R4-style Top Color Block with emerald theme
// ═══════════════════════════════════════════════════════════════

const allNoBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE },
  insideVertical: { style: BorderStyle.NONE },
};

function buildCover() {
  // Title lines
  const titleLines = ["Seosights", "Kompletna Dokumentacija", "Aplikacije"];
  const subtitle = "The Operating System for AI Visibility | v0.2.0";
  const metaLines = [
    "Verzija: 0.2.0",
    "Datum: Mart 2025",
    "Domen: https://seosights.com",
  ];

  const titleFontSize = 52; // 26pt
  const lineH = Math.ceil(26 * 23);

  const children = [];

  // Title lines
  for (const line of titleLines) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: lineH, lineRule: "atLeast", after: 40 },
      children: [new TextRun({
        text: line,
        bold: true,
        size: titleFontSize,
        color: P.coverTitle,
        font: { ascii: "Times New Roman", eastAsia: "SimHei" }
      })]
    }));
  }

  // Spacer
  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }));

  // Accent line (paragraph border)
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "10B981", space: 1 }
    },
    children: [new TextRun({ text: " ", size: 8, color: P.bg })]
  }));

  // Subtitle
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, lineRule: "atLeast", after: 200 },
    children: [new TextRun({
      text: subtitle,
      size: 28,
      color: P.coverSubtitle,
      italics: true,
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    })]
  }));

  // Spacer
  children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));

  // Meta lines
  for (const meta of metaLines) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 312, after: 40 },
      children: [new TextRun({
        text: meta,
        size: 22,
        color: P.coverMeta,
        font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
      })]
    }));
  }

  // Wrap in full-page table
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        verticalAlign: "top",
        borders: allNoBorders,
        shading: { type: ShadingType.CLEAR, fill: P.bg },
        children: [
          new Paragraph({ spacing: { before: 3600 }, children: [] }),
          ...children,
        ],
      })]
    })]
  });
}

// ═══════════════════════════════════════════════════════════════
// PAGE LAYOUT CONSTANTS
// ═══════════════════════════════════════════════════════════════

const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ═══════════════════════════════════════════════════════════════
// FOOTER with page number
// ═══════════════════════════════════════════════════════════════

function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Seosights Dokumentacija v0.2.0  |  Strana ", size: 16, color: c(P.secondary) }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary) }),
      ]
    })]
  });
}

// ═══════════════════════════════════════════════════════════════
// CONTENT — All 28 chapters
// ═══════════════════════════════════════════════════════════════

function buildBodyContent() {
  const content = [];

  // ═══════════════════════════════════════════════════════════
  // Chapter 1: Pregled Projekta
  // ═══════════════════════════════════════════════════════════
  content.push(heading("1. Pregled Projekta", HeadingLevel.HEADING_1));
  content.push(bodyText("Seosights je SaaS platforma za AI Visibility \u2014 poma\u017ee kompanijama da prate, mere i pobolj\u0161avaju svoju vidljivost u AI pretra\u017eiva\u010dima (ChatGPT, Claude, Gemini, Perplexity, Copilot). Platforma koristi 8-agent AI sistem za kompletnu SEO/AEO/GEO analizu web sajta."));
  content.push(heading("Klju\u010dne Mogu\u0107nosti", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Mogu\u0107nost", "Opis"],
    [
      ["AI Visibility Score", "Real-time scoring 0-100 po AI engine-u"],
      ["8-Agent SEO Audit", "Master Director + 7 sub-agenta za kompletnu analizu"],
      ["Smart AI Router", "Automatski bira najbolji LLM model po zadatku i tier-u"],
      ["AI Visibility Replay\u2122", "Timeline replay svih promena vidljivosti"],
      ["AI Recommendation Recorder\u2122", "Snimanje diff-ova AI preporuka pre i posle"],
      ["Auto Execute\u2122", "Automatsko izvr\u0161avanje fix-ova na WordPress/Webflow/Shopify"],
      ["ROI Opportunity Queue\u2122", "Prioritizovani queue akcija po ROI score-u"],
      ["Email Digest", "What changed overnight? dnevni/weekly/monthly digest"],
      ["Competitor Race", "Upore\u0111enje AI vidljivosti sa konkurencijom"],
      ["Affiliate System", "5-tier provizija (10%\u219250%), lifetime recurring"],
      ["Agency White-Label", "Pro plan sa custom brendiranjem"],
      ["Chrome Extension", "AI Visibility score u browser-u"],
      ["WordPress Plugin", "Direktna integracija sa WP sajtovima"],
    ]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 2: Tehnolo\u0161ki Stack
  // ═══════════════════════════════════════════════════════════
  content.push(heading("2. Tehnolo\u0161ki Stack", HeadingLevel.HEADING_1));
  content.push(heading("Core Framework", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tehnologija", "Verzija", "Namena"],
    [
      ["Next.js", "16.x", "App Router, SSR/SSG, API Routes"],
      ["React", "19.x", "UI biblioteka"],
      ["TypeScript", "5.x", "Tipizirani JavaScript"],
      ["Tailwind CSS", "4.x", "Utility-first styling"],
      ["shadcn/ui", "New York", "Komponentna biblioteka (45+ komponenti)"],
    ],
    [30, 20, 50]
  ));
  content.push(spacer());

  content.push(heading("Backend & Data", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tehnologija", "Namena"],
    [
      ["Prisma ORM", "Database ORM (SQLite lokalno, Turso produkcija)"],
      ["SQLite / Turso", "Baza podataka (libsql)"],
      ["BullMQ + ioredis", "Background job queue za audit worker"],
      ["Socket.IO", "Real-time WebSocket komunikacija"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  content.push(heading("AI & LLM", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Provider", "Modeli", "Namena"],
    [
      ["Groq", "Llama 3.1 70B, 8B, Mixtral", "Ultra-fast free inference"],
      ["Google Gemini", "Flash 1.5, Pro 1.5", "Free tier, huge context"],
      ["OpenRouter", "DeepSeek V3, Llama 3.1", "Free model routing"],
      ["OpenAI", "GPT-4o, GPT-4o-mini", "Paid, highest quality"],
      ["ZAI SDK", "Default", "Sandbox fallback"],
      ["Ollama", "Llama 3", "Local fallback"],
    ],
    [25, 40, 35]
  ));
  content.push(spacer());

  content.push(heading("Payments & Communication", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tehnologija", "Namena"],
    [
      ["Stripe", "Billing, checkout, portal, webhooks"],
      ["Resend", "Email slanje (digest, notifikacije)"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  content.push(heading("State & Forms", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tehnologija", "Namena"],
    [
      ["Zustand 5", "Globalni client state"],
      ["TanStack Query 5", "Server state management"],
      ["React Hook Form 7", "Form handling"],
      ["Zod 4", "Schema validacija"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  content.push(heading("Ostalo", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tehnologija", "Namena"],
    [
      ["Framer Motion", "Animacije i tranzicije"],
      ["Recharts 2", "Chart biblioteka"],
      ["Lucide React", "Ikonice"],
      ["Puppeteer", "Web scraping"],
      ["jsPDF", "PDF generacija izve\u0161taja"],
      ["Sharp", "Image processing"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 3: Arhitektura Sistema
  // ═══════════════════════════════════════════════════════════
  content.push(heading("3. Arhitektura Sistema", HeadingLevel.HEADING_1));
  content.push(...codeBlock([
    "SEOSIGHTS ARCHITECTURE",
    "",
    "  Browser (React) \u2194 Next.js 16 App Router \u2194 API Routes (70+ endpoints)",
    "       |                                     |",
    "       | Socket.IO                  Prisma ORM (SQLite/Turso)",
    "       | (XTransformPort=3003)               |",
    "  agent-stream       audit-worker      AI Router",
    "  (port 3003)        (port 3004)       (6 providers)",
    "  Socket.IO WS       BullMQ + Redis    Task-based",
    "  Live progress      Background        Tier-gated",
    "",
    "  Chrome Ext.    WordPress Pl.    Stripe Billing",
    "  AI Visibility  Auto Execute     4 Tier System",
    "",
    "  Caddy Gateway (:81)",
    "  Default \u2192 :3000 | XTransformPort=3003 \u2192 agent-stream",
    "                    XTransformPort=3004 \u2192 audit-worker",
  ]));
  content.push(heading("Request Flow", HeadingLevel.HEADING_2));
  content.push(bodyText("1. Korisnik otvara stranicu \u2192 Next.js SSR/CSR"));
  content.push(bodyText("2. Analiza \u2192 POST /api/analyze ili POST /api/audit/run"));
  content.push(bodyText("3. Scraper skida stranicu jednom (Scrape Once, Read Many)"));
  content.push(bodyText("4. AI Router bira optimalni LLM po task type + tier"));
  content.push(bodyText("5. 8 Agenata procesiraju u 2 batch-a (Strategy \u2192 Audit)"));
  content.push(bodyText("6. WebSocket \u0161alje live progress preko agent-stream (port 3003)"));
  content.push(bodyText("7. Rezultat se \u010duva u DB + generi\u0161e PDF izve\u0161taj"));
  content.push(bodyText("8. Webhook/Email obave\u0161tava korisnika"));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 4: Baza Podataka (Prisma Schema)
  // ═══════════════════════════════════════════════════════════
  content.push(heading("4. Baza Podataka (Prisma Schema)", HeadingLevel.HEADING_1));
  content.push(heading("Modeli (30 ukupno)", HeadingLevel.HEADING_2));

  content.push(heading("Core Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["User", "Korisnik sa rolom i tier-om", "email, role, tier, stripeCustomerId, agencyName"],
      ["Session", "JWT sesija (7-dnevni exp.)", "token, userId, expiresAt"],
      ["Analysis", "SEO/AEO/GEO analiza", "url, domain, status, mode, result"],
      ["Project", "Multi-projekt tracking", "url, domain, executionMode"],
    ],
    [20, 35, 45]
  ));
  content.push(spacer());

  content.push(heading("AI Agent Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["AgentLog", "Log svakog agent izvr\u0161enja", "agentId, tokensUsed, costUsd, model"],
      ["AgentPrompt", "Konfigurabilni agent prompt-ovi", "systemPrompt, userPromptTemplate, model"],
      ["Approval", "Human-in-the-loop odobrenja", "actionType, actionData, status"],
      ["TokenUsage", "Dnevni agregat token potro\u0161nje", "totalTokens, estimatedCostUsd"],
      ["TokenUsageLog", "Individualni token log", "modelUsed, costUsd, agentName"],
    ],
    [20, 35, 45]
  ));
  content.push(spacer());

  content.push(heading("AI Visibility Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["VisibilitySnapshot", "AI Visibility Score snapshot", "overallScore, perEngine, capturedAt"],
      ["CitationEvent", "AI citiranje doga\u0111aji", "engine, eventType, delta, prompt"],
      ["FeedItem", "Real-time vidljivost feed", "itemType, severity, isRead"],
      ["VisibilityAlert", "Monitoring alert-ovi", "alertType, severity, isRead"],
      ["IndustryBenchmark", "Industrijski benchmark-ovi", "industry, avgAIVisibility, perEngine"],
    ],
    [20, 35, 45]
  ));
  content.push(spacer());

  content.push(heading("P1 Feature Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["ReplaySession", "AI Visibility Replay timeline", "startDate, endDate, highlights"],
      ["RecommendationSnapshot", "AI preporuka snapshot", "prompt, engines, overallScore"],
      ["RecommendationDiff", "Before/after diff", "changes, severity, summary"],
      ["ActionItem", "AI-generisane akcije sa ROI", "priority, roiScore, autoExecuteEnabled"],
      ["AutoExecution", "Automatsko izvr\u0161avanje", "platform, actionType, status, rollbackPayload"],
      ["EmailDigest", "Digest email-ovi", "digestType, scoreDelta, citationsGained"],
    ],
    [22, 35, 43]
  ));
  content.push(spacer());

  content.push(heading("Superadmin Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["AnalyticsEvent", "Event tracking", "event, userId, metadata, createdAt"],
      ["DailyMetric", "Dnevne metrike", "visitors, mrr, d1Retention, d7Retention"],
    ],
    [25, 35, 40]
  ));
  content.push(spacer());

  content.push(heading("Poslovni Modeli", HeadingLevel.HEADING_3));
  content.push(makeTable(
    ["Model", "Opis", "Klju\u010dna Polja"],
    [
      ["Affiliate", "Affiliate program", "affiliateCode, totalEarningsUsd"],
      ["AffiliateReferral", "Referral tracking", "status, firstPaymentAt"],
      ["AffiliatePayout", "Isplate", "amountUsd, percentageApplied, stripeTransferId"],
      ["WebhookConfig", "Webhook integracije", "type (slack/discord/custom), url, events"],
      ["SystemSetting", "Superadmin konfiguracija", "key, value, isSecret, category"],
      ["Lead", "Lead capture", "name, email, website"],
      ["Post", "Blog post-ovi", "title, content, published"],
      ["PromptTemplate", "Prompt biblioteka", "industry, category, prompt"],
    ],
    [22, 35, 43]
  ));
  content.push(spacer());

  content.push(heading("Enum Vrednosti", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "User.role:          user | agency | affiliate | superadmin",
    "User.tier:          free_trial | starter | pro | managed",
    "User.subscriptionStatus: free_trial | active | past_due | canceled",
    "",
    "Analysis.status:    pending | running | completed | failed",
    "Analysis.mode:      auto-pilot | co-pilot",
    "",
    "ActionItem.status:  pending | in_progress | completed | dismissed | queued | auto_executing | auto_executed | auto_failed",
    "ActionItem.priority: low | medium | high | critical",
    "",
    "AutoExecution.platform: wordpress | webflow | shopify | custom",
    "AutoExecution.status: pending | executing | success | failed | rolled_back",
    "",
    "EmailDigest.digestType: overnight | weekly | monthly",
    "EmailDigest.status: pending | sent | failed",
    "",
    "AnalyticsEvent.event: started_audit | completed_audit | viewed_replay | opened_diff | connected_wordpress | executed_fix | opened_digest | clicked_upgrade | connected_gsc | registered | activated | paid",
    "",
    "CitationEvent.engine: chatgpt | claude | gemini | perplexity | copilot",
    "CitationEvent.eventType: cited | uncited | rank_up | rank_down | first_mention | competitor_overtake",
    "",
    "FeedItem.itemType: citation_gained | citation_lost | rank_change | competitor_alert | new_entity | score_milestone | ai_discovery",
    "FeedItem.severity: info | warning | positive | critical",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 5: API Reference
  // ═══════════════════════════════════════════════════════════
  content.push(heading("5. API Reference (70+ Endpointa)", HeadingLevel.HEADING_1));

  content.push(heading("Autentifikacija", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/auth/login", "POST", "Login sa email/password"],
      ["/api/auth/register", "POST", "Registracija novog korisnika"],
      ["/api/auth/register/agency", "POST", "Registracija agencije"],
      ["/api/auth/me", "GET", "Trenutni korisnik"],
      ["/api/auth/logout", "POST", "Logout"],
      ["/api/superadmin/auth", "POST", "Superadmin autentifikacija"],
      ["/api/superadmin/check", "GET", "Provera superadmin statusa"],
    ],
    [35, 15, 50]
  ));
  content.push(spacer());

  content.push(heading("Analiza & Audit", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis", "Timeout"],
    [
      ["/api/analyze", "POST", "Glavna SEO/AEO/GEO analiza", "300s"],
      ["/api/quick-audit", "POST", "Brzi audit", "60s"],
      ["/api/audit/run", "POST", "Pokretanje background audit job-a", "300s"],
      ["/api/audit/[jobId]", "GET", "Status audit job-a", "10s"],
      ["/api/analysis/[id]", "GET", "Preuzimanje analize po ID", "10s"],
      ["/api/analysis/[id]/download-pdf", "GET", "Download PDF izve\u0161taja", "30s"],
      ["/api/report", "POST", "Generisanje izve\u0161taja", "60s"],
    ],
    [35, 12, 38, 15]
  ));
  content.push(spacer());

  content.push(heading("AI Visibility", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/ai/visibility-score", "GET", "AI Visibility Score (0-100)"],
      ["/api/ai/visibility-replay", "GET", "Timeline replay vidljivosti"],
      ["/api/ai/visibility-forecast", "GET", "Prognoza score-a"],
      ["/api/ai/feed", "GET", "Real-time vidljivost feed"],
      ["/api/ai/diff", "GET", "Preporuka diff-ovi"],
      ["/api/ai/benchmarks", "GET", "Industrijski benchmark-ovi"],
      ["/api/ai/index-status", "GET", "AI index status"],
      ["/api/ai/entity-health", "GET", "Entity health scoring"],
      ["/api/ai/citation-explorer", "GET", "Citat exploracija"],
      ["/api/ai/influence-graph", "GET", "Graf uticaja"],
      ["/api/ai/content-gap", "GET", "Content gap analiza"],
    ],
    [35, 12, 53]
  ));
  content.push(spacer());

  content.push(heading("AI Akcije & Strategija", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/ai/mission-control", "GET", "Mission control panel"],
      ["/api/ai/action-center", "GET", "Akcioni itemi"],
      ["/api/ai/opportunity-finder", "GET", "Pretraga prilika"],
      ["/api/ai/opportunity-queue", "GET", "Prioritizovani queue"],
      ["/api/ai/auto-execute", "POST", "Auto-izvr\u0161avanje akcija"],
      ["/api/ai/recommendation-simulator", "POST", "Simulacija AI preporuka"],
      ["/api/ai/recommendation-recorder", "POST", "Snimanje preporuka"],
      ["/api/ai/recommendation-history", "GET", "Istorija preporuka"],
      ["/api/ai/prompt-library", "GET", "Prompt template biblioteka"],
      ["/api/ai/competitor-race", "GET", "Trka sa konkurencijom"],
      ["/api/ai/competitor-war-room", "GET", "War room analiza"],
      ["/api/ai/revenue-calculator", "GET", "Kalkulator uticaja na prihod"],
      ["/api/ai/digest", "POST", "Generisanje email digest-a"],
    ],
    [38, 12, 50]
  ));
  content.push(spacer());

  content.push(heading("Dashboard Widgeti", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/dashboard/one-click-fix", "POST", "One-click SEO fix-ovi"],
      ["/api/dashboard/crawl-logs", "GET", "Crawl log-ovi"],
      ["/api/dashboard/content-simulator", "POST", "Simulacija sadr\u017eaja"],
      ["/api/dashboard/entity-graph", "GET", "Entity graf podaci"],
      ["/api/dashboard/competitor-citation", "GET", "Konkurentski citati"],
      ["/api/dashboard/prompt-rank", "GET", "Prompt rangiranje"],
    ],
    [38, 12, 50]
  ));
  content.push(spacer());

  content.push(heading("Billing (Stripe)", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/stripe/checkout", "POST", "Kreiranje Stripe checkout"],
      ["/api/billing/create-checkout-session", "POST", "Checkout sesija"],
      ["/api/billing/portal", "POST", "Billing portal"],
      ["/api/billing/subscription", "GET", "Status pretplate"],
      ["/api/webhooks/stripe", "POST", "Stripe webhook handler"],
    ],
    [38, 12, 50]
  ));
  content.push(spacer());

  content.push(heading("Webhooks", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/webhooks", "GET/POST", "Lista/Kreiranje webhook-a"],
      ["/api/webhooks/[id]", "GET/PUT/DELETE", "CRUD za webhook"],
    ],
    [38, 18, 44]
  ));
  content.push(spacer());

  content.push(heading("CMS Integracija", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/cms/publish", "POST", "Publikovanje na CMS"],
      ["/api/cms/save-credentials", "POST", "\u010cuvanje CMS kredencijala"],
      ["/api/cms/test-connection", "POST", "Test CMS konekcije"],
    ],
    [38, 12, 50]
  ));
  content.push(spacer());

  content.push(heading("Superadmin", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/superadmin/ceo-metrics", "GET", "CEO dashboard metrike"],
      ["/api/superadmin/retention", "GET", "D1/D7/D30 retention podaci"],
      ["/api/superadmin/activation", "GET", "Aktivacioni funnel podaci"],
      ["/api/superadmin/events", "GET/POST", "Analytics eventi"],
      ["/api/superadmin/p1-overview", "GET", "P1 feature overview"],
      ["/api/superadmin/settings", "GET/PUT", "Sistemska pode\u0161avanja"],
    ],
    [38, 14, 48]
  ));
  content.push(spacer());

  content.push(heading("Admin", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/admin/analyses", "GET", "Lista analiza"],
      ["/api/admin/users", "GET", "Lista korisnika"],
      ["/api/admin/tokens", "GET", "Token potro\u0161nja"],
      ["/api/admin/prompts", "GET/PUT", "Agent prompt upravljanje"],
      ["/api/admin/client-zero", "GET", "Client zero (churn) podaci"],
      ["/api/admin/outreach-queue", "GET", "Backlink outreach queue"],
      ["/api/admin/content-queue", "GET", "Content publishing queue"],
      ["/api/admin/fallback-history", "GET", "AI fallback istorija"],
    ],
    [38, 14, 48]
  ));
  content.push(spacer());

  content.push(heading("Affiliate", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/affiliate/register", "POST", "Registracija kao affiliate"],
      ["/api/affiliate/stats", "GET", "Statistika zarade"],
      ["/api/affiliate/validate", "GET", "Validacija affiliate koda"],
    ],
    [38, 14, 48]
  ));
  content.push(spacer());

  content.push(heading("Cron Job-ovi", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/cron/auto-publish", "POST", "Auto-publikovanje sadr\u017eaja"],
      ["/api/cron/cluster-map", "POST", "A\u017euriranje cluster mape"],
      ["/api/cron/auto-outreach", "POST", "Auto outreach izvr\u0161avanje"],
      ["/api/cron/digest", "POST", "Slanje email digest-a"],
    ],
    [38, 14, 48]
  ));
  content.push(spacer());

  content.push(heading("Ostalo", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/api/limits", "GET", "Provera plan limita"],
      ["/api/leads", "POST", "Lead capture"],
      ["/api/alerts", "GET", "Alert upravljanje"],
      ["/api/alerts/check", "GET", "Provera novih alert-a"],
      ["/api/approvals", "GET", "Approval upravljanje"],
      ["/api/approvals/[id]", "PUT", "Akcija na approval-u"],
      ["/api/gsc", "POST", "Google Search Console konekcija"],
      ["/api/gsc/data", "GET", "GSC podaci"],
      ["/api/agency", "GET/PUT", "Agency upravljanje"],
      ["/api/live/stats", "GET", "Live statistike"],
      ["/api/live/activity", "GET", "Live aktivnost feed"],
      ["/api/generate-llms-txt", "POST", "Generisanje llms.txt fajla"],
      ["/api/route", "GET", "Health check"],
    ],
    [38, 14, 48]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 6: 8-Agent SEO Analizni Sistem
  // ═══════════════════════════════════════════════════════════
  content.push(heading("6. 8-Agent SEO Analizni Sistem", HeadingLevel.HEADING_1));
  content.push(heading("Hub-and-Spoke Protokol", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "                    Master Director (Orkestrator)",
    "                             |",
    "              +--------------+--------------+",
    "              |              |              |",
    "     Batch 1 (Strategy)     |      Batch 2 (Audit)",
    "     +----------------+     |      +----------------+",
    "     | Keyword        |     |      | On-Page        |",
    "     | Researcher     |     |      | Auditor        |",
    "     | Competitor     |     |      | Link           |",
    "     | Analyst        |     |      | Strategist    |",
    "     | Content        |     |      | Tech & Schema  |",
    "     | Architect      |     |      | Auditor        |",
    "     +----------------+     |      | Backlink       |",
    "                            |      | Prospector     |",
    "                    +-------+--------+",
    "                    | Final Assembled  |",
    "                    | Report           |",
    "                    +------------------+",
  ]));

  content.push(heading("Agent Detalji", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Agent ID", "Ime", "Batch", "Opis"],
    [
      ["master-director", "Master Director", "-", "Orkestrator, dispatch-uje task_scope svakom agentu"],
      ["keyword-researcher", "Keyword Researcher", "1", "Keyword analiza, volumen, difficulty"],
      ["competitor-analyst", "Competitor Analyst", "1", "Konkurentska analiza, gap-ovi"],
      ["content-architect", "Content Architect", "1", "Topik klasteri, content arhitektura"],
      ["on-page-auditor", "On-Page Auditor", "2", "Meta tag-ovi, heading-i, kvalitet"],
      ["link-strategist", "Link Strategist", "2", "Internal/external link strategija"],
      ["tech-schema-auditor", "Tech & Schema Auditor", "2", "Schema markup, robots.txt, brzina"],
      ["backlink-prospector", "Backlink Prospector", "2", "Backlink prilike, outreach"],
    ],
    [22, 20, 8, 50]
  ));
  content.push(spacer());

  content.push(heading("4-Step JSON Protokol", HeadingLevel.HEADING_2));
  content.push(bodyText("1. Frontend \u0161alje AnalysisInitPayload \u2192 Backend inicijalizuje"));
  content.push(bodyText("2. Master Director dispatch-uje task_scope svakom sub-agentu"));
  content.push(bodyText("3. Sub-agenti vra\u0107aju strict AgentResponse (findings + recommended_actions)"));
  content.push(bodyText("4. Master Director sastavlja FinalAssembledReport \u2192 Baza"));
  content.push(spacer());

  content.push(heading("Kontekst Optimizacija (Scrape Once, Read Many)", HeadingLevel.HEADING_2));
  content.push(bodyText("Svaki agent prima samo kontekst koji mu treba:"));
  content.push(makeTable(
    ["Agent", "Kontekst"],
    [
      ["Keyword Researcher", "meta_data, raw_text_content, search_context"],
      ["Competitor Analyst", "meta_data, search_context"],
      ["Content Architect", "meta_data, raw_text_content, structured_elements"],
      ["On-Page Auditor", "meta_data, raw_text_content, structured_elements"],
      ["Link Strategist", "structured_elements.links"],
      ["Tech & Schema", "meta_data, structured_elements.schema_markup"],
      ["Backlink Prospector", "search_context"],
    ],
    [30, 70]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 7: AI Router
  // ═══════════════════════════════════════════════════════════
  content.push(heading("7. AI Router \u2014 Smart Model Routing", HeadingLevel.HEADING_1));
  content.push(heading("Task-Based Model Selection", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Task", "Najbolji Model", "Za\u0161to"],
    [
      ["scoring", "Gemini Flash", "Brz, jeftin, dobar sa brojevima"],
      ["entity_extraction", "Groq Llama 3.1 70B", "Brz, strukturirani output"],
      ["summarization", "Groq Llama 3.1 70B", "Brzina + kvalitet"],
      ["long_report", "Gemini Pro", "Huge context window (2M)"],
      ["strategy", "OpenAI GPT-4o", "Najbolje rezonovanje"],
      ["code", "DeepSeek V3", "Code-specijalizovan"],
      ["reasoning", "OpenAI GPT-4o", "Complex chain-of-thought"],
      ["classification", "Groq Llama 3.1 8B", "Brza klasifikacija"],
      ["chat", "Groq Llama 3.1 70B", "Brzina + kvalitet"],
      ["embedding", "Gemini Flash", "Embedding generacija"],
    ],
    [25, 30, 45]
  ));
  content.push(spacer());

  content.push(heading("Tier-Based Budget Engine", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tier", "Dozvoljeni Provider-i", "Max Cost/Call", "Prefer Free"],
    [
      ["free_trial", "Groq, Gemini, OpenRouter, ZAI, Ollama", "$0.00", "Da"],
      ["starter", "Groq, Gemini, OpenRouter, ZAI, Ollama", "$0.00", "Da"],
      ["pro", "Svi + OpenAI", "$0.05", "Ne"],
      ["managed", "Svi + OpenAI", "$0.50", "Ne"],
    ],
    [15, 40, 20, 25]
  ));
  content.push(spacer());

  content.push(heading("Fallback Chain", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "Groq \u2192 Gemini \u2192 OpenRouter \u2192 OpenAI \u2192 ZAI \u2192 Ollama \u2192 Simulation",
    "",
    "Ako svi provider-i ne uspeju, vra\u0107a se status: \"simulation\" sa hardkodiranim podacima.",
  ]));

  content.push(heading("Data Status Flag-ovi", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Status", "Zna\u010denje"],
    [
      ["live", "Realan LLM odgovor"],
      ["estimated", "LLM odgovor sa zna\u010dajnom obradom"],
      ["simulation", "Hardkodirani fallback podaci"],
    ],
    [25, 75]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 8: Autentifikacija & Autorizacija
  // ═══════════════════════════════════════════════════════════
  content.push(heading("8. Autentifikacija & Autorizacija", HeadingLevel.HEADING_1));
  content.push(heading("JWT Sesije (jose + bcrypt)", HeadingLevel.HEADING_2));
  content.push(bulletItem("Algoritam: HS256", ""));
  content.push(bulletItem("Trajanje: 7 dana", ""));
  content.push(bulletItem("Storage: Cookie seosights_session", ""));
  content.push(bulletItem("Tier Cookie: seosights_tier (plain string: pro, starter, itd.)", ""));
  content.push(spacer());

  content.push(heading("Role-ovi", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Role", "Pristup"],
    [
      ["user", "Standardni korisnik, audit, dashboard"],
      ["agency", "Multi-brand dashboard, white-label"],
      ["affiliate", "Affiliate portal, statistika"],
      ["superadmin", "CEO/Retention/Activation dashboard, settings"],
    ],
    [20, 80]
  ));
  content.push(spacer());

  content.push(heading("Flow", HeadingLevel.HEADING_2));
  content.push(bodyText("1. POST /api/auth/register \u2192 Kreira User + Session \u2192 Vra\u0107a token cookie"));
  content.push(bodyText("2. POST /api/auth/login \u2192 Proverava bcrypt hash \u2192 Vra\u0107a token cookie"));
  content.push(bodyText("3. GET /api/auth/me \u2192 Dekoduje JWT \u2192 Vra\u0107a korisnika"));
  content.push(bodyText("4. POST /api/auth/logout \u2192 Bri\u0161e session iz DB + cookie"));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 9: Billing & Stripe Integracija
  // ═══════════════════════════════════════════════════════════
  content.push(heading("9. Billing & Stripe Integracija", HeadingLevel.HEADING_1));
  content.push(heading("Planovi", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Plan", "Cena/mes", "Max Domena", "Audit/mes", "Token Cap", "White-Label", "API"],
    [
      ["Free Trial", "$0", "1", "3", "$2", "Ne", "Ne"],
      ["Starter", "$9.90", "1", "10", "$5", "Ne", "Ne"],
      ["Pro", "$79", "20", "100", "$40", "Da", "Da"],
      ["Managed", "$199", "999", "9999", "$150", "Da", "Da"],
    ],
    [14, 12, 14, 12, 12, 16, 20]
  ));
  content.push(spacer());

  content.push(heading("Stripe Flow", HeadingLevel.HEADING_2));
  content.push(bodyText("1. POST /api/stripe/checkout \u2192 Kreira Checkout Session sa Price ID"));
  content.push(bodyText("2. Korisnik pla\u0107a na Stripe \u2192 Webhook checkout.session.completed"));
  content.push(bodyText("3. POST /api/webhooks/stripe \u2192 Kreira/aktivira User subscription"));
  content.push(bodyText("4. POST /api/billing/portal \u2192 Redirect na Stripe Customer Portal"));
  content.push(spacer());

  content.push(heading("Price ID-jevi (Environment Varijable)", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "STRIPE_STARTER_PRICE_ID=price_xxx",
    "STRIPE_PRO_PRICE_ID=price_xxx",
    "STRIPE_MANAGED_PRICE_ID=price_xxx",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 10: Plan Limits & Kill-Switch
  // ═══════════════════════════════════════════════════════════
  content.push(heading("10. Plan Limits & Kill-Switch", HeadingLevel.HEADING_1));
  content.push(heading("Limit Dimenzije", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Dimenzija", "Opis"],
    [
      ["max_domains", "Broj web sajtova (projekata)"],
      ["max_tracked_queries", "Broj keyword/phrase upita"],
      ["max_audits_per_month", "Broj kompletnih 8-agent audit-a"],
      ["agents_enabled", "Koji agenti su dostupni"],
      ["allow_white_label", "White-label izve\u0161taji"],
      ["monthly_cost_cap", "Max USD za LLM token-e mese\u010dno"],
      ["priority_support", "Prioritetni support"],
      ["api_access", "API pristup za integracije"],
    ],
    [30, 70]
  ));
  content.push(spacer());

  content.push(heading("Kill-Switch Logika", HeadingLevel.HEADING_2));
  content.push(bodyText("Pre svakog sub-agent LLM poziva:"));
  content.push(bodyText("1. Sumiraj cost_usd iz token_usage_logs za teku\u0107i mesec"));
  content.push(bodyText("2. Uporedi sa monthly_cost_cap za korisnikov tier"));
  content.push(bodyText("3. Ako cap prekora\u010den \u2192 PAUZIRAJ agente, obavesti korisnika"));
  content.push(spacer());
  content.push(bodyText("Primer: Starter ($9.90/mes) \u2192 $5 cap. Ako su agenti ve\u0107 potro\u0161ili $5.01, sistem pauzira i prikazuje \"Upgrade to Pro\"."));
  content.push(spacer());

  content.push(heading("API za Proveru", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "// Provera svih limita odjednom",
    "const result = await checkAllLimits(userId)",
    "// result.allowed, result.checks.subscription, result.checks.auditLimit, result.checks.costCap",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 11: Rate Limiting & Middleware
  // ═══════════════════════════════════════════════════════════
  content.push(heading("11. Rate Limiting & Middleware", HeadingLevel.HEADING_1));
  content.push(heading("Per-Minute Rate Limiting", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tier", "Req/min"],
    [
      ["free_trial", "10"],
      ["starter", "30"],
      ["pro", "100"],
      ["managed", "300"],
      ["superadmin", "1000"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  content.push(heading("Daily Audit Limit", HeadingLevel.HEADING_2));
  content.push(bulletItem("Besplatni/neregistrovani: 3 audit-a po IP dnevno", ""));
  content.push(bulletItem("Pla\u0107eni korisnici: Bez dnevnog limita", ""));
  content.push(spacer());

  content.push(heading("Response Headers", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "X-RateLimit-Limit: 100",
    "X-RateLimit-Remaining: 95",
    "X-RateLimit-Reset: 1710000000",
    "X-DailyAudit-Limit: 3",
    "X-DailyAudit-Remaining: 1",
  ]));

  content.push(heading("Isklju\u010deni iz Rate Limiting-a", HeadingLevel.HEADING_2));
  content.push(bulletItem("/api/webhooks/* \u2014 Imaju sopstvenu auth (signatures)", ""));
  content.push(bulletItem("/api/auth/* \u2014 Ne smeju biti agresivno limitirani", ""));
  content.push(bulletItem("/api/route \u2014 Health check", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 12: Superadmin Panel
  // ═══════════════════════════════════════════════════════════
  content.push(heading("12. Superadmin Panel", HeadingLevel.HEADING_1));
  content.push(heading("CEO Dashboard", HeadingLevel.HEADING_2));
  content.push(bodyText("Funnel metrike u realnom vremenu:"));
  content.push(...codeBlock([
    "Visitors Today \u2192 Free Audits \u2192 Registrations \u2192 Completed Audits \u2192 Activated Users \u2192 Paid Users \u2192 MRR",
  ]));
  content.push(bodyText("API: GET /api/superadmin/ceo-metrics"));
  content.push(spacer());

  content.push(heading("Retention Dashboard", HeadingLevel.HEADING_2));
  content.push(bodyText("D1, D7, D30 retention koorti:"));
  content.push(...codeBlock([
    "\"Ako D1 nije iznad 40%, ni\u0161ta drugo nije bitno.\"",
  ]));
  content.push(bodyText("API: GET /api/superadmin/retention"));
  content.push(spacer());

  content.push(heading("Activation Dashboard", HeadingLevel.HEADING_2));
  content.push(bodyText("Aktivacioni funnel:"));
  content.push(...codeBlock([
    "Audit \u2192 Connect GSC \u2192 Execute Fix \u2192 Return Tomorrow",
  ]));
  content.push(bodyText("API: GET /api/superadmin/activation"));
  content.push(spacer());

  content.push(heading("Event Tracker", HeadingLevel.HEADING_2));
  content.push(bodyText("Svi korisni\u010dki eventi u realnom vremenu:"));
  content.push(makeTable(
    ["Event", "Opis"],
    [
      ["started_audit", "Korisnik zapo\u010deo audit"],
      ["completed_audit", "Audit zavr\u0161en"],
      ["viewed_replay", "Pregledan Visibility Replay"],
      ["opened_diff", "Otvoren Recommendation Diff"],
      ["connected_wordpress", "Povezan WordPress"],
      ["executed_fix", "Izvr\u0161en Auto Fix"],
      ["opened_digest", "Otvoren Email Digest"],
      ["clicked_upgrade", "Klik na Upgrade"],
      ["connected_gsc", "Povezan Google Search Console"],
      ["registered", "Novi korisnik"],
      ["activated", "Korisnik aktiviran"],
      ["paid", "Korisnik platio"],
    ],
    [30, 70]
  ));
  content.push(bodyText("API: GET/POST /api/superadmin/events"));
  content.push(spacer());

  content.push(heading("P1 Overview", HeadingLevel.HEADING_2));
  content.push(bodyText("Pregled P1 feature metrika. API: GET /api/superadmin/p1-overview"));
  content.push(spacer());

  content.push(heading("Pristup", HeadingLevel.HEADING_2));
  content.push(bulletItem("URL: /superadmin-portal", ""));
  content.push(bulletItem("Login: /superadmin-portal/login", ""));
  content.push(bulletItem("Auth: POST /api/superadmin/auth", ""));
  content.push(bulletItem("Provera: GET /api/superadmin/check", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 13: P0 Moduli
  // ═══════════════════════════════════════════════════════════
  content.push(heading("13. P0 Moduli (AI Visibility)", HeadingLevel.HEADING_1));
  content.push(bodyText("Ovo su core dashboard widgeti koji koriste realne podatke iz baze:"));
  content.push(makeTable(
    ["Widget", "Opis", "API"],
    [
      ["AI Mission Control", "Centralni kontrolni panel", "/api/ai/mission-control"],
      ["AI Diff", "Preporu\u010deni diff-ovi pre/posle", "/api/ai/diff"],
      ["Competitor Race", "Upore\u0111enje sa konkurencijom", "/api/ai/competitor-race"],
      ["Sticky AI Visibility Score", "Score koji prati korisnika", "/api/ai/visibility-score"],
      ["AI Index Status", "Da li je sajt indeksiran", "/api/ai/index-status"],
    ],
    [28, 40, 32]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 14: P1 Moduli
  // ═══════════════════════════════════════════════════════════
  content.push(heading("14. P1 Moduli (Slede\u0107i Sprint)", HeadingLevel.HEADING_1));
  content.push(makeTable(
    ["Feature", "Opis", "Status"],
    [
      ["AI Visibility Replay\u2122", "Timeline replay svih promena", "Landing \u2192 Full funkcionalan"],
      ["AI Recommendation Recorder\u2122", "Snimanje diff-ova AI preporuka", "Landing \u2192 Full funkcionalan"],
      ["Auto Execute\u2122", "Automatsko izvr\u0161avanje na WP/Webflow", "Landing \u2192 Full funkcionalan"],
      ["ROI Opportunity Queue\u2122", "Prioritizovani queue po ROI", "Landing \u2192 Full funkcionalan"],
      ["Email Digest", "What changed overnight?", "Landing \u2192 Full funkcionalan"],
    ],
    [28, 40, 32]
  ));
  content.push(spacer());

  content.push(heading("P1 DB Modeli", HeadingLevel.HEADING_2));
  content.push(bodyText("Svi P1 modeli su ve\u0107 u Prisma schema-i:"));
  content.push(bulletItem("ReplaySession \u2014 Replay timeline sesije", ""));
  content.push(bulletItem("RecommendationSnapshot \u2014 Snapshot AI preporuka", ""));
  content.push(bulletItem("RecommendationDiff \u2014 Before/after diff", ""));
  content.push(bulletItem("ActionItem \u2014 Akcije sa ROI scoring", ""));
  content.push(bulletItem("AutoExecution \u2014 Automatsko izvr\u0161avanje", ""));
  content.push(bulletItem("EmailDigest \u2014 Digest email-ovi", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 15: Landing Page & Marketing
  // ═══════════════════════════════════════════════════════════
  content.push(heading("15. Landing Page & Marketing", HeadingLevel.HEADING_1));
  content.push(heading("Sekcije (40+ komponenti)", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Sekcija", "Komponenta", "Opis"],
    [
      ["Hero", "HeroSection", "Main CTA sa URL input-om"],
      ["Features", "FeaturesSection", "Klju\u010dne mogu\u0107nosti"],
      ["How It Works", "HowItWorksSection", "3-koraka proces"],
      ["Stats", "StatsSection", "Brojevi i metrike"],
      ["Social Proof", "SocialProofSection", "Testimonial-i"],
      ["Pricing", "PricingSection", "4 plana"],
      ["Comparison", "ComparisonSection", "Seosights vs konkurencija"],
      ["Integrations", "IntegrationsSection", "CMS/platform integracije"],
      ["CTA", "CTASection", "Finalni call-to-action"],
      ["Free Tools", "FreeToolsSection", "Besplatni SEO alati"],
      ["Build in Public", "BuildInPublicSection", "Transparentni razvoj"],
      ["June Stack", "JuneStackSection", "Tech stack"],
      ["Agent OS", "AgentOSSection", "8-Agent sistem"],
      ["Roadmap", "RoadmapChecklist", "Razvojni roadmap"],
    ],
    [20, 30, 50]
  ));
  content.push(spacer());

  content.push(heading("AI Visibility Landing Sekcije", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Sekcija", "Opis"],
    [
      ["AIVisibilityScoreSection", "AI Visibility Score obja\u0161njenje"],
      ["AIVisibilityTimeline", "Timeline promena"],
      ["AIVisibilityMap", "Vizuelna mapa vidljivosti"],
      ["AIVisibilityForecast", "Prognoza score-a"],
      ["AIVisibilityReplay", "Replay feature preview"],
      ["AIStickyScore", "Sticky score widget"],
      ["AIDiff", "Diff preview"],
      ["AIDailyFeedSection", "Daily feed preview"],
      ["AIRevenueCalculator", "Kalkulator prihoda"],
      ["AIRecommendationSimulator", "Simulacija preporuka"],
      ["AIRecommendationRecorder", "Recorder preview"],
      ["AIMissionControl", "Mission control preview"],
      ["AIActionCenterSection", "Action center preview"],
      ["AIAutoExecute", "Auto Execute preview"],
      ["AICompetitorRace", "Competitor race preview"],
      ["AICompetitorWarRoom", "War room preview"],
      ["AIInfluenceGraph", "Influence graf"],
      ["AICitationExplorer", "Citat explorer"],
      ["AIIndexStatus", "Index status"],
      ["AIOpportunityFinder", "Opportunity finder"],
      ["AIOpportunityQueue", "Queue preview"],
      ["AIEmailDigest", "Digest preview"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 16: Mini Servisi
  // ═══════════════════════════════════════════════════════════
  content.push(heading("16. Mini Servisi", HeadingLevel.HEADING_1));

  content.push(heading("agent-stream (Port 3003)", HeadingLevel.HEADING_2));
  content.push(bodyText("Svrha: Real-time WebSocket server za live agent progress streaming."));
  content.push(makeTable(
    ["Endpoint", "Method", "Opis"],
    [
      ["/ (Socket.IO)", "WS", "WebSocket konekcija"],
      ["/emit", "POST", "Emitovanje event-a"],
      ["/health", "GET", "Health check"],
      ["/sessions/:id", "GET", "Sesija detalji"],
    ],
    [35, 15, 50]
  ));
  content.push(spacer());

  content.push(bodyBold("Event-ovi:"));
  content.push(makeTable(
    ["Event", "Opis"],
    [
      ["agent:start", "Agent po\u010deo rad"],
      ["agent:progress", "Progress update"],
      ["agent:complete", "Agent zavr\u0161io"],
      ["agent:error", "Agent gre\u0161ka"],
      ["analysis:start", "Analiza po\u010dela"],
      ["analysis:complete", "Analiza zavr\u0161ena"],
      ["analysis:error", "Analiza gre\u0161ka"],
      ["session:replay", "Late-joiner replay"],
    ],
    [30, 70]
  ));
  content.push(spacer());
  content.push(bodyText("In-Memory Store: Last 100 events po sesiji, 2-satni TTL."));
  content.push(spacer());

  content.push(heading("audit-worker (Port 3004)", HeadingLevel.HEADING_2));
  content.push(bodyText("Svrha: Background worker koji pokre\u0107e 8 AI agenata za SEO analizu."));
  content.push(bodyBold("Pattern: BullMQ Producer-Worker"));
  content.push(bodyText("1. Next.js API kreira Analysis record \u2192 Dodaje job u BullMQ queue"));
  content.push(bodyText("2. Worker pokupi job \u2192 Pokre\u0107e agente \u2192 Komunicira preko DB + WebSocket"));
  content.push(spacer());
  content.push(bodyBold("Faze:"));
  content.push(bodyText("1. Data Gathering \u2192 Scraping"));
  content.push(bodyText("2. Strategy \u2192 Batch 1 agenti"));
  content.push(bodyText("3. Audit \u2192 Batch 2 agenti"));
  content.push(bodyText("4. Structure \u2192 Topik klasteri"));
  content.push(bodyText("5. Creative \u2192 Content brief-ovi"));
  content.push(bodyText("6. Measure \u2192 KPI tracking"));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 17: Chrome Ekstenzija
  // ═══════════════════════════════════════════════════════════
  content.push(heading("17. Chrome Ekstenzija", HeadingLevel.HEADING_1));
  content.push(bodyText("Lokacija: extensions/chrome-seosights/"));
  content.push(makeTable(
    ["Fajl", "Opis"],
    [
      ["manifest.json", "Extension manifest (Manifest V3)"],
      ["background.js", "Service worker za background task-ove"],
      ["content.js", "Content script \u2014 injektuje se u stranice"],
      ["popup.js", "Popup UI logika"],
      ["options.js", "Options page logika"],
      ["popup.html", "Popup HTML"],
      ["options.html", "Options HTML"],
      ["styles.css", "Stilovi"],
    ],
    [30, 70]
  ));
  content.push(spacer());

  content.push(bodyBold("Mogu\u0107nosti:"));
  content.push(bulletItem("AI Visibility Score prikaz u browser-u", ""));
  content.push(bulletItem("Entity Score za trenutnu stranicu", ""));
  content.push(bulletItem("Quick audit pokretanje", ""));
  content.push(bulletItem("Notifikacije za promene score-a", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 18: WordPress Plugin
  // ═══════════════════════════════════════════════════════════
  content.push(heading("18. WordPress Plugin", HeadingLevel.HEADING_1));
  content.push(bodyText("Lokacija: plugins/wordpress-seosights/"));
  content.push(makeTable(
    ["Fajl", "Opis"],
    [
      ["seosights.php", "Glavni plugin fajl"],
      ["uninstall.php", "Cleanup pri deinstalaciji"],
      ["readme.txt", "WordPress.org readme"],
      ["includes/class-seosights-core.php", "Core funkcionalnost"],
      ["includes/class-seosights-admin.php", "Admin panel"],
      ["includes/class-seosights-api.php", "API komunikacija"],
    ],
    [40, 60]
  ));
  content.push(spacer());

  content.push(bodyBold("Mogu\u0107nosti:"));
  content.push(bulletItem("Auto Execute \u2014 direktno izvr\u0161avanje SEO fix-ova", ""));
  content.push(bulletItem("Schema markup dodavanje", ""));
  content.push(bulletItem("robots.txt a\u017euriranje", ""));
  content.push(bulletItem("Content publikovanje", ""));
  content.push(bulletItem("llms.txt generisanje", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 19: Komponente
  // ═══════════════════════════════════════════════════════════
  content.push(heading("19. Komponente (130+ React)", HeadingLevel.HEADING_1));
  content.push(heading("Po Kategoriji", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Kategorija", "Broj", "Klju\u010dne Komponente"],
    [
      ["UI (shadcn)", "45", "Button, Card, Dialog, Form, Table, Tabs, Toast, Tooltip, Chart, etc."],
      ["Landing", "40+", "HeroSection, FeaturesSection, PricingSection, AI* sekcije"],
      ["Dashboard", "30", "KPIWidgets, MissionControlPanel, CompetitorRacePanel, etc."],
      ["Superadmin", "7", "CEODashboard, RetentionDashboard, ActivationDashboard, etc."],
      ["Auth", "2", "RegistrationDialog, AgencyRegistrationDialog"],
      ["Billing", "1", "PricingCard"],
      ["Site", "5", "SiteHeader, SiteFooter, SiteShell, NewsletterForm, IconRenderer"],
    ],
    [18, 8, 74]
  ));
  content.push(spacer());

  content.push(heading("Dashboard Widgeti (Detalji)", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Widget", "Opis", "Klju\u010dna Funkcionalnost"],
    [
      ["KPIWidgets", "SEO/AEO/GEO score kartice", "Score prikaz, trend strelice"],
      ["MissionControlPanel", "Centralni komandni centar", "Status agenata, progress"],
      ["AIVisibilityChart", "Graf vidljivosti", "Line chart po engine-u"],
      ["AIVisibilityFeed", "Live feed doga\u0111aja", "Real-time notifikacije"],
      ["CompetitorRacePanel", "Upore\u0111enje sa konkurencijom", "Bar chart, gap analiza"],
      ["DiffPanel", "Pre/posle diff-ovi", "Side-by-side prikaz"],
      ["EntityGraphBuilder", "Entity graf", "Vizuelni graf entiteta"],
      ["EntityHealth", "Entity zdravlje", "Score po dimenzijama"],
      ["GSCPanel", "Google Search Console", "Podaci iz GSC"],
      ["IndexStatusPanel", "Index status", "ChatGPT/Claude/Gemini status"],
      ["IndustryBenchmarks", "Industrijski benchmark-ovi", "Upore\u0111enje sa industrijom"],
      ["LiveAgentStatus", "Status agenata", "Live progress bar-ovi"],
      ["OneClickFix", "One-click SEO fix", "Lista predlo\u017eenih fix-ova"],
      ["PromptRankTracker", "Prompt rangiranje", "Pra\u0107enje pozicija"],
      ["StickyScoreWidget", "Sticky score", "Floating AI Visibility Score"],
      ["StrategyRoadmap", "Strategijski roadmap", "12-mese\u010dni plan"],
      ["UsageIndicator", "Kori\u0161\u0107enje resursa", "Progres bar za limit"],
      ["WebhooksPanel", "Webhook upravljanje", "CRUD za webhook-e"],
      ["CitationVelocityHeatmap", "Heatmap citata", "Vizuelni heatmap"],
      ["CompetitorCitationGap", "Gap analiza", "Citat gap sa konkurencijom"],
      ["CMSIntegrationPanel", "CMS integracija", "WordPress/Webflow konekcija"],
      ["AgencySettingsPanel", "Agency pode\u0161avanja", "White-label konfiguracija"],
      ["MultiBrandDashboard", "Multi-brand prikaz", "Switch izme\u0111u brendova"],
      ["AdvancedAITools", "Napredni AI alati", "Simulator, kalkulator"],
      ["AffiliatePortal", "Affiliate portal", "Zarada, referral-i"],
      ["PendingApprovalsPanel", "Pending odobrenja", "Human-in-the-loop"],
      ["AICrawlLogs", "AI crawl log-ovi", "Log analizator"],
      ["AIContentGap", "Content gap analiza", "AI-generated gap-ovi"],
      ["AIContentSimulator", "Content simulator", "Simulacija sadr\u017eaja"],
      ["AIActionCenter", "Akcioni centar", "Lista AI predloga"],
    ],
    [25, 35, 40]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 20: State Management
  // ═══════════════════════════════════════════════════════════
  content.push(heading("20. State Management", HeadingLevel.HEADING_1));
  content.push(heading("Zustand Global Store", HeadingLevel.HEADING_2));
  content.push(bodyText("Lokacija: src/lib/store.ts"));
  content.push(...codeBlock([
    "interface AppState {",
    "  view: 'landing' | 'analyzing' | 'dashboard'  // Trenutni view",
    "  targetUrl: string                              // URL za analizu",
    "  targetMarket: string                           // Tr\u017ei\u0161te (default: 'Global')",
    "  analysis: SEOAnalysis | null                   // Rezultat analize",
    "  analysisProgress: number                       // 0-100 progres",
    "  analysisStep: string                           // Trenutni korak",
    "  analysisError: string                          // Gre\u0161ka",
    "  activeAgent: string | null                     // Aktivni agent",
    "  sessionId: string                              // Sesija ID",
    "  mode: 'auto-pilot' | 'co-pilot'              // Re\u017eim rada",
    "  pendingApprovals: Approval[]                   // Human-in-the-loop",
    "  currentAnalysisId: string | null               // ID trenutne analize",
    "  analysisEngine: 'sse' | 'queue'               // Engine (SSE vs BullMQ)",
    "  jobId: string | null                           // BullMQ job ID",
    "  jobStatus: 'idle' | 'queued' | 'active' | 'completed' | 'failed' | 'unknown'",
    "}",
  ]));

  content.push(heading("SEOAnalysis Tip (Kompletna Struktura)", HeadingLevel.HEADING_2));
  content.push(bodyText("Analiza sadr\u017ei:"));
  content.push(makeTable(
    ["Sekcija", "Opis"],
    [
      ["overallScores", "SEO, AEO, GEO, Combined score (0-100)"],
      ["audit", "Technical SEO, Crawlability, PageSpeed, Indexation, AEO Readiness, GEO Visibility"],
      ["eeat", "E-E-A-T analiza (Experience, Expertise, Authoritativeness, Trustworthiness)"],
      ["geoCitability", "5 dimenzije citabilnosti za GEO"],
      ["aiCrawler", "AI bot pristup, robots.txt, llms.txt, JS rendering"],
      ["brandMentions", "Brand mention score, platform presence"],
      ["contentQuality", "AI pattern risk, humanization tips"],
      ["parasiteRisk", "Parasite SEO risk assessment"],
      ["localSEO", "GBP signals, NAP consistency, reviews"],
      ["sxo", "Search Experience Optimization"],
      ["structure", "Topic clusters, keyword gaps, content architecture, schema recommendations"],
      ["creative", "Content briefs, on-page optimizations, answer blocks"],
      ["measure", "KPI tracking, competitor benchmarks, weekly actions"],
      ["deepStrategy", "Technical implementations, backlink outreach, content calendar"],
      ["summary", "Executive summary"],
      ["executiveActions", "Top 5 prioritizovanih akcija"],
    ],
    [22, 78]
  ));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 21: Scraping Arhitektura
  // ═══════════════════════════════════════════════════════════
  content.push(heading("21. Scraping Arhitektura", HeadingLevel.HEADING_1));
  content.push(heading("Scrape Once, Read Many", HeadingLevel.HEADING_2));
  content.push(bodyText("Lokacija: src/lib/scraper.ts (808 linija)"));
  content.push(spacer());
  content.push(bodyBold("Princip:"));
  content.push(bodyText("1. Scrape website JEDNOM \u2192 O\u010disti HTML \u2192 Strukturirani JSON"));
  content.push(bodyText("2. Ke\u0161iraj (in-memory / Redis) \u2192 Svi agenti \u010ditaju iz ke\u0161a"));
  content.push(bodyText("3. Svaki agent dobija samo kontekst koji mu treba \u2192 Do 70% manje token-a"));
  content.push(spacer());

  content.push(heading("ScrapedSharedContext Struktura", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "interface ScrapedSharedContext {",
    "  meta_data: {",
    "    title, description, robots_txt, llms_txt_exists, url, domain",
    "  }",
    "  raw_text_content: string           // Max 6000 chars",
    "  structured_elements: {",
    "    headings: Record<string, string[]>",
    "    links: string[]",
    "    schema_markup: {",
    "      has_faq, has_organization, has_article, has_product,",
    "      has_local_business, detected_types",
    "    }",
    "  }",
    "  search_context: {",
    "    competitor_results: Array<{name, url, snippet}>",
    "    ai_citation_results: Array<{name, url, snippet}>",
    "    local_seo_results: Array<{name, url, snippet}>",
    "  }",
    "}",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 22: Email & Webhook Sistem
  // ═══════════════════════════════════════════════════════════
  content.push(heading("22. Email & Webhook Sistem", HeadingLevel.HEADING_1));
  content.push(heading("Email (Resend)", HeadingLevel.HEADING_2));
  content.push(bodyText("Lokacija: src/lib/email.ts"));
  content.push(bulletItem("Provider: Resend", ""));
  content.push(bulletItem("Tipovi: Digest, notifikacije, welcome, upgrade", ""));
  content.push(bulletItem("Digest tipovi: overnight, weekly, monthly", ""));
  content.push(spacer());

  content.push(heading("Webhook Dispatcher", HeadingLevel.HEADING_2));
  content.push(bodyText("Lokacija: src/lib/webhook-dispatcher.ts"));
  content.push(bodyBold("Podr\u017eani tip-ovi:"));
  content.push(bulletItem("slack \u2014 Slack incoming webhook", ""));
  content.push(bulletItem("discord \u2014 Discord webhook", ""));
  content.push(bulletItem("custom \u2014 Custom HTTP endpoint", ""));
  content.push(spacer());
  content.push(bodyBold("Event-ovi za webhook:"));
  content.push(bulletItem("analysis.completed", ""));
  content.push(bulletItem("visibility.score_changed", ""));
  content.push(bulletItem("citation.gained / citation.lost", ""));
  content.push(bulletItem("alert.triggered", ""));
  content.push(bulletItem("auto_execute.success / auto_execute.failed", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 23: Affiliate Program
  // ═══════════════════════════════════════════════════════════
  content.push(heading("23. Affiliate Program", HeadingLevel.HEADING_1));
  content.push(bodyText("Lokacija: src/lib/affiliate.ts"));
  content.push(spacer());

  content.push(heading("5-Tier Komisiona Struktura", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Tier", "Aktivnih Referral-a", "Provizija"],
    [
      ["1", "1-10", "10%"],
      ["2", "11-25", "20%"],
      ["3", "26-50", "30%"],
      ["4", "51-100", "40%"],
      ["5", "100+", "50%"],
    ],
    [20, 40, 40]
  ));
  content.push(spacer());

  content.push(heading("Karakteristike", HeadingLevel.HEADING_2));
  content.push(bulletItem("Lifetime recurring \u2014 Provizija se nastavlja dok korisnik pla\u0107a", ""));
  content.push(bulletItem("Stripe Transfers \u2014 Automatske isplate preko Stripe Connect", ""));
  content.push(bulletItem("Affiliate Code \u2014 Custom kod (npr. marko10)", ""));
  content.push(bulletItem("Landing Page \u2014 /affiliates sa prijavom i statistikom", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 24: CMS Integracija
  // ═══════════════════════════════════════════════════════════
  content.push(heading("24. CMS Integracija", HeadingLevel.HEADING_1));
  content.push(bodyText("Lokacija: src/lib/cms-publish.ts"));
  content.push(spacer());

  content.push(heading("Podr\u017eane Platforme", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Platform", "Status", "Mogu\u0107nosti"],
    [
      ["WordPress", "Aktivan", "Schema, meta tag-ovi, robots.txt, content publish"],
      ["Webflow", "Aktivan", "Meta tag-ovi, content update"],
      ["Shopify", "Aktivan", "Product schema, meta description"],
    ],
    [20, 15, 65]
  ));
  content.push(spacer());

  content.push(heading("API Endpoints", HeadingLevel.HEADING_2));
  content.push(bulletItem("POST /api/cms/publish \u2014 Publikovanje na CMS", ""));
  content.push(bulletItem("POST /api/cms/save-credentials \u2014 \u010cuvanje API kredencijala", ""));
  content.push(bulletItem("POST /api/cms/test-connection \u2014 Test konekcije", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 25: Deployment & DevOps
  // ═══════════════════════════════════════════════════════════
  content.push(heading("25. Deployment & DevOps", HeadingLevel.HEADING_1));
  content.push(heading("Vercel Deployment", HeadingLevel.HEADING_2));
  content.push(bulletItem("Auto-deploy sa GitHub push na main branch", ""));
  content.push(bulletItem("vercel.json konfiguracija za duge timeout-e (300s za analizu)", ""));
  content.push(spacer());

  content.push(heading("Caddy Gateway", HeadingLevel.HEADING_2));
  content.push(bodyText("Lokacija: Caddyfile"));
  content.push(...codeBlock([
    ":81 {",
    "    @transform_port_query {",
    "        query XTransformPort=*",
    "    }",
    "    handle @transform_port_query {",
    "        reverse_proxy localhost:{query.XTransformPort}",
    "    }",
    "    handle {",
    "        reverse_proxy localhost:3000",
    "    }",
    "}",
  ]));

  content.push(heading("Port Mapiranje", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Port", "Servis"],
    [
      ["81", "Caddy Gateway (externi)"],
      ["3000", "Next.js App"],
      ["3003", "agent-stream (Socket.IO)"],
      ["3004", "audit-worker (BullMQ)"],
    ],
    [20, 80]
  ));
  content.push(spacer());

  content.push(heading("XTransformPort Pravilo", HeadingLevel.HEADING_2));
  content.push(bodyText("Svi API zahtevi ka drugim portovima MORAJU koristiti ?XTransformPort=PORT query parametar:"));
  content.push(...codeBlock([
    "\u2705 /api/test?XTransformPort=3030",
    "\u274c http://localhost:3030/api/test",
    "",
    "Za WebSocket:",
    "\u2705 io(\"/?XTransformPort=3003\")",
    "\u274c io(\"http://localhost:3003\")",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 26: Konfiguracija
  // ═══════════════════════════════════════════════════════════
  content.push(heading("26. Konfiguracija (Environment Variables)", HeadingLevel.HEADING_1));
  content.push(heading("Obavezne", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Varijabla", "Opis"],
    [
      ["DATABASE_URL", "SQLite/Turso konekcioni string"],
      ["JWT_SECRET", "Tajni klju\u010d za JWT token-e"],
      ["STRIPE_SECRET_KEY", "Stripe API tajni klju\u010d"],
      ["STRIPE_STARTER_PRICE_ID", "Stripe Price ID za Starter"],
      ["STRIPE_PRO_PRICE_ID", "Stripe Price ID za Pro"],
      ["STRIPE_MANAGED_PRICE_ID", "Stripe Price ID za Managed"],
    ],
    [35, 65]
  ));
  content.push(spacer());

  content.push(heading("AI Provider Klju\u010devi", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Varijabla", "Opis"],
    [
      ["GROQ_API_KEY", "Groq API klju\u010d (free tier)"],
      ["GEMINI_API_KEY", "Google Gemini API klju\u010d"],
      ["OPENROUTER_API_KEY", "OpenRouter API klju\u010d"],
      ["OPENAI_API_KEY", "OpenAI API klju\u010d (paid)"],
    ],
    [35, 65]
  ));
  content.push(spacer());

  content.push(heading("Ostalo", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Varijabla", "Opis"],
    [
      ["RESEND_API_KEY", "Resend email API klju\u010d"],
      ["REDIS_URL", "Redis konekcioni string (BullMQ)"],
      ["STRIPE_WEBHOOK_SECRET", "Stripe webhook tajna"],
      ["NEXT_PUBLIC_APP_URL", "Public app URL"],
    ],
    [35, 65]
  ));
  content.push(spacer());

  content.push(heading("DB-Backed Settings (SystemSetting Model)", HeadingLevel.HEADING_2));
  content.push(bodyText("Svi ovi mogu biti prebrisani iz Superadmin Settings panela:"));
  content.push(bulletItem("stripe_secret_key", ""));
  content.push(bulletItem("stripe_starter_price_id", ""));
  content.push(bulletItem("stripe_pro_price_id", ""));
  content.push(bulletItem("stripe_managed_price_id", ""));
  content.push(bulletItem("openai_api_key", ""));
  content.push(bulletItem("groq_api_key", ""));
  content.push(bulletItem("gemini_api_key", ""));
  content.push(bulletItem("resend_api_key", ""));
  content.push(spacer());

  // ═══════════════════════════════════════════════════════════
  // Chapter 27: Folder Struktura
  // ═══════════════════════════════════════════════════════════
  content.push(heading("27. Folder Struktura", HeadingLevel.HEADING_1));
  content.push(...codeBlock([
    "src/",
    "\u251c\u2500\u2500 app/",
    "\u2502   \u251c\u2500\u2500 layout.tsx                          # Root layout (dark theme, AuthProvider, JSON-LD)",
    "\u2502   \u251c\u2500\u2500 page.tsx                            # Home \u2192 Superadmin dashboard",
    "\u2502   \u251c\u2500\u2500 globals.css                         # Global styles",
    "\u2502   \u251c\u2500\u2500 blog/                               # Blog sekcija",
    "\u2502   \u2502   \u251c\u2500\u2500 page.tsx + blog-hub-client.tsx",
    "\u2502   \u2502   \u2514\u2500\u2500 [slug]/page.tsx + blog-post-client.tsx",
    "\u2502   \u251c\u2500\u2500 pricing/                            # Pricing stranica",
    "\u2502   \u251c\u2500\u2500 affiliates/                         # Affiliate stranica",
    "\u2502   \u251c\u2500\u2500 free-ai-seo-tools/                  # Besplatni alati",
    "\u2502   \u2502   \u251c\u2500\u2500 page.tsx + free-tools-hub-client.tsx",
    "\u2502   \u2502   \u2514\u2500\u2500 [slug]/page.tsx + tool-page-client.tsx",
    "\u2502   \u251c\u2500\u2500 superadmin-portal/                  # Superadmin panel",
    "\u2502   \u2502   \u251c\u2500\u2500 page.tsx",
    "\u2502   \u2502   \u2514\u2500\u2500 login/page.tsx",
    "\u2502   \u2514\u2500\u2500 api/                               # 70+ API endpoint-a",
    "\u2502       \u251c\u2500\u2500 auth/                           # Autentifikacija",
    "\u2502       \u251c\u2500\u2500 ai/                             # AI Visibility & Akcije",
    "\u2502       \u251c\u2500\u2500 admin/                          # Admin upravljanje",
    "\u2502       \u251c\u2500\u2500 superadmin/                     # Superadmin dashboard-i",
    "\u2502       \u251c\u2500\u2500 billing/                        # Stripe billing",
    "\u2502       \u251c\u2500\u2500 webhooks/                       # Webhook upravljanje",
    "\u2502       \u251c\u2500\u2500 cms/                            # CMS integracija",
    "\u2502       \u251c\u2500\u2500 affiliate/                      # Affiliate program",
    "\u2502       \u251c\u2500\u2500 cron/                           # Cron job-ovi",
    "\u2502       \u251c\u2500\u2500 dashboard/                      # Dashboard widget-i",
    "\u2502       \u2514\u2500\u2500 ...                             # Ostali endpoint-i",
    "",
    "\u251c\u2500\u2500 components/",
    "\u2502   \u251c\u2500\u2500 ui/                                 # 45 shadcn/ui komponenti",
    "\u2502   \u251c\u2500\u2500 landing/                            # 40+ landing sekcija",
    "\u2502   \u251c\u2500\u2500 dashboard/                          # 30 dashboard widget-a",
    "\u2502   \u251c\u2500\u2500 superadmin/                         # 7 admin komponenti",
    "\u2502   \u251c\u2500\u2500 auth/                               # 2 auth komponente",
    "\u2502   \u251c\u2500\u2500 billing/                            # 1 billing komponenta",
    "\u2502   \u2514\u2500\u2500 site/                               # 5 site komponenti",
    "",
    "\u251c\u2500\u2500 lib/",
    "\u2502   \u251c\u2500\u2500 db.ts                               # Prisma client",
    "\u2502   \u251c\u2500\u2500 auth.ts                             # JWT auth (jose + bcrypt)",
    "\u2502   \u251c\u2500\u2500 auth-context.tsx                    # React auth provider",
    "\u2502   \u251c\u2500\u2500 ai-router.ts                        # Smart LLM routing",
    "\u2502   \u251c\u2500\u2500 agents.ts                           # 8-Agent definicije",
    "\u2502   \u251c\u2500\u2500 agent-protocol.ts                   # Agent komunikacioni protokol",
    "\u2502   \u251c\u2500\u2500 agent-fallback.ts                   # Ollama local fallback",
    "\u2502   \u251c\u2500\u2500 scraper.ts                          # Scrape Once, Read Many",
    "\u2502   \u251c\u2500\u2500 store.ts                            # Zustand global state",
    "\u2502   \u251c\u2500\u2500 stripe.ts                           # Stripe billing",
    "\u2502   \u251c\u2500\u2500 redis.ts                            # Redis/ioredis client",
    "\u2502   \u251c\u2500\u2500 email.ts                            # Email (Resend)",
    "\u2502   \u251c\u2500\u2500 pdf-generator.ts                    # jsPDF izve\u0161taji",
    "\u2502   \u251c\u2500\u2500 utils.ts                            # cn() utility",
    "\u2502   \u251c\u2500\u2500 settings.ts                         # DB-backed settings",
    "\u2502   \u251c\u2500\u2500 plan-limits.ts                      # Tier limits + Kill-Switch",
    "\u2502   \u251c\u2500\u2500 webhook-dispatcher.ts               # Webhook dispatch",
    "\u2502   \u251c\u2500\u2500 cms-publish.ts                      # CMS publishing",
    "\u2502   \u251c\u2500\u2500 affiliate.ts                        # Affiliate logika",
    "\u2502   \u251c\u2500\u2500 audit-queue.ts                      # BullMQ job queue",
    "\u2502   \u251c\u2500\u2500 token-tracker.ts                    # Token usage tracking",
    "\u2502   \u251c\u2500\u2500 shared-context.ts                   # Shared agent kontekst",
    "\u2502   \u251c\u2500\u2500 client-zero-topics.ts               # Client zero (churn)",
    "\u2502   \u2514\u2500\u2500 zai.ts                              # ZAI SDK wrapper",
    "",
    "\u251c\u2500\u2500 hooks/",
    "\u2502   \u251c\u2500\u2500 use-toast.ts                        # Toast hook",
    "\u2502   \u2514\u2500\u2500 use-mobile.ts                       # Mobile detection",
    "",
    "\u251c\u2500\u2500 data/",
    "\u2502   \u251c\u2500\u2500 blog-posts.ts                       # Stati\u010dki blog podaci",
    "\u2502   \u2514\u2500\u2500 free-tools.ts                       # Besplatni alati listing",
    "",
    "\u2514\u2500\u2500 middleware.ts                            # Rate limiting + daily audit limit",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Chapter 28: Razvojni Workflow
  // ═══════════════════════════════════════════════════════════
  content.push(heading("28. Razvojni Workflow", HeadingLevel.HEADING_1));
  content.push(heading("Komande", HeadingLevel.HEADING_2));
  content.push(makeTable(
    ["Komanda", "Opis"],
    [
      ["bun run dev", "Pokre\u0107e dev server na portu 3000"],
      ["bun run build", "Produktivni build (standalone)"],
      ["bun run lint", "ESLint provera"],
      ["bun run db:push", "Push schema u bazu"],
      ["bun run db:generate", "Generi\u0161e Prisma client"],
      ["bun run db:migrate", "Pokre\u0107e migracije"],
      ["bun run db:seed", "Seed-uje bazu"],
    ],
    [30, 70]
  ));
  content.push(spacer());

  content.push(heading("Mini Servisi", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "cd mini-services/agent-stream && bun run dev   # Port 3003",
    "cd mini-services/audit-worker && bun run dev   # Port 3004",
  ]));

  content.push(heading("Git Workflow", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "git add .",
    "git commit -m \"feat: opis\"",
    "git push origin main  # Auto-deploy na Vercel",
  ]));

  content.push(heading("Build Provera", HeadingLevel.HEADING_2));
  content.push(...codeBlock([
    "bun run lint           # ESLint",
    "bun run db:push        # Schema sync",
  ]));

  // ═══════════════════════════════════════════════════════════
  // Statistika Projekta
  // ═══════════════════════════════════════════════════════════
  content.push(heading("Statistika Projekta", HeadingLevel.HEADING_1));
  content.push(makeTable(
    ["Metrika", "Vrednost"],
    [
      ["API Endpoint-i", "70+"],
      ["Prisma Modeli", "30"],
      ["React Komponente", "130+"],
      ["Landing Sekcije", "40+"],
      ["Dashboard Widget-i", "30"],
      ["UI Komponente (shadcn)", "45"],
      ["Mini Servisi", "2"],
      ["Browser Ekstenzije", "1"],
      ["WordPress Plugin", "1"],
      ["LLM Provider-i", "6"],
      ["Linija Koda", "~25,000+"],
    ],
    [40, 60]
  ));
  content.push(spacer());
  content.push(spacer());

  // Footer note
  content.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "10B981", space: 8 }
    },
    children: [new TextRun({
      text: "Dokumentacija generisana automatski za Seosights v0.2.0",
      italics: true,
      size: 20,
      color: c(P.secondary),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    })]
  }));
  content.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
      text: "Poslednje a\u017euriranje: Mart 2025",
      italics: true,
      size: 20,
      color: c(P.secondary),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }
    })]
  }));

  return content;
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT ASSEMBLY
// ═══════════════════════════════════════════════════════════════

const bodyChildren = buildBodyContent();

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" },
          size: 24,
          color: c(P.body),
        },
        paragraph: {
          spacing: { line: 312 },
        },
      },
      heading1: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "SimHei" },
          size: 32,
          bold: true,
          color: c(P.primary),
        },
        paragraph: {
          spacing: { before: 480, after: 120 },
        },
      },
      heading2: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "SimHei" },
          size: 28,
          bold: true,
          color: c(P.primary),
        },
        paragraph: {
          spacing: { before: 360, after: 120 },
        },
      },
      heading3: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "SimHei" },
          size: 24,
          bold: true,
          color: c(P.primary),
        },
        paragraph: {
          spacing: { before: 240, after: 120 },
        },
      },
    },
  },
  sections: [
    // ── Section 1: Cover Page ──
    {
      properties: {
        page: {
          size: pgSize,
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [buildCover()],
    },
    // ── Section 2: TOC (Front Matter) ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({
            text: "Sadr\u017eaj",
            bold: true,
            size: 32,
            color: c(P.primary),
            font: { ascii: "Times New Roman", eastAsia: "SimHei" }
          })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
            italics: true,
            size: 18,
            color: "888888"
          })]
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ── Section 3: Body ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: {
        default: makeFooter(),
      },
      children: bodyChildren,
    },
  ],
});

// ═══════════════════════════════════════════════════════════════
// GENERATE FILE
// ═══════════════════════════════════════════════════════════════

const OUTPUT = "/home/z/my-project/Seosights_Dokumentacija.docx";

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Document generated:", OUTPUT);
  console.log("Size:", (buf.length / 1024).toFixed(1), "KB");
}).catch(err => {
  console.error("Error generating document:", err);
  process.exit(1);
});
