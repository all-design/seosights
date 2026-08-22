import { NextResponse } from 'next/server'
import {
  isGSCConfigured,
  getTopQueries,
  getTopPages,
  getSummaryMetrics,
  getPerformanceOverTime,
} from '@/lib/gsc-api'
import type { GSCQueryRow, GSCPageRow } from '@/lib/gsc-api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gsc/clients/[clientId]/export-pdf
 *
 * Generates a comprehensive, branded PDF report for a single client.
 * Includes ALL data (not just what's visible on screen):
 *  - Cover page with client info + health score
 *  - Executive summary (KPIs)
 *  - SEO Health Score breakdown
 *  - All opportunities (with impact/effort/actions)
 *  - Top 25 queries table
 *  - Top 25 pages table
 *  - Action plan / recommendations
 *  - Pricing plans
 *  - Footer with branding + contact
 */

interface ClientSite {
  id: string
  label: string
  siteUrl: string
  domain: string
  industry: string
  plan: string
}

const CLIENT_SITES: ClientSite[] = [
  {
    id: 'client-one',
    label: 'Client One',
    siteUrl: 'https://kilim.rs',
    domain: 'kilim.rs',
    industry: 'Home & Decor / Handmade Rugs',
    plan: 'trial',
  },
  {
    id: 'client-two',
    label: 'Client Two',
    siteUrl: 'https://zlatnistandard.rs',
    domain: 'zlatnistandard.rs',
    industry: 'Finance / Precious Metals',
    plan: 'trial',
  },
  {
    id: 'client-three',
    label: 'Client Three',
    siteUrl: 'https://investiciono-zlato.rs',
    domain: 'investiciono-zlato.rs',
    industry: 'Finance / Investment Gold',
    plan: 'trial',
  },
]

// ── Color palette (matches the dashboard dark theme, adapted for PDF) ──

const COLORS = {
  // Dark backgrounds
  bgDark: [15, 23, 42] as [number, number, number],       // slate-950
  bgCard: [30, 41, 59] as [number, number, number],       // slate-800
  bgLight: [241, 245, 249] as [number, number, number],   // slate-100
  bgWhite: [255, 255, 255] as [number, number, number],
  // Text
  textPrimary: [15, 23, 42] as [number, number, number],
  textSecondary: [71, 85, 105] as [number, number, number], // slate-600
  textMuted: [148, 163, 184] as [number, number, number],   // slate-400
  textWhite: [255, 255, 255] as [number, number, number],
  // Accents
  emerald: [16, 185, 129] as [number, number, number],
  emeraldDark: [5, 150, 105] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  border: [226, 232, 240] as [number, number, number], // slate-200
}

// ── Opportunity Analyzer (mirrors the detail API) ────────────────

interface Opportunity {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric: string
  value: number
  benchmark: number
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  estimatedUplift: string
  recommendedAction: string
}

interface HealthFactor {
  label: string
  score: number
  weight: number
  detail: string
}

interface Recommendation {
  priority: 'P0' | 'P1' | 'P2'
  category: string
  title: string
  description: string
  impact: string
  timeframe: string
}

function analyzeOpportunities(
  queries: GSCQueryRow[],
  pages: GSCPageRow[],
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null
): Opportunity[] {
  const opportunities: Opportunity[] = []
  let idCounter = 0
  const nextId = () => `opp-${++idCounter}`

  for (const q of queries) {
    if (q.impressions > 50 && q.ctr < 2) {
      const lostClicks = Math.round(q.impressions * (3 - q.ctr) / 100)
      opportunities.push({
        id: nextId(),
        type: 'low_ctr',
        severity: q.ctr < 1 ? 'critical' : 'warning',
        title: `Low click-through rate for "${q.query}"`,
        description: `"${q.query}" gets ${q.impressions.toLocaleString()} impressions but only ${q.ctr}% CTR. Users see your result but don't click — typically a title/meta description issue.`,
        metric: 'CTR',
        value: q.ctr,
        benchmark: 3,
        impact: q.impressions > 500 ? 'high' : q.impressions > 150 ? 'medium' : 'low',
        effort: 'low',
        estimatedUplift: `+${lostClicks} clicks/mo (est. +${Math.round(lostClicks * 0.4)} conversions)`,
        recommendedAction: 'Rewrite the page title and meta description to be more compelling. Test emotional triggers, numbers, and a clear value proposition.',
      })
    }
  }

  for (const q of queries) {
    if (q.position > 10 && q.position <= 20 && q.impressions > 20) {
      opportunities.push({
        id: nextId(),
        type: 'content_gap',
        severity: 'info',
        title: `"${q.query}" is on page 2 (position #${q.position.toFixed(1)})`,
        description: `Small improvement could push this query to page 1, where CTR jumps from <1% to 3-15%. Page 1 visibility is worth 5-10x more clicks.`,
        metric: 'Position',
        value: q.position,
        benchmark: 10,
        impact: q.impressions > 200 ? 'high' : 'medium',
        effort: 'medium',
        estimatedUplift: `+${Math.round(q.impressions * 0.05)} clicks/mo if reaches top 10`,
        recommendedAction: 'Refresh the existing content, add more depth, internal links, and earn a few quality backlinks to push it onto page 1.',
      })
    }
  }

  for (const q of queries) {
    if (q.position <= 5 && q.ctr < 3 && q.impressions > 30) {
      opportunities.push({
        id: nextId(),
        type: 'high_impression_low_click',
        severity: 'warning',
        title: `"${q.query}" ranks #${q.position.toFixed(1)} but CTR is only ${q.ctr}%`,
        description: `Top-5 ranking should yield 5-15% CTR. You're losing 60-80% of potential clicks despite strong rankings.`,
        metric: 'CTR vs Position',
        value: q.ctr,
        benchmark: q.position <= 3 ? 8 : 5,
        impact: 'high',
        effort: 'low',
        estimatedUplift: `+${Math.round(q.impressions * 0.05)} clicks/mo`,
        recommendedAction: 'A/B test title tags, add schema markup (FAQ/How-To), and ensure the meta description matches search intent.',
      })
    }
  }

  for (const p of pages.slice(0, 15)) {
    if (p.position > 20 && p.impressions > 20) {
      const path = p.url.split('/').slice(3).join('/') || '/'
      opportunities.push({
        id: nextId(),
        type: 'declining_position',
        severity: p.position > 50 ? 'critical' : 'warning',
        title: `Page averaging position #${p.position.toFixed(1)}`,
        description: `/${path} has ${p.impressions.toLocaleString()} impressions but ranks beyond page 2. Content may need a complete refresh or be targeting the wrong queries.`,
        metric: 'Position',
        value: p.position,
        benchmark: 10,
        impact: p.impressions > 200 ? 'high' : 'medium',
        effort: 'high',
        estimatedUplift: `+${Math.round(p.impressions * 0.08)} clicks/mo if reaches top 10`,
        recommendedAction: 'Audit the page for content quality, search intent match, and on-page SEO. Consider consolidating with a stronger page or rewriting.',
      })
    }
  }

  if (summary) {
    if (summary.ctr < 2) {
      opportunities.push({
        id: nextId(),
        type: 'poor_performance',
        severity: 'critical',
        title: 'Site-wide CTR is below industry benchmark',
        description: `Overall CTR of ${summary.ctr}% is significantly below the 3% industry average. This indicates systemic title/meta issues across the site.`,
        metric: 'Overall CTR',
        value: summary.ctr,
        benchmark: 3,
        impact: 'high',
        effort: 'medium',
        estimatedUplift: `+${Math.round(summary.impressions * 0.01)} clicks/mo`,
        recommendedAction: 'Run a site-wide title tag audit. Use a consistent template with primary keyword + value proposition + brand name.',
      })
    }
    if (summary.position > 15) {
      opportunities.push({
        id: nextId(),
        type: 'poor_performance',
        severity: 'warning',
        title: 'Average position is on page 2 or lower',
        description: `Average position of #${summary.position.toFixed(1)} means most queries rank beyond page 1, where click volume drops dramatically.`,
        metric: 'Avg Position',
        value: summary.position,
        benchmark: 10,
        impact: 'high',
        effort: 'high',
        estimatedUplift: `+${Math.round(summary.impressions * 0.15)} clicks/mo if avg improves to top 10`,
        recommendedAction: 'Prioritize content improvements for queries in position 8-15 (closest to page 1). Build topical authority through cluster content.',
      })
    }
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 }
  const impactOrder = { high: 0, medium: 1, low: 2 }
  opportunities.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return impactOrder[a.impact] - impactOrder[b.impact]
  })

  return opportunities
}

