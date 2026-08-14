// ─── Real Performance Audit Engine ────────────────────────────────
// Uses Lighthouse CLI subprocess + real HTTP timing to measure actual performance.
// NO hardcoded data — everything is measured in real-time.
// NO lighthouse import — runs via CLI to avoid webpack bundling issues.

import { execFile } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

// ── Types ────────────────────────────────────────────────────────

export interface LighthouseResult {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  pwa: number
  fcp: number
  lcp: number
  cls: number
  tti: number
  tbt: number
  si: number
  ttfb: number
  domSize: number
  jsSize: number
  cssSize: number
  imageSize: number
  fontSize: number
  totalSize: number
  opportunities: LighthouseOpportunity[]
  diagnostics: LighthouseDiagnostic[]
}

export interface LighthouseOpportunity {
  id: string
  title: string
  savings: number
  description: string
}

export interface LighthouseDiagnostic {
  id: string
  title: string
  value: number | string
  description: string
}

export interface EndpointTiming {
  route: string
  ttfb: number
  total: number
  status: number
  size: number
  error?: string
}

export interface PerformanceAuditResult {
  url: string
  timestamp: string
  durationMs: number
  lighthouse: LighthouseResult | null
  endpointTimings: EndpointTiming[]
  coreVitals: {
    lcp: number | null
    fcp: number | null
    cls: number | null
    ttfb: number | null
    tti: number | null
    tbt: number | null
    si: number | null
  }
  issues: PerformanceIssue[]
  score: number
}

export interface PerformanceIssue {
  title: string
  severity: 'critical' | 'major' | 'medium' | 'minor'
  category: string
  metric: string
  value: number | string
  threshold: number | string
  page: string
  fixSuggestion: string
}

// ── Config ───────────────────────────────────────────────────────

const PAGES_TO_AUDIT = ['/', '/os', '/growth', '/observatory', '/pricing']
const API_ENDPOINTS_TO_MEASURE = ['/api/control/data']

// ── Find Chrome binary ──────────────────────────────────────────

function findChromePath(): string | undefined {
  const puppeteerCachePath = path.join(process.env.HOME || '/root', '.cache/puppeteer/chrome')
  try {
    if (fs.existsSync(puppeteerCachePath)) {
      const versions = fs.readdirSync(puppeteerCachePath).sort().reverse()
      for (const version of versions) {
        const chromePath = path.join(puppeteerCachePath, version, 'chrome-linux64/chrome')
        if (fs.existsSync(chromePath)) return chromePath
      }
    }
  } catch {}
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(p)) return p
  }
  return undefined
}

// ── Lighthouse Audit via CLI subprocess ──────────────────────────

