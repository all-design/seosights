'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Eye,
  Gauge,
  TrendingUp,
  ArrowRight,
  Satellite,
  Sparkles,
  Shield,
  BarChart3,
  CloudSun,
  FileText,
  Zap,
  CheckCircle2,
  Globe,
  Brain,
  Bot,
} from 'lucide-react'

/**
 * seosights.com — The SaaS product landing page.
 * "SeoSights helps companies understand, measure and improve
 *  how AI models recommend their business."
 *
 * Observatory is the proof. OS is the tool. SaaS is the product.
 */
export default function SeoSightsPage() {
  const [scanUrl, setScanUrl] = useState('')

  const handleScan = () => {
    if (!scanUrl.trim()) return
    // In production, this would start an analysis
    alert(`Starting AI visibility analysis for: ${scanUrl}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">SeoSights</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#observatory" className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
                Observatory
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-600 bg-emerald-50">RESEARCH</Badge>
              </a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <a href="?view=observatory" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
                <Satellite className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ai.seosights.com</span>
              </a>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-sm">
                Start Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-white pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 text-emerald-600 border-emerald-200 bg-emerald-50">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Visibility Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
              Understand. Measure. Improve.
              <br />
              <span className="text-emerald-500">How AI recommends you.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              SeoSights helps companies understand, measure and improve how AI models
              recommend their business. Track citations. Fix visibility gaps. Get recommended.
            </p>

            {/* URL Input */}
            <div className="max-w-xl mx-auto flex gap-2">
              <Input
                placeholder="Enter your website URL..."
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="h-12 text-base border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-6 shrink-0"
                onClick={handleScan}
              >
                Scan
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Free AI visibility scan — no credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Three Pillars ───────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                label: 'Understand',
                description: 'See how AI models recommend your business. Every citation. Every shift. Every competitor.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
                items: ['AI Citation Tracker', 'Competitor Analysis', 'Source Monitoring', 'Entity Detection'],
              },
              {
                icon: Gauge,
                label: 'Measure',
                description: 'Track your AI visibility with real-time data, industry benchmarks, and Observatory Index™ scores.',
                color: 'text-cyan-500',
                bg: 'bg-cyan-50',
                items: ['AI Visibility Score™', 'Industry Benchmarks', 'AI Search Weather™', 'Daily Metrics'],
              },
              {
                icon: TrendingUp,
                label: 'Improve',
                description: 'Get actionable recommendations. Content Engine creates, optimizes, and publishes — automatically.',
                color: 'text-amber-500',
                bg: 'bg-amber-50',
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
                <Card className="border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all h-full">
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
              { step: '3', title: 'Improve', desc: 'Content Engine executes: FAQ, schema, internal links, content — automatically or with approval.', icon: Bot },
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

      {/* ── Features Overview ───────────────────────────────────── */}
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
              { icon: CloudSun, title: 'AI Search Weather', desc: 'Daily AI model stability index' },
              { icon: Zap, title: 'Content Engine', desc: 'Auto-create AI-optimized content' },
              { icon: Bot, title: 'Auto-Execute', desc: 'Publish changes directly to your CMS' },
              { icon: FileText, title: 'Schema Generator', desc: 'FAQ, Article, and Entity markup' },
              { icon: Brain, title: 'Growth Brain', desc: 'AI learns what works and improves' },
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
      <section id="observatory" className="py-16 bg-slate-950">
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

            {/* Observatory highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'AI Models Tracked', value: '6+', icon: Brain },
                { label: 'Responses Archived', value: '12K+', icon: FileText },
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

            <a href="?view=observatory">
              <Button size="lg" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 gap-2">
                <Satellite className="w-4 h-4" />
                Explore Observatory
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
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
            Join companies that are already tracking and improving their AI visibility.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
              Start Free Scan
              <ArrowRight className="w-4 h-4" />
            </Button>
            <a href="?view=observatory">
              <Button variant="outline" size="lg" className="gap-2">
                <Satellite className="w-4 h-4" />
                View Observatory
              </Button>
            </a>
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
                <li><a href="?view=observatory" className="text-xs text-slate-500 hover:text-slate-300">Observatory</a></li>
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
              <a href="?view=observatory" className="flex items-center gap-1 hover:text-slate-400 transition-colors">
                <Satellite className="w-3 h-3" />
                ai.seosights.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
