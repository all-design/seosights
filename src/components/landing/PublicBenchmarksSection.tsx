'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Crown,
  BarChart3,
  Eye,
  ArrowUpRight,
} from 'lucide-react'

const categories = [
  {
    key: 'saas',
    label: 'SaaS',
    entries: [
      { rank: 1, brand: 'Stripe', domain: 'stripe.com', score: 89, chatgpt: 92, claude: 85, gemini: 88, perplexity: 91, delta: 2 },
      { rank: 2, brand: 'HubSpot', domain: 'hubspot.com', score: 84, chatgpt: 86, claude: 80, gemini: 82, perplexity: 88, delta: -1 },
      { rank: 3, brand: 'Notion', domain: 'notion.so', score: 81, chatgpt: 84, claude: 78, gemini: 79, perplexity: 83, delta: 3 },
      { rank: 4, brand: 'Figma', domain: 'figma.com', score: 78, chatgpt: 80, claude: 74, gemini: 77, perplexity: 81, delta: 0 },
      { rank: 5, brand: 'Canva', domain: 'canva.com', score: 76, chatgpt: 78, claude: 72, gemini: 75, perplexity: 79, delta: 1 },
      { rank: 6, brand: 'Slack', domain: 'slack.com', score: 73, chatgpt: 76, claude: 70, gemini: 71, perplexity: 75, delta: -2 },
      { rank: 7, brand: 'Zoom', domain: 'zoom.us', score: 70, chatgpt: 73, claude: 67, gemini: 68, perplexity: 72, delta: 1 },
      { rank: 8, brand: 'Atlassian', domain: 'atlassian.com', score: 68, chatgpt: 70, claude: 64, gemini: 67, perplexity: 71, delta: 0 },
      { rank: 9, brand: 'Shopify', domain: 'shopify.com', score: 65, chatgpt: 68, claude: 62, gemini: 64, perplexity: 66, delta: 2 },
      { rank: 10, brand: 'Monday', domain: 'monday.com', score: 62, chatgpt: 64, claude: 58, gemini: 61, perplexity: 65, delta: -1 },
    ],
  },
  {
    key: 'law',
    label: 'Law Firms',
    entries: [
      { rank: 1, brand: 'Latham & Watkins', domain: 'lw.com', score: 67, chatgpt: 70, claude: 64, gemini: 66, perplexity: 68, delta: 1 },
      { rank: 2, brand: 'Kirkland & Ellis', domain: 'kirkland.com', score: 64, chatgpt: 67, claude: 61, gemini: 63, perplexity: 65, delta: 0 },
      { rank: 3, brand: 'DLA Piper', domain: 'dlapiper.com', score: 61, chatgpt: 63, claude: 58, gemini: 60, perplexity: 63, delta: 2 },
      { rank: 4, brand: 'Baker McKenzie', domain: 'bakermckenzie.com', score: 58, chatgpt: 60, claude: 55, gemini: 57, perplexity: 60, delta: -1 },
      { rank: 5, brand: 'Skadden', domain: 'skadden.com', score: 55, chatgpt: 57, claude: 52, gemini: 54, perplexity: 57, delta: 0 },
      { rank: 6, brand: 'Clifford Chance', domain: 'cliffordchance.com', score: 52, chatgpt: 54, claude: 49, gemini: 51, perplexity: 54, delta: 1 },
      { rank: 7, brand: 'White & Case', domain: 'whitecase.com', score: 49, chatgpt: 51, claude: 46, gemini: 48, perplexity: 51, delta: -2 },
      { rank: 8, brand: 'Linklaters', domain: 'linklaters.com', score: 46, chatgpt: 48, claude: 43, gemini: 45, perplexity: 48, delta: 0 },
      { rank: 9, brand: 'Freshfields', domain: 'freshfields.com', score: 43, chatgpt: 45, claude: 40, gemini: 42, perplexity: 45, delta: 1 },
      { rank: 10, brand: 'Allen & Overy', domain: 'allenovery.com', score: 40, chatgpt: 42, claude: 37, gemini: 39, perplexity: 42, delta: -1 },
    ],
  },
  {
    key: 'ecommerce',
    label: 'Ecommerce',
    entries: [
      { rank: 1, brand: 'Amazon', domain: 'amazon.com', score: 95, chatgpt: 97, claude: 93, gemini: 95, perplexity: 95, delta: 0 },
      { rank: 2, brand: 'Shopify', domain: 'shopify.com', score: 82, chatgpt: 85, claude: 79, gemini: 81, perplexity: 83, delta: 2 },
      { rank: 3, brand: 'eBay', domain: 'ebay.com', score: 79, chatgpt: 81, claude: 76, gemini: 78, perplexity: 81, delta: -1 },
      { rank: 4, brand: 'Etsy', domain: 'etsy.com', score: 74, chatgpt: 76, claude: 71, gemini: 73, perplexity: 76, delta: 1 },
      { rank: 5, brand: 'Wayfair', domain: 'wayfair.com', score: 70, chatgpt: 72, claude: 67, gemini: 69, perplexity: 72, delta: 0 },
      { rank: 6, brand: 'Zalando', domain: 'zalando.com', score: 66, chatgpt: 68, claude: 63, gemini: 65, perplexity: 68, delta: 3 },
      { rank: 7, brand: 'ASOS', domain: 'asos.com', score: 63, chatgpt: 65, claude: 60, gemini: 62, perplexity: 65, delta: -1 },
      { rank: 8, brand: 'Boohoo', domain: 'boohoo.com', score: 59, chatgpt: 61, claude: 56, gemini: 58, perplexity: 61, delta: 0 },
      { rank: 9, brand: 'Farfetch', domain: 'farfetch.com', score: 55, chatgpt: 57, claude: 52, gemini: 54, perplexity: 57, delta: 2 },
      { rank: 10, brand: 'SHEIN', domain: 'shein.com', score: 51, chatgpt: 53, claude: 48, gemini: 50, perplexity: 53, delta: 4 },
    ],
  },
]

