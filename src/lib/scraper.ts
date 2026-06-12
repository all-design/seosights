/**
 * Scraper — "Scrape Once, Read Many" Architecture
 *
 * Core of the memory optimization strategy:
 *   1. Scrape the website ONCE, clean the HTML, produce a structured JSON object.
 *   2. Cache that object (in-memory / Redis) so all 8 AI agents read from it.
 *   3. Each agent only receives the context sections it needs via getAgentSpecificContext(),
 *      reducing input tokens by up to 70%.
 *
 * This is the single source of truth for site data. No agent should ever
 * call page_reader or web_search on its own — everything flows through here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScrapedSharedContext {
  meta_data: {
    title: string
    description: string
    robots_txt: string
    llms_txt_exists: boolean
    url: string
    domain: string
  }
  raw_text_content: string // Clean text, max 6000 chars
  structured_elements: {
    headings: Record<string, string[]> // { "h1": [...], "h2": [...] }
    links: string[]
    schema_markup: {
      has_faq: boolean
      has_organization: boolean
      has_article: boolean
      has_product: boolean
      has_local_business: boolean
      detected_types: string[] // All @type values found
    }
  }
  // Additional context for agents (not from HTML but from search APIs)
  search_context: {
    competitor_results: Array<{
      name?: string
      url?: string
      snippet?: string
      host_name?: string
    }>
    ai_citation_results: Array<{
      name?: string
      url?: string
      snippet?: string
      host_name?: string
    }>
    local_seo_results: Array<{
      name?: string
      url?: string
      snippet?: string
      host_name?: string
    }>
  }
  html_structure: string // Condensed heading/meta summary for backward compat
  scraped_at: number // Date.now()
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Context Focus — Maps agent IDs to the sections they need
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps agent IDs to the context section keys they need.
 * This is the KEY optimization — Content Architect gets only raw_text_content
 * (not schema_markup), Tech & Schema gets only structured_elements (not full text).
 *
 * Reduces input tokens by up to 70% compared to sending the full context to every agent.
 */
export const AGENT_CONTEXT_FOCUS: Record<string, string[]> = {
  'master-director': [
    'meta_data',
    'raw_text_content',
    'structured_elements',
    'search_context',
  ],
  'keyword-researcher': ['meta_data', 'raw_text_content', 'search_context'],
  'competitor-analyst': ['meta_data', 'search_context'],
  'content-architect': ['raw_text_content', 'structured_elements'],
  'on-page-auditor': ['meta_data', 'structured_elements'],
  'link-strategist': ['structured_elements', 'search_context'],
  'tech-schema-auditor': ['structured_elements', 'meta_data'],
  'backlink-prospector': ['search_context', 'meta_data'],
}

/**
 * Returns only the sections a specific agent needs from the full context.
 * This is the core of the "Scrape Once, Read Many" token optimization.
 *
 * Example:
 *   - Content Architect receives only `raw_text_content` + `structured_elements`
 *   - Tech & Schema receives only `structured_elements` + `meta_data`
 *   - Backlink Prospector receives only `search_context` + `meta_data`
 *
 * Always includes `scraped_at` so agents know the data freshness.
 */
export function getAgentSpecificContext(
  fullContext: ScrapedSharedContext,
  agentId: string
): Record<string, unknown> {
  const focusAreas = AGENT_CONTEXT_FOCUS[agentId]

  // If the agent isn't in the map, return everything (safe fallback)
  if (!focusAreas || focusAreas.length === 0) {
    return { ...fullContext }
  }

  const filtered: Record<string, unknown> = {
    scraped_at: fullContext.scraped_at,
  }

  for (const key of focusAreas) {
    if (key in fullContext) {
      filtered[key] = fullContext[key as keyof ScrapedSharedContext]
    }
  }

  return filtered
}

// ─────────────────────────────────────────────────────────────────────────────
// Retry + Timeout Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2
const BASE_DELAY_MS = 2500 // 2.5s base, jittered up to ~3s
const PAGE_READER_TIMEOUT_MS = 15_000
const WEB_SEARCH_TIMEOUT_MS = 12_000

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay with jitter.
 * delay = baseDelay * 2^attempt + random(0, 500)
 */
function backoffDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt)
  const jitter = Math.random() * 500
  return exponential + jitter
}

