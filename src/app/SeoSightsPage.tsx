'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Eye,
  TrendingUp,
  ArrowRight,
  Satellite,
  Sparkles,
  Shield,
  BarChart3,
  CheckCircle2,
  Globe,
  Brain,
  Zap,
  Star,
} from 'lucide-react'

const MODEL_COLORS: Record<string, { label: string; color: string }> = {
  chatgpt: { label: 'ChatGPT', color: '#10b981' },
  claude: { label: 'Claude', color: '#f59e0b' },
  gemini: { label: 'Gemini', color: '#8b5cf6' },
  perplexity: { label: 'Perplexity', color: '#06b6d4' },
  grok: { label: 'Grok', color: '#ef4444' },
  deepseek: { label: 'DeepSeek', color: '#3b82f6' },
}

export default function SeoSightsPage() {
  const [scanUrl, setScanUrl] = useState('')

  const handleScan = () => {
    if (!scanUrl.trim()) return
    alert(`Starting AI visibility analysis for: ${scanUrl}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">SeoSights</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 bg-emerald-50 hidden sm:inline-flex">
                AI VISIBILITY INTELLIGENCE
              </Badge>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <Link href="/observatory" className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5">
                Observatory
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-emerald-500/30 text-emerald-600 bg-emerald-50">RESEARCH</Badge>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-sm h-8">
                <Zap className="w-3.5 h-3.5" />
                Analyze Site
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <Badge variant="outline" className="mb-6 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              <Sparkles className="w-3 h-3 mr-1" />
              The AI Visibility Intelligence Platform
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
              Will AI <span className="text-emerald-400">recommend</span> your business?
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              ChatGPT, Claude, Gemini & Perplexity answer millions of buyer questions every day.
              Your <strong className="text-white">AI Visibility Score</strong> tells you whether you&apos;re the answer — and shows you exactly how to become it.
            </p>

            {/* CTA Input */}
            <div className="max-w-lg mx-auto flex gap-2 mb-4">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Enter your website URL (e.g. domain.com)"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="h-12 pl-10 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-6 shrink-0 gap-1.5"
                onClick={handleScan}
              >
                <Zap className="w-4 h-4" />
                Try Free Demo
              </Button>
            </div>

            <p className="text-xs text-slate-600 mb-10">
              No signup required · 20-second scan · See your AI Visibility Score instantly
            </p>

            {/* Tracked AI Models */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mb-10">
              <span className="text-xs text-slate-600 uppercase tracking-wider">Tracked across</span>
              {Object.values(MODEL_COLORS).map((model) => (
                <div key={model.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                  <span className="text-sm text-slate-400 font-medium">{model.label}</span>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-500">Loved by marketers worldwide</p>
              <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
                {[
                  { value: '1,200+', label: 'Active Marketers' },
                  { value: '500+', label: 'Agencies' },
                  { value: '34', label: 'Countries' },
                  { value: '50M', label: 'URLs Analyzed' },
                  { value: '6+', label: 'AI Engines Tracked' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-emerald-400 font-bold text-lg sm:text-xl">{stat.value}</div>
                    <div className="text-slate-600 text-[10px] uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Three Pillars ───────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Understand. Measure. Improve.</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Everything you need to make AI models recommend your business</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                label: 'Understand',
                description: 'See how AI models recommend your business. Every citation. Every shift. Every competitor.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                items: ['AI Citation Tracker', 'Competitor Analysis', 'Source Monitoring', 'Entity Detection'],
              },
              {
                icon: BarChart3,
                label: 'Measure',
                description: 'Track your AI visibility with real-time data, industry benchmarks, and Observatory Index™ scores.',
                color: 'text-cyan-500',
                bg: 'bg-cyan-50',
                border: 'border-cyan-200',
                items: ['AI Visibility Score™', 'Industry Benchmarks', 'AI Search Weather™', 'Daily Metrics'],
              },
              {
                icon: TrendingUp,
                label: 'Improve',
                description: 'Get actionable recommendations. Content Engine creates, optimizes, and publishes — automatically.',
                color: 'text-amber-500',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                items: ['Content Engine', 'Auto-Execute Actions', 'Schema Generation', 'FAQ Optimization'],
              },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border ${pillar.border} hover:shadow-lg transition-all h-full`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-xl ${pillar.bg}`}>
                        <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                      </div>
                      <h3 className={`text-xl font-bold ${pillar.color}`}>{pillar.label}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{pillar.description}</p>
                    <ul className="space-y-2">
                      {pillar.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Three steps to AI visibility mastery</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Scan', desc: 'Enter your URL. We analyze how 6+ AI models see, cite, and recommend your business.', icon: Globe },
              { step: '2', title: 'Discover', desc: 'See your AI Visibility Score, citation gaps, competitor advantages, and actionable fixes.', icon: Brain },
              { step: '3', title: 'Improve', desc: 'Content Engine executes: FAQ, schema, internal links, content — automatically or with approval.', icon: Zap },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-emerald-500 mb-1">STEP {s.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────── */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Built for AI Visibility</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Every feature designed for one goal: make AI models recommend your business</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Eye, title: 'AI Citation Tracker', desc: 'See every time AI models mention you' },
              { icon: Shield, title: 'Visibility Score™', desc: 'Industry-standard AI visibility metric' },
              { icon: BarChart3, title: 'Industry Benchmarks', desc: 'Compare against your competitors' },
              { icon: Satellite, title: 'AI Search Weather', desc: 'Daily AI model stability index' },
              { icon: Zap, title: 'Content Engine', desc: 'Auto-create AI-optimized content' },
              { icon: Brain, title: 'Auto-Execute', desc: 'Publish changes directly to your CMS' },
              { icon: Sparkles, title: 'Schema Generator', desc: 'FAQ, Article, and Entity markup' },
              { icon: TrendingUp, title: 'Growth Brain', desc: 'AI learns what works and improves' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all h-full">
                  <CardContent className="p-5">
                    <f.icon className="w-5 h-5 text-emerald-500 mb-3" />
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">{f.title}</h4>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Observatory: The Proof ──────────────────────────────── */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              <Satellite className="w-3 h-3 mr-1" />
              AI Search Observatory™
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              The Research Behind the Platform
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Our independent research center daily analyzes the behavior of leading AI models.
              Real data. Real methodology. This is what powers SeoSights recommendations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'AI Models Tracked', value: '6+', icon: Brain },
                { label: 'Responses Archived', value: '12K+', icon: Eye },
                { label: 'Industries Indexed', value: '12', icon: BarChart3 },
                { label: 'Research Citations', value: '127', icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <stat.icon className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <Link href="/observatory">
              <Button size="lg" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 gap-2">
                <Satellite className="w-4 h-4" />
                Explore Observatory
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Simple Pricing</h2>
            <p className="text-slate-600">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Free Trial', price: '$0', period: '14 days', features: ['1 website', 'AI Visibility Scan', 'Basic citations', 'Weekly reports'], cta: 'Start Free', popular: false },
              { name: 'Starter', price: '$49', period: '/month', features: ['3 websites', 'Full AI tracking', 'Content Engine', 'Auto-execute', 'Email alerts'], cta: 'Get Started', popular: true },
              { name: 'Pro', price: '$149', period: '/month', features: ['Unlimited websites', 'Agency dashboard', 'White-label reports', 'API access', 'Priority support'], cta: 'Go Pro', popular: false },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-left">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to see how AI sees you?
          </h2>
          <p className="text-slate-600 mb-8">
            Join 1,200+ marketers who are already tracking and improving their AI visibility.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
              <Zap className="w-4 h-4" />
              Start Free Scan
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/observatory">
              <Button variant="outline" size="lg" className="gap-2">
                <Satellite className="w-4 h-4" />
                View Observatory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white text-sm">SeoSights</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Helps companies understand, measure and improve how AI models recommend their business.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-xs text-slate-500 hover:text-slate-300">Features</a></li>
                <li><a href="#pricing" className="text-xs text-slate-500 hover:text-slate-300">Pricing</a></li>
                <li><a href="#how-it-works" className="text-xs text-slate-500 hover:text-slate-300">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Research</h4>
              <ul className="space-y-2">
                <li><Link href="/observatory" className="text-xs text-slate-500 hover:text-slate-300">Observatory</Link></li>
                <li><a href="#" className="text-xs text-slate-500 hover:text-slate-300">AI Search Weather</a></li>
                <li><a href="#" className="text-xs text-slate-500 hover:text-slate-300">Methodology</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-slate-500 hover:text-slate-300">About</a></li>
                <li><a href="#" className="text-xs text-slate-500 hover:text-slate-300">Blog</a></li>
                <li><a href="#" className="text-xs text-slate-500 hover:text-slate-300">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} SeoSights. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <Link href="/observatory" className="flex items-center gap-1 hover:text-slate-400 transition-colors">
                <Satellite className="w-3 h-3" />
                ai.seosights.com
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