function runLighthouseCLI(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chromePath = findChromePath()
    const args = [
      'lighthouse',
      url,
      '--output=json',
      '--output-path=stdout',
      '--chrome-flags=--headless --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--quiet',
    ]

    const env: Record<string, string> = { ...process.env as Record<string, string> }
    if (chromePath) env.CHROME_PATH = chromePath

    execFile('npx', args, {
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
      env,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Lighthouse CLI failed: ${error.message}${stderr ? ` | ${stderr.slice(0, 200)}` : ''}`))
        return
      }
      resolve(stdout)
    })
  })
}

async function runLighthouseAudit(url: string): Promise<LighthouseResult | null> {
  const chromePath = findChromePath()
  if (!chromePath) {
    console.error('[PerfAudit] Chrome not found — Lighthouse unavailable, using API-only audit.')
    return null
  }

  try {
    console.log(`[PerfAudit] Running Lighthouse CLI on ${url}...`)
    const rawJson = await runLighthouseCLI(url)
    const lhr = JSON.parse(rawJson)

    const cats = lhr.categories || {}
    const audits = lhr.audits || {}

    const fcp = audits['first-contentful-paint']?.numericValue ?? 0
    const lcp = audits['largest-contentful-paint']?.numericValue ?? 0
    const cls = audits['cumulative-layout-shift']?.numericValue ?? 0
    const tti = audits['interactive']?.numericValue ?? 0
    const tbt = audits['total-blocking-time']?.numericValue ?? 0
    const si = audits['speed-index']?.numericValue ?? 0
    const ttfb = audits['server-response-time']?.numericValue ?? 0
    const domSize = audits['dom-size']?.numericValue ?? 0

    let jsSize = 0, cssSize = 0, imageSize = 0, fontSize = 0, totalSize = 0
    const resourceSummary = audits['resource-summary']
    if (resourceSummary?.details?.items) {
      for (const item of resourceSummary.details.items) {
        const size = (item.transferSize ?? 0) / 1024
        totalSize += size
        if (item.resourceType === 'Script') jsSize += size
        else if (item.resourceType === 'Stylesheet') cssSize += size
        else if (item.resourceType === 'Image') imageSize += size
        else if (item.resourceType === 'Font') fontSize += size
      }
    }

    const opportunities: LighthouseOpportunity[] = []
    for (const [id, audit] of Object.entries(audits)) {
      if (audit.details?.type === 'opportunity' && audit.numericValue > 0) {
        opportunities.push({ id, title: audit.title, savings: Math.round(audit.numericValue), description: audit.description ?? '' })
      }
    }
    opportunities.sort((a, b) => b.savings - a.savings)

    const diagnostics: LighthouseDiagnostic[] = []
    for (const [id, audit] of Object.entries(audits)) {
      if (audit.details?.type === 'table' && audit.score !== null && audit.score < 1) {
        diagnostics.push({ id, title: audit.title, value: audit.numericValue ?? audit.displayValue ?? 'N/A', description: audit.description ?? '' })
      }
    }

    const result: LighthouseResult = {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
      pwa: Math.round((cats.pwa?.score ?? 0) * 100),
      fcp: Math.round(fcp) / 1000,
      lcp: Math.round(lcp) / 1000,
      cls: Math.round(cls * 1000) / 1000,
      tti: Math.round(tti) / 1000,
      tbt: Math.round(tbt),
      si: Math.round(si) / 1000,
      ttfb: Math.round(ttfb),
      domSize: Math.round(domSize),
      jsSize: Math.round(jsSize),
      cssSize: Math.round(cssSize),
      imageSize: Math.round(imageSize),
      fontSize: Math.round(fontSize),
      totalSize: Math.round(totalSize),
      opportunities: opportunities.slice(0, 20),
      diagnostics: diagnostics.slice(0, 15),
    }

    console.log(`[PerfAudit] Lighthouse: perf=${result.performance}, a11y=${result.accessibility}, seo=${result.seo}`)
    return result
  } catch (error: any) {
    console.error(`[PerfAudit] Lighthouse error:`, error.message)
    return null
  }
}

// ── Real HTTP Timing Measurements ────────────────────────────────

async function measureEndpoint(baseUrl: string, route: string): Promise<EndpointTiming> {
  const url = `${baseUrl}${route}`
  const start = Date.now()
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000) })
    const ttfb = Date.now() - start
    const body = await res.arrayBuffer()
    const total = Date.now() - start
    return { route, ttfb, total, status: res.status, size: body.byteLength }
  } catch (error: any) {
    return { route, ttfb: Date.now() - start, total: Date.now() - start, status: 0, size: 0, error: error.message }
  }
}

// ── Generate Issues from Real Data ───────────────────────────────

function generateIssues(lh: LighthouseResult | null, timings: EndpointTiming[], page: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []

  if (lh) {
    if (lh.lcp > 2.5) issues.push({ title: `LCP: ${lh.lcp.toFixed(1)}s (target ≤2.5s)`, severity: lh.lcp > 4 ? 'critical' : 'major', category: 'core-web-vitals', metric: 'LCP', value: lh.lcp, threshold: 2.5, page, fixSuggestion: 'Preload LCP image. Server-render hero content. Eliminate render-blocking resources.' })
    if (lh.fcp > 1.8) issues.push({ title: `FCP: ${lh.fcp.toFixed(1)}s (target ≤1.8s)`, severity: lh.fcp > 3 ? 'major' : 'medium', category: 'core-web-vitals', metric: 'FCP', value: lh.fcp, threshold: 1.8, page, fixSuggestion: 'Eliminate render-blocking resources. Inline critical CSS.' })
    if (lh.cls > 0.1) issues.push({ title: `CLS: ${lh.cls.toFixed(3)} (target ≤0.1)`, severity: lh.cls > 0.25 ? 'major' : 'medium', category: 'core-web-vitals', metric: 'CLS', value: lh.cls, threshold: 0.1, page, fixSuggestion: 'Set explicit width/height on images. Reserve space for dynamic content.' })
    if (lh.tbt > 200) issues.push({ title: `TBT: ${lh.tbt}ms (target ≤200ms)`, severity: lh.tbt > 600 ? 'major' : 'medium', category: 'core-web-vitals', metric: 'TBT', value: lh.tbt, threshold: 200, page, fixSuggestion: 'Code-split JS. Defer non-critical scripts. Break up long tasks.' })
    if (lh.ttfb > 800) issues.push({ title: `TTFB: ${lh.ttfb}ms (target ≤800ms)`, severity: lh.ttfb > 2000 ? 'major' : 'medium', category: 'server', metric: 'TTFB', value: lh.ttfb, threshold: 800, page, fixSuggestion: 'Optimize server logic. Add CDN caching. Use edge functions.' })
    if (lh.jsSize > 300) issues.push({ title: `JS bundle: ${lh.jsSize}KB (target ≤300KB)`, severity: lh.jsSize > 600 ? 'major' : 'medium', category: 'bundle', metric: 'js_size_kb', value: lh.jsSize, threshold: 300, page, fixSuggestion: 'Code-split with dynamic imports. Remove unused deps.' })
    for (const opp of lh.opportunities.slice(0, 5)) {
      if (opp.savings > 100) issues.push({ title: `${opp.title} (saves ${opp.savings}ms)`, severity: opp.savings > 1000 ? 'major' : 'medium', category: 'lighthouse', metric: opp.id, value: opp.savings, threshold: 0, page, fixSuggestion: opp.description })
    }
  }

  for (const t of timings) {
    if (t.error) issues.push({ title: `API failed: ${t.route} — ${t.error}`, severity: 'critical', category: 'api', metric: 'error', value: t.error, threshold: 'ok', page: t.route, fixSuggestion: 'Check server logs. Verify endpoint is operational.' })
    else if (t.ttfb > 500) issues.push({ title: `Slow API: ${t.route} — ${t.ttfb}ms (target ≤500ms)`, severity: t.ttfb > 2000 ? 'critical' : 'major', category: 'api', metric: 'api_ttfb', value: t.ttfb, threshold: 500, page: t.route, fixSuggestion: 'Add caching. Optimize queries. Parallelize external calls.' })
  }

  return issues
}

// ── Calculate Score ───────────────────────────────────────────────

function calcScore(lh: LighthouseResult | null, timings: EndpointTiming[]): number {
  if (!lh) {
    const ok = timings.filter(t => !t.error && t.status === 200).length
    return Math.round((ok / Math.max(timings.length, 1)) * 70)
  }
  const apiOk = timings.length > 0 ? (timings.filter(t => !t.error && t.status === 200 && t.ttfb < 500).length / timings.length) * 100 : 100
  return Math.round(lh.performance * 0.40 + lh.accessibility * 0.15 + lh.bestPractices * 0.15 + lh.seo * 0.15 + lh.pwa * 0.05 + apiOk * 0.10)
}

// ── Main Audit ───────────────────────────────────────────────────

export async function runPerformanceAudit(
  baseUrl: string = 'http://localhost:3000',
  pages: string[] = PAGES_TO_AUDIT,
  endpoints: string[] = API_ENDPOINTS_TO_MEASURE,
): Promise<PerformanceAuditResult> {
  const startTime = Date.now()
  console.log(`[PerfAudit] Starting audit at ${new Date().toISOString()}`)

  const auditUrl = `${baseUrl}${pages[0]}`
  const lighthouse = await runLighthouseAudit(auditUrl)

  console.log(`[PerfAudit] Measuring ${endpoints.length} API endpoints...`)
  const endpointTimings = await Promise.all(endpoints.map(r => measureEndpoint(baseUrl, r)))
  for (const t of endpointTimings) console.log(`[PerfAudit]   ${t.route}: ttfb=${t.ttfb}ms, status=${t.status}`)

  const issues = generateIssues(lighthouse, endpointTimings, pages[0])
  const score = calcScore(lighthouse, endpointTimings)
  const durationMs = Date.now() - startTime

  console.log(`[PerfAudit] Complete: score=${score}, issues=${issues.length}, duration=${durationMs}ms`)

  return {
    url: auditUrl,
    timestamp: new Date().toISOString(),
    durationMs,
    lighthouse,
    endpointTimings,
    coreVitals: { lcp: lighthouse?.lcp ?? null, fcp: lighthouse?.fcp ?? null, cls: lighthouse?.cls ?? null, ttfb: lighthouse?.ttfb ?? null, tti: lighthouse?.tti ?? null, tbt: lighthouse?.tbt ?? null, si: lighthouse?.si ?? null },
    issues,
    score,
  }
}

// ── Quick API-Only Audit ─────────────────────────────────────────

export async function runQuickApiAudit(
  baseUrl: string = 'http://localhost:3000',
  endpoints: string[] = API_ENDPOINTS_TO_MEASURE,
): Promise<Pick<PerformanceAuditResult, 'endpointTimings' | 'timestamp' | 'durationMs'>> {
  const startTime = Date.now()
  const endpointTimings = await Promise.all(endpoints.map(r => measureEndpoint(baseUrl, r)))
  return { endpointTimings, timestamp: new Date().toISOString(), durationMs: Date.now() - startTime }
}
