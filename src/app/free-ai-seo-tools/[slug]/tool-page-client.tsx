'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import IconRenderer from '@/components/site/IconRenderer'
import {
  ArrowRight,
  ChevronRight,
  Check,
  Clock,
  Mail,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { FreeTool } from '@/data/free-tools'

// Deterministic pseudo-random from a string — so the same URL produces the same score
function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function genScore(url: string): number {
  return 25 + (hashString(url) % 71) // 25-95
}

interface EngineResult {
  name: string
  emoji: string
  cited: boolean
  score: number
  snippet: string
}

function generateEngineResults(url: string, slug: string): EngineResult[] {
  const base = genScore(url)
  const domain = (() => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  })()
  const engines = [
    { name: 'ChatGPT', emoji: '🤖' },
    { name: 'Claude', emoji: '🧠' },
    { name: 'Perplexity', emoji: '🔮' },
    { name: 'Google AI Overviews', emoji: '🔍' },
  ]
  return engines.map((e, i) => {
    const seed = hashString(url + e.name) % 100
    const cited = seed > 35
    const score = cited ? Math.min(100, base + (seed % 25) - 12) : Math.max(0, base - 30 - (seed % 20))
    const snippets = cited
      ? [
          `Based on analysis from ${domain}, the answer highlights key features and recent updates.`,
          `${domain} is mentioned as a notable option in this category, with emphasis on its AI-focused approach.`,
          `According to ${domain}, the recommended approach balances performance with long-term maintainability.`,
          `Sources including ${domain} suggest that the latest best practices emphasize entity clarity and schema markup.`,
        ]
      : [
          `No direct citation found for ${domain} in this answer. Competitors were cited instead.`,
          `${domain} was not mentioned. The answer drew from general knowledge and other sources.`,
          `This answer did not cite ${domain}. Consider strengthening entity signals and FAQ schema.`,
        ]
    return {
      name: e.name,
      emoji: e.emoji,
      cited,
      score: Math.max(0, Math.min(100, score)),
      snippet: snippets[hashString(url + e.name) % snippets.length],
    }
  })
}

function generateRobotsResults(url: string): { bot: string; allowed: boolean; rule: string }[] {
  const domain = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()
  const seed = hashString(domain)
  const bots = [
    'GPTBot',
    'ClaudeBot',
    'anthropic-ai',
    'PerplexityBot',
    'Google-Extended',
    'CCBot',
    'Bytespider',
    'Applebot-Extended',
    'Claude-Web',
    'cohere-ai',
    'Meta-ExternalAgent',
    'Amazonbot',
    'Diffbot',
    'Omgilibot',
    'FacebookBot',
    'ImagesiftBot',
    'OAI-SearchBot',
  ]
  return bots.map((bot, i) => {
    const s = (seed + i * 7) % 100
    const allowed = s > 25
    return {
      bot,
      allowed,
      rule: allowed
        ? `No specific Disallow rule found for User-agent: ${bot}`
        : `User-agent: ${bot}\nDisallow: /`,
    }
  })
}