function calculateHealthScore(
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null,
  opportunities: Opportunity[]
): { score: number; factors: HealthFactor[] } {
  if (!summary) return { score: 0, factors: [] }

  const ctrScore = Math.min(100, (summary.ctr / 8) * 100)
  const positionScore = summary.position > 30 ? 10 : Math.max(0, Math.min(100, ((30 - summary.position) / 27) * 100))
  const volumeScore = Math.min(100, (summary.impressions / 5000) * 100)
  const criticalCount = opportunities.filter(o => o.severity === 'critical').length
  const warningCount = opportunities.filter(o => o.severity === 'warning').length
  const opportunityBurden = Math.max(0, 100 - (criticalCount * 15 + warningCount * 5))

  const factors: HealthFactor[] = [
    { label: 'Click-through Rate', score: Math.round(ctrScore), weight: 30, detail: `${summary.ctr}% (benchmark: 3%+)` },
    { label: 'Average Position', score: Math.round(positionScore), weight: 30, detail: `#${summary.position.toFixed(1)} (goal: top 10)` },
    { label: 'Search Visibility', score: Math.round(volumeScore), weight: 20, detail: `${summary.impressions.toLocaleString()} impressions/mo` },
    { label: 'SEO Issue Burden', score: Math.round(opportunityBurden), weight: 20, detail: `${criticalCount} critical, ${warningCount} warnings` },
  ]

  const overall = Math.round(factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0))
  return { score: Math.max(0, Math.min(100, overall)), factors }
}

