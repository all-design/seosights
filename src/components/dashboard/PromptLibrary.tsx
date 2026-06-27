'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Play, Copy, Check, Sparkles } from 'lucide-react'

interface PromptItem {
  id: string
  industry: string
  category: string
  prompt: string
  isPopular: boolean
  usageCount: number
}

interface PromptResponse {
  prompts: PromptItem[]
  industries: string[]
  categories: string[]
  _meta: { status: string }
}

const INDUSTRY_LABELS: Record<string, string> = {
  dentists: '🦷 Dentists', law_firms: '⚖️ Law Firms', saas: '💻 SaaS', hotels: '🏨 Hotels',
  restaurants: '🍽️ Restaurants', marketing_agencies: '📢 Marketing', healthcare: '🏥 Healthcare',
  ecommerce: '🛒 E-Commerce', finance: '💰 Finance', real_estate: '🏠 Real Estate',
}

const CATEGORY_LABELS: Record<string, string> = {
  service: 'Service', product: 'Product', comparison: 'Comparison', local: 'Local',
}

export default function PromptLibrary({ onSelectPrompt }: { onSelectPrompt?: (prompt: string) => void }) {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams()
        if (selectedIndustry) params.set('industry', selectedIndustry)
        if (selectedCategory) params.set('category', selectedCategory)
        const res = await fetch(`/api/ai/prompt-library?${params}`)
        const data: PromptResponse = await res.json()
        setPrompts(data.prompts || [])
        if (data.industries) setIndustries(data.industries)
        if (data.categories) setCategories(data.categories)
      } catch { /* empty */ } finally { setLoading(false) }
    }
    load()
  }, [selectedIndustry, selectedCategory])

  const filtered = prompts.filter(p =>
    !searchQuery || p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">Prompt Library</CardTitle>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Industry filter pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${!selectedIndustry ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedIndustry(null)}
          >
            All
          </Badge>
          {industries.map(ind => (
            <Badge
              key={ind}
              variant="outline"
              className={`cursor-pointer transition-colors ${selectedIndustry === ind ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedIndustry(selectedIndustry === ind ? null : ind)}
            >
              {INDUSTRY_LABELS[ind] || ind}
            </Badge>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 mb-3">
          <Badge
            variant="outline"
            className={`cursor-pointer text-xs ${!selectedCategory ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Types
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant="outline"
              className={`cursor-pointer text-xs ${selectedCategory === cat ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </Badge>
          ))}
        </div>

        <ScrollArea className="max-h-[350px]">
          <AnimatePresence>
            <div className="space-y-1.5">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-foreground truncate">{p.prompt}</span>
                      {p.isPopular && (
                        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{INDUSTRY_LABELS[p.industry] || p.industry}</span>
                      <span className="text-[11px] text-muted-foreground/50">•</span>
                      <span className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[p.category] || p.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyPrompt(p.id, p.prompt)}>
                      {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    {onSelectPrompt && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectPrompt(p.prompt)}>
                        <Play className="h-3.5 w-3.5 text-emerald-400" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
