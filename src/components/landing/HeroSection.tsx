'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, Brain, Search, Eye, BarChart3, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  onStartFree?: () => void
}

const agentPills = [
  { name: 'Master Director', icon: '🎯', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Keyword Researcher', icon: '🔑', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Competitor Analyst', icon: '🕵️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { name: 'Content Architect', icon: '🏗️', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'On-Page Auditor', icon: '🔍', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Link Strategist', icon: '🔗', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { name: 'Tech & Schema', icon: '⚙️', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Backlink Prospector', icon: '🤝', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
]

const threeSights = [
  {
    number: '1st',
    name: 'First Sight',
    label: 'SEO',
    description: 'Traditional search',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  {
    number: '2nd',
    name: 'Second Sight',
    label: 'AEO',
    description: 'AI assistants',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
  {
    number: '3rd',
    name: 'Third Sight',
    label: 'GEO',
    description: 'Generative engines',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
]

export default function HeroSection({ onStartFree }: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-emerald-950/20 to-background" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/6 rounded-full blur-[100px]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* ── Text-only Logo: seosights (big) + tagline centered below ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-400 bg-clip-text text-transparent">
              seosights
            </span>
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.35em] text-emerald-400/60 uppercase mt-2 text-center">
            Multiple pillars, one unified AI engine
          </p>
        </motion.div>

        {/* Badge: SEO · AEO · GEO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Three Sights. One Platform.
          </Badge>
        </motion.div>

        {/* "Not a Wrapper" Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm mb-8"
          >
            ⚡ Not a Wrapper. A Purpose-Built SEO Engine.
          </Badge>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="text-foreground">Get Customers from </span>
          <span className="text-emerald-400">Google</span>
          <span className="text-foreground"> & </span>
          <span className="text-amber-400">AI</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto mb-4 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          8 AI agents audit, strategize, and auto-execute your SEO —{' '}
          <span className="text-foreground font-semibold">all while you sleep</span>.
        </motion.p>

        {/* Sub-subheadline */}
        <motion.p
          className="text-base sm:text-lg text-muted-foreground/70 max-w-3xl mx-auto mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          Own your AI presence. A proprietary multi-agent engine that ranks you on Google, wins featured snippets, and gets cited by AI. 2,000-word stealth strategies that actually stick.
        </motion.p>

        {/* ── Three Sights Visual ── */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {threeSights.map((sight, idx) => (
            <motion.div
              key={sight.label}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border ${sight.border} ${sight.bg} backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.45 + idx * 0.1 }}
            >
              <Eye className={`w-4 h-4 ${sight.color}`} />
              <div className="text-left">
                <span className={`text-xs font-bold ${sight.color} uppercase tracking-wider`}>
                  {sight.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{sight.label}</span>
                  <span className="text-xs text-muted-foreground">· {sight.description}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Platform Badges — "Tracked across 17+ AI Engines" */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span className="text-sm text-muted-foreground/70 block mb-3">Tracked across 17+ AI Engines</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: 'ChatGPT', icon: Bot, color: 'text-emerald-400' },
              { name: 'Claude', icon: Brain, color: 'text-amber-400' },
              { name: 'Perplexity', icon: Search, color: 'text-cyan-400' },
              { name: 'AI Overviews', icon: Eye, color: 'text-rose-400' },
              { name: 'Gemini', icon: Sparkles, color: 'text-blue-400' },
              { name: 'DeepSeek', icon: Zap, color: 'text-purple-400' },
              { name: 'Grok', icon: Bot, color: 'text-orange-400' },
              { name: 'Copilot', icon: Search, color: 'text-teal-400' },
            ].map((engine, idx) => (
              <motion.div
                key={engine.name}
                className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + idx * 0.04 }}
              >
                <engine.icon className={`w-3.5 h-3.5 ${engine.color}`} />
                <span className="text-xs font-medium text-foreground/80">{engine.name}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm border border-emerald-500/30 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-emerald-400">+9 more</span>
            </div>
          </div>
        </motion.div>

        {/* ── "Your 24/7 AI SEO Team" Section ── */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
              Your 24/7 AI SEO Team
            </span>
          </h2>
          <p className="text-muted-foreground/80 text-base sm:text-lg mb-5">
            8 specialized agents. Auto-executing your strategy while you sleep.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {agentPills.map((agent, idx) => (
              <motion.div
                key={agent.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium ${agent.color} backdrop-blur-sm`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
              >
                <span className="text-sm">{agent.icon}</span>
                {agent.name}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={onStartFree}
          >
            Deploy Your AI Team — Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-semibold text-lg px-8 py-6 transition-all duration-300"
            onClick={() => scrollToSection('pricing')}
          >
            View Pricing
          </Button>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl px-5 py-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-xl">8X</span>
            <span className="text-muted-foreground text-sm">SEO rankings</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-xl px-5 py-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xl">5X</span>
            <span className="text-muted-foreground text-sm">AEO featured snippets</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl px-5 py-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold text-xl">3X</span>
            <span className="text-muted-foreground text-sm">Brand mentions → AI</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-rose-500/20 rounded-xl px-5 py-3">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span className="text-rose-400 font-bold text-xl">9X</span>
            <span className="text-muted-foreground text-sm">LLM traffic converts</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
