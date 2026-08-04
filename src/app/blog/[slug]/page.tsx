import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, getPostBySlug, getRelatedPosts, blogCategories } from '@/data/blog-posts'
import { ChevronRight } from 'lucide-react'
import BlogPostClient from './blog-post-client'
import type { AIBlogPost, UnifiedBlogPost } from '@/data/blog-types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL ? 'https://seosights.com' : 'http://localhost:3000')

// Allow dynamic params for AI-generated slugs that aren't pre-rendered
export const dynamicParams = true

export async function generateStaticParams() {
  // Only static posts are pre-rendered; AI posts are resolved at request time
  return blogPosts.map((p) => ({ slug: p.slug }))
}

// ─── Fetch an AI-generated article by slug ────────────────────────────
async function fetchAIPost(slug: string): Promise<AIBlogPost | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/public/blog-posts/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.post || null
  } catch {
    return null
  }
}

// ─── Metadata generation ──────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  // Check static posts first
  const staticPost = getPostBySlug(slug)
  if (staticPost) {
    return {
      title: staticPost.metaTitle,
      description: staticPost.metaDescription,
      keywords: staticPost.keywords,
      alternates: { canonical: `/blog/${staticPost.slug}` },
      openGraph: {
        title: staticPost.metaTitle,
        description: staticPost.metaDescription,
        url: `${SITE_URL}/blog/${staticPost.slug}`,
        type: 'article',
        publishedTime: staticPost.publishedAt,
        modifiedTime: staticPost.updatedAt || staticPost.publishedAt,
        authors: [staticPost.author],
        tags: staticPost.tags,
        images: [{ url: '/og-image.png', width: 1344, height: 768, alt: staticPost.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: staticPost.metaTitle,
        description: staticPost.metaDescription,
        images: ['/og-image.png'],
      },
    }
  }

  // Try AI post
  const aiPost = await fetchAIPost(slug)
  if (aiPost) {
    return {
      title: aiPost.metaTitle,
      description: aiPost.metaDescription,
      keywords: aiPost.keywords,
      alternates: { canonical: `/blog/${aiPost.slug}` },
      openGraph: {
        title: aiPost.metaTitle,
        description: aiPost.metaDescription,
        url: `${SITE_URL}/blog/${aiPost.slug}`,
        type: 'article',
        publishedTime: aiPost.publishedAt,
        modifiedTime: aiPost.updatedAt || aiPost.publishedAt,
        authors: [aiPost.author],
        tags: aiPost.tags,
        images: [{ url: '/og-image.png', width: 1344, height: 768, alt: aiPost.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: aiPost.metaTitle,
        description: aiPost.metaDescription,
        images: ['/og-image.png'],
      },
    }
  }

  return { title: 'Post not found' }
}

// ─── Page component ────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // 1. Check static posts
  const staticPost = getPostBySlug(slug)
  if (staticPost) {
    const related = getRelatedPosts(slug, 3)

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: staticPost.title,
      description: staticPost.description,
      url: `${SITE_URL}/blog/${staticPost.slug}`,
      datePublished: staticPost.publishedAt,
      dateModified: staticPost.updatedAt || staticPost.publishedAt,
      author: { '@type': 'Organization', name: staticPost.author },
      publisher: {
        '@type': 'Organization',
        name: 'seosights',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-transparent.png` },
      },
      keywords: staticPost.keywords.join(', '),
      articleSection: staticPost.category.name,
      wordCount: staticPost.content.reduce((acc, s) => acc + s.body.split(/\s+/).length + (s.bullets?.length || 0) * 10, 0),
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${staticPost.slug}` },
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: staticPost.title, item: `${SITE_URL}/blog/${staticPost.slug}` },
      ],
    }

    const unifiedPost: UnifiedBlogPost = { ...staticPost, isAiGenerated: false }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        <BlogPostClient post={unifiedPost} related={related.map((r) => ({ ...r, isAiGenerated: false as const }))} />

        {/* Hidden semantic breadcrumb */}
        <nav aria-label="Breadcrumb" className="sr-only">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li>
              <span aria-current="page">{staticPost.title}</span>
              <ChevronRight className="inline w-3 h-3" aria-hidden="true" />
            </li>
          </ol>
        </nav>
      </>
    )
  }

  // 2. Try AI-generated post from database
  const aiPost = await fetchAIPost(slug)
  if (aiPost) {
    // Find related posts: prefer same category from static posts, then same from AI posts
    const staticRelated = blogPosts
      .filter((p) => p.category.slug === aiPost.category.slug)
      .slice(0, 3)
      .map((p) => ({ ...p, isAiGenerated: false as const }))

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: aiPost.title,
      description: aiPost.description,
      url: `${SITE_URL}/blog/${aiPost.slug}`,
      datePublished: aiPost.publishedAt,
      dateModified: aiPost.updatedAt || aiPost.publishedAt,
      author: { '@type': 'Organization', name: 'seosights AI' },
      publisher: {
        '@type': 'Organization',
        name: 'seosights',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-transparent.png` },
      },
      keywords: aiPost.keywords.join(', '),
      articleSection: aiPost.category.name,
      wordCount: aiPost.readingTime * 200, // approximate
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${aiPost.slug}` },
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: aiPost.title, item: `${SITE_URL}/blog/${aiPost.slug}` },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        <BlogPostClient post={aiPost} related={staticRelated} />

        {/* Hidden semantic breadcrumb */}
        <nav aria-label="Breadcrumb" className="sr-only">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li>
              <span aria-current="page">{aiPost.title}</span>
              <ChevronRight className="inline w-3 h-3" aria-hidden="true" />
            </li>
          </ol>
        </nav>
      </>
    )
  }

  // 3. Not found
  notFound()
}
