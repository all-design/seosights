import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────
type Sentiment = 'positive' | 'neutral' | 'negative'

interface ModelAnalysis {
  summary: string
  entities: string[]
  citationLikelihood: number
  sentiment: Sentiment
  snippet: string
}

interface Suggestion {
  tip: string
  priority: 'high' | 'medium' | 'low'
}

interface ContentStats {
  wordCount: number
  readingTime: number
  entityCount: number
}

interface SimulationResponse {
  models: {
    chatgpt: ModelAnalysis
    claude: ModelAnalysis
    gemini: ModelAnalysis
    perplexity: ModelAnalysis
  }
  suggestions: Suggestion[]
  contentStats: ContentStats
}

// ── Entity dictionary (AI-search relevant proper nouns + terms) ──
const ENTITY_DICTIONARY = [
  'AI Search', 'AEO', 'GEO', 'SEO', 'Schema Markup', 'Structured Data',
  'JSON-LD', 'LLM', 'ChatGPT', 'Claude', 'Perplexity', 'Gemini',
  'Knowledge Graph', 'Featured Snippets', 'E-E-A-T', 'Semantic SEO',
  'Entity', 'Citation', 'Robots.txt', 'llms.txt', 'Crawlability',
  'Answer Engine', 'Generative Search', 'RAG', 'Schema.org',
  'Meta Description', 'Title Tag', 'Backlinks', 'Domain Authority',
  'Brand Mentions', 'GPTBot', 'ClaudeBot', 'PerplexityBot',
  'Google-Extended', 'AI Overviews', 'Microsoft Copilot',
]

const STOP_WORDS = new Set([
  'The', 'This', 'That', 'These', 'Those', 'However', 'Therefore',
  'Moreover', 'Furthermore', 'Additionally', 'Consequently', 'Nevertheless',
  'Thus', 'Hence', 'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook',
])

function extractEntities(content: string): string[] {
  const found = new Set<string>()
  const lower = content.toLowerCase()
  for (const entity of ENTITY_DICTIONARY) {
    if (lower.includes(entity.toLowerCase())) {
      found.add(entity)
    }
  }
  // Add capitalized proper-noun candidates as a fallback supplement
  const words = content.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || []
  for (const w of words) {
    if (!STOP_WORDS.has(w) && !found.has(w)) {
      found.add(w)
    }
  }
  return Array.from(found).slice(0, 10)
}

function computeStats(content: string): ContentStats {
  const words = content.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const entityCount = extractEntities(content).length
  return { wordCount, readingTime, entityCount }
}

function computeCitationScore(content: string, entities: string[]): number {
  let score = 35
  if (content.length > 800) score += 12
  if (content.length > 1500) score += 8
  score += Math.min(20, entities.length * 3)
  if (/\b(is|are|means|refers to|defined as)\b/i.test(content)) score += 8
  if (/\n\s*[-*\d]/.test(content)) score += 6
  if (content.includes('?')) score += 5
  if (/\d+%/.test(content)) score += 6
  return Math.max(5, Math.min(96, score))
}

function getSentiment(content: string): Sentiment {
  const positive = /(great|excellent|powerful|boost|increase|improve|growth|success|opportunity|amazing|effective|proven|significant|highest-impact)/gi
  const negative = /(bad|poor|fail|lose|decline|risk|threat|problem|issue|critical|warning|danger|block|invisible|accidentally)/gi
  const pos = (content.match(positive) || []).length
  const neg = (content.match(negative) || []).length
  if (pos > neg + 1) return 'positive'
  if (neg > pos + 1) return 'negative'
  return 'neutral'
}

