'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, ArrowRight, Search, ChevronRight } from 'lucide-react'

// ── Prompt Data ─────────────────────────────────────────────
interface PromptItem {
  id: string
  text: string
  category: string
  isPopular: boolean
}

interface IndustryPrompts {
  key: string
  label: string
  emoji: string
  prompts: PromptItem[]
}

const INDUSTRIES: IndustryPrompts[] = [
  {
    key: 'saas',
    label: 'SaaS',
    emoji: '💻',
    prompts: [
      { id: 's1', text: 'What is the best project management software for remote teams?', category: 'Product', isPopular: true },
      { id: 's2', text: 'Compare Notion vs Monday.com for team collaboration', category: 'Comparison', isPopular: true },
      { id: 's3', text: 'Recommend a CRM tool for a 50-person startup', category: 'Service', isPopular: false },
      { id: 's4', text: 'What are the top 5 email marketing platforms for SaaS?', category: 'Product', isPopular: false },
      { id: 's5', text: 'Best help desk software with AI chatbot integration?', category: 'Product', isPopular: true },
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    emoji: '🏥',
    prompts: [
      { id: 'h1', text: 'What is the best EHR system for a small private practice?', category: 'Product', isPopular: true },
      { id: 'h2', text: 'Find a telemedicine platform compliant with HIPAA', category: 'Service', isPopular: true },
      { id: 'h3', text: 'Recommend patient scheduling software for dental clinics', category: 'Product', isPopular: false },
      { id: 'h4', text: 'Compare Epic vs Cerner for hospital management', category: 'Comparison', isPopular: true },
      { id: 'h5', text: 'Best medical billing software for independent practitioners?', category: 'Product', isPopular: false },
    ],
  },
  {
    key: 'law_firms',
    label: 'Law Firms',
    emoji: '⚖️',
    prompts: [
      { id: 'l1', text: 'What is the best case management software for law firms?', category: 'Product', isPopular: true },
      { id: 'l2', text: 'Recommend a document automation tool for contract drafting', category: 'Service', isPopular: false },
      { id: 'l3', text: 'Find the best legal research platform for IP attorneys', category: 'Service', isPopular: true },
      { id: 'l4', text: 'Compare Clio vs PracticePanther for small firms', category: 'Comparison', isPopular: true },
      { id: 'l5', text: 'Best e-discovery software for litigation support?', category: 'Product', isPopular: false },
    ],
  },
]

const CATEGORY_STYLES: Record<string, string> = {
  Product: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Service: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Comparison: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Local: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

// ── Component ───────────────────────────────────────────────
export default function PromptLibrarySection({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [activeIndustry, setActiveIndustry] = useState<string>('saas')

  const activeData = INDUSTRIES.find((ind) => ind.key === activeIndustry) || INDUSTRIES[0]

  return (
    <section id="prompt-library" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/8 to-background" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[350px] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Prompt Library
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Test Any Prompt.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              See Who AI Recommends.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hundreds of pre-built prompts across 10 industries — see if AI recommends your business
          </p>
        </motion.div>

        {/* Industry filter pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {INDUSTRIES.map((ind) => {
            const isActive = ind.key === activeIndustry
            return (
              <button
                key={ind.key}
                onClick={() => setActiveIndustry(ind.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{ind.emoji}</span>
                {ind.label}
              </button>
            )
          })}
        </motion.div>

        {/* Prompt cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndustry}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="border-emerald-500/20 bg-black/30 backdrop-blur-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Search className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {activeData.emoji} {activeData.label} Prompts
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {activeData.prompts.length} prompts shown • 200+ available
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  10 industries
                </Badge>
              </div>

              {/* Prompts list */}
              <div className="p-3 sm:p-4 space-y-1.5">
                {activeData.prompts.map((prompt, i) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-foreground">{prompt.text}</span>
                        {prompt.isPopular && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20"
                          >
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] px-2 py-0.5 ${CATEGORY_STYLES[prompt.category] || ''}`}
                    >
                      {prompt.category}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              {/* Card footer */}
              <div className="p-4 border-t border-white/5 flex items-center justify-center">
                <Button
                  variant="ghost"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-sm"
                  onClick={onStartFree}
                >
                  Browse all {activeData.label} prompts <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Run any prompt across ChatGPT, Claude, Gemini & Perplexity — see if your brand appears
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 px-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            Try it free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
