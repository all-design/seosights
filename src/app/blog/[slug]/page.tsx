import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, getPostBySlug, getRelatedPosts } from '@/data/blog-posts'
import { ChevronRight } from 'lucide-react'
import BlogPostClient from './blog-post-client'

const SITE_URL = 'https://seosights.com'

export const dynamicParams = false

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const post = getPostBySlug(slug)
    if (!post) return { title: 'Post not found' }
    return {
      title: post.metaTitle,
      description: post.metaDescription,
      keywords: post.keywords,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        title: post.metaTitle,
        description: post.metaDescription,
        url: `${SITE_URL}/blog/${post.slug}`,
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt || post.publishedAt,
        authors: [post.author],
        tags: post.tags,
        images: [{ url: '/og-image.png', width: 1344, height: 768, alt: post.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.metaTitle,
        description: post.metaDescription,
        images: ['/og-image.png'],
      },
    }
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  const related = getRelatedPosts(slug, 3)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'seosights',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-transparent.png` },
    },
    keywords: post.keywords.join(', '),
    articleSection: post.category.name,
    wordCount: post.content.reduce((acc, s) => acc + s.body.split(/\s+/).length + (s.bullets?.length || 0) * 10, 0),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
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

      <BlogPostClient post={post} related={related} />

      {/* Hidden semantic breadcrumb */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li>
            <span aria-current="page">{post.title}</span>
            <ChevronRight className="inline w-3 h-3" aria-hidden="true" />
          </li>
        </ol>
      </nav>
    </>
  )
}