export default function ToolPageClient({
  tool,
  related,
}: {
  tool: FreeTool
  related: FreeTool[]
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<unknown>(null)
  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setResults(null)
    setTimeout(() => {
      if (tool.slug === 'ai-visibility-checker') {
        setResults({ type: 'visibility', engines: generateEngineResults(input, tool.slug), score: genScore(input) })
      } else if (tool.slug === 'robots-txt-tester') {
        setResults({ type: 'robots', bots: generateRobotsResults(input) })
      } else if (tool.slug === 'gptbot-checker' || tool.slug === 'claudebot-checker') {
        const bots = generateRobotsResults(input)
        const target = tool.slug === 'gptbot-checker' ? 'GPTBot' : 'ClaudeBot'
        const match = bots.find((b) => b.bot === target) || bots[0]
        setResults({ type: 'single-bot', target, ...match })
      } else {
        setResults({ type: 'generic', message: tool.resultsIntro })
      }
      setLoading(false)
    }, 1200)
  }

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setNotified(true)
  }

  return (
    <article>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/free-ai-seo-tools" className="hover:text-foreground transition-colors">Free AI SEO Tools</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">{tool.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/5 to-background" />
        <div className={`absolute top-1/4 left-1/3 w-[400px] h-[400px] ${tool.bg} rounded-full blur-[150px] opacity-50`} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${tool.bg} flex items-center justify-center shrink-0`}>
                <IconRenderer name={tool.icon} className={`w-8 h-8 ${tool.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl sm:text-4xl font-bold">{tool.name}</h1>
                  {tool.status === 'live' ? (
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10">
                      Coming soon
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>
            <p className="text-base text-muted-foreground/90 leading-relaxed max-w-3xl">
              {tool.description}
            </p>

            {/* Interactive widget — live tools get real input, coming-soon gets email signup */}
            {tool.status === 'live' ? (
              <form onSubmit={handleRun} className="w-full max-w-2xl">
                <label htmlFor="tool-input" className="block text-sm font-medium text-foreground mb-2">
                  {tool.inputLabel}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="tool-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={tool.inputPlaceholder}
                    className="flex-1 px-4 py-3 min-h-[48px] rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 min-h-[48px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {tool.ctaText}
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Free · No signup · Results in seconds
                </p>
              </form>
            ) : (
              <div className="w-full max-w-2xl">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">This tool is coming soon</h3>
                        <p className="text-sm text-muted-foreground">
                          We are shipping new tools every month. Drop your email and we will notify
                          you the moment this one goes live.
                        </p>
                      </div>
                    </div>
                    {notified ? (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">You are on the list. We will email you when it launches.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="flex-1 px-4 py-3 min-h-[48px] rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                          required
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 min-h-[48px] inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-foreground font-semibold rounded-lg transition-all duration-300"
                        >
                          <Mail className="w-4 h-4" />
                          Notify me
                        </button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results — appears after running the tool */}
      <AnimatePresence>
        {results && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-6">{tool.resultsIntro}</h2>
              <ResultsRenderer results={results} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* What is this tool */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">What is {tool.name}?</h2>
          <div className="prose prose-invert max-w-none">
            {tool.longDescription.split('\n\n').map((para, i) => (
              <p key={i} className="text-base text-muted-foreground leading-relaxed mb-4">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-gradient-to-b from-background to-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">How it works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tool.howItWorks.map((step, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center mb-3`}>
                    <span className={`text-sm font-bold ${tool.color}`}>{i + 1}</span>
                  </div>
                  <h3 className="font-semibold mb-1.5 text-sm">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key benefits */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Key benefits</h2>
          <ul className="space-y-3">
            {tool.keyBenefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full ${tool.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Check className={`w-3 h-3 ${tool.color}`} />
                </div>
                <span className="text-base text-muted-foreground leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gradient-to-b from-background to-amber-950/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            {tool.name} FAQ
          </h2>
          <div className="space-y-3">
            {tool.faq.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm sm:text-base">{item.question}</span>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related tools */}
      {related.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">Related free tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((rel) => (
                <RelatedToolCard key={rel.slug} tool={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-12 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 p-8 backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Run the full Three Sights audit
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
              Free tools are spot checks. The seosights platform runs all checks continuously,
              alerts you when something changes, and ships a 90-day auto-executed roadmap.
            </p>
            <Link
              href="/#cta"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              Start 14-day free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-3 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              No credit card required
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}

// Standalone component for related tool cards
function RelatedToolCard({ tool }: { tool: FreeTool }) {
  return (
    <Link href={`/free-ai-seo-tools/${tool.slug}`}>
      <Card className="bg-white/5 border-white/10 hover:border-white/25 hover:-translate-y-1 transition-all duration-300 h-full group cursor-pointer">
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center`}>
            <IconRenderer name={tool.icon} className={`w-5 h-5 ${tool.color}`} />
          </div>
          <h3 className="font-bold text-sm">{tool.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{tool.tagline}</p>
          <span className={`text-xs font-medium ${tool.color} flex items-center gap-1 group-hover:gap-2 transition-all`}>
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

function ResultsRenderer({ results }: { results: unknown }) {
  const r = results as {
    type: string
    engines?: { name: string; emoji: string; cited: boolean; score: number; snippet: string }[]
    score?: number
    bots?: { bot: string; allowed: boolean; rule: string }[]
    target?: string
    allowed?: boolean
    rule?: string
    message?: string
  }

  if (r.type === 'visibility' && r.engines) {
    const overall = r.score || 0
    const color = overall >= 70 ? 'text-emerald-400' : overall >= 40 ? 'text-amber-400' : 'text-rose-400'
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall AI Visibility Score</p>
            <div className={`text-6xl font-bold ${color} mb-2`}>{overall}</div>
            <p className="text-sm text-muted-foreground">
              {overall >= 70
                ? 'Strong — you are cited by most engines on most prompts.'
                : overall >= 40
                  ? 'Moderate — there is clear room to grow. Focus on schema and directness.'
                  : 'Low — start by unblocking AI crawlers and adding FAQ schema.'}
            </p>
          </CardContent>
        </Card>
        <div className="grid sm:grid-cols-2 gap-4">
          {r.engines.map((e) => (
            <Card key={e.name} className="bg-white/5 border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{e.emoji}</span>
                    <span className="font-semibold">{e.name}</span>
                  </div>
                  {e.cited ? (
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                      Cited
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-500/50 text-rose-400 bg-rose-500/10">
                      Not cited
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${e.cited ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${e.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{e.score}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">"{e.snippet}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 text-center">
          Demo results — scores are generated deterministically from your URL. The full platform
          probes real answer engines with your chosen prompts.
        </p>
      </div>
    )
  }

  if (r.type === 'robots' && r.bots) {
    const allowedCount = r.bots.filter((b) => b.allowed).length
    return (
      <div className="space-y-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI crawler access summary</p>
                <p className="text-2xl font-bold">
                  <span className="text-emerald-400">{allowedCount}</span>
                  <span className="text-muted-foreground"> / {r.bots.length} bots allowed</span>
                </p>
              </div>
              <div className={`text-4xl ${allowedCount >= 12 ? 'text-emerald-400' : allowedCount >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
                {allowedCount >= 12 ? '✓' : allowedCount >= 6 ? '⚠' : '✕'}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {r.bots.map((b) => (
            <div
              key={b.bot}
              className={`rounded-lg border p-3 ${b.allowed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-semibold">{b.bot}</span>
                {b.allowed ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-rose-400 text-lg leading-none">×</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 font-mono">{b.rule}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 text-center">
          Demo results — bot access is simulated. The full platform fetches your real robots.txt
          and parses it against RFC 9309.
        </p>
      </div>
    )
  }

  if (r.type === 'single-bot' && r.target) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">{r.target} status for your site</p>
          {r.allowed ? (
            <>
              <div className="text-5xl mb-3">✓</div>
              <p className="text-2xl font-bold text-emerald-400 mb-2">Allowed</p>
              <p className="text-sm text-muted-foreground">
                {r.target} can crawl your site. Make sure your content is citation-worthy — run the
                AI Visibility Checker to see if you are actually being cited.
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">×</div>
              <p className="text-2xl font-bold text-rose-400 mb-2">Blocked</p>
              <p className="text-sm text-muted-foreground mb-4">
                Your robots.txt blocks {r.target}. Add the following to allow it:
              </p>
              <pre className="text-left bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
{`User-agent: ${r.target}
Allow: /`}
              </pre>
            </>
          )}
          <p className="text-xs text-muted-foreground/60 mt-4">
            Demo result — status is simulated. The full platform fetches your real robots.txt.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 text-center">
        <p className="text-base text-muted-foreground">{r.message}</p>
      </CardContent>
    </Card>
  )
}