function generateRecommendations(
  opportunities: Opportunity[],
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null,
  queries: GSCQueryRow[],
  pages: GSCPageRow[]
): Recommendation[] {
  const recs: Recommendation[] = []

  if (summary && summary.ctr < 3) {
    recs.push({
      priority: 'P0',
      category: 'CTR Optimization',
      title: 'Run a site-wide title & meta description overhaul',
      description: `Your overall CTR is ${summary.ctr}% (below the 3% benchmark). Rewriting titles and descriptions for top 20 pages typically yields a 30-50% click lift within 2-4 weeks.`,
      impact: `+${Math.round(summary.impressions * 0.015)} clicks/mo`,
      timeframe: '2-4 weeks',
    })
  }

  const page2Queries = queries.filter(q => q.position > 10 && q.position <= 20)
  if (page2Queries.length > 0) {
    recs.push({
      priority: 'P1',
      category: 'Content Refresh',
      title: `Refresh content for ${page2Queries.length} queries on page 2`,
      description: `${page2Queries.length} queries rank between positions 11-20. With focused content improvements, 40-60% can reach page 1, where CTR is 5-15x higher.`,
      impact: `+${Math.round(page2Queries.reduce((s, q) => s + q.impressions, 0) * 0.04)} clicks/mo`,
      timeframe: '4-8 weeks',
    })
  }

  const lowCtrTopPages = pages.filter(p => p.position <= 10 && p.ctr < 5).slice(0, 5)
  if (lowCtrTopPages.length > 0) {
    recs.push({
      priority: 'P1',
      category: 'Technical SEO',
      title: 'Add structured data (schema) to top-ranking pages',
      description: `${lowCtrTopPages.length} pages rank in the top 10 but have CTR below 5%. Adding FAQ, How-To, or Product schema can unlock rich results and boost CTR by 20-30%.`,
      impact: `+${Math.round(lowCtrTopPages.reduce((s, p) => s + p.impressions, 0) * 0.05)} clicks/mo`,
      timeframe: '1-2 weeks',
    })
  }

  if (queries.length > 0) {
    const topQuery = queries[0]
    recs.push({
      priority: 'P2',
      category: 'Keyword Expansion',
      title: 'Expand content around your strongest topic cluster',
      description: `Your best-performing query is "${topQuery.query}" (${topQuery.impressions.toLocaleString()} impressions). Build supporting content (guides, comparisons, FAQs) to dominate this topic.`,
      impact: '+25-40% topic authority',
      timeframe: '6-12 weeks',
    })
  }

  if (pages.length > 10) {
    recs.push({
      priority: 'P2',
      category: 'Site Structure',
      title: 'Strengthen internal linking architecture',
      description: `${pages.length}+ pages indexed. A strategic internal linking pass can transfer authority from high-ranking pages to those stuck on page 2-3.`,
      impact: '+10-15% crawl efficiency',
      timeframe: '2-3 weeks',
    })
  }

  return recs
}

