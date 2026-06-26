'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Boxes, Sparkles } from 'lucide-react'

interface Integration {
  name: string
  monogram: string
  description: string
  status: 'connected' | 'available'
  // Tailwind classes for the monogram badge background + text
  badgeBg: string
  badgeText: string
  ring: string
}

const integrations: Integration[] = [
  {
    name: 'Google Search Console',
    monogram: 'GSC',
    description: 'Pull impressions, clicks & queries',
    status: 'connected',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    ring: 'ring-blue-500/30',
  },
  {
    name: 'GA4',
    monogram: 'GA4',
    description: 'Track conversions & engagement',
    status: 'connected',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    ring: 'ring-amber-500/30',
  },
  {
    name: 'Cloudflare',
    monogram: 'CF',
    description: 'Deploy edge rules & cache headers',
    status: 'available',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    ring: 'ring-orange-500/30',
  },
  {
    name: 'WordPress',
    monogram: 'WP',
    description: 'Auto-publish content briefs & schema',
    status: 'connected',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    ring: 'ring-sky-500/30',
  },
  {
    name: 'Shopify',
    monogram: 'S',
    description: 'Push product schema & metafields',
    status: 'available',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    ring: 'ring-emerald-500/30',
  },
  {
    name: 'Webflow',
    monogram: 'WF',
    description: 'Sync CMS items & SEO settings',
    status: 'available',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    ring: 'ring-indigo-500/30',
  },
  {
    name: 'GitHub',
    monogram: 'GH',
    description: 'Open PRs for on-page fixes',
    status: 'available',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    ring: 'ring-slate-500/30',
  },
  {
    name: 'Vercel',
    monogram: '▲',
    description: 'Deploy llms.txt & middleware',
    status: 'available',
    badgeBg: 'bg-white/10',
    badgeText: 'text-foreground',
    ring: 'ring-white/20',
  },
]

const upcoming = ['Slack', 'Notion', 'Zapier', 'Make.com', 'HubSpot', 'Ahrefs API']

export default function IntegrationsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 relative" ref={ref} id="integrations">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Boxes className="w-3.5 h-3.5" />
            Integrations
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Connect Your Stack in{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              One Click
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Pull real data from Google Search Console, GA4, and your CMS. Deploy fixes to Cloudflare, WordPress, Shopify, and Webflow. seosights fits into your existing workflow — not on top of it.
          </p>
        </motion.div>

        {/* Integrations grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * i }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)] transition-all duration-300 h-full group">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl ${integration.badgeBg} ring-1 ${integration.ring} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <span className={`text-base font-bold ${integration.badgeText} leading-none`}>
                        {integration.monogram}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 ${
                        integration.status === 'connected'
                          ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                          : 'border-white/15 text-muted-foreground bg-white/5'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          integration.status === 'connected'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            : 'bg-muted-foreground/50'
                        }`}
                      />
                      {integration.status === 'connected' ? 'Connected' : 'Available'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground/90 leading-tight">
                      {integration.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {integration.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom row: upcoming integrations */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              More integrations coming:{' '}
              <span className="text-foreground/80 font-medium">
                {upcoming.join(', ')}
              </span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
