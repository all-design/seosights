import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

// ── Font Registration for Next.js Runtime ──────────────────────────
// In Next.js, pdfkit's __dirname doesn't point to its module directory,
// so we register fonts explicitly from a local copy
const FONT_DIR = path.join(process.cwd(), 'src', 'fonts')

function registerFonts(doc: InstanceType<typeof PDFDocument>): void {
  const fonts = ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
    'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique',
    'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic']
  for (const font of fonts) {
    const afmPath = path.join(FONT_DIR, `${font}.afm`)
    if (fs.existsSync(afmPath)) {
      try {
        doc.registerFont(font, afmPath)
      } catch {
        // Font may already be registered
      }
    }
  }
}

// ── Color Palette (Emerald / Gold / Cyan) ──────────────────────────
const COLORS = {
  emerald: '#10B981',
  emeraldDark: '#059669',
  gold: '#F59E0B',
  goldDark: '#D97706',
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  dark: '#1F2937',
  medium: '#4B5563',
  light: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  bgLight: '#F0FDF4',
  bgAmber: '#FFFBEB',
  bgRed: '#FEF2F2',
} as const

// ── Score Color Helper ─────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 70) return COLORS.green
  if (score >= 40) return COLORS.amber
  return COLORS.red
}

function scoreBgColor(score: number): string {
  if (score >= 70) return COLORS.bgLight
  if (score >= 40) return COLORS.bgAmber
  return COLORS.bgRed
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Critical'
}

// ── Type Helpers (inline to avoid client imports) ──────────────────
interface ReportData {
  url: string
  siteName: string
  market: string
  overallScores: { seo: number; aeo: number; geo: number; combined: number }
  audit: {
    technicalSEO: { score: number; issues: { issue: string; severity: string; fix: string }[] }
    crawlability: { score: number; issues: { issue: string; impact: string }[] }
    pageSpeed: { score: number; coreVitals: { metric: string; value: string; status: string }[] }
    indexation: { score: number; indexedPages: number; orphanPages: number; issues: string[] }
    aeoReadiness: { score: number; hasFAQ: boolean; hasSchema: boolean; hasStructuredData: boolean; answerFormatScore: number; issues: string[] }
    geoVisibility: { score: number; citedByAI: string[]; entityRecognition: number; knowledgeGraphPresence: boolean; issues: string[] }
  }
  eeat: {
    overallScore: number
    experience: { score: number; findings: string[] }
    expertise: { score: number; findings: string[] }
    authoritativeness: { score: number; findings: string[] }
    trustworthiness: { score: number; findings: string[] }
    whoHowWhyTest: { who: string; how: string; why: string }
  }
  geoCitability: {
    overallScore: number
    citabilityScore: { score: number; weight: number; findings: string[] }
    structuralReadability: { score: number; weight: number; findings: string[] }
    multiModalContent: { score: number; weight: number; findings: string[] }
    authorityBrandSignals: { score: number; weight: number; findings: string[] }
    technicalAccessibility: { score: number; weight: number; findings: string[] }
  }
  aiCrawler: {
    aiCrawlerAccess: { bot: string; allowed: boolean; recommendation: string }[]
    robotsTxtAnalysis: string[]
    llmsTxtPresence: boolean
    jsRenderingDependency: string
    ssrVsCsr: string
  }
  brandMentions: {
    brandMentionScore: number
    backlinkCorrelation: string
    platformPresence: { platform: string; detected: boolean; strength: string }[]
    citationSources: { engine: string; topSource: string; percentage: number }[]
  }
  contentQuality: {
    overallScore: number
    contentDepth: number
    aiPatternRisk: string
    humanizationTips: string[]
    fillerDetected: string[]
    originalityIndicators: string[]
  }
  parasiteRisk: {
    riskLevel: string
    findings: string[]
    recommendations: string[]
  }
  localSEO: {
    applicable: boolean
    gbpSignals: { score: number; findings: string[] }
    napConsistency: { score: number; findings: string[] }
    reviewSignals: { score: number; findings: string[] }
    businessType: string
  }
  sxo: {
    pageTypeMatch: string
    serpIntentMatch: string
    userPersonaScores: { persona: string; score: number }[]
    recommendations: string[]
  }
  structure: {
    topicClusters: { cluster: string; pillarKeyword: string; supportingKeywords: string[]; seoOpportunity: string; aeoOpportunity: string; geoOpportunity: string }[]
    keywordGaps: { keyword: string; volume: string; difficulty: string; type: string; opportunity: string }[]
    contentArchitecture: {
      recommended: { section: string; purpose: string; pillar: string }[]
      internalLinkMap: { from: string; to: string; anchor: string }[]
    }
    schemaRecommendations: { schemaType: string; purpose: string; pillar: string; implementation: string; status: string }[]
  }
  creative: {
    contentBriefs: { title: string; type: string; targetKeyword: string; pillar: string; brief: string; estimatedImpact: string; wordCount: string; structure: string[] }[]
    onPageOptimizations: { page: string; currentTitle: string; suggestedTitle: string; suggestedDescription: string; aeoTweaks: string[]; geoTweaks: string[] }[]
    answerBlocks: { question: string; suggestedAnswer: string; format: string; targetEngine: string }[]
  }
  measure: {
    kpiTracking: {
      seo: { metric: string; current: string; target: string; timeline: string }[]
      aeo: { metric: string; current: string; target: string; timeline: string }[]
      geo: { metric: string; current: string; target: string; timeline: string }[]
    }
    competitorBenchmarks: { competitor: string; url: string; seoScore: number; aeoScore: number; geoScore: number; citedBy: string[] }[]
    weeklyActions: { week: string; tasks: { task: string; pillar: string; priority: string }[] }[]
  }
  summary: string
  executiveActions: string[]
  algorithmUpdates?: {
    recentUpdates: { name: string; date: string; impact: string; description: string; affectedPillar: string }[]
  }
  roadmap?: {
    quarters: { label: string; seoGoal: string; aeoGoal: string; geoGoal: string; targetScores: { seo: number; aeo: number; geo: number } }[]
  }
  trafficInsights?: {
    winners: { page: string; change: string; pillar: string }[]
    losers: { page: string; change: string; pillar: string }[]
  }
}

// ── PDF Builder ─────────────────────────────────────────────────────

