import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { AIBlogPost } from '../route'

export const dynamic = 'force-dynamic'

// ─── Helpers (duplicated from parent route for self-contained endpoint) ──

const PILLAR_CATEGORY_MAP: Record<string, { name: string; slug: string; description: string; color: string }> = {
  seo: { name: 'Technical SEO', slug: 'technical-seo', description: 'Crawlability, Core Web Vitals, indexing, and the technical foundation AI search needs.', color: 'text-blue-400' },
  aeo: { name: 'AEO & GEO Fundamentals', slug: 'aeo-geo-fundamentals', description: 'The core concepts behind Answer Engine Optimization and Generative Engine Optimization.', color: 'text-emerald-400' },
  geo: { name: 'Content Strategy for AI Search', slug: 'content-strategy-ai-search', description: 'Writing content that AI assistants want to quote and cite.', color: 'text-pink-400' },
  all: { name: 'AI Search News & Updates', slug: 'ai-search-news', description: 'What changed this month in ChatGPT, Claude, Perplexity, and Google AI Overviews.', color: 'text-rose-400' },
}

const AI_GRADIENTS = [
  'from-emerald-600 via-teal-500 to-cyan-500',
  'from-teal-600 via-emerald-500 to-green-500',
  'from-cyan-600 via-teal-500 to-emerald-500',
  'from-emerald-700 via-teal-600 to-cyan-600',
]

const AI_EMOJIS = ['🤖', '🧠', '⚡', '🔮', '✨', '🪄']

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function deriveSlug(title: string, existingSlug?: string | null): string {
  if (existingSlug) return existingSlug
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── Main handler ────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try to find by explicit slug first, then by title-derived slug
    const article = await db.contentArticle.findFirst({
      where: {
        status: 'published',
        format: 'blog',
        domain: 'seosights.com',
        slug: slug,
      },
      include: { brief: true },
    })

    // Fallback: find by title-derived slug match
    const fallbackArticle = !article
      ? await db.contentArticle.findFirst({
          where: {
            status: 'published',
            format: 'blog',
            domain: 'seosights.com',
          },
          include: { brief: true },
        })
      : null

    const matched = article || (fallbackArticle && deriveSlug(fallbackArticle.title, fallbackArticle.slug) === slug ? fallbackArticle : null)

    if (!matched) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const meta = parseMetadata(matched.metadata)
    const briefMeta = parseMetadata(matched.brief?.briefContent ?? null)
    const description = (meta.metaDescription as string) || (meta.description as string) || matched.title
    const excerpt = (meta.excerpt as string) || (briefMeta.excerpt as string) || description.slice(0, 180) + '…'
    const category = PILLAR_CATEGORY_MAP[matched.pillar] || PILLAR_CATEGORY_MAP.geo
    const keywords = (meta.keywords as string[]) || [matched.brief?.keywordTarget || matched.pillar]
    const tags = (meta.tags as string[]) || keywords.slice(0, 5)
    const keyTakeaways = (meta.keyTakeaways as string[]) || []
    const readingTime = Math.max(1, Math.round(matched.wordCount / 200))

    // Use published articles list to determine gradient/emoji index
    const publishedArticles = await db.contentArticle.findMany({
      where: { status: 'published', format: 'blog', domain: 'seosights.com' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    })
    const index = publishedArticles.findIndex((a) => a.id === matched.id)
    const safeIndex = index >= 0 ? index : 0

    const mapped: AIBlogPost = {
      slug: deriveSlug(matched.title, matched.slug),
      title: matched.title,
      description,
      excerpt,
      category,
      tags,
      author: 'seosights AI',
      authorRole: 'AI Content Engine',
      publishedAt: matched.publishedAt?.toISOString() || matched.createdAt.toISOString(),
      updatedAt: matched.updatedAt.toISOString(),
      readingTime,
      metaTitle: (meta.metaTitle as string) || `${matched.title} | seosights`,
      metaDescription: description,
      keywords,
      heroGradient: AI_GRADIENTS[safeIndex % AI_GRADIENTS.length],
      heroEmoji: AI_EMOJIS[safeIndex % AI_EMOJIS.length],
      contentHtml: matched.content || undefined,
      content: undefined,
      keyTakeaways,
      isAiGenerated: true as const,
    }

    return NextResponse.json({ post: mapped })
  } catch (err) {
    console.error('[public/blog-posts/[slug]] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