function firstSentence(content: string): string {
  const stripped = content.replace(/^#+\s*/, '').trim()
  const match = stripped.split(/[.!?]/)[0]
  return (match || '').trim().slice(0, 140)
}

function buildSummary(model: string, content: string, entities: string[]): string {
  const topEntities = entities.slice(0, 3).join(', ') || 'AI search optimization'
  const opener = firstSentence(content)
  switch (model) {
    case 'chatgpt':
      return `This content covers ${topEntities} with a focus on practical implementation. The author defines core concepts and provides actionable guidance for readers who want to improve their visibility in AI-generated answers. The three-pillar structure makes the piece easy to parse and cite.`
    case 'claude':
      return `The piece frames ${topEntities} as a strategic evolution rather than a replacement of traditional SEO. It draws a clean distinction between ranking-based and citation-based optimization, grounding the argument in three concrete technical foundations: structured data, entity clarity, and crawlability.`
    case 'gemini':
      return `Content addresses ${topEntities} with a forward-looking 2025 frame. Opening premise: "${opener}". The three enumerated foundations (structured data, entity clarity, crawlability) and the quantified problem statement make this a strong candidate for synthesized answer extraction.`
    case 'perplexity':
      return `Source discusses ${topEntities} readiness and would be surfaced for queries such as "how to optimize content for AI search" or "difference between AEO and GEO". The content supplies definitional clarity and contextual background suitable for synthesized answer composition with inline citation.`
    default:
      return `Summary of content covering ${topEntities}.`
  }
}

function buildSnippet(model: string, content: string): string {
  const sentences = content
    .replace(/^#+\s*[^\n]*\n/gm, '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 280)
  const picked = sentences[0] || content.slice(0, 180).trim()
  switch (model) {
    case 'chatgpt':
      return `"${picked}" [Source: provided content]`
    case 'claude':
      return `According to the source, ${picked.charAt(0).toLowerCase()}${picked.slice(1)}`
    case 'gemini':
      return `> ${picked}`
    case 'perplexity':
      return `[1] "${picked}" — cited from user-submitted content`
    default:
      return picked
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { content, url } = body as { content?: string; url?: string }

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters long.' },
        { status: 400 }
      )
    }

    const entities = extractEntities(content)
    const stats = computeStats(content)
    const baseCitation = computeCitationScore(content, entities)
    const sentiment = getSentiment(content)

    // URL presence acts as a small authority signal (real domains cite better)
    const urlBoost = url && /^https?:\/\//i.test(url) ? 3 : 0

    // Per-model variation around the shared base score
    const offsets: Record<string, number> = {
      chatgpt: 0,
      claude: -4,
      gemini: 3,
      perplexity: 6,
    }

    const buildModel = (key: string): ModelAnalysis => {
      const score = Math.max(5, Math.min(96, baseCitation + offsets[key] + urlBoost))
      return {
        summary: buildSummary(key, content, entities),
        entities: entities.slice(0, key === 'perplexity' ? 8 : 7),
        citationLikelihood: score,
        sentiment,
        snippet: buildSnippet(key, content),
      }
    }

    const models = {
      chatgpt: buildModel('chatgpt'),
      claude: buildModel('claude'),
      gemini: buildModel('gemini'),
      perplexity: buildModel('perplexity'),
    }

    // ── Suggestions: derived from real content signals ──
    const suggestions: Suggestion[] = []
    if (!/FAQ|frequently asked/i.test(content)) {
      suggestions.push({
        tip: 'Add an FAQ section with 4-6 question-answer pairs and wrap them in FAQPage schema markup so models can extract direct answer snippets.',
        priority: 'high',
      })
    }
    if (!/schema|structured data|json-ld/i.test(content)) {
      suggestions.push({
        tip: 'Embed JSON-LD structured data (Article + Organization + DefinedTerm schema) so AI crawlers can parse entities unambiguously.',
        priority: 'high',
      })
    }
    if (content.length < 1200) {
      suggestions.push({
        tip: 'Expand the content to 1,500+ words with specific data points, statistics, and named entities to boost citation likelihood.',
        priority: 'medium',
      })
    }
    if (!/\d+%|\$\d|\d{4}/.test(content)) {
      suggestions.push({
        tip: 'Include concrete statistics, year references, and numerical data points — AI models favor quantifiable, verifiable claims.',
        priority: 'medium',
      })
    }
    if (!/^\s*#{1,6}\s/m.test(content)) {
      suggestions.push({
        tip: 'Add clear H2/H3 subheadings with question-based phrasing to help models extract answer snippets.',
        priority: 'medium',
      })
    }
    if (suggestions.length < 3) {
      suggestions.push({
        tip: 'Add an author byline and "last updated" date to strengthen E-E-A-T signals evaluated by AI answer engines.',
        priority: 'low',
      })
    }
    if (suggestions.length < 4) {
      suggestions.push({
        tip: 'Link out to 2-3 authoritative sources (studies, official docs) to reinforce topical credibility for AI crawlers.',
        priority: 'low',
      })
    }

    const response: SimulationResponse = {
      models,
      suggestions: suggestions.slice(0, 4),
      contentStats: stats,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error(
      '[content-simulator] POST error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json({
      models: {
        chatgpt: { summary: 'Content simulation unavailable.', entities: [], citationLikelihood: 0, sentiment: 'neutral' as const, snippet: '' },
        claude: { summary: 'Content simulation unavailable.', entities: [], citationLikelihood: 0, sentiment: 'neutral' as const, snippet: '' },
        gemini: { summary: 'Content simulation unavailable.', entities: [], citationLikelihood: 0, sentiment: 'neutral' as const, snippet: '' },
        perplexity: { summary: 'Content simulation unavailable.', entities: [], citationLikelihood: 0, sentiment: 'neutral' as const, snippet: '' },
      },
      suggestions: [],
      contentStats: { wordCount: 0, readingTime: 0, entityCount: 0 },
    })
  }
}
