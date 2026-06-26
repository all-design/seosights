'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Gift,
  Eye,
  FileText,
  Code,
  Bot,
  Search,
  Globe,
  MessageSquare,
  Sparkles,
  Network,
  ArrowRight,
  LucideIcon,
} from 'lucide-react'

interface FreeTool {
  name: string
  description: string
  icon: LucideIcon
  color: string
  bg: string
  status: 'live' | 'coming-soon'
}

const tools: FreeTool[] = [
  {
    name: 'AI Visibility Checker',
    description: 'See if ChatGPT, Claude & Perplexity can cite you',
    icon: Eye,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'live',
  },
  {
    name: 'llms.txt Generator',
    description: 'Generate llms.txt for your site in 1 click',
    icon: FileText,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
  },
  {
    name: 'Schema Generator',
    description: 'FAQ, Article, Product schema markup',
    icon: Code,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
  },
  {
    name: 'Robots.txt Tester',
    description: 'Check if AI bots are blocked',
    icon: Bot,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    status: 'live',
  },
  {
    name: 'GPTBot Checker',
    description: 'Can OpenAI crawl your site?',
    icon: Search,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'live',
  },
  {
    name: 'ClaudeBot Checker',
    description: 'Can Anthropic crawl your site?',
    icon: Search,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    status: 'coming-soon',
  },
  {
    name: 'GEO Audit',
    description: 'Quick generative engine audit',
    icon: Globe,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
  },
  {
    name: 'AEO Audit',
    description: 'Answer engine readiness check',
    icon: MessageSquare,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
  },
  {
    name: 'Prompt Visibility Checker',
    description: 'See how AI answers mention you',
    icon: Sparkles,
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    status: 'coming-soon',
  },
  {
    name: 'Entity Graph Viewer',
    description: 'Visualize your entity authority',
    icon: Network,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
  },
]

export default function FreeToolsSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="free-tools">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/5 to-background" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm mb-6"
          >
            <Gift className="w-3.5 h-3.5" />
            Free Tools
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Free Tools —{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              No Signup Required
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instant utilities for the AI search era. Bookmark them, share them,
            use them daily.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.name}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
            >
              <Card
                onClick={onStartFree}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onStartFree?.()
                  }
                }}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/25 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group"
              >
                <CardContent className="p-5 flex flex-col gap-4 h-full">
                  {/* Top row: icon + status badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl ${tool.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
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
                        Coming soon
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Footer */}
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
                      Try it
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <p className="text-muted-foreground text-sm">
            More free tools added every week. Run a full{' '}
            <span className="text-foreground font-medium">
              SEO · AEO · GEO
            </span>{' '}
            audit with all 8 AI agents to get the complete picture.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