const PAGE_WIDTH = 595.28
const CONTENT_WIDTH = PAGE_WIDTH - 72 - 72 // 72pt margins each side
const LEFT_MARGIN = 72

class PDFBuilder {
  private doc: InstanceType<typeof PDFDocument>
  private y = 0

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: LEFT_MARGIN, right: LEFT_MARGIN },
      bufferPages: true,
      info: {
        Title: 'Agent OS — SEO/AEO/GEO Analysis Report',
        Author: 'Agent OS',
        Subject: 'Comprehensive Search Intelligence Report',
      },
    })
    registerFonts(this.doc)
    this.y = this.doc.y
  }

  // ── Helpers ──────────────────────────────────────────────────

  private ensureSpace(needed: number): void {
    if (this.y + needed > this.doc.page.height - 90) {
      this.doc.addPage()
      this.y = this.doc.y
    }
  }

  private setY(y: number): void {
    this.y = y
    this.doc.y = y
  }

  private drawFilledRect(x: number, y: number, w: number, h: number, color: string): void {
    this.doc.save().rect(x, y, w, h).fill(color).restore()
    this.doc.y = this.y
  }

  private drawRect(x: number, y: number, w: number, h: number, color: string, lineWidth = 1): void {
    this.doc.save().lineWidth(lineWidth).rect(x, y, w, h).stroke(color).restore()
    this.doc.y = this.y
  }

  // ── Section Headers ──────────────────────────────────────────

  sectionTitle(text: string, color = COLORS.emeraldDark): this {
    this.ensureSpace(50)
    // Accent bar
    this.drawFilledRect(LEFT_MARGIN, this.y, 4, 24, color)
    this.doc.fontSize(16).font('Helvetica-Bold').fillColor(color).text(text, LEFT_MARGIN + 14, this.y + 3)
    this.setY(this.y + 30)
    // Divider line
    this.doc.save().moveTo(LEFT_MARGIN, this.y).lineTo(PAGE_WIDTH - LEFT_MARGIN, this.y).lineWidth(0.5).strokeColor(COLORS.border).stroke().restore()
    this.setY(this.y + 10)
    return this
  }

  subTitle(text: string, color = COLORS.dark): this {
    this.ensureSpace(30)
    this.doc.fontSize(12).font('Helvetica-Bold').fillColor(color).text(text, LEFT_MARGIN, this.y)
    this.setY(this.y + 18)
    return this
  }

  bodyText(text: string, indent = 0): this {
    this.ensureSpace(20)
    this.doc.fontSize(9.5).font('Helvetica').fillColor(COLORS.medium).text(text, LEFT_MARGIN + indent, this.y, { width: CONTENT_WIDTH - indent, lineGap: 2 })
    this.setY(this.doc.y + 4)
    return this
  }

  bulletItem(text: string, indent = 12, bulletColor = COLORS.emerald): this {
    this.ensureSpace(18)
    const bx = LEFT_MARGIN + indent
    this.doc.fontSize(9).font('Helvetica').fillColor(bulletColor).text('●', bx, this.y, { continued: false })
    this.doc.fontSize(9.5).font('Helvetica').fillColor(COLORS.medium).text(text, bx + 12, this.y - 1, { width: CONTENT_WIDTH - indent - 16, lineGap: 1.5 })
    this.setY(this.doc.y + 3)
    return this
  }

  // ── Score Card ───────────────────────────────────────────────

  scoreCard(label: string, score: number, width: number, x?: number): this {
    const cx = x ?? LEFT_MARGIN
    this.ensureSpace(65)
    const cardY = this.y
    const cardH = 58
    // Background
    this.drawFilledRect(cx, cardY, width, cardH, scoreBgColor(score))
    this.drawRect(cx, cardY, width, cardH, scoreColor(score), 1.5)
    // Score number
    this.doc.fontSize(22).font('Helvetica-Bold').fillColor(scoreColor(score)).text(String(score), cx, cardY + 6, { width, align: 'center' })
    // Label
    this.doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLORS.dark).text(label.toUpperCase(), cx, cardY + 32, { width, align: 'center' })
    // Status
    this.doc.fontSize(7.5).font('Helvetica').fillColor(scoreColor(score)).text(scoreLabel(score), cx, cardY + 44, { width, align: 'center' })
    this.setY(cardY + cardH + 8)
    return this
  }

  // ── Pillar Badge Color ───────────────────────────────────────

  pillarColor(pillar: string): string {
    switch (pillar) {
      case 'seo': return COLORS.emerald
      case 'aeo': return COLORS.gold
      case 'geo': return COLORS.cyan
      default: return COLORS.medium
    }
  }

  // ── Simple Table ─────────────────────────────────────────────

  simpleTable(headers: { label: string; width: number }[], rows: string[][], headerBg = COLORS.emeraldDark): this {
    this.ensureSpace(20 + rows.length * 18)
    // Header
    let cx = LEFT_MARGIN
    const hy = this.y
    this.drawFilledRect(LEFT_MARGIN, hy, CONTENT_WIDTH, 18, headerBg)
    for (const h of headers) {
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white).text(h.label, cx + 4, hy + 4, { width: h.width - 8, align: 'left', lineBreak: false })
      cx += h.width
    }
    this.drawRect(LEFT_MARGIN, hy, CONTENT_WIDTH, 18, headerBg)
    this.setY(hy + 18)

    // Rows
    for (let i = 0; i < rows.length; i++) {
      this.ensureSpace(20)
      const ry = this.y
      const bg = i % 2 === 1 ? COLORS.light : undefined
      if (bg) this.drawFilledRect(LEFT_MARGIN, ry, CONTENT_WIDTH, 18, bg)
      cx = LEFT_MARGIN
      for (let j = 0; j < headers.length; j++) {
        const text = rows[j] ?? ''
        this.doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark).text(String(text), cx + 4, ry + 4, { width: headers[j].width - 8, align: 'left', lineBreak: false, ellipsis: true })
        cx += headers[j].width
      }
      this.drawRect(LEFT_MARGIN, ry, CONTENT_WIDTH, 18, COLORS.border, 0.5)
      this.setY(ry + 18)
    }
    this.setY(this.y + 6)
    return this
  }

  // ── Labeled Value ────────────────────────────────────────────

  labeledValue(label: string, value: string, labelColor = COLORS.medium, valueColor = COLORS.dark): this {
    this.ensureSpace(18)
    this.doc.fontSize(8).font('Helvetica').fillColor(labelColor).text(label + ': ', LEFT_MARGIN + 12, this.y, { continued: true })
    this.doc.font('Helvetica-Bold').fillColor(valueColor).text(value)
    this.setY(this.doc.y + 2)
    return this
  }

  // ── Spacer ───────────────────────────────────────────────────

  spacer(h = 8): this {
    this.setY(this.y + h)
    return this
  }

  // ── Cover Page ───────────────────────────────────────────────

  coverPage(data: ReportData): this {
    // Full emerald background band
    this.drawFilledRect(0, 0, PAGE_WIDTH, 280, COLORS.emeraldDark)

    // Brand name
    this.doc.fontSize(36).font('Helvetica-Bold').fillColor(COLORS.white).text('Agent OS', 0, 80, { align: 'center' })

    // Tagline
    this.doc.fontSize(12).font('Helvetica').fillColor('rgba(255,255,255,0.8)').text('Search Intelligence Platform', 0, 125, { align: 'center' })

    // Divider
    this.doc.save().moveTo(PAGE_WIDTH / 2 - 60, 155).lineTo(PAGE_WIDTH / 2 + 60, 155).lineWidth(2).strokeColor(COLORS.gold).stroke().restore()

    // Report title
    this.doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.white).text('SEO / AEO / GEO Analysis Report', 0, 175, { align: 'center' })

    // Site info
    this.doc.fontSize(11).font('Helvetica').fillColor('rgba(255,255,255,0.9)').text(data.siteName, 0, 210, { align: 'center' })
    this.doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text(data.url, 0, 228, { align: 'center' })

    // Market & date
    this.doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text(`Market: ${data.market}  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 248, { align: 'center' })

    // ── Score Cards ──────────────────────────────────────────
    const cardW = (CONTENT_WIDTH - 30) / 4 // 4 cards with gaps
    const cardStartY = 320
    const scores = [
      { label: 'SEO Score', value: data.overallScores.seo },
      { label: 'AEO Score', value: data.overallScores.aeo },
      { label: 'GEO Score', value: data.overallScores.geo },
      { label: 'Combined', value: data.overallScores.combined },
    ]

    for (let i = 0; i < scores.length; i++) {
      const cx = LEFT_MARGIN + i * (cardW + 10)
      const s = scores[i]
      // Card bg
      this.drawFilledRect(cx, cardStartY, cardW, 70, scoreBgColor(s.value))
      this.drawRect(cx, cardStartY, cardW, 70, scoreColor(s.value), 2)
      // Score
      this.doc.fontSize(28).font('Helvetica-Bold').fillColor(scoreColor(s.value)).text(String(s.value), cx, cardStartY + 8, { width: cardW, align: 'center' })
      // Label
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.dark).text(s.label.toUpperCase(), cx, cardStartY + 42, { width: cardW, align: 'center' })
      // Status
      this.doc.fontSize(7).font('Helvetica').fillColor(scoreColor(s.value)).text(scoreLabel(s.value), cx, cardStartY + 55, { width: cardW, align: 'center' })
    }

    // Footer on cover
    const pageH = this.doc.page.height
    this.doc.fontSize(8).font('Helvetica').fillColor(COLORS.medium)
      .text('This report provides a comprehensive three-pillar analysis of your web presence.', LEFT_MARGIN, pageH - 100, { width: CONTENT_WIDTH, align: 'center' })
      .text('SEO (Search Engine Optimization) · AEO (Answer Engine Optimization) · GEO (Generative Engine Optimization)', LEFT_MARGIN, pageH - 86, { width: CONTENT_WIDTH, align: 'center' })

    this.doc.fontSize(7).fillColor(COLORS.border).text('© ' + new Date().getFullYear() + ' Agent OS — Confidential', LEFT_MARGIN, pageH - 60, { width: CONTENT_WIDTH, align: 'center' })

    this.doc.addPage()
    this.y = this.doc.y
    return this
  }

  // ── Executive Summary ────────────────────────────────────────

  executiveSummary(data: ReportData): this {
    this.sectionTitle('Executive Summary', COLORS.emeraldDark)
    this.bodyText(data.summary)
    this.spacer(6)

    this.subTitle('Top 5 Priority Actions')
    for (let i = 0; i < data.executiveActions.length; i++) {
      this.ensureSpace(20)
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.emerald).text(`${i + 1}.`, LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(` ${data.executiveActions[i]}`, { width: CONTENT_WIDTH - 24 })
      this.setY(this.doc.y + 3)
    }
    this.spacer(8)
    return this
  }

  // ── Phase 1: Audit ───────────────────────────────────────────

  auditPhase(data: ReportData): this {
    this.sectionTitle('Phase 1: Audit', COLORS.emeraldDark)

    // Technical SEO
    this.subTitle('Technical SEO')
    this.scoreCard('Technical SEO Score', data.audit.technicalSEO.score, 160)
    if (data.audit.technicalSEO.issues.length > 0) {
      this.simpleTable(
        [{ label: 'Issue', width: CONTENT_WIDTH * 0.38 }, { label: 'Severity', width: CONTENT_WIDTH * 0.15 }, { label: 'Fix', width: CONTENT_WIDTH * 0.47 }],
        data.audit.technicalSEO.issues.map(i => [i.issue, i.severity, i.fix])
      )
    }

    // Crawlability
    this.subTitle('Crawlability')
    this.scoreCard('Crawlability Score', data.audit.crawlability.score, 160)
    if (data.audit.crawlability.issues.length > 0) {
      this.simpleTable(
        [{ label: 'Issue', width: CONTENT_WIDTH * 0.5 }, { label: 'Impact', width: CONTENT_WIDTH * 0.5 }],
        data.audit.crawlability.issues.map(i => [i.issue, i.impact])
      )
    }

    // Core Web Vitals
    this.subTitle('Core Web Vitals')
    this.scoreCard('Page Speed Score', data.audit.pageSpeed.score, 160)
    if (data.audit.pageSpeed.coreVitals.length > 0) {
      this.simpleTable(
        [{ label: 'Metric', width: CONTENT_WIDTH * 0.25 }, { label: 'Value', width: CONTENT_WIDTH * 0.35 }, { label: 'Status', width: CONTENT_WIDTH * 0.4 }],
        data.audit.pageSpeed.coreVitals.map(v => [v.metric, v.value, v.status])
      )
    }

    // Indexation
    this.subTitle('Indexation')
    this.labeledValue('Score', String(data.audit.indexation.score))
    this.labeledValue('Indexed Pages', String(data.audit.indexation.indexedPages))
    this.labeledValue('Orphan Pages', String(data.audit.indexation.orphanPages))
    if (data.audit.indexation.issues.length > 0) {
      this.subTitle('Indexation Issues', COLORS.medium)
      for (const iss of data.audit.indexation.issues) {
        this.bulletItem(iss, 12, COLORS.amber)
      }
    }
    this.spacer(6)

    // AEO Readiness
    this.subTitle('AEO Readiness')
    this.scoreCard('AEO Readiness Score', data.audit.aeoReadiness.score, 160)
    this.labeledValue('Has FAQ', data.audit.aeoReadiness.hasFAQ ? 'Yes' : 'No')
    this.labeledValue('Has Schema', data.audit.aeoReadiness.hasSchema ? 'Yes' : 'No')
    this.labeledValue('Has Structured Data', data.audit.aeoReadiness.hasStructuredData ? 'Yes' : 'No')
    this.labeledValue('Answer Format Score', String(data.audit.aeoReadiness.answerFormatScore))
    if (data.audit.aeoReadiness.issues.length > 0) {
      for (const iss of data.audit.aeoReadiness.issues) {
        this.bulletItem(iss, 12, COLORS.goldDark)
      }
    }
    this.spacer(6)

    // GEO Visibility
    this.subTitle('GEO Visibility')
    this.scoreCard('GEO Visibility Score', data.audit.geoVisibility.score, 160)
    this.labeledValue('Entity Recognition', String(data.audit.geoVisibility.entityRecognition))
    this.labeledValue('Knowledge Graph', data.audit.geoVisibility.knowledgeGraphPresence ? 'Present' : 'Absent')
    if (data.audit.geoVisibility.citedByAI.length > 0) {
      this.labeledValue('Cited By AI', data.audit.geoVisibility.citedByAI.join(', '))
    }
    if (data.audit.geoVisibility.issues.length > 0) {
      for (const iss of data.audit.geoVisibility.issues) {
        this.bulletItem(iss, 12, COLORS.cyanDark)
      }
    }
    this.spacer(6)
    return this
  }

  // ── E-E-A-T Analysis ─────────────────────────────────────────

  eeatSection(data: ReportData): this {
    this.sectionTitle('E-E-A-T Analysis', COLORS.goldDark)
    this.scoreCard('E-E-A-T Overall', data.eeat.overallScore, 160)
    this.spacer(2)

    const dims = [
      { label: 'Experience', data: data.eeat.experience },
      { label: 'Expertise', data: data.eeat.expertise },
      { label: 'Authoritativeness', data: data.eeat.authoritativeness },
      { label: 'Trustworthiness', data: data.eeat.trustworthiness },
    ]

    for (const d of dims) {
      this.ensureSpace(40)
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(scoreColor(d.data.score))
        .text(`${d.label}: ${d.data.score}/100`, LEFT_MARGIN + 8, this.y)
      this.setY(this.y + 16)
      for (const f of d.data.findings) {
        this.bulletItem(f, 20, COLORS.gold)
      }
    }

    this.spacer(4)
    this.subTitle('Who / How / Why Test')
    this.labeledValue('WHO', data.eeat.whoHowWhyTest.who, COLORS.gold, COLORS.dark)
    this.labeledValue('HOW', data.eeat.whoHowWhyTest.how, COLORS.gold, COLORS.dark)
    this.labeledValue('WHY', data.eeat.whoHowWhyTest.why, COLORS.gold, COLORS.dark)
    this.spacer(6)
    return this
  }

  // ── GEO Citability ───────────────────────────────────────────

  geoCitabilitySection(data: ReportData): this {
    this.sectionTitle('GEO Citability', COLORS.cyanDark)
    this.scoreCard('GEO Citability Score', data.geoCitability.overallScore, 160)
    this.spacer(2)

    const dims = [
      { label: 'Citability Score', d: data.geoCitability.citabilityScore },
      { label: 'Structural Readability', d: data.geoCitability.structuralReadability },
      { label: 'Multi-Modal Content', d: data.geoCitability.multiModalContent },
      { label: 'Authority & Brand Signals', d: data.geoCitability.authorityBrandSignals },
      { label: 'Technical Accessibility', d: data.geoCitability.technicalAccessibility },
    ]

    this.simpleTable(
      [{ label: 'Dimension', width: CONTENT_WIDTH * 0.3 }, { label: 'Score', width: CONTENT_WIDTH * 0.15 }, { label: 'Weight', width: CONTENT_WIDTH * 0.12 }, { label: 'Findings', width: CONTENT_WIDTH * 0.43 }],
      dims.map(d => [d.label, String(d.d.score), d.d.weight + '%', (d.d.findings[0] ?? '-')])
    )
    this.spacer(6)
    return this
  }

  // ── AI Crawler Analysis ──────────────────────────────────────

  aiCrawlerSection(data: ReportData): this {
    this.sectionTitle('AI Crawler & Bot Analysis', COLORS.cyanDark)

    if (data.aiCrawler.aiCrawlerAccess.length > 0) {
      this.simpleTable(
        [{ label: 'Bot', width: CONTENT_WIDTH * 0.2 }, { label: 'Allowed', width: CONTENT_WIDTH * 0.15 }, { label: 'Recommendation', width: CONTENT_WIDTH * 0.65 }],
        data.aiCrawler.aiCrawlerAccess.map(b => [b.bot, b.allowed ? 'Yes' : 'No', b.recommendation]),
        COLORS.cyanDark
      )
    }

    this.labeledValue('llms.txt Present', data.aiCrawler.llmsTxtPresence ? 'Yes' : 'No')
    this.labeledValue('JS Rendering Dependency', data.aiCrawler.jsRenderingDependency.toUpperCase())
    this.labeledValue('SSR vs CSR', data.aiCrawler.ssrVsCsr)

    if (data.aiCrawler.robotsTxtAnalysis.length > 0) {
      this.subTitle('robots.txt Analysis')
      for (const r of data.aiCrawler.robotsTxtAnalysis) {
        this.bulletItem(r, 12, COLORS.cyan)
      }
    }
    this.spacer(6)
    return this
  }

  // ── Brand Mentions ───────────────────────────────────────────

  brandMentionsSection(data: ReportData): this {
    this.sectionTitle('Brand Mentions & AI Citation Signals', COLORS.goldDark)
    this.scoreCard('Brand Mention Score', data.brandMentions.brandMentionScore, 160)
    this.labeledValue('Backlink Correlation', data.brandMentions.backlinkCorrelation)
    this.spacer(4)

    if (data.brandMentions.platformPresence.length > 0) {
      this.subTitle('Platform Presence')
      this.simpleTable(
        [{ label: 'Platform', width: CONTENT_WIDTH * 0.35 }, { label: 'Detected', width: CONTENT_WIDTH * 0.2 }, { label: 'Strength', width: CONTENT_WIDTH * 0.45 }],
        data.brandMentions.platformPresence.map(p => [p.platform, p.detected ? 'Yes' : 'No', p.strength]),
        COLORS.goldDark
      )
    }

    if (data.brandMentions.citationSources.length > 0) {
      this.subTitle('Citation Sources')
      this.simpleTable(
        [{ label: 'Engine', width: CONTENT_WIDTH * 0.3 }, { label: 'Top Source', width: CONTENT_WIDTH * 0.4 }, { label: '%', width: CONTENT_WIDTH * 0.3 }],
        data.brandMentions.citationSources.map(c => [c.engine, c.topSource, String(c.percentage + '%')]),
        COLORS.goldDark
      )
    }
    this.spacer(6)
    return this
  }

  // ── Content Quality ──────────────────────────────────────────

  contentQualitySection(data: ReportData): this {
    this.sectionTitle('Content Quality & Humanization', COLORS.emeraldDark)
    this.scoreCard('Content Quality Score', data.contentQuality.overallScore, 160)
    this.labeledValue('Content Depth', String(data.contentQuality.contentDepth) + '/100')
    this.labeledValue('AI Pattern Risk', data.contentQuality.aiPatternRisk.toUpperCase(), COLORS.medium, scoreColor(
      data.contentQuality.aiPatternRisk === 'low' ? 80 : data.contentQuality.aiPatternRisk === 'medium' ? 50 : 20
    ))
    this.spacer(4)

    if (data.contentQuality.humanizationTips.length > 0) {
      this.subTitle('Humanization Tips')
      for (const t of data.contentQuality.humanizationTips) {
        this.bulletItem(t, 12, COLORS.emerald)
      }
    }
    if (data.contentQuality.fillerDetected.length > 0) {
      this.subTitle('Filler Content Detected')
      for (const f of data.contentQuality.fillerDetected) {
        this.bulletItem(f, 12, COLORS.amber)
      }
    }
    if (data.contentQuality.originalityIndicators.length > 0) {
      this.subTitle('Originality Indicators')
      for (const o of data.contentQuality.originalityIndicators) {
        this.bulletItem(o, 12, COLORS.cyan)
      }
    }
    this.spacer(6)
    return this
  }

  // ── Parasite SEO Risk ────────────────────────────────────────

  parasiteRiskSection(data: ReportData): this {
    this.sectionTitle('Parasite SEO Risk', COLORS.red)
    const riskColor = data.parasiteRisk.riskLevel === 'low' ? COLORS.green : data.parasiteRisk.riskLevel === 'medium' ? COLORS.amber : COLORS.red
    this.ensureSpace(30)
    this.doc.fontSize(12).font('Helvetica-Bold').fillColor(riskColor)
      .text(`Risk Level: ${data.parasiteRisk.riskLevel.toUpperCase()}`, LEFT_MARGIN + 8, this.y)
    this.setY(this.y + 20)

    if (data.parasiteRisk.findings.length > 0) {
      this.subTitle('Findings')
      for (const f of data.parasiteRisk.findings) {
        this.bulletItem(f, 12, COLORS.red)
      }
    }
    if (data.parasiteRisk.recommendations.length > 0) {
      this.subTitle('Recommendations')
      for (const r of data.parasiteRisk.recommendations) {
        this.bulletItem(r, 12, COLORS.emerald)
      }
    }
    this.spacer(6)
    return this
  }

  // ── Local SEO ────────────────────────────────────────────────

  localSEOSection(data: ReportData): this {
    if (!data.localSEO.applicable) return this
    this.sectionTitle('Local SEO Signals', COLORS.goldDark)
    this.scoreCard('GBP Signals', data.localSEO.gbpSignals.score, 140)
    this.scoreCard('NAP Consistency', data.localSEO.napConsistency.score, 140)
    this.scoreCard('Review Signals', data.localSEO.reviewSignals.score, 140)
    this.labeledValue('Business Type', data.localSEO.businessType)
    this.spacer(2)

    if (data.localSEO.gbpSignals.findings.length > 0) {
      this.subTitle('GBP Findings')
      for (const f of data.localSEO.gbpSignals.findings) { this.bulletItem(f, 12, COLORS.gold) }
    }
    if (data.localSEO.napConsistency.findings.length > 0) {
      this.subTitle('NAP Findings')
      for (const f of data.localSEO.napConsistency.findings) { this.bulletItem(f, 12, COLORS.gold) }
    }
    if (data.localSEO.reviewSignals.findings.length > 0) {
      this.subTitle('Review Findings')
      for (const f of data.localSEO.reviewSignals.findings) { this.bulletItem(f, 12, COLORS.gold) }
    }
    this.spacer(6)
    return this
  }

  // ── Phase 2: Structure ───────────────────────────────────────

  structurePhase(data: ReportData): this {
    this.sectionTitle('Phase 2: Structure', COLORS.emeraldDark)

    // Topic Clusters
    if (data.structure.topicClusters.length > 0) {
      this.subTitle('Topic Clusters')
      for (const tc of data.structure.topicClusters) {
        this.ensureSpace(60)
        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.emerald).text(tc.cluster, LEFT_MARGIN + 8, this.y)
        this.setY(this.y + 14)
        this.labeledValue('Pillar Keyword', tc.pillarKeyword)
        if (tc.supportingKeywords.length > 0) {
          this.labeledValue('Supporting KWs', tc.supportingKeywords.join(', '))
        }
        this.labeledValue('SEO Opportunity', tc.seoOpportunity)
        this.labeledValue('AEO Opportunity', tc.aeoOpportunity)
        this.labeledValue('GEO Opportunity', tc.geoOpportunity)
        this.spacer(4)
      }
    }

    // Keyword Gaps
    if (data.structure.keywordGaps.length > 0) {
      this.subTitle('Keyword Gaps')
      this.simpleTable(
        [{ label: 'Keyword', width: CONTENT_WIDTH * 0.22 }, { label: 'Volume', width: CONTENT_WIDTH * 0.12 }, { label: 'Difficulty', width: CONTENT_WIDTH * 0.14 }, { label: 'Type', width: CONTENT_WIDTH * 0.1 }, { label: 'Opportunity', width: CONTENT_WIDTH * 0.42 }],
        data.structure.keywordGaps.map(k => [k.keyword, k.volume, k.difficulty, k.type.toUpperCase(), k.opportunity]),
        COLORS.emeraldDark
      )
    }

    // Content Architecture
    if (data.structure.contentArchitecture.recommended.length > 0) {
      this.subTitle('Recommended Content Architecture')
      this.simpleTable(
        [{ label: 'Section', width: CONTENT_WIDTH * 0.25 }, { label: 'Purpose', width: CONTENT_WIDTH * 0.45 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.3 }],
        data.structure.contentArchitecture.recommended.map(r => [r.section, r.purpose, r.pillar.toUpperCase()]),
        COLORS.emeraldDark
      )
    }

    if (data.structure.contentArchitecture.internalLinkMap.length > 0) {
      this.subTitle('Internal Link Map')
      this.simpleTable(
        [{ label: 'From', width: CONTENT_WIDTH * 0.25 }, { label: 'To', width: CONTENT_WIDTH * 0.25 }, { label: 'Anchor', width: CONTENT_WIDTH * 0.5 }],
        data.structure.contentArchitecture.internalLinkMap.map(l => [l.from, l.to, l.anchor]),
        COLORS.emeraldDark
      )
    }

    // Schema Recommendations
    if (data.structure.schemaRecommendations.length > 0) {
      this.subTitle('Schema Recommendations')
      this.simpleTable(
        [{ label: 'Schema Type', width: CONTENT_WIDTH * 0.2 }, { label: 'Purpose', width: CONTENT_WIDTH * 0.25 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.1 }, { label: 'Implementation', width: CONTENT_WIDTH * 0.3 }, { label: 'Status', width: CONTENT_WIDTH * 0.15 }],
        data.structure.schemaRecommendations.map(s => [s.schemaType, s.purpose, s.pillar.toUpperCase(), s.implementation, s.status]),
        COLORS.emeraldDark
      )
    }
    this.spacer(6)
    return this
  }

  // ── Phase 3: Creative ────────────────────────────────────────

  creativePhase(data: ReportData): this {
    this.sectionTitle('Phase 3: Creative', COLORS.goldDark)

    // Content Briefs
    if (data.creative.contentBriefs.length > 0) {
      this.subTitle('Content Briefs')
      for (const cb of data.creative.contentBriefs) {
        this.ensureSpace(80)
        const pColor = this.pillarColor(cb.pillar)
        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(pColor).text(cb.title, LEFT_MARGIN + 8, this.y)
        this.setY(this.y + 14)
        this.labeledValue('Type', cb.type.toUpperCase() + ' | Pillar: ' + cb.pillar.toUpperCase())
        this.labeledValue('Target Keyword', cb.targetKeyword)
        this.labeledValue('Brief', cb.brief)
        this.labeledValue('Estimated Impact', cb.estimatedImpact)
        this.labeledValue('Word Count', cb.wordCount)
        if (cb.structure.length > 0) {
          this.labeledValue('Structure', cb.structure.join(' → '))
        }
        this.spacer(6)
      }
    }

    // On-Page Optimizations
    if (data.creative.onPageOptimizations.length > 0) {
      this.subTitle('On-Page Optimizations')
      for (const op of data.creative.onPageOptimizations) {
        this.ensureSpace(60)
        this.doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.gold).text(`Page: ${op.page}`, LEFT_MARGIN + 8, this.y)
        this.setY(this.y + 14)
        this.labeledValue('Current Title', op.currentTitle)
        this.labeledValue('Suggested Title', op.suggestedTitle, COLORS.medium, COLORS.emerald)
        this.labeledValue('Description', op.suggestedDescription)
        if (op.aeoTweaks.length > 0) {
          this.subTitle('AEO Tweaks', COLORS.goldDark)
          for (const t of op.aeoTweaks) { this.bulletItem(t, 16, COLORS.gold) }
        }
        if (op.geoTweaks.length > 0) {
          this.subTitle('GEO Tweaks', COLORS.cyanDark)
          for (const t of op.geoTweaks) { this.bulletItem(t, 16, COLORS.cyan) }
        }
        this.spacer(4)
      }
    }

    // Answer Blocks
    if (data.creative.answerBlocks.length > 0) {
      this.subTitle('Answer Blocks')
      this.simpleTable(
        [{ label: 'Question', width: CONTENT_WIDTH * 0.28 }, { label: 'Answer', width: CONTENT_WIDTH * 0.37 }, { label: 'Format', width: CONTENT_WIDTH * 0.18 }, { label: 'Engine', width: CONTENT_WIDTH * 0.17 }],
        data.creative.answerBlocks.map(a => [a.question, a.suggestedAnswer.slice(0, 60), a.format, a.targetEngine]),
        COLORS.goldDark
      )
    }
    this.spacer(6)
    return this
  }

  // ── Phase 4: Measure ─────────────────────────────────────────

  measurePhase(data: ReportData): this {
    this.sectionTitle('Phase 4: Measure', COLORS.cyanDark)

    // KPIs
    this.subTitle('KPI Tracking')

    const kpiSections: { label: string; items: { metric: string; current: string; target: string; timeline: string }[]; color: string }[] = [
      { label: 'SEO KPIs', items: data.measure.kpiTracking.seo, color: COLORS.emeraldDark },
      { label: 'AEO KPIs', items: data.measure.kpiTracking.aeo, color: COLORS.goldDark },
      { label: 'GEO KPIs', items: data.measure.kpiTracking.geo, color: COLORS.cyanDark },
    ]

    for (const ks of kpiSections) {
      if (ks.items.length > 0) {
        this.ensureSpace(30)
        this.doc.fontSize(9).font('Helvetica-Bold').fillColor(ks.color).text(ks.label, LEFT_MARGIN + 8, this.y)
        this.setY(this.y + 14)
        this.simpleTable(
          [{ label: 'Metric', width: CONTENT_WIDTH * 0.28 }, { label: 'Current', width: CONTENT_WIDTH * 0.2 }, { label: 'Target', width: CONTENT_WIDTH * 0.22 }, { label: 'Timeline', width: CONTENT_WIDTH * 0.3 }],
          ks.items.map(k => [k.metric, k.current, k.target, k.timeline]),
          ks.color
        )
      }
    }

    // Competitor Benchmarks
    if (data.measure.competitorBenchmarks.length > 0) {
      this.subTitle('Competitor Benchmarks')
      this.simpleTable(
        [{ label: 'Competitor', width: CONTENT_WIDTH * 0.22 }, { label: 'SEO', width: CONTENT_WIDTH * 0.1 }, { label: 'AEO', width: CONTENT_WIDTH * 0.1 }, { label: 'GEO', width: CONTENT_WIDTH * 0.1 }, { label: 'Cited By', width: CONTENT_WIDTH * 0.48 }],
        data.measure.competitorBenchmarks.map(c => [c.competitor, String(c.seoScore), String(c.aeoScore), String(c.geoScore), c.citedBy.join(', ')]),
        COLORS.cyanDark
      )
    }

    // Weekly Actions
    if (data.measure.weeklyActions.length > 0) {
      this.subTitle('Weekly Action Plan')
      for (const wa of data.measure.weeklyActions) {
        this.ensureSpace(30)
        this.doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.cyanDark).text(wa.week, LEFT_MARGIN + 8, this.y)
        this.setY(this.y + 14)
        if (wa.tasks.length > 0) {
          this.simpleTable(
            [{ label: 'Task', width: CONTENT_WIDTH * 0.55 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.15 }, { label: 'Priority', width: CONTENT_WIDTH * 0.3 }],
            wa.tasks.map(t => [t.task, t.pillar.toUpperCase(), t.priority.toUpperCase()]),
            COLORS.cyanDark
          )
        }
      }
    }
    this.spacer(6)
    return this
  }

  // ── 12-Month Roadmap ─────────────────────────────────────────

  roadmap(data: ReportData): this {
    this.sectionTitle('12-Month Roadmap', COLORS.emeraldDark)

    // Generate quarterly milestones from weekly actions
    const weeks = data.measure.weeklyActions
    const allTasks: { task: string; pillar: string; priority: string }[] = []
    for (const w of weeks) {
      allTasks.push(...w.tasks)
    }

    const seoTasks = allTasks.filter(t => t.pillar === 'seo' || t.pillar === 'all')
    const aeoTasks = allTasks.filter(t => t.pillar === 'aeo' || t.pillar === 'all')
    const geoTasks = allTasks.filter(t => t.pillar === 'geo' || t.pillar === 'all')

    const quarters = [
      {
        label: 'Q1: Foundation (Months 1-3)',
        color: COLORS.emeraldDark,
        seo: seoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Fix critical SEO issues; Optimize meta tags and headings',
        aeo: aeoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Add FAQ schema; Implement structured data',
        geo: geoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Create cite-worthy content; Add llms.txt',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 15)} | AEO: ${Math.min(100, data.overallScores.aeo + 12)} | GEO: ${Math.min(100, data.overallScores.geo + 10)}`,
      },
      {
        label: 'Q2: Growth (Months 4-6)',
        color: COLORS.goldDark,
        seo: 'Build authoritative backlinks; Expand topic clusters',
        aeo: 'Optimize answer blocks; Target featured snippets',
        geo: 'Increase AI citation presence; Strengthen entity signals',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 25)} | AEO: ${Math.min(100, data.overallScores.aeo + 22)} | GEO: ${Math.min(100, data.overallScores.geo + 20)}`,
      },
      {
        label: 'Q3: Authority (Months 7-9)',
        color: COLORS.cyanDark,
        seo: 'Dominate niche keywords; Content refresh program',
        aeo: 'Voice search optimization; People Also Ask targeting',
        geo: 'Multi-platform AI visibility; Knowledge graph expansion',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 35)} | AEO: ${Math.min(100, data.overallScores.aeo + 32)} | GEO: ${Math.min(100, data.overallScores.geo + 30)}`,
      },
      {
        label: 'Q4: Scale (Months 10-12)',
        color: COLORS.dark,
        seo: 'Scale content production; Advanced technical SEO',
        aeo: 'Automated answer optimization; Cross-platform AEO',
        geo: 'AI-first content strategy; Brand authority stronghold',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 45)} | AEO: ${Math.min(100, data.overallScores.aeo + 40)} | GEO: ${Math.min(100, data.overallScores.geo + 38)}`,
      },
    ]

    for (const q of quarters) {
      this.ensureSpace(100)
      // Quarter header bar
      this.drawFilledRect(LEFT_MARGIN, this.y, CONTENT_WIDTH, 20, q.color)
      this.doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.white).text(q.label, LEFT_MARGIN + 8, this.y + 4)
      this.setY(this.y + 24)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.emerald).text('SEO:', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(' ' + q.seo, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.gold).text('AEO:', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(' ' + q.aeo, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.cyan).text('GEO:', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(' ' + q.geo, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.medium).text('Target Scores: ' + q.target, LEFT_MARGIN + 8, this.y)
      this.setY(this.y + 12)
    }
    this.spacer(6)
    return this
  }

  // ── SXO Section ──────────────────────────────────────────────

  sxoSection(data: ReportData): this {
    this.sectionTitle('SXO — Search Experience Optimization', COLORS.cyanDark)
    this.labeledValue('Page Type Match', data.sxo.pageTypeMatch)
    this.labeledValue('SERP Intent Match', data.sxo.serpIntentMatch.toUpperCase())
    this.spacer(2)

    if (data.sxo.userPersonaScores.length > 0) {
      this.subTitle('User Persona Scores')
      this.simpleTable(
        [{ label: 'Persona', width: CONTENT_WIDTH * 0.5 }, { label: 'Score', width: CONTENT_WIDTH * 0.5 }],
        data.sxo.userPersonaScores.map(p => [p.persona, String(p.score) + '/100']),
        COLORS.cyanDark
      )
    }

    if (data.sxo.recommendations.length > 0) {
      this.subTitle('SXO Recommendations')
      for (const r of data.sxo.recommendations) {
        this.bulletItem(r, 12, COLORS.cyan)
      }
    }
    this.spacer(6)
    return this
  }

  // ── Algorithm Updates Tracker ────────────────────────────────

  algorithmUpdatesSection(data: ReportData): this {
    if (!data.algorithmUpdates?.recentUpdates?.length) return this
    this.sectionTitle('Algorithm Updates Tracker', COLORS.red)

    this.simpleTable(
      [{ label: 'Update', width: CONTENT_WIDTH * 0.25 }, { label: 'Date', width: CONTENT_WIDTH * 0.12 }, { label: 'Impact', width: CONTENT_WIDTH * 0.12 }, { label: 'Description', width: CONTENT_WIDTH * 0.35 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.16 }],
      data.algorithmUpdates.recentUpdates.map(u => [u.name, u.date, u.impact.toUpperCase(), u.description, u.affectedPillar.toUpperCase()]),
      COLORS.red
    )
    this.spacer(6)
    return this
  }

  // ── 12-Month Roadmap (from LLM data) ────────────────────────

  roadmapSection(data: ReportData): this {
    if (!data.roadmap?.quarters?.length) return this
    this.sectionTitle('12-Month Roadmap', COLORS.emeraldDark)

    const qColors = [COLORS.emeraldDark, COLORS.goldDark, COLORS.cyanDark, COLORS.dark]
    for (let i = 0; i < data.roadmap.quarters.length; i++) {
      const q = data.roadmap.quarters[i]
      this.ensureSpace(80)
      const qColor = qColors[i % qColors.length]
      this.drawFilledRect(LEFT_MARGIN, this.y, CONTENT_WIDTH, 18, qColor)
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text(q.label, LEFT_MARGIN + 8, this.y + 3)
      this.setY(this.y + 22)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.emerald).text('SEO: ', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(q.seoGoal, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.gold).text('AEO: ', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(q.aeoGoal, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.cyan).text('GEO: ', LEFT_MARGIN + 8, this.y, { continued: true })
      this.doc.font('Helvetica').fillColor(COLORS.dark).text(q.geoGoal, { width: CONTENT_WIDTH - 20 })
      this.setY(this.doc.y + 2)

      this.doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.medium)
        .text(`Target Scores — SEO: ${q.targetScores.seo} | AEO: ${q.targetScores.aeo} | GEO: ${q.targetScores.geo}`, LEFT_MARGIN + 8, this.y)
      this.setY(this.doc.y + 8)
    }
    this.spacer(6)
    return this
  }

  // ── Traffic Insights ─────────────────────────────────────────

  trafficInsightsSection(data: ReportData): this {
    if (!data.trafficInsights) return this
    if (!data.trafficInsights.winners?.length && !data.trafficInsights.losers?.length) return this
    this.sectionTitle('Traffic Insights — Winners & Losers', COLORS.emeraldDark)

    if (data.trafficInsights.winners?.length) {
      this.subTitle('Winners', COLORS.green)
      this.simpleTable(
        [{ label: 'Page', width: CONTENT_WIDTH * 0.45 }, { label: 'Change', width: CONTENT_WIDTH * 0.25 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.3 }],
        data.trafficInsights.winners.map(w => [w.page, w.change, w.pillar.toUpperCase()]),
        COLORS.emeraldDark
      )
    }

    if (data.trafficInsights.losers?.length) {
      this.subTitle('Losers', COLORS.red)
      this.simpleTable(
        [{ label: 'Page', width: CONTENT_WIDTH * 0.45 }, { label: 'Change', width: CONTENT_WIDTH * 0.25 }, { label: 'Pillar', width: CONTENT_WIDTH * 0.3 }],
        data.trafficInsights.losers.map(l => [l.page, l.change, l.pillar.toUpperCase()]),
        COLORS.red
      )
    }
    this.spacer(6)
    return this
  }

  // ── Page Numbers ─────────────────────────────────────────────

  addPageNumbers(): this {
    const pages = this.doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      this.doc.switchToPage(i)
      if (i === 0) continue // Skip cover page
      this.doc.save()
      this.doc.fontSize(7).font('Helvetica').fillColor(COLORS.medium)
        .text(
          `Agent OS — SEO/AEO/GEO Report  |  Page ${i + 1}`,
          LEFT_MARGIN,
          this.doc.page.height - 45,
          { width: CONTENT_WIDTH, align: 'center' }
        )
      this.doc.restore()
    }
    return this
  }

  // ── Build Final PDF ──────────────────────────────────────────

  build(data: ReportData): InstanceType<typeof PDFDocument> {
    this.coverPage(data)
    this.executiveSummary(data)
    this.auditPhase(data)
    this.eeatSection(data)
    this.geoCitabilitySection(data)
    this.aiCrawlerSection(data)
    this.brandMentionsSection(data)
    this.contentQualitySection(data)
    this.parasiteRiskSection(data)
    this.localSEOSection(data)
    this.algorithmUpdatesSection(data)
    this.roadmapSection(data)
    this.trafficInsightsSection(data)
    this.sxoSection(data)
    this.structurePhase(data)
    this.creativePhase(data)
    this.measurePhase(data)
    this.roadmap(data)
    this.addPageNumbers()
    this.doc.end()
    return this.doc
  }

  getDocument(): InstanceType<typeof PDFDocument> {
    return this.doc
  }
}

// ── API Route Handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 })
    }

    const data = body as ReportData

    if (!data.url || !data.overallScores) {
      return NextResponse.json({ error: 'Missing required fields: url, overallScores' }, { status: 400 })
    }

    // Generate PDF
    const builder = new PDFBuilder()
    builder.build(data)
    const doc = builder.getDocument()

    // Collect PDF chunks
    const chunks: Buffer[] = []
    const stream = doc as unknown as NodeJS.ReadableStream

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', resolve)
      stream.on('error', reject)
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Sanitize filename
    const safeName = (data.siteName || 'report')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)
    const filename = `AgentOS-${safeName}-Report.pdf`

    // Return PDF response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[report] PDF generation error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to generate PDF report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
