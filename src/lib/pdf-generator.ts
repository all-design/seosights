/**
 * White-Label PDF Generator — Puppeteer-Based Premium Report Engine
 *
 * Generates branded, agency-quality PDF reports using Puppeteer.
 * The backend creates clean HTML/CSS, and Puppeteer renders it into a premium PDF.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY BENEFITS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. SEO agencies buy tools to SHOW reports to their clients and justify invoices.
 * 2. One-click branded PDF with their logo and colors → $79 Pro package sells itself.
 * 3. Only Pro/Managed users get white-label; others get the seosights-branded version.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Pull agency settings from DB (agencyName, agencyLogoUrl, agencyPrimaryColor)
 * 2. Pull analysis results from DB (the JSON assembled by Master Director)
 * 3. Build dynamic HTML template with inline Tailwind CSS
 * 4. Puppeteer renders HTML → PDF with A4 format, print backgrounds
 * 5. Return buffer ready for download or S3 upload
 */

import puppeteer from 'puppeteer'
import { db } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AgencyBranding {
  isPro: boolean
  logo: string
  brandName: string
  primaryColor: string
  secondaryColor: string
}

interface AuditData {
  url?: string
  target_url?: string
  overall_scores?: {
    seo_score: number
    aeo_score: number
    geo_score: number
  }
  overallScores?: {
    seo: number
    aeo: number
    geo: number
  }
  '90_day_roadmap'?: {
    week_1: RoadmapItem[]
    week_2: RoadmapItem[]
    week_3: RoadmapItem[]
    week_4: RoadmapItem[]
    week_5_to_8?: RoadmapItem[]
    week_9_to_12?: RoadmapItem[]
  }
  summary?: string
  executiveActions?: string[]
  audit?: {
    technicalSEO?: { score: number; issues?: { issue: string; severity: string; fix: string }[] }
    aeoReadiness?: { score: number; hasFAQ: boolean; hasSchema: boolean; answerFormatScore: number; issues?: string[] }
    geoVisibility?: { score: number; entityRecognition: number; knowledgeGraphPresence: boolean; citedByAI?: string[]; issues?: string[] }
    crawlability?: { score: number; issues?: { issue: string; impact: string }[] }
    pageSpeed?: { score: number; coreVitals?: { metric: string; value: string; status: string }[] }
    indexation?: { score: number; indexedPages: number; orphanPages: number; issues?: string[] }
  }
  eeat?: {
    overallScore: number
    experience: { score: number; findings: string[] }
    expertise: { score: number; findings: string[] }
    authoritativeness: { score: number; findings: string[] }
    trustworthiness: { score: number; findings: string[] }
  }
  aiCrawler?: {
    aiCrawlerAccess?: { bot: string; allowed: boolean; recommendation: string }[]
    llmsTxtPresence: boolean
  }
  geoCitability?: {
    overallScore: number
    citabilityScore: { score: number; weight: number; findings: string[] }
    structuralReadability: { score: number; weight: number; findings: string[] }
    multiModalContent: { score: number; weight: number; findings: string[] }
    authorityBrandSignals: { score: number; weight: number; findings: string[] }
    technicalAccessibility: { score: number; weight: number; findings: string[] }
  }
  agent_findings?: Record<string, Record<string, unknown>>
  all_recommended_actions?: { action_id: string; sight: string; description: string; estimated_impact: string }[]
  meta?: {
    session_id: string
    total_tokens_used: number
    total_cost_usd: number
    agents_completed: number
    agents_failed: number
  }
}

