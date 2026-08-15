'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { UnifiedBlogPost, BlogCategory } from '@/data/blog-types'
import { isAIPost } from '@/data/blog-types'

export default function BlogHubClient({
  posts,
  categories,
}: {
  posts: UnifiedBlogPost[]
  categories: BlogCategory[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return posts
    return posts.filter((p) => p.category.slug === activeCategory)
  }, [posts, activeCategory])

  return (
    <section className="py-12" id="all-posts">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
            }`}
          >
            All ({posts.length})
          </button>
          {categories.map((cat) => {
            const count = posts.filter((p) => p.category.slug === cat.slug).length
            return (
              <button
                key={cat.slug}
                id={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Posts grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((post) => {
              const ai = isAIPost(post)
              return (
                <motion.article
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full group">
                    <div className={`rounded-2xl border ${ai ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-white/10 hover:border-white/25'} bg-white/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col`}>
                      {/* Hero gradient header */}
                      <div className={`h-32 bg-gradient-to-br ${post.heroGradient} flex items-center justify-center text-5xl overflow-hidden relative`}>
                        {post.heroImage ? (
                          <img src={post.heroImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                        ) : (
                          post.heroEmoji
                        )}
                      </div>
                      {/* Body */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <span className={`font-semibold uppercase tracking-wider ${post.category.color}`}>
                            {post.category.name}
                          </span>
                          {ai && (
                            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0">
                              🤖 AI
                            </Badge>
                          )}
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readingTime} min
                          </span>
                        </div>
                        <h3 className={`font-bold text-base mb-2 ${ai ? 'group-hover:text-teal-300' : 'group-hover:text-purple-300'} transition-colors leading-snug`}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <span className="text-xs text-muted-foreground">
                            {ai ? 'seosights AI' : new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className={`text-xs font-medium ${ai ? 'text-teal-400' : 'text-purple-400'} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No posts in this category yet. Check back soon.
          </div>
        )}
      </div>
    </section>
  )
}
