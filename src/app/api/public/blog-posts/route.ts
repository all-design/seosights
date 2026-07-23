import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── Type definitions ────────────────────────────────────────────────

export interface AIBlogPost {
  slug: string
  title: string
  description: string
  excerpt: string
  category: {
    name: string
    slug: string
    description: string
    color: string
  }
  tags: string[]
  author: string
  authorRole: string
  publishedAt: string
  updatedAt?: string
  readingTime: number
  metaTitle: string
  metaDescription: string
  keywords: string[]
  heroGradient: string
  heroEmoji: string
  contentHtml?: string // AI articles use raw HTML instead of structured sections
  content?: { heading: string; body: string; bullets?: string[] }[]
  keyTakeaways: string[]
  isAiGenerated: true // discriminant
}

// ─── Pillar → Category mapping ──────────────────────────────────────

const PILLAR_CATEGORY_MAP: Record<string, { name: string; slug: string; description: string; color: string }> = {
  seo: {
    name: 'Technical SEO',
    slug: 'technical-seo',
    description: 'Crawlability, Core Web Vitals, indexing, and the technical foundation AI search needs.',
    color: 'text-blue-400',
  },
  aeo: {
    name: 'AEO & GEO Fundamentals',
    slug: 'aeo-geo-fundamentals',
    description: 'The core concepts behind Answer Engine Optimization and Generative Engine Optimization.',
    color: 'text-emerald-400',
  },
  geo: {
    name: 'Content Strategy for AI Search',
    slug: 'content-strategy-ai-search',
    description: 'Writing content that AI assistants want to quote and cite.',
    color: 'text-pink-400',
  },
  all: {
    name: 'AI Search News & Updates',
    slug: 'ai-search-news',
    description: 'What changed this month in ChatGPT, Claude, Perplexity, and Google AI Overviews.',
    color: 'text-rose-400',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────

const AI_GRADIENTS = [
  'from-emerald-600 via-teal-500 to-cyan-500',
  'from-teal-600 via-emerald-500 to-green-500',
  'from-cyan-600 via-teal-500 to-emerald-500',
  'from-emerald-700 via-teal-600 to-cyan-600',
]

const AI_EMOJIS = ['🤖', '🧠', '⚡', '🔮', '✨', '🪄']

function pickGradient(index: number): string {
  return AI_GRADIENTS[index % AI_GRADIENTS.length]
}

function pickEmoji(index: number): string {
  return AI_EMOJIS[index % AI_EMOJIS.length]
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function deriveSlug(title: string, existingSlug?: string | null): string {
  if (existingSlug) return existingSlug
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Main handler ────────────────────────────────────────────────────

export async function GET() {
  try {
    const articles = await db.contentArticle.findMany({
      where: {
        status: 'published',
        format: 'blog',
        domain: 'seosights.com',
      },
      orderBy: { publishedAt: 'desc' },
      include: { brief: true },
    })

    const mapped: AIBlogPost[] = articles.map((article, i) => {
      const meta = parseMetadata(article.metadata)
      const briefMeta = parseMetadata(article.brief?.briefContent ?? null)

      const slug = deriveSlug(article.title, article.slug)
      const description =
        (meta.metaDescription as string) ||
        (meta.description as string) ||
        article.title
      const excerpt =
        (meta.excerpt as string) ||
        (briefMeta.excerpt as string) ||
        description.slice(0, 180) + '…'
      const category = PILLAR_CATEGORY_MAP[article.pillar] || PILLAR_CATEGORY_MAP.geo
      const keywords = (meta.keywords as string[]) || [article.brief?.keywordTarget || article.pillar]
      const tags = (meta.tags as string[]) || keywords.slice(0, 5)
      const keyTakeaways = (meta.keyTakeaways as string[]) || []
      const readingTime = Math.max(1, Math.round(article.wordCount / 200))

      return {
        slug,
        title: article.title,
        description,
        excerpt,
        category,
        tags,
        author: 'seosights AI',
        authorRole: 'AI Content Engine',
        publishedAt: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        readingTime,
        metaTitle: (meta.metaTitle as string) || `${article.title} | seosights`,
        metaDescription: description,
        keywords,
        heroGradient: pickGradient(i),
        heroEmoji: pickEmoji(i),
        contentHtml: article.content || undefined,
        content: undefined, // AI articles use contentHtml, not structured sections
        keyTakeaways,
        isAiGenerated: true as const,
      }
    })

    return NextResponse.json({ posts: mapped })
  } catch (err) {
    console.error('[public/blog-posts] Error fetching articles:', err)
    return NextResponse.json({ posts: [], error: 'Failed to fetch articles' }, { status: 500 })
  }
}