interface RoadmapItem {
  agent: string
  task: string
  sight: 'SEO' | 'AEO' | 'GEO'
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PDF Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a white-label PDF report for a given analysis.
 *
 * @param projectId - The project/analysis ID
 * @param userId - The user ID (for agency branding lookup)
 * @returns Buffer containing the PDF data
 */
export async function generateWhiteLabelPDF(
  analysisId: string,
  userId: string
): Promise<Buffer> {
  // 1. Pull agency settings + analysis results from DB
  const [user, analysis] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        agencyName: true,
        agencyLogoUrl: true,
        agencyPrimaryColor: true,
        agencySecondaryColor: true,
      },
    }),
    db.analysis.findUnique({
      where: { id: analysisId },
    }),
  ])

  if (!user) throw new Error('User not found')
  if (!analysis) throw new Error('Analysis not found')
  if (!analysis.result) throw new Error('Analysis has no results yet')

  // Parse the stored JSON result
  const auditData: AuditData = JSON.parse(analysis.result)

  // 2. Determine agency branding (Pro/Managed get white-label)
  const branding: AgencyBranding = {
    isPro: user.tier === 'pro' || user.tier === 'managed',
    logo:
      (user.tier === 'pro' || user.tier === 'managed') && user.agencyLogoUrl
        ? user.agencyLogoUrl
        : '',
    brandName:
      (user.tier === 'pro' || user.tier === 'managed') && user.agencyName
        ? user.agencyName
        : 'seosights Engine',
    primaryColor:
      (user.tier === 'pro' || user.tier === 'managed')
        ? user.agencyPrimaryColor || '#10b981'
        : '#10b981', // Default emerald
    secondaryColor:
      (user.tier === 'pro' || user.tier === 'managed')
        ? user.agencySecondaryColor || '#6B7280'
        : '#6B7280',
  }

  // 3. Build HTML
  const htmlContent = buildReportHTML(auditData, branding, analysis.url, analysis.domain)

  // 4. Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Critical: Tailwind colors and backgrounds render
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Template Builder
// ─────────────────────────────────────────────────────────────────────────────

