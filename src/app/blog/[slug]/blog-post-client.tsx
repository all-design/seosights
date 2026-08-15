'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Clock, ChevronRight, ArrowRight, BookOpen, Check, Mail } from 'lucide-react'
import type { UnifiedBlogPost, AIBlogPost } from '@/data/blog-types'
import { isAIPost } from '@/data/blog-types'

/**
 * Render rich text with:
 * - Internal links: [text](/blog/slug) → <Link>
 * - Bold: **text** → <strong>
 * - Inline code: `text` → <code>
 */
function renderRichText(text: string): React.ReactNode[] {
  // Split on markdown-style patterns: [text](url), **bold**, `code`
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Try matching internal link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    // Try matching bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Try matching inline code `text`
    const codeMatch = remaining.match(/`([^`]+)`/)

    // Find the earliest match
    const matches: { index: number; length: number; node: React.ReactNode }[] = []

    if (linkMatch && linkMatch.index !== undefined) {
      const href = linkMatch[2]
      const isInternal = href.startsWith('/') || href.startsWith('/blog')
      matches.push({
        index: linkMatch.index,
        length: linkMatch[0].length,
        node: isInternal
          ? <Link key={`l${key++}`} href={href} className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">{linkMatch[1]}</Link>
          : <a key={`l${key++}`} href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">{linkMatch[1]}</a>,
      })
    }
    if (boldMatch && boldMatch.index !== undefined) {
      matches.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: <strong key={`b${key++}`} className="text-foreground font-semibold">{boldMatch[1]}</strong>,
      })
    }
    if (codeMatch && codeMatch.index !== undefined) {
      matches.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: <code key={`c${key++}`} className="bg-white/10 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">{codeMatch[1]}</code>,
      })
    }

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    // Pick the earliest match
    const earliest = matches.sort((a, b) => a.index - b.index)[0]

    // Add text before the match
    if (earliest.index > 0) {
      parts.push(remaining.substring(0, earliest.index))
    }

    // Add the matched node
    parts.push(earliest.node)

    // Continue after the match
    remaining = remaining.substring(earliest.index + earliest.length)
  }

  return parts
}

export default function BlogPostClient({
  post,
  related,
}: {
  post: UnifiedBlogPost
  related: UnifiedBlogPost[]
}) {
  const [activeSection, setActiveSection] = useState<string>('')
  const isAI = isAIPost(post)

  // Parse HTML content for TOC sections from AI posts
  const aiSections = useMemo(() => {
    if (!isAI || !post.contentHtml) return []
    // Extract headings from HTML for TOC
    const headingRegex = /<h[2-3][^>]*>(.*?)<\/h[2-3]> /gi
    const matches: { heading: string; id: string }[] = []
    let match
    while ((match = headingRegex.exec(post.contentHtml)) !== null) {
      const heading = match[1].replace(/<[^>]+>/g, '').trim()
      const id = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      matches.push({ heading, id })
    }
    return matches
  }, [isAI, post])

  // Track active section for TOC highlighting (only for static posts)
  useEffect(() => {
    if (isAI) return // AI posts don't use structured sections for scroll tracking

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    if (!isAI && post.content) {
      post.content.forEach((_, i) => {
        const el = document.getElementById(`section-${i}`)
        if (el) observer.observe(el)
      })
    }
    return () => observer.disconnect()
  }, [post, isAI])

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const publishedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const updatedDate = post.updatedAt
    ? new Date(post.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // For AI posts, add IDs to headings in the HTML content
  const processedHtml = useMemo(() => {
    if (!isAI || !post.contentHtml) return ''
    // Add IDs to h2 and h3 headings for scroll anchoring
    return post.contentHtml.replace(
      /<h([2-3])([^>]*)>(.*?)<\/h([2-3])> /gi,
      (_match, level, attrs, content, _closeLevel) => {
        const id = content
          .replace(/<[^>]+>/g, '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        return `<h${level} id="${id}"${attrs}>${content}</h${level}>`
      }
    )
  }, [isAI, post])

  return (
    <article className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate">{post.category.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Badge
              variant="outline"
              className={`border-current ${post.category.color} bg-current/5`}
            >
              {post.category.name}
            </Badge>
            {isAI && (
              <Badge
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
              >
                🤖 AI-Generated
              </Badge>
            )}
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime} min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {post.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-t border-b border-white/10 py-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${isAI ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500'} flex items-center justify-center text-white text-xs font-bold`}>
                {isAI ? 'AI' : 's'}
              </div>
              <div>
                <div className="font-medium text-foreground">{post.author}</div>
                <div className="text-xs text-muted-foreground">{post.authorRole}</div>
              </div>
            </div>
            <span className="text-muted-foreground/40">·</span>
            <span>Published {publishedDate}</span>
            {updatedDate && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-amber-400">Updated {updatedDate}</span>
              </>
            )}
          </div>
        </header>

        {/* Hero gradient banner */}
        <div className={`rounded-2xl bg-gradient-to-br ${post.heroGradient} h-32 sm:h-40 flex items-center justify-center text-6xl mb-8 overflow-hidden relative`}>
          {post.heroImage ? (
            <img src={post.heroImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          ) : (
            post.heroEmoji
          )}
        </div>

        {/* Key takeaways box */}
        {post.keyTakeaways.length > 0 && (
          <div className={`rounded-2xl border ${isAI ? 'border-teal-500/30 bg-teal-500/5' : 'border-emerald-500/30 bg-emerald-500/5'} p-6 mb-10`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isAI ? 'text-teal-400' : 'text-emerald-400'} mb-3 flex items-center gap-2`}>
              <BookOpen className="w-4 h-4" />
              Key takeaways
            </h2>
            <ul className="space-y-2">
              {post.keyTakeaways.map((kt, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className={`w-4 h-4 ${isAI ? 'text-teal-400' : 'text-emerald-400'} shrink-0 mt-0.5`} />
                  <span className="text-sm text-foreground/90 leading-relaxed">{kt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Table of contents */}
        {(!isAI && post.content && post.content.length > 0) && (
          <details className="mb-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden group" open>
            <summary className="px-5 py-3.5 cursor-pointer font-semibold text-sm flex items-center justify-between hover:bg-white/5 transition-colors">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Table of contents
              </span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <ol className="px-5 pb-4 space-y-1.5 list-decimal list-inside text-sm">
              {post.content.map((section, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className={`hover:text-purple-300 transition-colors ${
                      activeSection === `section-${i}` ? 'text-purple-300 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* AI post TOC */}
        {isAI && aiSections.length > 0 && (
          <details className="mb-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden group" open>
            <summary className="px-5 py-3.5 cursor-pointer font-semibold text-sm flex items-center justify-between hover:bg-white/5 transition-colors">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                Table of contents
              </span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <ol className="px-5 pb-4 space-y-1.5 list-decimal list-inside text-sm">
              {aiSections.map((sec, i) => (
                <li key={i}>
                  <a
                    href={`#${sec.id}`}
                    className="hover:text-teal-300 transition-colors text-muted-foreground"
                  >
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* Article body — Static posts */}
        {!isAI && post.content && (
          <div className="prose prose-invert max-w-none">
            {post.content.map((section, i) => (
              <section
                key={i}
                id={`section-${i}`}
                className="mb-10 scroll-mt-24"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
                  {section.heading}
                </h2>
                {section.body.split('\n\n').map((para, pi) => (
                  <p key={pi} className="text-base text-muted-foreground leading-relaxed mb-4">
                    {renderRichText(para)}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2 my-4">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-2.5" />
                        <span className="text-base text-muted-foreground leading-relaxed">{renderRichText(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Article body — AI posts (HTML content) */}
        {isAI && processedHtml && (
          <div
            className="prose prose-invert max-w-none ai-article-content"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-white/10">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs border-white/20 text-muted-foreground">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Author / share box */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-12 flex flex-col sm:flex-row items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${isAI ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500'} flex items-center justify-center text-white text-lg font-bold shrink-0`}>
            {isAI ? 'AI' : 's'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{post.author}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {isAI
                ? 'seosights AI Content Engine — automatically generated and reviewed by multi-agent AI systems for accuracy, depth, and AI-search optimization.'
                : `${post.authorRole} at seosights. We build the operating system for AI search — Three Sights, one unified engine.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/#cta"
                className={`text-xs font-medium ${isAI ? 'text-teal-400 hover:text-teal-300' : 'text-purple-400 hover:text-purple-300'} transition-colors`}
              >
                Try seosights free →
              </Link>
              <a
                href="mailto:hello@seosights.com"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-12 border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">Keep reading</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link key={rel.slug} href={`/blog/${rel.slug}`} className="group">
                  <div className="rounded-2xl border border-white/10 bg-white/5 hover:border-white/25 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    <div className={`h-24 bg-gradient-to-br ${rel.heroGradient} flex items-center justify-center text-4xl`}>
                      {rel.heroEmoji}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${rel.category.color}`}>
                          {rel.category.name}
                        </span>
                        {isAIPost(rel) && (
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0">
                            🤖 AI
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm mb-2 group-hover:text-purple-300 transition-colors leading-snug">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
                        {rel.excerpt}
                      </p>
                      <span className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rel.readingTime} min
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`rounded-3xl border border-white/10 ${isAI ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10' : 'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10'} p-8 backdrop-blur-sm`}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Put this into action
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
              Run a full Three Sights audit on your site. 8 AI agents, 90-day roadmap, 14-day free
              trial — no credit card.
            </p>
            <Link
              href="/#cta"
              className={`inline-flex items-center gap-2 px-6 py-3 ${isAI ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]'} text-white font-semibold rounded-lg transition-all duration-300`}
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