/**
 * Invoke an SDK function with retry logic and timeout.
 *
 * - Retries up to MAX_RETRIES times on failure
 * - Implements exponential backoff between retries
 * - Enforces a timeout via AbortController pattern
 * - Returns null on total failure (never throws)
 */
async function invokeWithRetry(
  zai: { functions: { invoke: (fn: string, opts: unknown) => Promise<unknown> } },
  fnName: string,
  opts: unknown,
  timeoutMs: number
): Promise<unknown> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await Promise.race([
        zai.functions.invoke(fnName, opts),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout: ${fnName} exceeded ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ])
      return result
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES
      if (isLastAttempt) {
        console.warn(
          `[scraper] ${fnName} failed after ${MAX_RETRIES + 1} attempts:`,
          err instanceof Error ? err.message : String(err)
        )
        return null
      }

      const delay = backoffDelay(attempt)
      console.warn(
        `[scraper] ${fnName} attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`,
        err instanceof Error ? err.message : String(err)
      )
      await sleep(delay)
    }
  }

  return null // Unreachable, but satisfies TypeScript
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Processing Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove noise elements from HTML: <script>, <style>, <nav>, <footer>, <header>.
 * These are not useful for content analysis and waste tokens.
 */
function removeNoiseTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
}

/**
 * Strip all remaining HTML tags, leaving only text content.
 * Collapses whitespace and trims the result.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract headings from raw HTML using regex.
 * Returns a Record mapping heading level ("h1", "h2", etc.) to an array of heading texts.
 */
function extractHeadings(html: string): Record<string, string[]> {
  const headings: Record<string, string[]> = {}
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(html)) !== null) {
    const level = `h${match[1]}`
    const text = stripHtmlTags(match[2]).trim()
    if (text.length === 0) continue

    if (!headings[level]) {
      headings[level] = []
    }
    // Cap each heading text at 200 chars and limit to 20 headings per level
    if (headings[level].length < 20) {
      headings[level].push(text.slice(0, 200))
    }
  }

  return headings
}

/**
 * Extract meta description from HTML.
 * Looks for <meta name="description" content="...">.
 */
function extractMetaDescription(html: string): string {
  const metaRegex = /<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']*)["'][^>]*>/i
  const metaRegexAlt = /<meta[^>]+content\s*=\s*["']([^"']*)["'][^>]+name\s*=\s*["']description["'][^>]*>/i

  const match = html.match(metaRegex) || html.match(metaRegexAlt)
  return match ? match[1].trim().slice(0, 500) : ''
}

/**
 * Extract the page title from HTML.
 * Looks for <title>...</title>.
 */
function extractTitle(html: string): string {
  const titleRegex = /<title[^>]*>(.*?)<\/title>/i
  const match = html.match(titleRegex)
  return match ? stripHtmlTags(match[1]).trim().slice(0, 300) : ''
}

/**
 * Extract links from <a href="..."> tags.
 * Returns an array of absolute or relative URLs, deduplicated, max 50.
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"'#]+)["'][^>]*>/gi
  const links: Set<string> = new Set()

  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim()
    if (href.length === 0 || href.startsWith('javascript:') || href.startsWith('mailto:')) continue

    // Resolve relative URLs
    try {
      const resolved = new URL(href, baseUrl).href
      links.add(resolved)
    } catch {
      // Keep the raw href if URL resolution fails
      links.add(href)
    }

    if (links.size >= 50) break
  }

  return Array.from(links)
}

/**
 * Detect JSON-LD schema markup in the HTML.
 * Parses <script type="application/ld+json"> blocks and extracts @type values.
 */
