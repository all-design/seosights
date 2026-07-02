'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Globe,
  Bot,
  Brain,
  Sparkles,
  ArrowRight,
  Search,
  Stethoscope,
  Scale,
  Hotel,
  Monitor,
  ShoppingCart,
  Code2,
  Newspaper,
  Utensils,
  Building2,
  TrendingUp,
  Zap,
} from 'lucide-react'

const industries = [
  { key: 'dentists', label: 'Dentists', icon: Stethoscope, avg: 34 },
  { key: 'lawyers', label: 'Lawyers', icon: Scale, avg: 28 },
  { key: 'hotels', label: 'Hotels', icon: Hotel, avg: 41 },
  { key: 'saas', label: 'SaaS', icon: Monitor, avg: 52 },
  { key: 'shopify', label: 'Shopify Stores', icon: ShoppingCart, avg: 38 },
  { key: 'webflow', label: 'Webflow Sites', icon: Code2, avg: 31 },
  { key: 'wordpress', label: 'WordPress Sites', icon: Newspaper, avg: 44 },
  { key: 'restaurants', label: 'Restaurants', icon: Utensils, avg: 29 },
  { key: 'realestate', label: 'Real Estate', icon: Building2, avg: 36 },
  { key: 'ecommerce', label: 'Ecommerce', icon: ShoppingCart, avg: 47 },
  { key: 'fitness', label: 'Fitness', icon: TrendingUp, avg: 33 },
  { key: 'medical', label: 'Medical', icon: Stethoscope, avg: 37 },
  { key: 'education', label: 'Education', icon: Globe, avg: 42 },
  { key: 'finance', label: 'Finance', icon: Building2, avg: 51 },
  { key: 'legal', label: 'Legal', icon: Scale, avg: 30 },
  { key: 'travel', label: 'Travel', icon: Hotel, avg: 39 },
  { key: 'automotive', label: 'Automotive', icon: Zap, avg: 35 },
  { key: 'insurance', label: 'Insurance', icon: Building2, avg: 40 },
  { key: 'agencies', label: 'Marketing Agencies', icon: Brain, avg: 55 },
  { key: 'healthcare', label: 'Healthcare', icon: Stethoscope, avg: 38 },
]

const templateTypes = [
  { key: 'all', label: 'All Pages' },
  { key: 'ai-visibility-for', label: 'AI Visibility for...' },
  { key: 'chatgpt-seo-for', label: 'ChatGPT SEO for...' },
  { key: 'claude-seo-for', label: 'Claude SEO for...' },
  { key: 'gemini-visibility-for', label: 'Gemini Visibility for...' },
]

function getTemplateLabel(template: string, industry: string): string {
  switch (template) {
    case 'ai-visibility-for': return `AI Visibility for ${industry}`
    case 'chatgpt-seo-for': return `ChatGPT SEO for ${industry}`
    case 'claude-seo-for': return `Claude SEO for ${industry}`
    case 'gemini-visibility-for': return `Gemini Visibility for ${industry}`
    default: return `AI Visibility for ${industry}`
  }
}

function getEngineBadge(template: string) {
  switch (template) {
    case 'chatgpt-seo-for': return { label: 'ChatGPT', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    case 'claude-seo-for': return { label: 'Claude', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    case 'gemini-visibility-for': return { label: 'Gemini', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' }
    default: return { label: 'All Engines', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
  }
}

export default function ProgrammaticSEOSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [activeTemplate, setActiveTemplate] = useState('all')

  const filteredIndustries = activeTemplate === 'all'
    ? industries
    : industries

  return (
    <section className="py-24 relative" ref={ref} id="programmatic-seo">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            1000+ Industry Pages
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            AI Visibility{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              for Every Industry
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            When someone asks ChatGPT &ldquo;best SEO tool for dentists&rdquo; — are you the answer?{' '}
            <span className="text-foreground font-medium">1000+ industry-specific pages</span> ensure you are.
          </p>
        </motion.div>

        {/* Template Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTemplate} onValueChange={setActiveTemplate} className="w-full">
            <TabsList className="mx-auto flex flex-wrap justify-center gap-1 bg-muted/50 h-auto p-1">
              {templateTypes.map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Industry Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredIndustries.map((ind, i) => {
            const templates = activeTemplate === 'all'
              ? ['ai-visibility-for', 'chatgpt-seo-for', 'claude-seo-for', 'gemini-visibility-for']
              : [activeTemplate]

            return templates.map((template, ti) => {
              const badge = getEngineBadge(template)
              const label = getTemplateLabel(template, ind.label)
              return (
                <motion.div
                  key={`${template}-${ind.key}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: Math.min((i * 0.03 + ti * 0.01), 0.8) }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <ind.icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${badge.color}`}>
                          {badge.label}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground/90 mb-1 leading-tight">{label}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Avg AI Visibility</span>
                        <span className={`text-xs font-bold ${ind.avg >= 50 ? 'text-emerald-400' : ind.avg >= 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {ind.avg}/100
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${ind.avg}%`,
                            background: ind.avg >= 50 ? '#10b981' : ind.avg >= 35 ? '#f59e0b' : '#f43f5e'
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          }).flat().slice(0, activeTemplate === 'all' ? 20 : 20)}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-muted-foreground mb-4">
            1000+ industry pages — Get found when AI answers questions about your industry
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/20"
          >
            <Search className="mr-2 w-4 h-4" />
            Find Your Industry
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