function getDeltaIcon(delta: number) {
  if (delta > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />
  if (delta < 0) return <TrendingDown className="w-3 h-3 text-rose-400" />
  return <Minus className="w-3 h-3 text-muted-foreground" />
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-rose-400'
}

export default function PublicBenchmarksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [activeCategory, setActiveCategory] = useState('saas')

  const currentCategory = categories.find(c => c.key === activeCategory) || categories[0]

  return (
    <section className="py-24 relative" ref={ref} id="benchmarks">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/5 to-background" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm mb-6"
          >
            <Trophy className="w-3.5 h-3.5" />
            AI Visibility Index™ — Public Benchmark Data
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Top 100{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              AI Visibility
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every day. Automatically. Which brands do AI engines recommend? The data that gets linked.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-6">
            <TabsList className="mx-auto flex justify-center gap-1 bg-muted/50 h-auto p-1">
              {categories.map(c => (
                <TabsTrigger
                  key={c.key}
                  value={c.key}
                  className="text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                >
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Benchmark Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-8 gap-3 p-4 border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-8">#</div>
              <div>Brand</div>
              <div>AI Visibility</div>
              <div>ChatGPT</div>
              <div>Claude</div>
              <div>Gemini</div>
              <div>Perplexity</div>
              <div>Change</div>
            </div>

            {/* Table Rows */}
            {currentCategory.entries.map((entry, i) => (
              <motion.div
                key={entry.domain}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.2, delay: 0.4 + i * 0.05 }}
                className="grid grid-cols-2 md:grid-cols-8 gap-2 md:gap-3 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors items-center"
              >
                <div className="flex items-center gap-2 col-span-1">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    {entry.rank <= 3 ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{entry.rank}</span>
                    )}
                  </div>
                  <span className="font-semibold text-foreground text-sm md:hidden">#{entry.rank}</span>
                </div>
                <div className="col-span-1">
                  <span className="font-medium text-foreground text-sm">{entry.brand}</span>
                  <span className="block text-[10px] text-muted-foreground">{entry.domain}</span>
                </div>
                <div className="flex items-center">
                  <span className={`font-bold text-sm ${getScoreColor(entry.score)}`}>{entry.score}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="md:hidden text-[10px] text-muted-foreground/60 mr-1">GPT:</span>
                  {entry.chatgpt}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="md:hidden text-[10px] text-muted-foreground/60 mr-1">CL:</span>
                  {entry.claude}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="md:hidden text-[10px] text-muted-foreground/60 mr-1">GE:</span>
                  {entry.gemini}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="md:hidden text-[10px] text-muted-foreground/60 mr-1">PE:</span>
                  {entry.perplexity}
                </div>
                <div className="flex items-center gap-1">
                  {getDeltaIcon(entry.delta)}
                  <span className={`text-xs font-medium ${entry.delta > 0 ? 'text-emerald-400' : entry.delta < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                    {entry.delta > 0 ? '+' : ''}{entry.delta}
                  </span>
                </div>
              </motion.div>
            ))}
          </Card>
        </motion.div>

        {/* Bottom CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Button
            variant="outline"
            size="lg"
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          >
            <BarChart3 className="mr-2 w-4 h-4" />
            View Full Top 100 →
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold shadow-lg shadow-amber-900/20"
          >
            <Eye className="mr-2 w-4 h-4" />
            Check Your AI Visibility Score
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