function detectSchemaMarkup(html: string): ScrapedSharedContext['structured_elements']['schema_markup'] {
  const schemaBlockRegex = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const detectedTypes: string[] = []

  let match: RegExpExecArray | null
  while ((match = schemaBlockRegex.exec(html)) !== null) {
    try {
      const jsonStr = match[1].trim()
      if (!jsonStr) continue

      const parsed = JSON.parse(jsonStr)
      extractSchemaTypes(parsed, detectedTypes)
    } catch {
      // Malformed JSON-LD — skip silently
    }
  }

  // Deduplicate
  const uniqueTypes = [...new Set(detectedTypes)]

  return {
    has_faq: uniqueTypes.some((t) => t === 'FAQPage' || t === 'faq'),
    has_organization: uniqueTypes.some(
      (t) => t === 'Organization' || t === 'organization'
    ),
    has_article: uniqueTypes.some(
      (t) => t === 'Article' || t === 'article' || t === 'NewsArticle' || t === 'BlogPosting'
    ),
    has_product: uniqueTypes.some((t) => t === 'Product' || t === 'product'),
    has_local_business: uniqueTypes.some(
      (t) =>
        t === 'LocalBusiness' ||
        t === 'localBusiness' ||
        t === 'Store' ||
        t === 'Restaurant' ||
        t === 'MedicalBusiness' ||
        t === 'Dentist' ||
        t === 'AutoDealer'
    ),
    detected_types: uniqueTypes,
  }
}

/**
 * Recursively extract @type values from a parsed JSON-LD object.
 * Handles arrays, nested @graph, and single objects.
 */
function extractSchemaTypes(obj: unknown, out: string[]): void {
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractSchemaTypes(item, out)
    }
    return
  }

  const record = obj as Record<string, unknown>

  // Handle @graph (container for multiple schema objects)
  if (record['@graph'] && Array.isArray(record['@graph'])) {
    for (const item of record['@graph'] as unknown[]) {
      extractSchemaTypes(item, out)
    }
  }

  // Extract @type — can be string or array of strings
  if (record['@type']) {
    if (typeof record['@type'] === 'string') {
      out.push(record['@type'])
    } else if (Array.isArray(record['@type'])) {
      for (const t of record['@type']) {
        if (typeof t === 'string') out.push(t)
      }
    }
  }
}

/**
 * Build a condensed HTML structure summary for backward compatibility.
 * Includes heading outline + meta tags in a compact string.
 */
function buildHtmlStructureSummary(
  headings: Record<string, string[]>,
  metaDescription: string,
  title: string
): string {
  const parts: string[] = []

  if (title) {
    parts.push(`TITLE: ${title}`)
  }
  if (metaDescription) {
    parts.push(`META DESC: ${metaDescription.slice(0, 200)}`)
  }

  // Build heading outline
  const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  for (const level of headingLevels) {
    const texts = headings[level]
    if (texts && texts.length > 0) {
      const indent = '  '.repeat(parseInt(level[1]) - 1)
      for (const text of texts) {
        parts.push(`${indent}<${level}> ${text}`)
      }
    }
  }

  return parts.join('\n').slice(0, 3000)
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Data Collection
// ─────────────────────────────────────────────────────────────────────────────

type SearchResultItem = {
  name?: string
  url?: string
  snippet?: string
  host_name?: string
}

/**
 * Normalize search results from the web_search SDK function.
 * The SDK returns various shapes — this safely extracts what we need.
 */
function normalizeSearchResults(raw: unknown): SearchResultItem[] {
  if (!raw) return []

  const data = (raw as Record<string, unknown>)?.data || raw

  // If it's an array, map directly
  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return {}
      const d = item as Record<string, unknown>
      return {
        name: typeof d.name === 'string' ? d.name.slice(0, 200) : undefined,
        url: typeof d.url === 'string' ? d.url.slice(0, 500) : undefined,
        snippet: typeof d.snippet === 'string' ? d.snippet.slice(0, 300) : undefined,
        host_name: typeof d.host_name === 'string' ? d.host_name.slice(0, 200) : undefined,
      }
    })
  }

  // If it has a results array
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const results = d.results || d.organic_results || d.items
    if (Array.isArray(results)) {
      return results.slice(0, 10).map((item: unknown) => {
        if (typeof item !== 'object' || item === null) return {}
        const r = item as Record<string, unknown>
        return {
          name: typeof (r.name || r.title) === 'string' ? String(r.name || r.title).slice(0, 200) : undefined,
          url: typeof (r.url || r.link) === 'string' ? String(r.url || r.link).slice(0, 500) : undefined,
          snippet: typeof (r.snippet || r.description) === 'string' ? String(r.snippet || r.description).slice(0, 300) : undefined,
          host_name: typeof r.host_name === 'string' ? r.host_name.slice(0, 200) : undefined,
        }
      })
    }
  }

  return []
}