// ── PDF Builder ──────────────────────────────────────────────────

function buildPDF(
  client: ClientSite,
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null,
  summary90d: { impressions: number; clicks: number; ctr: number; position: number } | null,
  topQueries: GSCQueryRow[],
  topPages: GSCPageRow[],
  opportunities: Opportunity[],
  healthScore: { score: number; factors: HealthFactor[] },
  recommendations: Recommendation[]
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  let y = 0

  // Helper: add page with header/footer
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      addPageFooter()
      doc.addPage()
      y = margin
    }
  }

  const addPageFooter = () => {
    const footerY = pageHeight - 12
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(`SeoSights™ · SEO Visibility Report · ${client.domain}`, margin, footerY + 5)
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 10, footerY + 5)
    doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2 - 15, footerY + 5)
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════════════════════

  // Dark background top section
  doc.setFillColor(...COLORS.bgDark)
  doc.rect(0, 0, pageWidth, 110, 'F')

  // Brand header
  doc.setFillColor(...COLORS.emerald)
  doc.rect(margin, 18, 3, 8, 'F')
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.textWhite)
  doc.setFont('helvetica', 'bold')
  doc.text('SeoSights', margin + 6, 24)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textMuted)
  doc.text('AI-Powered SEO Visibility Platform', margin + 6, 29)

  // Report title
  doc.setFontSize(24)
  doc.setTextColor(...COLORS.textWhite)
  doc.setFont('helvetica', 'bold')
  doc.text('SEO Visibility Report', margin, 55)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.emerald)
  doc.text('Comprehensive search performance analysis & action plan', margin, 63)

  // Client info card
  doc.setFillColor(...COLORS.bgCard)
  doc.roundedRect(margin, 75, contentWidth, 28, 2, 2, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text('PREPARED FOR', margin + 5, 82)

  doc.setFontSize(16)
  doc.setTextColor(...COLORS.textWhite)
  doc.setFont('helvetica', 'bold')
  doc.text(client.domain, margin + 5, 89)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textMuted)
  doc.text(client.industry, margin + 5, 95)

  // Health score badge (right side of card)
  if (summary) {
    const scoreX = pageWidth - margin - 35
    const scoreColor = healthScore.score >= 70 ? COLORS.emerald :
                       healthScore.score >= 40 ? COLORS.amber : COLORS.red

    // Score circle
    doc.setFillColor(...COLORS.bgDark)
    doc.circle(scoreX + 15, 89, 12, 'F')
    doc.setDrawColor(...scoreColor)
    doc.setLineWidth(1.5)
    doc.circle(scoreX + 15, 89, 12, 'S')

    doc.setFontSize(16)
    doc.setTextColor(...scoreColor)
    doc.setFont('helvetica', 'bold')
    doc.text(String(healthScore.score), scoreX + 15, 91, { align: 'center' })

    doc.setFontSize(6)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text('HEALTH SCORE', scoreX + 15, 96, { align: 'center' })
  }

  // Report metadata on white background
  y = 125
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textSecondary)
  doc.setFont('helvetica', 'normal')

  const metaItems = [
    ['Report Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Data Source', 'Google Search Console API'],
    ['Analysis Period', 'Last 28 days (with 90-day trend)'],
    ['Report Type', 'SEO Performance & Opportunity Analysis'],
    ['Prepared By', 'SeoSights AI Engine'],
  ]

  metaItems.forEach(([label, value]) => {
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin, y)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text(value, margin + 45, y)
    y += 7
  })

  // Executive summary box
  y += 5
  doc.setDrawColor(...COLORS.emerald)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 20, y)
  y += 6

  doc.setFontSize(13)
  doc.setTextColor(...COLORS.textPrimary)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', margin, y)
  y += 7

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textSecondary)
  doc.setFont('helvetica', 'normal')

  const summaryText = summary
    ? `This report analyzes the search performance of ${client.domain} over the last 28 days. During this period, the site received ${summary.impressions.toLocaleString()} impressions and ${summary.clicks.toLocaleString()} clicks from Google Search, achieving an average click-through rate of ${summary.ctr}% and an average position of #${summary.position.toFixed(1)}. ${opportunities.length > 0 ? `Our analysis identified ${opportunities.length} SEO opportunities that, if addressed, could significantly improve organic search performance. The overall SEO Health Score is ${healthScore.score}/100.` : 'The site is performing well across all measured metrics with no critical issues detected.'}`
    : `This report is prepared for ${client.domain}. Google Search Console data is not yet available for this site. Once the site starts receiving organic search traffic, this report will include detailed performance analysis, opportunity identification, and a prioritized action plan.`

  const splitText = doc.splitTextToSize(summaryText, contentWidth)
  doc.text(splitText, margin, y)
  y += splitText.length * 5 + 5

  addPageFooter()

  // ═══════════════════════════════════════════════════════════════
  // PAGE 2 — KPIs + HEALTH SCORE BREAKDOWN
  // ═══════════════════════════════════════════════════════════════

  doc.addPage()
  y = margin

  // Section title
  doc.setFillColor(...COLORS.emerald)
  doc.rect(margin, y, 3, 6, 'F')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.textPrimary)
  doc.setFont('helvetica', 'bold')
  doc.text('Performance Overview', margin + 6, y + 5)
  y += 12

  if (summary) {
    // KPI cards (4 across)
    const cardWidth = (contentWidth - 9) / 4
    const cardHeight = 28
    const kpis = [
      { label: 'Impressions', value: summary.impressions.toLocaleString(), color: COLORS.emerald, sub90: summary90d ? `${summary90d.impressions.toLocaleString()} (90d)` : '' },
      { label: 'Clicks', value: summary.clicks.toLocaleString(), color: COLORS.cyan, sub90: summary90d ? `${summary90d.clicks.toLocaleString()} (90d)` : '' },
      { label: 'CTR', value: `${summary.ctr}%`, color: summary.ctr >= 3 ? COLORS.emerald : summary.ctr >= 1.5 ? COLORS.amber : COLORS.red, sub90: 'Benchmark: 3%+' },
      { label: 'Avg Position', value: `#${summary.position.toFixed(1)}`, color: summary.avgPosition <= 10 ? COLORS.emerald : summary.avgPosition <= 20 ? COLORS.amber : COLORS.red, sub90: 'Goal: top 10' },
    ]

    kpis.forEach((kpi, i) => {
      const x = margin + i * (cardWidth + 3)
      // Card background
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F')
      // Top accent
      doc.setFillColor(...kpi.color)
      doc.roundedRect(x, y, cardWidth, 1.5, 2, 2, 'F')
      // Label
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      doc.text(kpi.label.toUpperCase(), x + 3, y + 7)
      // Value
      doc.setFontSize(15)
      doc.setTextColor(...COLORS.textPrimary)
      doc.setFont('helvetica', 'bold')
      doc.text(kpi.value, x + 3, y + 15)
      // Sub
      if (kpi.sub90) {
        doc.setFontSize(6)
        doc.setTextColor(...COLORS.textMuted)
        doc.setFont('helvetica', 'normal')
        doc.text(kpi.sub90, x + 3, y + 21)
      }
    })

    y += cardHeight + 8
  }

  // Health Score Breakdown
  if (healthScore.factors.length > 0) {
    ensureSpace(50)
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text('SEO Health Score Breakdown', margin, y)
    y += 6

    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(`Overall Score: ${healthScore.score}/100`, margin, y)
    y += 6

    healthScore.factors.forEach((factor) => {
      ensureSpace(16)
      const factorColor = factor.score >= 70 ? COLORS.emerald :
                          factor.score >= 40 ? COLORS.amber : COLORS.red

      // Label
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.textPrimary)
      doc.setFont('helvetica', 'bold')
      doc.text(factor.label, margin, y)
      // Score
      doc.setFontSize(11)
      doc.setTextColor(...factorColor)
      doc.text(`${factor.score}/100`, pageWidth - margin - 35, y)
      // Weight
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      doc.text(`weight ${factor.weight}%`, pageWidth - margin - 15, y)
      y += 3

      // Progress bar
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(margin, y, contentWidth - 35, 2, 1, 1, 'F')
      doc.setFillColor(...factorColor)
      const barWidth = ((contentWidth - 35) * factor.score) / 100
      doc.roundedRect(margin, y, barWidth, 2, 1, 1, 'F')
      y += 5

      // Detail
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textSecondary)
      doc.setFont('helvetica', 'normal')
      doc.text(factor.detail, margin, y)
      y += 7
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE — SEO OPPORTUNITIES
  // ═══════════════════════════════════════════════════════════════

  if (opportunities.length > 0) {
    doc.addPage()
    y = margin

    doc.setFillColor(...COLORS.emerald)
    doc.rect(margin, y, 3, 6, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text('SEO Opportunities', margin + 6, y + 5)
    y += 10

    const oppSummary = {
      critical: opportunities.filter(o => o.severity === 'critical').length,
      warning: opportunities.filter(o => o.severity === 'warning').length,
      info: opportunities.filter(o => o.severity === 'info').length,
    }

    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textSecondary)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${oppSummary.critical} critical · ${oppSummary.warning} warnings · ${oppSummary.info} opportunities`,
      margin, y
    )
    y += 8

    opportunities.forEach((opp, idx) => {
      ensureSpace(35)
      const sevColor = opp.severity === 'critical' ? COLORS.red :
                       opp.severity === 'warning' ? COLORS.amber : COLORS.cyan

      // Card background
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F')
      // Left accent
      doc.setFillColor(...sevColor)
      doc.roundedRect(margin, y, 1.5, 30, 1, 1, 'F')

      // Severity badge
      doc.setFillColor(...sevColor)
      doc.roundedRect(margin + 4, y + 3, 18, 5, 1, 1, 'F')
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.textWhite)
      doc.setFont('helvetica', 'bold')
      doc.text(opp.severity.toUpperCase(), margin + 13, y + 6.5, { align: 'center' })

      // Impact + Effort
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      doc.text(`${opp.impact.toUpperCase()} IMPACT`, margin + 25, y + 6.5)
      doc.text(`${opp.effort.toUpperCase()} EFFORT`, margin + 50, y + 6.5)

      // Title
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.textPrimary)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(`${idx + 1}. ${opp.title}`, contentWidth - 6)
      doc.text(titleLines[0], margin + 4, y + 12)

      // Description
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.textSecondary)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(opp.description, contentWidth - 6)
      doc.text(descLines.slice(0, 2), margin + 4, y + 17)

      // Estimated uplift + action
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.emerald)
      doc.setFont('helvetica', 'bold')
      doc.text(`↑ ${opp.estimatedUplift}`, margin + 4, y + 26)

      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      const actionText = `Action: ${opp.recommendedAction}`
      const actionLines = doc.splitTextToSize(actionText, contentWidth - 6)
      doc.text(actionLines.slice(0, 1), margin + 4, y + 30)

      y += 33
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE — TOP QUERIES TABLE
  // ═══════════════════════════════════════════════════════════════

  if (topQueries.length > 0) {
    doc.addPage()
    y = margin

    doc.setFillColor(...COLORS.emerald)
    doc.rect(margin, y, 3, 6, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Search Queries', margin + 6, y + 5)
    y += 10

    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(`Top ${Math.min(topQueries.length, 25)} queries by impressions · Last 28 days`, margin, y)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [['#', 'Query', 'Impressions', 'Clicks', 'CTR', 'Position', 'Status']],
      body: topQueries.slice(0, 25).map((q, i) => [
        String(i + 1),
        q.query,
        q.impressions.toLocaleString(),
        q.clicks.toLocaleString(),
        `${q.ctr}%`,
        `#${q.position.toFixed(1)}`,
        q.position <= 5 ? 'Top 5' : q.position <= 10 ? 'Top 10' : q.position <= 20 ? 'Page 2' : 'Page 3+',
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.bgDark,
        textColor: COLORS.textWhite,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: COLORS.textPrimary,
      },
      alternateRowStyles: {
        fillColor: COLORS.bgLight,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE — TOP PAGES TABLE
  // ═══════════════════════════════════════════════════════════════

  if (topPages.length > 0) {
    doc.addPage()
    y = margin

    doc.setFillColor(...COLORS.emerald)
    doc.rect(margin, y, 3, 6, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Pages', margin + 6, y + 5)
    y += 10

    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(`Top ${Math.min(topPages.length, 25)} pages by impressions · Last 28 days`, margin, y)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [['#', 'Page URL', 'Impressions', 'Clicks', 'CTR', 'Position']],
      body: topPages.slice(0, 25).map((p, i) => {
        const path = p.url.replace(/^https?:\/\/[^/]+/, '') || '/'
        return [
          String(i + 1),
          path.length > 50 ? path.substring(0, 47) + '...' : path,
          p.impressions.toLocaleString(),
          p.clicks.toLocaleString(),
          `${p.ctr}%`,
          `#${p.position.toFixed(1)}`,
        ]
      }),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.bgDark,
        textColor: COLORS.textWhite,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: COLORS.textPrimary,
      },
      alternateRowStyles: {
        fillColor: COLORS.bgLight,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 75 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE — ACTION PLAN / RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════

  if (recommendations.length > 0) {
    doc.addPage()
    y = margin

    doc.setFillColor(...COLORS.emerald)
    doc.rect(margin, y, 3, 6, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.textPrimary)
    doc.setFont('helvetica', 'bold')
    doc.text('AI-Powered Action Plan', margin + 6, y + 5)
    y += 10

    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textSecondary)
    doc.setFont('helvetica', 'normal')
    const introText = `Based on ${opportunities.length} detected opportunities across ${topQueries.length} queries and ${topPages.length} pages, we recommend the following prioritized action plan to maximize SEO impact.`
    const introLines = doc.splitTextToSize(introText, contentWidth)
    doc.text(introLines, margin, y)
    y += introLines.length * 5 + 5

    recommendations.forEach((rec, idx) => {
      ensureSpace(35)
      const prioColor = rec.priority === 'P0' ? COLORS.red :
                        rec.priority === 'P1' ? COLORS.amber : COLORS.cyan

      // Card
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F')

      // Priority badge
      doc.setFillColor(...prioColor)
      doc.roundedRect(margin + 3, y + 3, 16, 6, 1, 1, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textWhite)
      doc.setFont('helvetica', 'bold')
      doc.text(rec.priority, margin + 11, y + 7, { align: 'center' })

      // Category
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      doc.text(rec.category.toUpperCase(), margin + 22, y + 7)

      // Title
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.textPrimary)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(`${idx + 1}. ${rec.title}`, contentWidth - 6)
      doc.text(titleLines.slice(0, 2), margin + 4, y + 13)

      // Description
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.textSecondary)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(rec.description, contentWidth - 6)
      doc.text(descLines.slice(0, 2), margin + 4, y + 20)

      // Impact + timeframe
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.emerald)
      doc.setFont('helvetica', 'bold')
      doc.text(`Impact: ${rec.impact}`, margin + 4, y + 28)

      doc.setFontSize(7)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'normal')
      doc.text(`Timeframe: ${rec.timeframe}`, margin + 60, y + 28)

      y += 35
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE — PRICING / NEXT STEPS
  // ═══════════════════════════════════════════════════════════════

  doc.addPage()
  y = margin

  // Dark hero
  doc.setFillColor(...COLORS.bgDark)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setFillColor(...COLORS.emerald)
  doc.rect(margin, 18, 3, 8, 'F')
  doc.setFontSize(18)
  doc.setTextColor(...COLORS.textWhite)
  doc.setFont('helvetica', 'bold')
  doc.text('Ready to Accelerate', margin + 6, 25)
  doc.text('Your SEO Growth?', margin + 6, 33)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.emerald)
  doc.setFont('helvetica', 'normal')
  doc.text(opportunities.length > 0
    ? `Address ${opportunities.length} opportunities to unlock significant traffic growth.`
    : 'Choose the plan that fits your business goals.',
    margin + 6, 40
  )

  y = 60

  // Pricing plans
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: '/mo',
      tagline: 'For small sites',
      features: ['Weekly SEO audit', 'Top 100 keywords', '1 competitor', 'Monthly report', 'Email support'],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$299',
      period: '/mo',
      tagline: 'For growing businesses',
      features: ['Everything in Starter', 'Daily audits + alerts', 'Top 1,000 keywords', '5 competitors', 'AI Visibility tracking', 'Weekly action plans', '10 content briefs/mo', 'Priority support'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$999',
      period: '/mo',
      tagline: 'For agencies & multi-site',
      features: ['Everything in Pro', 'Unlimited keywords', 'Multi-site dashboard', 'White-label reports', 'Dedicated strategist', 'API access', 'Custom AI training', '24/7 phone support'],
      highlighted: false,
    },
  ]

  const planWidth = (contentWidth - 6) / 3
  const planHeight = 85

  plans.forEach((plan, i) => {
    const x = margin + i * (planWidth + 3)

    // Background
    if (plan.highlighted) {
      doc.setFillColor(...COLORS.emerald)
      doc.roundedRect(x - 1, y - 1, planWidth + 2, planHeight + 2, 2, 2, 'F')
      doc.setFillColor(...COLORS.bgDark)
      doc.roundedRect(x, y, planWidth, planHeight, 2, 2, 'F')
    } else {
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(x, y, planWidth, planHeight, 2, 2, 'F')
    }

    // Name
    doc.setFontSize(11)
    const nameColor = plan.highlighted ? COLORS.emerald : COLORS.textPrimary
    doc.setTextColor(nameColor[0], nameColor[1], nameColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(plan.name, x + 3, y + 7)

    // Price
    doc.setFontSize(20)
    doc.setTextColor(...COLORS.textPrimary)
    doc.text(plan.price, x + 3, y + 16)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(plan.period, x + 3 + doc.getTextWidth(plan.price), y + 16)

    // Tagline
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(plan.tagline, x + 3, y + 21)

    // Features
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textSecondary)
    let fy = y + 27
    plan.features.forEach((f) => {
      // Checkmark
      doc.setTextColor(...COLORS.emerald)
      doc.text('✓', x + 3, fy)
      doc.setTextColor(...COLORS.textSecondary)
      const fLines = doc.splitTextToSize(f, planWidth - 8)
      doc.text(fLines[0], x + 7, fy)
      fy += 5
    })

    if (plan.highlighted) {
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.emerald)
      doc.setFont('helvetica', 'bold')
      doc.text('★ MOST POPULAR', x + planWidth / 2, y + planHeight - 3, { align: 'center' })
    }
  })

  y += planHeight + 10

  // Contact section
  ensureSpace(40)
  doc.setDrawColor(...COLORS.emerald)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 30, y)
  y += 7

  doc.setFontSize(12)
  doc.setTextColor(...COLORS.textPrimary)
  doc.setFont('helvetica', 'bold')
  doc.text('Next Steps', margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textSecondary)
  doc.setFont('helvetica', 'normal')
  const nextSteps = [
    '1. Review this report with your team',
    '2. Choose the plan that fits your needs',
    '3. Connect your Google Search Console (if not already done)',
    '4. Start receiving weekly audits and AI-powered recommendations',
    '5. Track your progress with the SeoSights dashboard',
  ]
  nextSteps.forEach((step) => {
    doc.text(step, margin, y)
    y += 6
  })

  y += 5
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.emerald)
  doc.setFont('helvetica', 'bold')
  doc.text('Contact: sales@seosights.com', margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text('Visit seosights.com to get started', margin, y)

  addPageFooter()

  // Return as buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

// ── Main Handler ────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const site = CLIENT_SITES.find(s => s.id === clientId)

  if (!site) {
    return NextResponse.json(
      { error: 'Client not found', clientId },
      { status: 404 }
    )
  }

  // Even if GSC is not configured, we can still generate a report (with no data section)
  const configured = isGSCConfigured()

  let summary = null
  let summary90d = null
  let topQueries: GSCQueryRow[] = []
  let topPages: GSCPageRow[] = []
  let opportunities: Opportunity[] = []
  let healthScore = { score: 0, factors: [] as HealthFactor[] }
  let recommendations: Recommendation[] = []

  if (configured) {
    try {
      const [s, s90, q, p] = await Promise.all([
        getSummaryMetrics(28, site.siteUrl),
        getSummaryMetrics(90, site.siteUrl),
        getTopQueries(28, 50, site.siteUrl),
        getTopPages(28, 50, site.siteUrl),
      ])

      summary = s
      summary90d = s90
      topQueries = q
      topPages = p

      const hasData = q.length > 0 || p.length > 0
      if (hasData && s) {
        opportunities = analyzeOpportunities(q, p, s)
        healthScore = calculateHealthScore(s, opportunities)
        recommendations = generateRecommendations(opportunities, s, q, p)
      }
    } catch (err) {
      console.error(`[GSC export-pdf ${clientId}] Error fetching data:`, err)
      // Continue with empty data — PDF will show "no data" state
    }
  }

  try {
    const pdfBuffer = buildPDF(
      site,
      summary,
      summary90d,
      topQueries,
      topPages,
      opportunities,
      healthScore,
      recommendations
    )

    const filename = `seosights-seo-report-${site.domain}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error(`[GSC export-pdf ${clientId}] PDF generation error:`, err)
    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
