'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, TrendingUp, Zap, Bot, Brain, Search } from 'lucide-react'

interface HeroSectionProps {
  onStartFree?: () => void
}

export default function HeroSection({ onStartFree }: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />

      {/* Emerald glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/6 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            SEO · AEO · GEO — One System
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-400 bg-clip-text text-transparent">
            SEO · AEO · GEO
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto mb-6 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Rank on Google{' '}
          <span className="text-emerald-400 font-semibold">(SEO)</span>, Win Featured Snippets{' '}
          <span className="text-cyan-400 font-semibold">(AEO)</span>,{' '}
          <span className="text-foreground font-semibold">AND</span> Get Cited by AI{' '}
          <span className="text-amber-400 font-semibold">(GEO)</span>
        </motion.p>

        {/* AI Platform Badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="text-sm text-muted-foreground/70 mr-1">Optimize for</span>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-foreground/80">ChatGPT</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-foreground/80">Claude</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-foreground/80">Perplexity</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={onStartFree}
          >
            Analyze My Site
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-semibold text-lg px-8 py-6 transition-all duration-300"
            onClick={() => scrollToSection('june-stack')}
          >
            See the June Stack
          </Button>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl px-6 py-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-xl">8X</span>
            <span className="text-muted-foreground text-sm">SEO rankings</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-xl px-6 py-4">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xl">5X</span>
            <span className="text-muted-foreground text-sm">AEO featured snippets</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl px-6 py-4">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold text-xl">9X</span>
            <span className="text-muted-foreground text-sm">GEO AI citations</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
