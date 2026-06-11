import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

// ── Color Palette (Emerald / Amber / Cyan) ─────────────────────────
const C = {
  emerald: [16, 185, 129] as const,
  emeraldDark: [5, 150, 105] as const,
  amber: [245, 158, 11] as const,
  amberDark: [217, 119, 6] as const,
  cyan: [6, 182, 212] as const,
  cyanDark: [8, 145, 178] as const,
  dark: [31, 41, 55] as const,
  medium: [75, 85, 99] as const,
  light: [249, 250, 251] as const,
  white: [255, 255, 255] as const,
  border: [229, 231, 235] as const,
  red: [239, 68, 68] as const,
  bgGreen: [240, 253, 244] as const,
  bgAmber: [255, 251, 235] as const,
  bgRed: [254, 242, 242] as const,
}

// ── Score Helpers ───────────────────────────────────────────────────
function scoreRGB(score: number): [number, number, number] {
  if (score >= 70) return C.emerald
  if (score >= 40) return C.amber
  return C.red
}
function scoreBgRGB(score: number): [number, number, number] {
  if (score >= 70) return C.bgGreen
  if (score >= 40) return C.bgAmber
  return C.bgRed
}
function scoreLabel(score: number): string {
  if (score >= 70) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Critical'
}

// ── ReportData Interface (inline to avoid client imports) ──────────
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

// ── PDF Builder (jspdf) ────────────────────────────────────────────

const PW = 210  // A4 width in mm
const PH = 297  // A4 height in mm
const ML = 20   // left margin mm
const MR = 20   // right margin mm
const MT = 20   // top margin mm
const MB = 25   // bottom margin mm
const CW = PW - ML - MR  // content width