/**
 * Fetch search data (competitors, AI citations, local SEO) in parallel.
 * Each search call uses retry logic and timeouts.
 * Returns empty arrays on failure — never throws.
 */
async function fetchSearchContext(
  zai: { functions: { invoke: (fn: string, opts: unknown) => Promise<unknown> } },
  domain: string,
  url: string,
  targetMarket: string
): Promise<ScrapedSharedContext['search_context']> {
  const [competitorResults, aiCitationResults, localSeoResults] = await Promise.all([
    // Competitor search — find who ranks for the same domain/keywords
    invokeWithRetry(
      zai,
      'web_search',
      { query: `site:${domain} OR "${domain}" competitors SEO analysis` },
      WEB_SEARCH_TIMEOUT_MS
    ).then(normalizeSearchResults),

    // AI citation search — find where AI engines cite or mention this domain
    invokeWithRetry(
      zai,
      'web_search',
      { query: `"${domain}" AI citation ChatGPT Perplexity mention` },
      WEB_SEARCH_TIMEOUT_MS
    ).then(normalizeSearchResults),

    // Local SEO search — only when target market is not Global
    targetMarket !== 'Global'
      ? invokeWithRetry(
          zai,
          'web_search',
          { query: `"${domain}" local SEO ${targetMarket} business directory` },
          WEB_SEARCH_TIMEOUT_MS
        ).then(normalizeSearchResults)
      : Promise.resolve([]),
  ])

  return {
    competitor_results: competitorResults,
    ai_citation_results: aiCitationResults,
    local_seo_results: localSeoResults,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Function: scrapeAndCleanWebsite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scrape a website ONCE, clean the HTML, and produce a structured JSON object
 * that gets cached for all 8 AI agents to read from.
 *
 * This is the core of the "Scrape Once, Read Many" architecture:
 *   - One page_reader call fetches the HTML
 *   - HTML is cleaned (remove nav, scripts, CSS, footer, header)
 *   - Structured data is extracted (headings, links, schema, meta)
 *   - Search context is gathered (competitors, AI citations, local SEO)
 *   - Result is a ScrapedSharedContext that gets cached in Redis/memory
 *
 * Resilient by design: if any step fails, it continues with defaults
 * rather than throwing. The agents will still get partial context rather
 * than no context at all.
 *
 * @param url - The full URL to scrape (e.g. "https://seosights.com")
 * @param zai - The z-ai-web-dev-sdk instance with functions.invoke
 * @param options - Optional: includeSearchData (default true), targetMarket (default "Global")
 * @returns ScrapedSharedContext — the structured, cleaned site data
 */
export async function scrapeAndCleanWebsite(
  url: string,
  zai: { functions: { invoke: (fn: string, opts: unknown) => Promise<unknown> } },
  options?: { includeSearchData?: boolean; targetMarket?: string }
): Promise<ScrapedSharedContext> {
  const includeSearchData = options?.includeSearchData !== false // default true
  const targetMarket = options?.targetMarket || 'Global'

  // Parse URL for origin/domain
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    // If the URL is invalid, try prepending https://
    try {
      parsedUrl = new URL(`https://${url}`)
    } catch {
      // Completely invalid URL — return minimal context
      console.warn(`[scraper] Invalid URL: ${url}`)
      return {
        meta_data: {
          title: url,
          description: '',
          robots_txt: '',
          llms_txt_exists: false,
          url,
          domain: url,
        },
        raw_text_content: '',
        structured_elements: {
          headings: {},
          links: [],
          schema_markup: {
            has_faq: false,
            has_organization: false,
            has_article: false,
            has_product: false,
            has_local_business: false,
            detected_types: [],
          },
        },
        search_context: {
          competitor_results: [],
          ai_citation_results: [],
          local_seo_results: [],
        },
        html_structure: '',
        scraped_at: Date.now(),
      }
    }
  }

  const domain = parsedUrl.hostname.replace(/^www\./, '')
  const origin = parsedUrl.origin

  // ── Step 1: Fetch the page ──────────────────────────────────────────────
  let rawHtml = ''
  let pageTitle = ''

  try {
    const pageResult = await invokeWithRetry(
      zai,
      'page_reader',
      { url },
      PAGE_READER_TIMEOUT_MS
    )

    if (pageResult) {
      const rawData = (pageResult as Record<string, unknown>)?.data || pageResult
      const data = rawData as Record<string, unknown>
      rawHtml = typeof data.html === 'string' ? data.html : ''
      pageTitle =
        typeof data.title === 'string'
          ? data.title
          : extractTitle(rawHtml)
    }
  } catch {
    // Continue with empty data
    console.warn(`[scraper] page_reader failed for ${url}`)
  }

  // If page_reader gave no HTML but we have a title, still proceed
  if (!rawHtml) {
    rawHtml = ''
  }

  // Extract title from HTML as fallback
  if (!pageTitle) {
    pageTitle = extractTitle(rawHtml) || domain
  }

  // ── Step 2: Extract meta description BEFORE cleaning ────────────────────
  const metaDescription = extractMetaDescription(rawHtml)

  // ── Step 3: Extract headings BEFORE cleaning (need raw HTML) ────────────
  const headings = extractHeadings(rawHtml)

  // ── Step 4: Extract links BEFORE cleaning ───────────────────────────────
  const links = extractLinks(rawHtml, url)

  // ── Step 5: Detect schema markup BEFORE cleaning ────────────────────────
  const schemaMarkup = detectSchemaMarkup(rawHtml)

  // ── Step 6: Clean HTML and extract text ──────────────────────────────────
  const cleanedHtml = removeNoiseTags(rawHtml)
  const rawTextContent = stripHtmlTags(cleanedHtml).slice(0, 6000) // Cap at 6000 chars

  // ── Step 7: Build HTML structure summary ─────────────────────────────────
  const htmlStructure = buildHtmlStructureSummary(headings, metaDescription, pageTitle)

  // ── Step 8: Fetch robots.txt ─────────────────────────────────────────────
  let robotsTxt = ''
  try {
    const robotsResult = await invokeWithRetry(
      zai,
      'page_reader',
      { url: `${origin}/robots.txt` },
      PAGE_READER_TIMEOUT_MS
    )

    if (robotsResult) {
      const rd = (robotsResult as Record<string, unknown>)?.data || robotsResult
      const data = rd as Record<string, unknown>
      const content = typeof data.html === 'string' ? data.html : typeof data.text === 'string' ? data.text : ''
      robotsTxt = stripHtmlTags(content).slice(0, 2000)
    }
  } catch {
    robotsTxt = ''
  }

  // ── Step 9: Check for llms.txt ───────────────────────────────────────────
  let llmsTxtExists = false
  try {
    const llmsResult = await invokeWithRetry(
      zai,
      'page_reader',
      { url: `${origin}/llms.txt` },
      PAGE_READER_TIMEOUT_MS
    )

    if (llmsResult) {
      const ld = (llmsResult as Record<string, unknown>)?.data || llmsResult
      const data = ld as Record<string, unknown>
      const content =
        typeof data.html === 'string'
          ? data.html
          : typeof data.text === 'string'
            ? data.text
            : ''
      const cleaned = stripHtmlTags(content).trim()
      llmsTxtExists = cleaned.length > 10
    }
  } catch {
    llmsTxtExists = false
  }

  // ── Step 10: Fetch search context (competitors, AI citations, local SEO) ─
  let searchContext: ScrapedSharedContext['search_context'] = {
    competitor_results: [],
    ai_citation_results: [],
    local_seo_results: [],
  }

  if (includeSearchData) {
    try {
      searchContext = await fetchSearchContext(zai, domain, url, targetMarket)
    } catch {
      // Continue with empty search context
      console.warn(`[scraper] Search context collection failed for ${domain}`)
    }
  }

  // ── Step 11: Assemble the final ScrapedSharedContext ─────────────────────
  const context: ScrapedSharedContext = {
    meta_data: {
      title: pageTitle.slice(0, 300),
      description: metaDescription.slice(0, 500),
      robots_txt: robotsTxt,
      llms_txt_exists: llmsTxtExists,
      url,
      domain,
    },
    raw_text_content: rawTextContent,
    structured_elements: {
      headings,
      links,
      schema_markup: schemaMarkup,
    },
    search_context: searchContext,
    html_structure: htmlStructure,
    scraped_at: Date.now(),
  }

  return context
}
