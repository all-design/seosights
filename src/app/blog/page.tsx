import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts, blogCategories } from '@/data/blog-posts'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import BlogHubClient from './blog-hub-client'
import NewsletterForm from '@/components/site/NewsletterForm'

const SITE_URL = 'https://seosights.com'

export const metadata: Metadata = {
  title: 'Blog — AI SEO, AEO & GEO Insights | seosights',
  description:
    'Practical guides on AI search optimization, AEO, GEO, llms.txt, schema markup, entity SEO, and content strategy for the AI era. Written by the seosights team.',
  keywords: [
    'ai seo blog',
    'aeo blog',
    'geo blog',
    'llms.txt guide',
    'entity seo',
    'chatgpt seo',
    'ai search optimization',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — AI SEO, AEO & GEO Insights | seosights',
    description:
      'Practical guides on AI search optimization, AEO, GEO, llms.txt, schema markup, and entity SEO.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [{ url: '/og-image.png', width: 1344, height: 768, alt: 'seosights Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'seosights Blog — AI SEO, AEO & GEO Insights',
    description: 'Practical guides on AI search optimization, AEO, GEO, and entity SEO.',
    images: ['/og-image.png'],
  },
}

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'seosights Blog',
  description: 'Practical guides on AI search optimization, AEO, GEO, llms.txt, and entity SEO.',
  url: `${SITE_URL}/blog`,
  publisher: {
    '@type': 'Organization',
    name: 'seosights',
    url: SITE_URL,
  },
  blogPost: blogPosts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    url: `${SITE_URL}/blog/${p.slug}`,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt || p.publishedAt,
    author: { '@type': 'Organization', name: p.author },
    keywords: p.keywords.join(', '),
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
  ],
}

export default function BlogHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[400px] bg-purple-500/10 rounded-full blur-[150px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm rounded-full mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            seosights Blog
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            AI SEO, AEO & GEO{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              insights
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Practical guides on getting cited by ChatGPT, Claude, and Perplexity. Written by the
            team building the seosights platform. New posts every week.
          </p>
        </div>
      </section>

      {/* Featured post (first one) */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={`/blog/${blogPosts[0].slug}`} className="block group">
            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${blogPosts[0].heroGradient} p-6 sm:p-10 backdrop-blur-sm hover:border-white/25 transition-all duration-300`}>
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="text-7xl sm:text-8xl shrink-0">{blogPosts[0].heroEmoji}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${blogPosts[0].category.color}`}>
                      {blogPosts[0].category.name}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blogPosts[0].readingTime} min read
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(blogPosts[0].publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 group-hover:text-purple-300 transition-colors">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                    {blogPosts[0].excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 group-hover:gap-2.5 transition-all">
                    Read the article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories overview */}
      <section className="py-8" id="categories">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Browse by topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {blogCategories.map((cat) => {
              const count = blogPosts.filter((p) => p.category.slug === cat.slug).length
              return (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 p-4 transition-all duration-300"
                >
                  <div className={`text-xs font-semibold uppercase tracking-wider ${cat.color} mb-1`}>
                    {cat.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{count} post{count !== 1 ? 's' : ''}</div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* All posts grid (client component with category filter) */}
      <BlogHubClient posts={blogPosts} categories={blogCategories} />

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
