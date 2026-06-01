'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radar, Send, Sparkles } from 'lucide-react'

const agents = [
  {
    name: 'Hermes',
    icon: Radar,
    description: 'Finds keywords and builds authority sites',
    theme: 'emerald' as const,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
    glowClass: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    iconBgClass: 'bg-emerald-500/20',
  },
  {
    name: 'OpenClaw',
    icon: Send,
    description: 'Publishes daily inside your WordPress',
    theme: 'amber' as const,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    glowClass: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    iconBgClass: 'bg-amber-500/20',
  },
  {
    name: 'Claude',
    icon: Sparkles,
    description: 'Runs strategy and AI-citable copy',
    theme: 'cyan' as const,
    colorClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    bgClass: 'bg-cyan-500/10',
    glowClass: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    iconBgClass: 'bg-cyan-500/20',
  },
]

export default function AgentOSSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="agent-os">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-emerald-950/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            The Agent OS Handles the{' '}
            <span className="text-emerald-400">Content</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pick one or run all three. We install it free.
          </p>
        </motion.div>

        {/* Agent Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
            >
              <Card
                className={`bg-white/5 backdrop-blur-sm border ${agent.borderClass} ${agent.glowClass} transition-all duration-300 h-full group`}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl ${agent.iconBgClass} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <agent.icon className={`w-8 h-8 ${agent.colorClass}`} />
                  </div>
                  <h3 className={`text-2xl font-bold ${agent.colorClass} mb-3`}>
                    {agent.name}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Visual Element - agents.png */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl" />
            <img
              src="/agents.png"
              alt="Agent OS - AI-powered content agents"
              className="relative rounded-2xl max-w-2xl w-full border border-white/10"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
          >
            Configured for your niche. Running by next week.
          </Badge>
        </motion.div>
      </div>
    </section>
  )
}
