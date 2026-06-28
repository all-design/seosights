import type { Metadata } from 'next'
import Link from 'next/link'
import { freeTools, freeToolCategories } from '@/data/free-tools'
import { ArrowRight, Gift, Sparkles, Zap } from 'lucide-react'
import FreeToolsHubClient from './free-tools-hub-client'

const SITE_URL = 'https://seosights.com'

export const metadata: Metadata = {
  title: 'Free AI SEO Tools — 10 Free AEO, GEO & LLM Visibility Tools | seosights',
  description:
    '10 free AI SEO tools — AI Visibility Checker, llms.txt Generator, Schema Generator, Robots.txt Tester, GPTBot Checker, ClaudeBot Checker, GEO Audit, AEO Audit, and more. No signup required.',
  keywords: [
    'free ai seo tools',
    'free aeo tools',
    'free geo tools',
    'ai visibility checker',
    'llms.txt generator',
    'schema generator',
    'robots.txt tester',
    'gptbot checker',
    'claudebot checker',
    'geo audit',
    'aeo audit',
  ],
  alternates: { canonical: '/free-ai-seo-tools' },
  openGraph: {
    title: 'Free AI SEO Tools — 10 Free AEO, GEO & LLM Visibility Tools',
    description:
      '10 free AI SEO tools. AI Visibility Checker, llms.txt Generator, Schema Generator, Robots.txt Tester, and more. No signup required.',
    url: `${SITE_URL}/free-ai-seo-tools`,
    type: 'website',
    images: [{ url: '/og-image.png', width: 1344, height: 768, alt: 'Free AI SEO Tools by seosights' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI SEO Tools — 10 Free AEO, GEO & LLM Visibility Tools',
    description: '10 free AI SEO tools. No signup required. Run instant AEO, GEO, and AI visibility checks.',
    images: ['/og-image.png'],
  },
}

// JSON-LD ItemList of all free tools
const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Free AI SEO Tools',
  description:
    '10 free AI SEO tools for AEO, GEO, and LLM visibility. No signup required.',
  itemListElement: freeTools.map((tool, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/free-ai-seo-tools/${tool.slug}`,
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Free AI SEO Tools', item: `${SITE_URL}/free-ai-seo-tools` },
  ],
}

export default function FreeToolsHubPage() {
  const liveCount = freeTools.filter((t) => t.status === 'live').length

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm rounded-full mb-6">
            <Gift className="w-3.5 h-3.5" />
            Free Forever · No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Free AI SEO Tools
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              for the AI Search Era
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            {freeTools.length} free tools to audit your AI visibility, fix crawlability, generate
            schema and llms.txt, and benchmark against competitors. {liveCount} are live now — the
            rest ship monthly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/free-ai-seo-tools/${freeTools[0].slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              <Zap className="w-4 h-4" />
              Try the AI Visibility Checker
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-foreground font-semibold rounded-lg transition-all duration-300"
            >
              See paid plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tools grid with category filter (client) */}
      <FreeToolsHubClient tools={freeTools} categories={freeToolCategories} />

      {/* Why use our free tools */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why use our free tools?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by the same team that powers the seosights 8-agent platform. Free forever, no
              credit card, no email wall.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'No signup, no credit card',
                description:
                  'Every tool runs instantly in your browser. We rate-limit by IP to keep the service fast for everyone — that is the only gate.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
              {
                icon: Zap,
                title: 'Real results in 30 seconds',
                description:
                  'No mock data, no fake demos. The AI Visibility Checker and Robots.txt Tester fetch your real site and probe real answer engines.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
              {
                icon: Gift,
                title: 'Built to be shared',
                description:
                  'Every check produces a shareable URL. Bookmark it, send it to your team, or drop it in a client report.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/15',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/25 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 relative bg-gradient-to-b from-background to-amber-950/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Are these tools really free?',
                a: 'Yes. Every tool on this page is free forever, with no signup and no credit card. We rate-limit by IP to keep the service fast. Sign up for a free trial only if you want scheduled re-checks, alerts, and historical trending.',
              },
              {
                q: 'Do the tools work on any website?',
                a: 'Yes. Enter any public URL — your own site, a competitor, or a client. The tools only see what a crawler can see, so they work equally well on any public web page.',
              },
              {
                q: 'How often are new tools added?',
                a: 'We ship a new free tool roughly every month. Coming-soon tools on this page are in active development and will go live in the next 30-60 days.',
              },
              {
                q: 'What is the difference between the free tools and the paid platform?',
                a: 'The free tools are single-purpose utilities — they run one check, one time. The paid platform runs all checks continuously, alerts you when something changes, tracks competitors, and gives you a 90-day auto-executed roadmap. Free tools are the appetizer; the platform is the full meal.',
              },
              {
                q: 'Can I use these tools for client work?',
                a: 'Yes. The free tools are perfect for quick client audits and lead-gen reports. Agency customers on the $199 plan get white-label PDF exports of every check, plus unlimited client domains.',
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
              >
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 p-8 sm:p-12 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready for the full{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Three Sights
              </span>{' '}
              audit?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Free tools are great for spot checks. The seosights platform runs all checks
              continuously, alerts you when something changes, and ships a 90-day auto-executed
              roadmap.
            </p>
            <Link
              href="/#cta"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-300"
            >
              Start 14-day free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
