'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Swords,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  BarChart3,
  Brain,
  Shield,
} from 'lucide-react'

const competitors = [
  {
    key: 'ahrefs',
    name: 'Ahrefs',
    url: 'ahrefs.com',
    theirScore: 78,
    ourScore: 92,
    differentiator: 'Seosights tracks AI citations across ChatGPT, Claude, Gemini & Perplexity. Ahrefs doesn\'t.',
    theyHave: ['Backlink data', 'Keyword research', 'Rank tracking', 'Site audit'],
    weHave: ['AI citation tracking', 'AI Visibility Score', 'llms.txt generator', 'Recommendation Simulator', 'Auto Execute', '8-Agent AI Engine'],
    searchVolume: 2400,
  },
  {
    key: 'semrush',
    name: 'Semrush',
    url: 'semrush.com',
    theirScore: 82,
    ourScore: 92,
    differentiator: 'Semrush sees traditional search. Seosights sees AI search — the channel growing 10x faster.',
    theyHave: ['SEO toolkit', 'Content marketing', 'PPC data', 'Social media'],
    weHave: ['AI Visibility Score', 'Per-engine tracking', 'AI Replay', 'Citation Explorer', 'Auto Execute', 'AI Recommendation Engine'],
    searchVolume: 3200,
  },
  {
    key: 'surfer',
    name: 'Surfer SEO',
    url: 'surferseo.com',
    theirScore: 65,
    ourScore: 92,
    differentiator: 'Surfer optimizes content for Google. Seosights optimizes for AI — where buyers now go first.',
    theyHave: ['Content editor', 'SERP analyzer', 'Keyword planner'],
    weHave: ['AI Visibility Score', '8-Agent AI analysis', 'AI Replay & Recorder', 'Auto Execute', 'Citation tracking', 'Entity optimization'],
    searchVolume: 1800,
  },
  {
    key: 'profound',
    name: 'Profound',
    url: 'profound.co',
    theirScore: 58,
    ourScore: 92,
    differentiator: 'Profound tracks AI mentions. Seosights goes further — it tells you exactly what to do and auto-executes.',
    theyHave: ['AI mention tracking', 'Basic analytics'],
    weHave: ['AI Visibility Score', 'Action recommendations', 'Auto Execute', '8-Agent AI Engine', 'Mission Control', 'Citation Explorer'],
    searchVolume: 320,
  },
  {
    key: 'goodie',
    name: 'Goodie',
    url: 'goodie.ai',
    theirScore: 52,
    ourScore: 92,
    differentiator: 'Goodie monitors AI answers. Seosights actively improves your position in them.',
    theyHave: ['AI answer monitoring', 'Basic alerts'],
    weHave: ['AI Visibility Score', 'Auto Execute', '8-Agent AI Engine', 'Score Delta tracking', 'Full audit suite', 'CMS integration'],
    searchVolume: 210,
  },
]

export default function VSPagesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 relative" ref={ref} id="vs-pages">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-rose-950/5 to-background" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-rose-500/50 text-rose-400 bg-rose-500/10 backdrop-blur-sm mb-6"
          >
            <Swords className="w-3.5 h-3.5" />
            High Commercial Intent
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Seosights vs{' '}
            <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              The Rest
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Traditional SEO tools can&apos;t see AI. We can.
          </p>
        </motion.div>

        {/* VS Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((comp, i) => (
            <motion.div
              key={comp.key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">vs {comp.name}</h3>
                      <p className="text-xs text-muted-foreground">{comp.url}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-400">
                      {comp.searchVolume.toLocaleString()}/mo
                    </Badge>
                  </div>

                  {/* Score Comparison */}
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/5">
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-muted-foreground mb-1">Seosights</div>
                      <div className="text-2xl font-bold text-emerald-400">{comp.ourScore}</div>
                      <div className="text-[10px] text-emerald-400/70">AI Visibility</div>
                    </div>
                    <div className="text-xs text-muted-foreground font-bold">VS</div>
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-muted-foreground mb-1">{comp.name}</div>
                      <div className="text-2xl font-bold text-muted-foreground">{comp.theirScore}</div>
                      <div className="text-[10px] text-muted-foreground/70">Traditional SEO</div>
                    </div>
                  </div>

                  {/* Key Differentiator */}
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">
                    {comp.differentiator}
                  </p>

                  {/* Feature Compare */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Seosights has</div>
                    {comp.weHave.slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                    <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mt-2 mb-1">They don't</div>
                    {comp.weHave.slice(3, 5).map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <XCircle className="w-3 h-3 text-rose-500/50 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 mt-auto"
                  >
                    View Full Comparison
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
