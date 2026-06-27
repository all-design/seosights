'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import IconRenderer from '@/components/site/IconRenderer'
import { ArrowRight } from 'lucide-react'
import type { FreeTool } from '@/data/free-tools'

type Category = { name: string; slug: string; description: string }

// Standalone card component — IconRenderer avoids creating components during render
function ToolGridCard({ tool }: { tool: FreeTool }) {
  return (
    <Link href={`/free-ai-seo-tools/${tool.slug}`} className="block h-full">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/25 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between">
            <div
              className={`w-11 h-11 rounded-xl ${tool.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
            >
              <IconRenderer name={tool.icon} className={`w-5 h-5 ${tool.color}`} />
            </div>
            {tool.status === 'live' ? (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-5 border-emerald-500/50 text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-5 border-white/20 text-muted-foreground/70 bg-white/5"
              >
                Soon
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">{tool.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.tagline}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 h-5 border-amber-500/40 text-amber-300 bg-amber-500/5"
            >
              Free
            </Badge>
            <span
              className={`text-sm font-medium ${tool.color} flex items-center gap-1 group-hover:gap-2 transition-all`}
            >
              Open
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function FreeToolsHubClient({
  tools,
  categories,
}: {
  tools: FreeTool[]
  categories: Category[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchesCategory =
        activeCategory === 'all' ||
        t.category.toLowerCase() === activeCategory
      const matchesSearch =
        search.trim() === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tagline.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [tools, activeCategory, search])

  return (
    <section className="py-16 relative" id="all-tools">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search + category filter */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="px-4 py-2.5 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              aria-label="Search free tools"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                All ({tools.length})
              </button>
              {categories.map((cat) => {
                const count = tools.filter(
                  (t) => t.category.toLowerCase() === cat.name.toLowerCase()
                ).length
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.name.toLowerCase())}
                    className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                      activeCategory === cat.name.toLowerCase()
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tools grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((tool) => (
              <motion.div
                key={tool.slug}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ToolGridCard tool={tool} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No tools match your search. Try a different keyword or category.
          </div>
        )}
      </div>
    </section>
  )
}