class PDFBuilder {
  private doc: jsPDF
  private y = 0
  private pageNum = 0  // tracks content pages (not cover)

  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    this.doc.setProperties({
      title: 'seosights — SEO/AEO/GEO Analysis Report',
      author: 'seosights',
      subject: 'Comprehensive Search Intelligence Report',
    })
  }

  // ── Helpers ───────────────────────────────────────────────────

  private maxY(): number { return PH - MB }

  private ensureSpace(needed: number): void {
    if (this.y + needed > this.maxY()) {
      this.newPage()
    }
  }

  private newPage(): void {
    this.doc.addPage()
    this.pageNum++
    this.y = MT
  }

  private setColor(c: readonly [number, number, number]): void {
    this.doc.setTextColor(c[0], c[1], c[2])
  }

  private setDrawColor(c: readonly [number, number, number]): void {
    this.doc.setDrawColor(c[0], c[1], c[2])
  }

  private setFillColor(c: readonly [number, number, number]): void {
    this.doc.setFillColor(c[0], c[1], c[2])
  }

  private text(text: string, x: number, opts?: { maxWidth?: number; align?: 'left' | 'center' | 'right'; size?: number; color?: readonly [number, number, number]; bold?: boolean }): void {
    const size = opts?.size ?? 9
    const bold = opts?.bold ?? false
    this.doc.setFontSize(size)
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    if (opts?.color) this.setColor(opts.color)
    const align = opts?.align ?? 'left'
    if (opts?.maxWidth) {
      this.doc.text(text, x, this.y, { maxWidth: opts.maxWidth, align })
    } else {
      this.doc.text(text, x, this.y, { align })
    }
  }

  // ── Section Headers ──────────────────────────────────────────

  sectionTitle(text: string, color: readonly [number, number, number] = C.emeraldDark): this {
    this.ensureSpace(18)
    // accent bar
    this.setFillColor(color)
    this.doc.rect(ML, this.y, 2, 9, 'F')
    // title text
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(color)
    this.doc.text(text, ML + 6, this.y + 7)
    this.y += 12
    // divider line
    this.setDrawColor(C.border)
    this.doc.setLineWidth(0.3)
    this.doc.line(ML, this.y, PW - MR, this.y)
    this.y += 5
    return this
  }

  subTitle(text: string, color: readonly [number, number, number] = C.dark): this {
    this.ensureSpace(12)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(color)
    this.doc.text(text, ML, this.y + 3)
    this.y += 8
    return this
  }

  bodyText(text: string): this {
    this.ensureSpace(10)
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    this.setColor(C.medium)
    const lines = this.doc.splitTextToSize(text, CW)
    const h = lines.length * 4.5
    this.ensureSpace(h)
    this.doc.text(lines, ML, this.y)
    this.y += h + 2
    return this
  }

  bulletItem(text: string, indent = 6, bulletColor: readonly [number, number, number] = C.emerald): this {
    this.ensureSpace(8)
    const bx = ML + indent
    // bullet
    this.doc.setFontSize(7)
    this.doc.setFont('helvetica', 'normal')
    this.setColor(bulletColor)
    this.doc.text('\u2022', bx, this.y + 1)
    // text
    this.doc.setFontSize(8.5)
    this.setColor(C.medium)
    const lines = this.doc.splitTextToSize(text, CW - indent - 4)
    this.doc.text(lines, bx + 4, this.y + 1)
    this.y += Math.max(lines.length * 4, 5) + 1
    return this
  }

  // ── Score Card ───────────────────────────────────────────────

  scoreCard(label: string, score: number, width = 60): this {
    this.ensureSpace(25)
    const cx = ML
    const cardH = 22
    const sc = scoreRGB(score)
    const bg = scoreBgRGB(score)
    // background
    this.setFillColor(bg)
    this.doc.rect(cx, this.y, width, cardH, 'F')
    // border
    this.setDrawColor(sc)
    this.doc.setLineWidth(0.6)
    this.doc.rect(cx, this.y, width, cardH, 'S')
    // score
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(sc)
    this.doc.text(String(score), cx + width / 2, this.y + 8, { align: 'center' })
    // label
    this.doc.setFontSize(6.5)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(C.dark)
    this.doc.text(label.toUpperCase(), cx + width / 2, this.y + 14, { align: 'center' })
    // status
    this.doc.setFontSize(5.5)
    this.doc.setFont('helvetica', 'normal')
    this.setColor(sc)
    this.doc.text(scoreLabel(score), cx + width / 2, this.y + 19, { align: 'center' })
    this.y += cardH + 4
    return this
  }

  // ── Labeled Value ────────────────────────────────────────────

  labeledValue(label: string, value: string, labelColor: readonly [number, number, number] = C.medium, valueColor: readonly [number, number, number] = C.dark): this {
    this.ensureSpace(7)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.setColor(labelColor)
    const labelW = this.doc.getTextWidth(label + ': ')
    this.doc.text(label + ': ', ML + 5, this.y + 1)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(valueColor)
    // Truncate value if needed
    const maxValW = CW - 5 - labelW
    let val = value
    if (this.doc.getTextWidth(val) > maxValW) {
      while (this.doc.getTextWidth(val + '...') > maxValW && val.length > 0) {
        val = val.slice(0, -1)
      }
      val += '...'
    }
    this.doc.text(val, ML + 5 + labelW, this.y + 1)
    this.y += 6
    return this
  }

  // ── AutoTable Helper ─────────────────────────────────────────

  makeTable(headers: string[], rows: string[][], headerColor: readonly [number, number, number] = C.emeraldDark): this {
    const startY = this.y + 1
    autoTable(this.doc, {
      startY,
      margin: { left: ML, right: MR, top: 0, bottom: MB },
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: C.dark as [number, number, number],
        lineColor: C.border as [number, number, number],
        lineWidth: 0.15,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: headerColor as [number, number, number],
        textColor: C.white as [number, number, number],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: C.light as [number, number, number],
      },
      columnStyles: {},
      didDrawPage: () => {
        // Track the y position after the table
      },
    })
    // Get the final Y position after the table
    const finalY = (this.doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? startY + 10
    this.y = finalY + 4
    // If we went past the page, we're on a new page
    if (this.y > PH - MB) {
      this.newPage()
    }
    return this
  }

  // ── Spacer ───────────────────────────────────────────────────

  spacer(h = 4): this {
    this.y += h
    return this
  }

  // ── Pillar Color ─────────────────────────────────────────────

  pillarColor(pillar: string): readonly [number, number, number] {
    switch (pillar) {
      case 'seo': return C.emerald
      case 'aeo': return C.amber
      case 'geo': return C.cyan
      default: return C.medium
    }
  }

  // ── Cover Page ───────────────────────────────────────────────

  coverPage(data: ReportData): this {
    // Emerald header band
    this.setFillColor(C.emeraldDark)
    this.doc.rect(0, 0, PW, 100, 'F')

    // Brand name
    this.doc.setFontSize(32)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(C.white)
    this.doc.text('seosights', PW / 2, 38, { align: 'center' })

    // Tagline
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(255, 255, 255)
    this.doc.text('Vision. Analytics. Rank.', PW / 2, 48, { align: 'center' })

    // Gold divider line
    this.setDrawColor(C.amber)
    this.doc.setLineWidth(0.8)
    this.doc.line(PW / 2 - 25, 55, PW / 2 + 25, 55)

    // Report title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(C.white)
    this.doc.text('SEO / AEO / GEO Analysis Report', PW / 2, 66, { align: 'center' })

    // Site info
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(230, 230, 230)
    this.doc.text(data.siteName || '', PW / 2, 78, { align: 'center' })
    this.doc.setFontSize(8)
    this.doc.setTextColor(200, 200, 200)
    this.doc.text(data.url || '', PW / 2, 84, { align: 'center' })

    // Market & date
    this.doc.setFontSize(8)
    this.doc.setTextColor(200, 200, 200)
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    this.doc.text(`Market: ${data.market}  |  ${dateStr}`, PW / 2, 92, { align: 'center' })

    // ── Score Cards ──────────────────────────────────────────
    const cardW = (CW - 12) / 4
    const cardStartY = 115
    const scores = [
      { label: 'SEO Score', value: data.overallScores.seo },
      { label: 'AEO Score', value: data.overallScores.aeo },
      { label: 'GEO Score', value: data.overallScores.geo },
      { label: 'Combined', value: data.overallScores.combined },
    ]

    for (let i = 0; i < scores.length; i++) {
      const cx = ML + i * (cardW + 4)
      const s = scores[i]
      const sc = scoreRGB(s.value)
      const bg = scoreBgRGB(s.value)
      // card bg
      this.setFillColor(bg)
      this.doc.rect(cx, cardStartY, cardW, 28, 'F')
      // card border
      this.setDrawColor(sc)
      this.doc.setLineWidth(0.8)
      this.doc.rect(cx, cardStartY, cardW, 28, 'S')
      // score number
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(sc)
      this.doc.text(String(s.value), cx + cardW / 2, cardStartY + 10, { align: 'center' })
      // label
      this.doc.setFontSize(6)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.dark)
      this.doc.text(s.label.toUpperCase(), cx + cardW / 2, cardStartY + 17, { align: 'center' })
      // status
      this.doc.setFontSize(5)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(sc)
      this.doc.text(scoreLabel(s.value), cx + cardW / 2, cardStartY + 23, { align: 'center' })
    }

    // Footer on cover
    this.doc.setFontSize(7)
    this.doc.setFont('helvetica', 'normal')
    this.setColor(C.medium)
    this.doc.text('This report provides a comprehensive three-pillar analysis of your web presence.', PW / 2, PH - 45, { align: 'center', maxWidth: CW })
    this.doc.text('SEO (Search Engine Optimization)  \u00B7  AEO (Answer Engine Optimization)  \u00B7  GEO (Generative Engine Optimization)', PW / 2, PH - 40, { align: 'center', maxWidth: CW })
    this.doc.setFontSize(6)
    this.setColor(C.border)
    this.doc.text(`\u00A9 ${new Date().getFullYear()} seosights \u2014 Confidential`, PW / 2, PH - 30, { align: 'center' })

    // Start content on new page
    this.doc.addPage()
    this.pageNum++
    this.y = MT
    return this
  }

  // ── Executive Summary ────────────────────────────────────────

  executiveSummary(data: ReportData): this {
    this.sectionTitle('Executive Summary', C.emeraldDark)
    this.bodyText(data.summary || 'No summary available.')
    this.spacer(3)

    this.subTitle('Top 5 Priority Actions')
    for (let i = 0; i < (data.executiveActions?.length ?? 0); i++) {
      this.ensureSpace(8)
      this.doc.setFontSize(8.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.emerald)
      this.doc.text(`${i + 1}.`, ML + 4, this.y + 1)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const lines = this.doc.splitTextToSize(data.executiveActions[i], CW - 12)
      this.doc.text(lines, ML + 10, this.y + 1)
      this.y += Math.max(lines.length * 4, 4) + 2
    }
    this.spacer(4)
    return this
  }

  // ── Phase 1: Audit ───────────────────────────────────────────

  auditPhase(data: ReportData): this {
    this.sectionTitle('Phase 1: Audit', C.emeraldDark)

    // Technical SEO
    this.subTitle('Technical SEO')
    this.scoreCard('Technical SEO Score', data.audit.technicalSEO.score)
    if (data.audit.technicalSEO.issues?.length > 0) {
      this.makeTable(
        ['Issue', 'Severity', 'Fix'],
        data.audit.technicalSEO.issues.map(i => [i.issue, i.severity, i.fix])
      )
    }

    // Crawlability
    this.subTitle('Crawlability')
    this.scoreCard('Crawlability Score', data.audit.crawlability.score)
    if (data.audit.crawlability.issues?.length > 0) {
      this.makeTable(
        ['Issue', 'Impact'],
        data.audit.crawlability.issues.map(i => [i.issue, i.impact]),
        C.emeraldDark
      )
    }

    // Core Web Vitals
    this.subTitle('Core Web Vitals')
    this.scoreCard('Page Speed Score', data.audit.pageSpeed.score)
    if (data.audit.pageSpeed.coreVitals?.length > 0) {
      this.makeTable(
        ['Metric', 'Value', 'Status'],
        data.audit.pageSpeed.coreVitals.map(v => [v.metric, v.value, v.status])
      )
    }

    // Indexation
    this.subTitle('Indexation')
    this.labeledValue('Score', String(data.audit.indexation.score))
    this.labeledValue('Indexed Pages', String(data.audit.indexation.indexedPages))
    this.labeledValue('Orphan Pages', String(data.audit.indexation.orphanPages))
    if (data.audit.indexation.issues?.length > 0) {
      for (const iss of data.audit.indexation.issues) {
        this.bulletItem(iss, 6, C.amber)
      }
    }
    this.spacer(3)

    // AEO Readiness
    this.subTitle('AEO Readiness')
    this.scoreCard('AEO Readiness Score', data.audit.aeoReadiness.score)
    this.labeledValue('Has FAQ', data.audit.aeoReadiness.hasFAQ ? 'Yes' : 'No')
    this.labeledValue('Has Schema', data.audit.aeoReadiness.hasSchema ? 'Yes' : 'No')
    this.labeledValue('Has Structured Data', data.audit.aeoReadiness.hasStructuredData ? 'Yes' : 'No')
    this.labeledValue('Answer Format Score', String(data.audit.aeoReadiness.answerFormatScore))
    if (data.audit.aeoReadiness.issues?.length > 0) {
      for (const iss of data.audit.aeoReadiness.issues) {
        this.bulletItem(iss, 6, C.amberDark)
      }
    }
    this.spacer(3)

    // GEO Visibility
    this.subTitle('GEO Visibility')
    this.scoreCard('GEO Visibility Score', data.audit.geoVisibility.score)
    this.labeledValue('Entity Recognition', String(data.audit.geoVisibility.entityRecognition))
    this.labeledValue('Knowledge Graph', data.audit.geoVisibility.knowledgeGraphPresence ? 'Present' : 'Absent')
    if (data.audit.geoVisibility.citedByAI?.length > 0) {
      this.labeledValue('Cited By AI', data.audit.geoVisibility.citedByAI.join(', '))
    }
    if (data.audit.geoVisibility.issues?.length > 0) {
      for (const iss of data.audit.geoVisibility.issues) {
        this.bulletItem(iss, 6, C.cyanDark)
      }
    }
    this.spacer(3)
    return this
  }

  // ── E-E-A-T Analysis ─────────────────────────────────────────

  eeatSection(data: ReportData): this {
    this.sectionTitle('E-E-A-T Analysis', C.amberDark)
    this.scoreCard('E-E-A-T Overall', data.eeat.overallScore)
    this.spacer(1)

    const dims = [
      { label: 'Experience', d: data.eeat.experience },
      { label: 'Expertise', d: data.eeat.expertise },
      { label: 'Authoritativeness', d: data.eeat.authoritativeness },
      { label: 'Trustworthiness', d: data.eeat.trustworthiness },
    ]

    for (const dim of dims) {
      this.ensureSpace(12)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(scoreRGB(dim.d.score))
      this.doc.text(`${dim.label}: ${dim.d.score}/100`, ML + 4, this.y + 1)
      this.y += 6
      for (const f of (dim.d.findings ?? [])) {
        this.bulletItem(f, 10, C.amber)
      }
    }

    this.spacer(2)
    this.subTitle('Who / How / Why Test')
    this.labeledValue('WHO', data.eeat.whoHowWhyTest.who, C.amber, C.dark)
    this.labeledValue('HOW', data.eeat.whoHowWhyTest.how, C.amber, C.dark)
    this.labeledValue('WHY', data.eeat.whoHowWhyTest.why, C.amber, C.dark)
    this.spacer(3)
    return this
  }

  // ── GEO Citability ───────────────────────────────────────────

  geoCitabilitySection(data: ReportData): this {
    this.sectionTitle('GEO Citability', C.cyanDark)
    this.scoreCard('GEO Citability Score', data.geoCitability.overallScore)
    this.spacer(1)

    const dims = [
      { label: 'Citability Score', d: data.geoCitability.citabilityScore },
      { label: 'Structural Readability', d: data.geoCitability.structuralReadability },
      { label: 'Multi-Modal Content', d: data.geoCitability.multiModalContent },
      { label: 'Authority & Brand Signals', d: data.geoCitability.authorityBrandSignals },
      { label: 'Technical Accessibility', d: data.geoCitability.technicalAccessibility },
    ]

    this.makeTable(
      ['Dimension', 'Score', 'Weight', 'Findings'],
      dims.map(d => [d.label, String(d.d.score), d.d.weight + '%', (d.d.findings?.[0] ?? '-')]),
      C.cyanDark
    )
    this.spacer(3)
    return this
  }

  // ── AI Crawler Analysis ──────────────────────────────────────

  aiCrawlerSection(data: ReportData): this {
    this.sectionTitle('AI Crawler & Bot Analysis', C.cyanDark)

    if (data.aiCrawler.aiCrawlerAccess?.length > 0) {
      this.makeTable(
        ['Bot', 'Allowed', 'Recommendation'],
        data.aiCrawler.aiCrawlerAccess.map(b => [b.bot, b.allowed ? 'Yes' : 'No', b.recommendation]),
        C.cyanDark
      )
    }

    this.labeledValue('llms.txt Present', data.aiCrawler.llmsTxtPresence ? 'Yes' : 'No')
    this.labeledValue('JS Rendering Dependency', (data.aiCrawler.jsRenderingDependency || '').toUpperCase())
    this.labeledValue('SSR vs CSR', data.aiCrawler.ssrVsCsr || 'N/A')

    if (data.aiCrawler.robotsTxtAnalysis?.length > 0) {
      this.subTitle('robots.txt Analysis')
      for (const r of data.aiCrawler.robotsTxtAnalysis) {
        this.bulletItem(r, 6, C.cyan)
      }
    }
    this.spacer(3)
    return this
  }

  // ── Brand Mentions ───────────────────────────────────────────

  brandMentionsSection(data: ReportData): this {
    this.sectionTitle('Brand Mentions & AI Citation Signals', C.amberDark)
    this.scoreCard('Brand Mention Score', data.brandMentions.brandMentionScore)
    this.labeledValue('Backlink Correlation', data.brandMentions.backlinkCorrelation || 'N/A')
    this.spacer(2)

    if (data.brandMentions.platformPresence?.length > 0) {
      this.subTitle('Platform Presence')
      this.makeTable(
        ['Platform', 'Detected', 'Strength'],
        data.brandMentions.platformPresence.map(p => [p.platform, p.detected ? 'Yes' : 'No', p.strength]),
        C.amberDark
      )
    }

    if (data.brandMentions.citationSources?.length > 0) {
      this.subTitle('Citation Sources')
      this.makeTable(
        ['Engine', 'Top Source', '%'],
        data.brandMentions.citationSources.map(c => [c.engine, c.topSource, String(c.percentage + '%')]),
        C.amberDark
      )
    }
    this.spacer(3)
    return this
  }

  // ── Content Quality ──────────────────────────────────────────

  contentQualitySection(data: ReportData): this {
    this.sectionTitle('Content Quality & Humanization', C.emeraldDark)
    this.scoreCard('Content Quality Score', data.contentQuality.overallScore)
    this.labeledValue('Content Depth', String(data.contentQuality.contentDepth) + '/100')
    const riskScore = data.contentQuality.aiPatternRisk === 'low' ? 80 : data.contentQuality.aiPatternRisk === 'medium' ? 50 : 20
    this.labeledValue('AI Pattern Risk', (data.contentQuality.aiPatternRisk || 'unknown').toUpperCase(), C.medium, scoreRGB(riskScore))
    this.spacer(2)

    if (data.contentQuality.humanizationTips?.length > 0) {
      this.subTitle('Humanization Tips')
      for (const t of data.contentQuality.humanizationTips) {
        this.bulletItem(t, 6, C.emerald)
      }
    }
    if (data.contentQuality.fillerDetected?.length > 0) {
      this.subTitle('Filler Content Detected')
      for (const f of data.contentQuality.fillerDetected) {
        this.bulletItem(f, 6, C.amber)
      }
    }
    if (data.contentQuality.originalityIndicators?.length > 0) {
      this.subTitle('Originality Indicators')
      for (const o of data.contentQuality.originalityIndicators) {
        this.bulletItem(o, 6, C.cyan)
      }
    }
    this.spacer(3)
    return this
  }

  // ── Parasite SEO Risk ────────────────────────────────────────

  parasiteRiskSection(data: ReportData): this {
    this.sectionTitle('Parasite SEO Risk', C.red)
    const riskColor = data.parasiteRisk.riskLevel === 'low' ? C.emerald : data.parasiteRisk.riskLevel === 'medium' ? C.amber : C.red
    this.ensureSpace(10)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(riskColor)
    this.doc.text(`Risk Level: ${(data.parasiteRisk.riskLevel || 'unknown').toUpperCase()}`, ML + 4, this.y + 1)
    this.y += 8

    if (data.parasiteRisk.findings?.length > 0) {
      this.subTitle('Findings')
      for (const f of data.parasiteRisk.findings) {
        this.bulletItem(f, 6, C.red)
      }
    }
    if (data.parasiteRisk.recommendations?.length > 0) {
      this.subTitle('Recommendations')
      for (const r of data.parasiteRisk.recommendations) {
        this.bulletItem(r, 6, C.emerald)
      }
    }
    this.spacer(3)
    return this
  }

  // ── Local SEO ────────────────────────────────────────────────

  localSEOSection(data: ReportData): this {
    if (!data.localSEO?.applicable) return this
    this.sectionTitle('Local SEO Signals', C.amberDark)
    this.scoreCard('GBP Signals', data.localSEO.gbpSignals.score, 55)
    this.scoreCard('NAP Consistency', data.localSEO.napConsistency.score, 55)
    this.scoreCard('Review Signals', data.localSEO.reviewSignals.score, 55)
    this.labeledValue('Business Type', data.localSEO.businessType || 'N/A')
    this.spacer(1)

    if (data.localSEO.gbpSignals.findings?.length > 0) {
      this.subTitle('GBP Findings')
      for (const f of data.localSEO.gbpSignals.findings) { this.bulletItem(f, 6, C.amber) }
    }
    if (data.localSEO.napConsistency.findings?.length > 0) {
      this.subTitle('NAP Findings')
      for (const f of data.localSEO.napConsistency.findings) { this.bulletItem(f, 6, C.amber) }
    }
    if (data.localSEO.reviewSignals.findings?.length > 0) {
      this.subTitle('Review Findings')
      for (const f of data.localSEO.reviewSignals.findings) { this.bulletItem(f, 6, C.amber) }
    }
    this.spacer(3)
    return this
  }

  // ── Algorithm Updates Tracker ────────────────────────────────

  algorithmUpdatesSection(data: ReportData): this {
    if (!data.algorithmUpdates?.recentUpdates?.length) return this
    this.sectionTitle('Algorithm Updates Tracker', C.red)

    this.makeTable(
      ['Update', 'Date', 'Impact', 'Description', 'Pillar'],
      data.algorithmUpdates.recentUpdates.map(u => [u.name, u.date, u.impact?.toUpperCase() || '', u.description, u.affectedPillar?.toUpperCase() || '']),
      C.red
    )
    this.spacer(3)
    return this
  }

  // ── 12-Month Roadmap (from LLM data) ────────────────────────

  roadmapSection(data: ReportData): this {
    if (!data.roadmap?.quarters?.length) return this
    this.sectionTitle('12-Month Roadmap', C.emeraldDark)

    const qColors: readonly [number, number, number][] = [C.emeraldDark, C.amberDark, C.cyanDark, C.dark]
    for (let i = 0; i < data.roadmap.quarters.length; i++) {
      const q = data.roadmap.quarters[i]
      this.ensureSpace(35)
      const qColor = qColors[i % qColors.length]
      // quarter header bar
      this.setFillColor(qColor)
      this.doc.rect(ML, this.y, CW, 8, 'F')
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.white)
      this.doc.text(q.label, ML + 3, this.y + 5.5)
      this.y += 10

      // SEO goal
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.emerald)
      this.doc.text('SEO: ', ML + 4, this.y + 1, { maxWidth: 10 })
      const seoLabelW = this.doc.getTextWidth('SEO: ')
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const seoLines = this.doc.splitTextToSize(q.seoGoal, CW - 4 - seoLabelW - 4)
      this.doc.text(seoLines, ML + 4 + seoLabelW, this.y + 1)
      this.y += Math.max(seoLines.length * 3.5, 3.5) + 1

      // AEO goal
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.amber)
      this.doc.text('AEO: ', ML + 4, this.y + 1, { maxWidth: 10 })
      const aeoLabelW = this.doc.getTextWidth('AEO: ')
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const aeoLines = this.doc.splitTextToSize(q.aeoGoal, CW - 4 - aeoLabelW - 4)
      this.doc.text(aeoLines, ML + 4 + aeoLabelW, this.y + 1)
      this.y += Math.max(aeoLines.length * 3.5, 3.5) + 1

      // GEO goal
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.cyan)
      this.doc.text('GEO: ', ML + 4, this.y + 1, { maxWidth: 10 })
      const geoLabelW = this.doc.getTextWidth('GEO: ')
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const geoLines = this.doc.splitTextToSize(q.geoGoal, CW - 4 - geoLabelW - 4)
      this.doc.text(geoLines, ML + 4 + geoLabelW, this.y + 1)
      this.y += Math.max(geoLines.length * 3.5, 3.5) + 1

      // Target scores
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.medium)
      this.doc.text(`Target Scores \u2014 SEO: ${q.targetScores.seo} | AEO: ${q.targetScores.aeo} | GEO: ${q.targetScores.geo}`, ML + 4, this.y + 1)
      this.y += 6
    }
    this.spacer(3)
    return this
  }

  // ── Traffic Insights ─────────────────────────────────────────

  trafficInsightsSection(data: ReportData): this {
    if (!data.trafficInsights) return this
    if (!data.trafficInsights.winners?.length && !data.trafficInsights.losers?.length) return this
    this.sectionTitle('Traffic Insights \u2014 Winners & Losers', C.emeraldDark)

    if (data.trafficInsights.winners?.length) {
      this.subTitle('Winners', C.emerald)
      this.makeTable(
        ['Page', 'Change', 'Pillar'],
        data.trafficInsights.winners.map(w => [w.page, w.change, w.pillar?.toUpperCase() || '']),
        C.emeraldDark
      )
    }

    if (data.trafficInsights.losers?.length) {
      this.subTitle('Losers', C.red)
      this.makeTable(
        ['Page', 'Change', 'Pillar'],
        data.trafficInsights.losers.map(l => [l.page, l.change, l.pillar?.toUpperCase() || '']),
        C.red
      )
    }
    this.spacer(3)
    return this
  }

  // ── SXO Section ──────────────────────────────────────────────

  sxoSection(data: ReportData): this {
    this.sectionTitle('SXO \u2014 Search Experience Optimization', C.cyanDark)
    this.labeledValue('Page Type Match', data.sxo.pageTypeMatch || 'N/A')
    this.labeledValue('SERP Intent Match', (data.sxo.serpIntentMatch || 'N/A').toUpperCase())
    this.spacer(1)

    if (data.sxo.userPersonaScores?.length > 0) {
      this.subTitle('User Persona Scores')
      this.makeTable(
        ['Persona', 'Score'],
        data.sxo.userPersonaScores.map(p => [p.persona, String(p.score) + '/100']),
        C.cyanDark
      )
    }

    if (data.sxo.recommendations?.length > 0) {
      this.subTitle('SXO Recommendations')
      for (const r of data.sxo.recommendations) {
        this.bulletItem(r, 6, C.cyan)
      }
    }
    this.spacer(3)
    return this
  }

  // ── Phase 2: Structure ───────────────────────────────────────

  structurePhase(data: ReportData): this {
    this.sectionTitle('Phase 2: Structure', C.emeraldDark)

    // Topic Clusters
    if (data.structure.topicClusters?.length > 0) {
      this.subTitle('Topic Clusters')
      for (const tc of data.structure.topicClusters) {
        this.ensureSpace(25)
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'bold')
        this.setColor(C.emerald)
        this.doc.text(tc.cluster, ML + 4, this.y + 1)
        this.y += 6
        this.labeledValue('Pillar Keyword', tc.pillarKeyword)
        if (tc.supportingKeywords?.length > 0) {
          this.labeledValue('Supporting KWs', tc.supportingKeywords.join(', '))
        }
        this.labeledValue('SEO Opportunity', tc.seoOpportunity)
        this.labeledValue('AEO Opportunity', tc.aeoOpportunity)
        this.labeledValue('GEO Opportunity', tc.geoOpportunity)
        this.spacer(2)
      }
    }

    // Keyword Gaps
    if (data.structure.keywordGaps?.length > 0) {
      this.subTitle('Keyword Gaps')
      this.makeTable(
        ['Keyword', 'Volume', 'Difficulty', 'Type', 'Opportunity'],
        data.structure.keywordGaps.map(k => [k.keyword, k.volume, k.difficulty, k.type?.toUpperCase() || '', k.opportunity]),
        C.emeraldDark
      )
    }

    // Content Architecture
    if (data.structure.contentArchitecture?.recommended?.length > 0) {
      this.subTitle('Recommended Content Architecture')
      this.makeTable(
        ['Section', 'Purpose', 'Pillar'],
        data.structure.contentArchitecture.recommended.map(r => [r.section, r.purpose, r.pillar?.toUpperCase() || '']),
        C.emeraldDark
      )
    }

    if (data.structure.contentArchitecture?.internalLinkMap?.length > 0) {
      this.subTitle('Internal Link Map')
      this.makeTable(
        ['From', 'To', 'Anchor'],
        data.structure.contentArchitecture.internalLinkMap.map(l => [l.from, l.to, l.anchor]),
        C.emeraldDark
      )
    }

    // Schema Recommendations
    if (data.structure.schemaRecommendations?.length > 0) {
      this.subTitle('Schema Recommendations')
      this.makeTable(
        ['Schema Type', 'Purpose', 'Pillar', 'Implementation', 'Status'],
        data.structure.schemaRecommendations.map(s => [s.schemaType, s.purpose, s.pillar?.toUpperCase() || '', s.implementation, s.status]),
        C.emeraldDark
      )
    }
    this.spacer(3)
    return this
  }

  // ── Phase 3: Creative ────────────────────────────────────────

  creativePhase(data: ReportData): this {
    this.sectionTitle('Phase 3: Creative', C.amberDark)

    // Content Briefs
    if (data.creative.contentBriefs?.length > 0) {
      this.subTitle('Content Briefs')
      for (const cb of data.creative.contentBriefs) {
        this.ensureSpace(30)
        const pColor = this.pillarColor(cb.pillar)
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'bold')
        this.setColor(pColor)
        this.doc.text(cb.title, ML + 4, this.y + 1)
        this.y += 6
        this.labeledValue('Type', (cb.type?.toUpperCase() || '') + ' | Pillar: ' + (cb.pillar?.toUpperCase() || ''))
        this.labeledValue('Target Keyword', cb.targetKeyword)
        this.labeledValue('Brief', cb.brief)
        this.labeledValue('Estimated Impact', cb.estimatedImpact)
        this.labeledValue('Word Count', cb.wordCount)
        if (cb.structure?.length > 0) {
          this.labeledValue('Structure', cb.structure.join(' \u2192 '))
        }
        this.spacer(3)
      }
    }

    // On-Page Optimizations
    if (data.creative.onPageOptimizations?.length > 0) {
      this.subTitle('On-Page Optimizations')
      for (const op of data.creative.onPageOptimizations) {
        this.ensureSpace(20)
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'bold')
        this.setColor(C.amber)
        this.doc.text(`Page: ${op.page}`, ML + 4, this.y + 1)
        this.y += 6
        this.labeledValue('Current Title', op.currentTitle)
        this.labeledValue('Suggested Title', op.suggestedTitle, C.medium, C.emerald)
        this.labeledValue('Description', op.suggestedDescription)
        if (op.aeoTweaks?.length > 0) {
          this.subTitle('AEO Tweaks', C.amberDark)
          for (const t of op.aeoTweaks) { this.bulletItem(t, 8, C.amber) }
        }
        if (op.geoTweaks?.length > 0) {
          this.subTitle('GEO Tweaks', C.cyanDark)
          for (const t of op.geoTweaks) { this.bulletItem(t, 8, C.cyan) }
        }
        this.spacer(2)
      }
    }

    // Answer Blocks
    if (data.creative.answerBlocks?.length > 0) {
      this.subTitle('Answer Blocks')
      this.makeTable(
        ['Question', 'Answer', 'Format', 'Engine'],
        data.creative.answerBlocks.map(a => [a.question, (a.suggestedAnswer || '').slice(0, 80), a.format, a.targetEngine]),
        C.amberDark
      )
    }
    this.spacer(3)
    return this
  }

  // ── Phase 4: Measure ─────────────────────────────────────────

  measurePhase(data: ReportData): this {
    this.sectionTitle('Phase 4: Measure', C.cyanDark)

    // KPIs
    this.subTitle('KPI Tracking')

    const kpiSections: { label: string; items: { metric: string; current: string; target: string; timeline: string }[]; color: readonly [number, number, number] }[] = [
      { label: 'SEO KPIs', items: data.measure.kpiTracking.seo, color: C.emeraldDark },
      { label: 'AEO KPIs', items: data.measure.kpiTracking.aeo, color: C.amberDark },
      { label: 'GEO KPIs', items: data.measure.kpiTracking.geo, color: C.cyanDark },
    ]

    for (const ks of kpiSections) {
      if (ks.items?.length > 0) {
        this.ensureSpace(15)
        this.doc.setFontSize(8)
        this.doc.setFont('helvetica', 'bold')
        this.setColor(ks.color)
        this.doc.text(ks.label, ML + 4, this.y + 1)
        this.y += 5
        this.makeTable(
          ['Metric', 'Current', 'Target', 'Timeline'],
          ks.items.map(k => [k.metric, k.current, k.target, k.timeline]),
          ks.color
        )
      }
    }

    // Competitor Benchmarks
    if (data.measure.competitorBenchmarks?.length > 0) {
      this.subTitle('Competitor Benchmarks')
      this.makeTable(
        ['Competitor', 'SEO', 'AEO', 'GEO', 'Cited By'],
        data.measure.competitorBenchmarks.map(c => [c.competitor, String(c.seoScore), String(c.aeoScore), String(c.geoScore), (c.citedBy || []).join(', ')]),
        C.cyanDark
      )
    }

    // Weekly Actions
    if (data.measure.weeklyActions?.length > 0) {
      this.subTitle('Weekly Action Plan')
      for (const wa of data.measure.weeklyActions) {
        this.ensureSpace(15)
        this.doc.setFontSize(8)
        this.doc.setFont('helvetica', 'bold')
        this.setColor(C.cyanDark)
        this.doc.text(wa.week, ML + 4, this.y + 1)
        this.y += 5
        if (wa.tasks?.length > 0) {
          this.makeTable(
            ['Task', 'Pillar', 'Priority'],
            wa.tasks.map(t => [t.task, t.pillar?.toUpperCase() || '', t.priority?.toUpperCase() || '']),
            C.cyanDark
          )
        }
      }
    }
    this.spacer(3)
    return this
  }

  // ── 12-Month Roadmap (generated from weekly actions) ─────────

  roadmap(data: ReportData): this {
    this.sectionTitle('12-Month Roadmap', C.emeraldDark)

    const weeks = data.measure.weeklyActions || []
    const allTasks: { task: string; pillar: string; priority: string }[] = []
    for (const w of weeks) {
      allTasks.push(...(w.tasks || []))
    }

    const seoTasks = allTasks.filter(t => t.pillar === 'seo' || t.pillar === 'all')
    const aeoTasks = allTasks.filter(t => t.pillar === 'aeo' || t.pillar === 'all')
    const geoTasks = allTasks.filter(t => t.pillar === 'geo' || t.pillar === 'all')

    const quarters = [
      {
        label: 'Q1: Foundation (Months 1-3)',
        color: C.emeraldDark,
        seo: seoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Fix critical SEO issues; Optimize meta tags and headings',
        aeo: aeoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Add FAQ schema; Implement structured data',
        geo: geoTasks.slice(0, 2).map(t => t.task).join('; ') || 'Create cite-worthy content; Add llms.txt',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 15)} | AEO: ${Math.min(100, data.overallScores.aeo + 12)} | GEO: ${Math.min(100, data.overallScores.geo + 10)}`,
      },
      {
        label: 'Q2: Growth (Months 4-6)',
        color: C.amberDark,
        seo: 'Build authoritative backlinks; Expand topic clusters',
        aeo: 'Optimize answer blocks; Target featured snippets',
        geo: 'Increase AI citation presence; Strengthen entity signals',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 25)} | AEO: ${Math.min(100, data.overallScores.aeo + 22)} | GEO: ${Math.min(100, data.overallScores.geo + 20)}`,
      },
      {
        label: 'Q3: Authority (Months 7-9)',
        color: C.cyanDark,
        seo: 'Dominate niche keywords; Content refresh program',
        aeo: 'Voice search optimization; People Also Ask targeting',
        geo: 'Multi-platform AI visibility; Knowledge graph expansion',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 35)} | AEO: ${Math.min(100, data.overallScores.aeo + 32)} | GEO: ${Math.min(100, data.overallScores.geo + 30)}`,
      },
      {
        label: 'Q4: Scale (Months 10-12)',
        color: C.dark,
        seo: 'Scale content production; Advanced technical SEO',
        aeo: 'Automated answer optimization; Cross-platform AEO',
        geo: 'AI-first content strategy; Brand authority stronghold',
        target: `SEO: ${Math.min(100, data.overallScores.seo + 45)} | AEO: ${Math.min(100, data.overallScores.aeo + 40)} | GEO: ${Math.min(100, data.overallScores.geo + 38)}`,
      },
    ]

    for (const q of quarters) {
      this.ensureSpace(40)
      // quarter header bar
      this.setFillColor(q.color)
      this.doc.rect(ML, this.y, CW, 8, 'F')
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.white)
      this.doc.text(q.label, ML + 3, this.y + 5.5)
      this.y += 10

      // SEO
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.emerald)
      const seoLblW = this.doc.getTextWidth('SEO: ')
      this.doc.text('SEO: ', ML + 4, this.y + 1)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const seoLines = this.doc.splitTextToSize(q.seo, CW - 4 - seoLblW - 4)
      this.doc.text(seoLines, ML + 4 + seoLblW, this.y + 1)
      this.y += Math.max(seoLines.length * 3.5, 3.5) + 1

      // AEO
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.amber)
      const aeoLblW = this.doc.getTextWidth('AEO: ')
      this.doc.text('AEO: ', ML + 4, this.y + 1)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const aeoLines = this.doc.splitTextToSize(q.aeo, CW - 4 - aeoLblW - 4)
      this.doc.text(aeoLines, ML + 4 + aeoLblW, this.y + 1)
      this.y += Math.max(aeoLines.length * 3.5, 3.5) + 1

      // GEO
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.cyan)
      const geoLblW = this.doc.getTextWidth('GEO: ')
      this.doc.text('GEO: ', ML + 4, this.y + 1)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.dark)
      const geoLines = this.doc.splitTextToSize(q.geo, CW - 4 - geoLblW - 4)
      this.doc.text(geoLines, ML + 4 + geoLblW, this.y + 1)
      this.y += Math.max(geoLines.length * 3.5, 3.5) + 1

      // target
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(C.medium)
      this.doc.text('Target Scores: ' + q.target, ML + 4, this.y + 1)
      this.y += 5
    }
    this.spacer(3)
    return this
  }

  // ── Add Page Numbers ─────────────────────────────────────────

  addPageNumbers(): this {
    const totalPages = this.doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(6.5)
      this.doc.setFont('helvetica', 'normal')
      this.setColor(C.medium)
      this.doc.text(
        `Agent OS \u2014 SEO/AEO/GEO Report  |  Page ${i}`,
        PW / 2,
        PH - 12,
        { align: 'center' }
      )
    }
    return this
  }

  // ── Build Final PDF ──────────────────────────────────────────

  build(data: ReportData): jsPDF {
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
    const doc = builder.build(data)

    // Get PDF as Uint8Array
    const pdfOutput = doc.output('arraybuffer')

    // Sanitize filename
    const safeName = (data.siteName || 'report')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)
    const filename = `AgentOS-${safeName}-Report.pdf`

    // Return PDF response
    return new Response(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(pdfOutput.byteLength),
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