function buildReportHTML(
  data: AuditData,
  branding: AgencyBranding,
  url: string,
  domain: string
): string {
  const pc = branding.primaryColor
  const sc = branding.secondaryColor
  const seoScore = data.overall_scores?.seo_score ?? data.overallScores?.seo ?? 0
  const aeoScore = data.overall_scores?.aeo_score ?? data.overallScores?.aeo ?? 0
  const geoScore = data.overall_scores?.geo_score ?? data.overallScores?.geo ?? 0
  const targetUrl = data.url || data.target_url || url

  // Score color helper
  const scoreColor = (s: number) =>
    s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'

  // Score label helper
  const scoreLabel = (s: number) =>
    s >= 70 ? 'Good' : s >= 40 ? 'Needs Work' : 'Critical'

  // Roadmap data
  const roadmap = data['90_day_roadmap']
  const week1 = roadmap?.week_1 || []
  const week2 = roadmap?.week_2 || []

  // E-E-A-T data
  const eeat = data.eeat
  const eeatScore = eeat?.overallScore ?? 0

  // AI Crawler data
  const aiCrawler = data.aiCrawler
  const blockedBots = aiCrawler?.aiCrawlerAccess?.filter(b => !b.allowed) || []
  const allowedBots = aiCrawler?.aiCrawlerAccess?.filter(b => b.allowed) || []

  // GEO Citability
  const geoCit = data.geoCitability
  const geoCitScore = geoCit?.overallScore ?? 0

  // Audit sections
  const techSEO = data.audit?.technicalSEO
  const aeoReadiness = data.audit?.aeoReadiness
  const geoVisibility = data.audit?.geoVisibility
  const crawlability = data.audit?.crawlability
  const pageSpeed = data.audit?.pageSpeed

  // Recommended actions
  const allActions = data.all_recommended_actions || []

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 10px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    :root {
      --primary-color: ${pc};
      --secondary-color: ${sc};
    }

    .page-break { page-break-before: always; }

    .brand-text { color: var(--primary-color); }
    .brand-bg { background-color: var(--primary-color); }
    .brand-border { border-color: var(--primary-color); }

    /* ── COVER PAGE ── */
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px;
      border-top: 8px solid ${pc};
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-logo {
      height: 48px;
      object-fit: contain;
    }

    .cover-label {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }

    .cover-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-title {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #111827;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 16px;
    }

    .cover-site {
      font-weight: 600;
      color: #374151;
    }

    .cover-accent-bar {
      width: 80px;
      height: 8px;
      background: ${pc};
      border-radius: 4px;
      margin-top: 16px;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
    }

    .cover-footer .agency-name { font-weight: 500; color: #374151; }

    /* ── SCORE CARDS ── */
    .score-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin: 32px 0;
    }

    .score-card {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
    }

    .score-card-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
    }

    .score-card-value {
      font-size: 40px;
      font-weight: 900;
      margin: 8px 0;
    }

    .score-card-status {
      font-size: 10px;
      font-weight: 500;
    }

    /* ── SECTION ── */
    .section {
      padding: 48px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${pc};
    }

    .section-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: ${pc}15;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .section-desc {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* ── ROADMAP ITEMS ── */
    .roadmap-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${pc};
      margin-bottom: 8px;
    }

    .roadmap-sight {
      padding: 2px 8px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      background: #e5e7eb;
      color: #374151;
      margin-right: 12px;
      white-space: nowrap;
    }

    .roadmap-sight.seo { background: #d1fae5; color: #065f46; }
    .roadmap-sight.aeo { background: #cffafe; color: #155e75; }
    .roadmap-sight.geo { background: #fef3c7; color: #92400e; }

    .roadmap-task {
      font-weight: 600;
      color: #111827;
      font-size: 11px;
    }

    .roadmap-agent {
      font-size: 9px;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* ── FINDINGS TABLE ── */
    .findings-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10px;
    }

    .findings-table th {
      background: ${pc};
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .findings-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }

    .findings-table tr:nth-child(even) { background: #f9fafb; }

    /* ── SEVERITY BADGES ── */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
    }

    .badge-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-info { background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; }
    .badge-good { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-blocked { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-allowed { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    /* ── E-E-A-T DIMENSIONS ── */
    .eeat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 16px 0;
    }

    .eeat-card {
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${pc};
    }

    .eeat-card-title {
      font-size: 11px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 4px;
    }

    .eeat-card-score {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .eeat-card-findings {
      font-size: 9px;
      color: #6b7280;
    }

    /* ── BOT STATUS ── */
    .bot-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 12px 0;
    }

    .bot-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 500;
    }

    .bot-item.blocked { background: #fef2f2; color: #dc2626; }
    .bot-item.allowed { background: #f0fdf4; color: #16a34a; }

    .bot-icon { font-size: 14px; }

    /* ── CITABILITY DIMENSIONS ── */
    .citability-bar {
      display: flex;
      align-items: center;
      margin: 8px 0;
    }

    .citability-label {
      width: 160px;
      font-size: 10px;
      font-weight: 500;
      color: #374151;
    }

    .citability-track {
      flex: 1;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .citability-fill {
      height: 100%;
      border-radius: 4px;
      background: ${pc};
    }

    .citability-score {
      width: 40px;
      text-align: right;
      font-size: 10px;
      font-weight: 700;
      color: #374151;
      margin-left: 8px;
    }

    /* ── LLMs.TXT STATUS ── */
    .llms-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin: 12px 0;
    }

    .llms-status.present { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .llms-status.missing { background: #fef2f2; border: 1px solid #fecaca; }

    .llms-icon { font-size: 20px; }

    .llms-label { font-weight: 600; font-size: 11px; }
    .llms-desc { font-size: 9px; color: #6b7280; margin-top: 2px; }

    /* ── FOOTER ── */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 48px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #d1d5db;
      border-top: 1px solid #f3f4f6;
    }

    /* ── EXECUTIVE ACTIONS ── */
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .action-number {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: ${pc}15;
      color: ${pc};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .action-text {
      font-size: 11px;
      color: #374151;
      padding-top: 3px;
    }

    /* ── SUMMARY BOX ── */
    .summary-box {
      padding: 20px;
      background: ${pc}08;
      border: 1px solid ${pc}20;
      border-radius: 12px;
      margin: 16px 0;
    }

    .summary-text {
      font-size: 12px;
      color: #374151;
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- PAGE 1: COVER -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  <div class="cover">
    <div class="cover-header">
      ${branding.logo ? `<img src="${branding.logo}" class="cover-logo" alt="Logo">` : `<span style="font-size:24px;font-weight:800;color:${pc};">seosights</span>`}
      <span class="cover-label">Digital Marketing Report</span>
    </div>

    <div class="cover-main">
      <h1 class="cover-title">Unified SEO &middot; AEO &middot; GEO Audit</h1>
      <p class="cover-subtitle">Comprehensive Visibility Report for <span class="cover-site">${domain || targetUrl}</span></p>
      <div class="cover-accent-bar"></div>
    </div>

    <div class="cover-footer">
      <div>Prepared by: <span class="agency-name">${branding.brandName}</span></div>
      <div>Date: ${dateStr}</div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- PAGE 2: EXECUTIVE SUMMARY + SCORES -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="section">
    <div class="section-header">
      <div class="section-icon">&#x1F3AF;</div>
      <div>
        <div class="section-title">Executive Summary</div>
        <div class="section-desc">Analysis performed across all Three Sights by 8 autonomous AI agents</div>
      </div>
    </div>

    <!-- Score Cards -->
    <div class="score-grid">
      <div class="score-card">
        <div class="score-card-label">1st Sight: SEO</div>
        <div class="score-card-value" style="color: ${scoreColor(seoScore)}">${seoScore}/100</div>
        <div class="score-card-status" style="color: ${scoreColor(seoScore)}">${scoreLabel(seoScore)}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">2nd Sight: AEO</div>
        <div class="score-card-value" style="color: ${scoreColor(aeoScore)}">${aeoScore}/100</div>
        <div class="score-card-status" style="color: ${scoreColor(aeoScore)}">${scoreLabel(aeoScore)}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">3rd Sight: GEO</div>
        <div class="score-card-value" style="color: ${scoreColor(geoScore)}">${geoScore}/100</div>
        <div class="score-card-status" style="color: ${scoreColor(geoScore)}">${scoreLabel(geoScore)}</div>
      </div>
    </div>

    <!-- Summary -->
    ${data.summary ? `
    <div class="summary-box">
      <div class="summary-text">${data.summary}</div>
    </div>` : ''}

    <!-- Executive Actions -->
    ${data.executiveActions && data.executiveActions.length > 0 ? `
    <div style="margin-top: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 12px;">Priority Actions</div>
      ${data.executiveActions.slice(0, 7).map((action, i) => `
        <div class="action-item">
          <div class="action-number">${i + 1}</div>
          <div class="action-text">${action}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Recommended Actions from Agent Protocol -->
    ${allActions.length > 0 ? `
    <div style="margin-top: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 12px;">All Agent Recommendations</div>
      <table class="findings-table">
        <thead>
          <tr><th>ID</th><th>Sight</th><th>Action</th><th>Impact</th></tr>
        </thead>
        <tbody>
          ${allActions.slice(0, 15).map(a => `
            <tr>
              <td style="font-weight:600;font-size:9px;">${a.action_id}</td>
              <td><span class="roadmap-sight ${a.sight.toLowerCase()}">${a.sight}</span></td>
              <td>${a.description}</td>
              <td><span class="badge ${a.estimated_impact === 'critical' ? 'badge-critical' : a.estimated_impact === 'high' ? 'badge-warning' : 'badge-info'}">${a.estimated_impact}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : ''}
  </div>

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- PAGE 3: 90-DAY ROADMAP -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  ${(week1.length > 0 || week2.length > 0) ? `
  <div class="page-break"></div>
  <div class="section">
    <div class="section-header">
      <div class="section-icon">&#x1F4C5;</div>
      <div>
        <div class="section-title">90-Day Roadmap</div>
        <div class="section-desc">Prioritized action items from all 8 AI agents</div>
      </div>
    </div>

    ${week1.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Week 1-2: Critical Actions</div>
      ${week1.map(item => `
        <div class="roadmap-item">
          <span class="roadmap-sight ${item.sight.toLowerCase()}">${item.sight}</span>
          <div>
            <div class="roadmap-task">${item.task}</div>
            <div class="roadmap-agent">Assigned Agent: ${item.agent}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    ${week2.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Week 3-4: High Priority</div>
      ${week2.map(item => `
        <div class="roadmap-item">
          <span class="roadmap-sight ${item.sight.toLowerCase()}">${item.sight}</span>
          <div>
            <div class="roadmap-task">${item.task}</div>
            <div class="roadmap-agent">Assigned Agent: ${item.agent}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    ${roadmap?.week_3?.length ? `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Week 5-8: Medium Priority</div>
      ${roadmap.week_3.map(item => `
        <div class="roadmap-item">
          <span class="roadmap-sight ${item.sight.toLowerCase()}">${item.sight}</span>
          <div>
            <div class="roadmap-task">${item.task}</div>
            <div class="roadmap-agent">Assigned Agent: ${item.agent}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}
  </div>` : ''}

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- PAGE 4: TECHNICAL AUDIT + AEO READINESS -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="section">
    <div class="section-header">
      <div class="section-icon">&#x1F50D;</div>
      <div>
        <div class="section-title">Technical Audit</div>
        <div class="section-desc">On-Page SEO, Crawlability, Core Web Vitals, Indexation</div>
      </div>
    </div>

    ${techSEO ? `
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px;">Technical SEO &mdash; Score: <span style="color:${scoreColor(techSEO.score)}">${techSEO.score}/100</span></div>
      ${techSEO.issues && techSEO.issues.length > 0 ? `
      <table class="findings-table">
        <thead><tr><th>Issue</th><th>Severity</th><th>Fix</th></tr></thead>
        <tbody>
          ${techSEO.issues.map(i => `
          <tr>
            <td>${i.issue}</td>
            <td><span class="badge ${i.severity === 'critical' ? 'badge-critical' : i.severity === 'warning' ? 'badge-warning' : 'badge-info'}">${i.severity}</span></td>
            <td>${i.fix}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : ''}
    </div>` : ''}

    ${crawlability ? `
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px;">Crawlability &mdash; Score: <span style="color:${scoreColor(crawlability.score)}">${crawlability.score}/100</span></div>
      ${crawlability.issues && crawlability.issues.length > 0 ? `
      <table class="findings-table">
        <thead><tr><th>Issue</th><th>Impact</th></tr></thead>
        <tbody>
          ${crawlability.issues.map(i => `<tr><td>${i.issue}</td><td>${i.impact}</td></tr>`).join('')}
        </tbody>
      </table>` : ''}
    </div>` : ''}

    ${pageSpeed ? `
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px;">Core Web Vitals &mdash; Score: <span style="color:${scoreColor(pageSpeed.score)}">${pageSpeed.score}/100</span></div>
      ${pageSpeed.coreVitals && pageSpeed.coreVitals.length > 0 ? `
      <table class="findings-table">
        <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
        <tbody>
          ${pageSpeed.coreVitals.map(v => `
          <tr>
            <td style="font-weight:600;">${v.metric}</td>
            <td>${v.value}</td>
            <td><span class="badge ${v.status === 'good' ? 'badge-good' : v.status === 'needs-improvement' ? 'badge-warning' : 'badge-critical'}">${v.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>` : ''}
    </div>` : ''}
  </div>

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- AEO READINESS + GEO VISIBILITY -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  ${aeoReadiness || geoVisibility ? `
  <div class="page-break"></div>
  <div class="section">
    ${aeoReadiness ? `
    <div class="section-header">
      <div class="section-icon">&#x1F4AC;</div>
      <div>
        <div class="section-title">AEO Readiness</div>
        <div class="section-desc">Answer Engine Optimization for AI assistants</div>
      </div>
    </div>

    <div class="score-grid" style="margin-top:0;">
      <div class="score-card">
        <div class="score-card-label">AEO Score</div>
        <div class="score-card-value" style="color: ${scoreColor(aeoReadiness.score)}">${aeoReadiness.score}/100</div>
        <div class="score-card-status" style="color: ${scoreColor(aeoReadiness.score)}">${scoreLabel(aeoReadiness.score)}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">FAQ Schema</div>
        <div class="score-card-value" style="color: ${aeoReadiness.hasFAQ ? '#10b981' : '#ef4444'}">${aeoReadiness.hasFAQ ? 'YES' : 'NO'}</div>
        <div class="score-card-status">${aeoReadiness.hasFAQ ? 'Present' : 'Missing'}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">Answer Format</div>
        <div class="score-card-value" style="color: ${scoreColor(aeoReadiness.answerFormatScore)}">${aeoReadiness.answerFormatScore}/100</div>
        <div class="score-card-status" style="color: ${scoreColor(aeoReadiness.answerFormatScore)}">${scoreLabel(aeoReadiness.answerFormatScore)}</div>
      </div>
    </div>

    ${aeoReadiness.issues && aeoReadiness.issues.length > 0 ? `
    <div style="margin-top: 16px;">
      ${aeoReadiness.issues.map(i => `<div style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:10px;color:#6b7280;">&#x26A0;&#xFE0F; ${i}</div>`).join('')}
    </div>` : ''}
    ` : ''}

    ${geoVisibility ? `
    <div style="margin-top: 32px;">
      <div class="section-header">
        <div class="section-icon">&#x1F30D;</div>
        <div>
          <div class="section-title">GEO Visibility</div>
          <div class="section-desc">Generative Engine Optimization for AI platforms</div>
        </div>
      </div>

      <div class="score-grid" style="margin-top:0;">
        <div class="score-card">
          <div class="score-card-label">GEO Score</div>
          <div class="score-card-value" style="color: ${scoreColor(geoVisibility.score)}">${geoVisibility.score}/100</div>
          <div class="score-card-status" style="color: ${scoreColor(geoVisibility.score)}">${scoreLabel(geoVisibility.score)}</div>
        </div>
        <div class="score-card">
          <div class="score-card-label">Entity Recognition</div>
          <div class="score-card-value" style="color: ${scoreColor(geoVisibility.entityRecognition)}">${geoVisibility.entityRecognition}/100</div>
          <div class="score-card-status" style="color: ${scoreColor(geoVisibility.entityRecognition)}">${scoreLabel(geoVisibility.entityRecognition)}</div>
        </div>
        <div class="score-card">
          <div class="score-card-label">Knowledge Graph</div>
          <div class="score-card-value" style="color: ${geoVisibility.knowledgeGraphPresence ? '#10b981' : '#ef4444'}">${geoVisibility.knowledgeGraphPresence ? 'YES' : 'NO'}</div>
          <div class="score-card-status">${geoVisibility.knowledgeGraphPresence ? 'Present' : 'Missing'}</div>
        </div>
      </div>

      ${geoVisibility.issues && geoVisibility.issues.length > 0 ? `
      <div style="margin-top: 16px;">
        ${geoVisibility.issues.map(i => `<div style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:10px;color:#6b7280;">&#x26A0;&#xFE0F; ${i}</div>`).join('')}
      </div>` : ''}
    </div>` : ''}
  </div>` : ''}

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- E-E-A-T + AI CRAWLER -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  ${(eeat || aiCrawler) ? `
  <div class="page-break"></div>
  <div class="section">
    ${eeat ? `
    <div class="section-header">
      <div class="section-icon">&#x1F6E1;&#xFE0F;</div>
      <div>
        <div class="section-title">E-E-A-T Analysis</div>
        <div class="section-desc">Experience, Expertise, Authoritativeness, Trustworthiness</div>
      </div>
    </div>

    <div style="text-align:center;margin:16px 0;">
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Overall E-E-A-T</div>
      <div style="font-size:48px;font-weight:900;color:${scoreColor(eeatScore)}">${eeatScore}/100</div>
    </div>

    <div class="eeat-grid">
      <div class="eeat-card">
        <div class="eeat-card-title">Experience</div>
        <div class="eeat-card-score" style="color:${scoreColor(eeat.experience.score)}">${eeat.experience.score}/100</div>
        <div class="eeat-card-findings">${eeat.experience.findings?.slice(0, 2).join('. ') || '-'}</div>
      </div>
      <div class="eeat-card">
        <div class="eeat-card-title">Expertise</div>
        <div class="eeat-card-score" style="color:${scoreColor(eeat.expertise.score)}">${eeat.expertise.score}/100</div>
        <div class="eeat-card-findings">${eeat.expertise.findings?.slice(0, 2).join('. ') || '-'}</div>
      </div>
      <div class="eeat-card">
        <div class="eeat-card-title">Authoritativeness</div>
        <div class="eeat-card-score" style="color:${scoreColor(eeat.authoritativeness.score)}">${eeat.authoritativeness.score}/100</div>
        <div class="eeat-card-findings">${eeat.authoritativeness.findings?.slice(0, 2).join('. ') || '-'}</div>
      </div>
      <div class="eeat-card">
        <div class="eeat-card-title">Trustworthiness</div>
        <div class="eeat-card-score" style="color:${scoreColor(eeat.trustworthiness.score)}">${eeat.trustworthiness.score}/100</div>
        <div class="eeat-card-findings">${eeat.trustworthiness.findings?.slice(0, 2).join('. ') || '-'}</div>
      </div>
    </div>` : ''}

    ${aiCrawler ? `
    <div style="margin-top: 32px;">
      <div class="section-header">
        <div class="section-icon">&#x1F916;</div>
        <div>
          <div class="section-title">AI Crawler Access</div>
          <div class="section-desc">Which AI bots can access your content</div>
        </div>
      </div>

      <!-- llms.txt Status -->
      <div class="llms-status ${aiCrawler.llmsTxtPresence ? 'present' : 'missing'}">
        <div class="llms-icon">${aiCrawler.llmsTxtPresence ? '&#x2705;' : '&#x274C;'}</div>
        <div>
          <div class="llms-label">llms.txt ${aiCrawler.llmsTxtPresence ? 'Found' : 'Missing'}</div>
          <div class="llms-desc">${aiCrawler.llmsTxtPresence ? 'AI models can discover your content efficiently' : 'AI models cannot discover your content — add llms.txt to your root directory'}</div>
        </div>
      </div>

      ${blockedBots.length > 0 ? `
      <div style="margin-top: 16px;">
        <div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:8px;">Blocked AI Crawlers</div>
        <div class="bot-grid">
          ${blockedBots.map(b => `
          <div class="bot-item blocked">
            <span class="bot-icon">&#x1F6AB;</span>
            <span>${b.bot}</span>
          </div>`).join('')}
        </div>
        <div style="font-size:9px;color:#6b7280;margin-top:4px;">These AI bots cannot access your site &mdash; you are invisible to their users.</div>
      </div>` : ''}

      ${allowedBots.length > 0 ? `
      <div style="margin-top: 16px;">
        <div style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:8px;">Allowed AI Crawlers</div>
        <div class="bot-grid">
          ${allowedBots.slice(0, 6).map(b => `
          <div class="bot-item allowed">
            <span class="bot-icon">&#x2705;</span>
            <span>${b.bot}</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>` : ''}
  </div>` : ''}

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- GEO CITABILITY -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  ${geoCit ? `
  <div class="page-break"></div>
  <div class="section">
    <div class="section-header">
      <div class="section-icon">&#x1F3AF;</div>
      <div>
        <div class="section-title">GEO Citability Score</div>
        <div class="section-desc">How likely AI engines are to cite and reference your content</div>
      </div>
    </div>

    <div style="text-align:center;margin:16px 0;">
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Overall Citability</div>
      <div style="font-size:48px;font-weight:900;color:${scoreColor(geoCitScore)}">${geoCitScore}/100</div>
    </div>

    <div style="max-width:500px;margin:0 auto;">
      ${[
        { label: 'Citability Score', data: geoCit.citabilityScore },
        { label: 'Structural Readability', data: geoCit.structuralReadability },
        { label: 'Multi-Modal Content', data: geoCit.multiModalContent },
        { label: 'Authority & Brand Signals', data: geoCit.authorityBrandSignals },
        { label: 'Technical Accessibility', data: geoCit.technicalAccessibility },
      ].map(dim => `
        <div class="citability-bar">
          <div class="citability-label">${dim.label}<br><span style="font-size:8px;color:#9ca3af;">Weight: ${dim.data.weight}%</span></div>
          <div class="citability-track">
            <div class="citability-fill" style="width: ${dim.data.score}%; background: ${scoreColor(dim.data.score)}"></div>
          </div>
          <div class="citability-score">${dim.data.score}</div>
        </div>
      `).join('')}
    </div>

    ${[geoCit.citabilityScore, geoCit.structuralReadability, geoCit.multiModalContent, geoCit.authorityBrandSignals, geoCit.technicalAccessibility].some(d => d.findings && d.findings.length > 0) ? `
    <div style="margin-top: 24px;">
      <div style="font-size:12px;font-weight:700;color:#111827;margin-bottom:8px;">Key Findings</div>
      ${[geoCit.citabilityScore, geoCit.structuralReadability, geoCit.multiModalContent, geoCit.authorityBrandSignals, geoCit.technicalAccessibility].flatMap(d => d.findings || []).slice(0, 6).map(f => `
        <div style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:10px;color:#6b7280;">&#x2022; ${f}</div>
      `).join('')}
    </div>` : ''}
  </div>` : ''}

  <!-- ════════════════════════════════════════════════════════════════ -->
  <!-- BACK PAGE / DISCLAIMER -->
  <!-- ════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="section" style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:90vh;text-align:center;">
    <div style="font-size:32px;font-weight:800;color:${pc};margin-bottom:8px;">
      ${branding.brandName}
    </div>
    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:32px;">
      SEO &middot; AEO &middot; GEO Intelligence Platform
    </div>
    <div style="width:80px;height:4px;background:${pc};border-radius:2px;margin-bottom:32px;"></div>
    <div style="font-size:11px;color:#9ca3af;max-width:400px;line-height:1.6;">
      This report was generated by 8 autonomous AI agents analyzing your site across
      Traditional Search (SEO), Answer Engines (AEO), and Generative Engines (GEO).
    </div>
    <div style="margin-top:32px;font-size:9px;color:#d1d5db;">
      &copy; ${new Date().getFullYear()} ${branding.brandName} &mdash; Confidential
    </div>
    ${data.meta ? `
    <div style="margin-top:16px;font-size:8px;color:#e5e7eb;">
      Session: ${data.meta.session_id} | Agents: ${data.meta.agents_completed} completed, ${data.meta.agents_failed} failed | Cost: $${data.meta.total_cost_usd?.toFixed(4) || '0.00'}
    </div>` : ''}
  </div>

</body>
</html>`
}
