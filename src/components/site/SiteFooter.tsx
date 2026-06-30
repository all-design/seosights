'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

/**
 * SiteFooter — SEO platform footer with all category links.
 * Every section is an SEO entry point: Tools, Industries, Compare, Benchmarks, Directory, Resources.
 * Data is referenced from real routes for maximum crawlability.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Main grid: Brand + 6 columns ────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-10">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex flex-col items-start cursor-pointer select-none group mb-3">
              <span className="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                seosights
              </span>
              <span className="text-[7px] tracking-[0.15em] text-emerald-400/60 uppercase leading-none mt-0.5">
                AI Visibility Intelligence Platform
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
              Understand, measure and improve how AI recommends your business.
            </p>
          </div>

          {/* ── Free Tools ──────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Free Tools
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/tools" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium">All Tools →</Link></li>
              <li><Link href="/free-ai-seo-tools/ai-visibility-checker" className="text-xs text-muted-foreground hover:text-foreground transition-colors">AI Visibility Checker</Link></li>
              <li><Link href="/free-ai-seo-tools/llms-txt-generator" className="text-xs text-muted-foreground hover:text-foreground transition-colors">llms.txt Generator</Link></li>
              <li><Link href="/free-ai-seo-tools/schema-generator" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Schema Generator</Link></li>
              <li><Link href="/free-ai-seo-tools/robots-txt-tester" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Robots.txt Tester</Link></li>
              <li><Link href="/free-ai-seo-tools/gptbot-checker" className="text-xs text-muted-foreground hover:text-foreground transition-colors">GPTBot Checker</Link></li>
              <li><Link href="/free-ai-seo-tools/claudebot-checker" className="text-xs text-muted-foreground hover:text-foreground transition-colors">ClaudeBot Checker</Link></li>
              <li><Link href="/free-ai-seo-tools/faq-generator" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ Generator</Link></li>
              <li><Link href="/free-ai-seo-tools/entity-extractor" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Entity Extractor</Link></li>
              <li><Link href="/free-ai-seo-tools/brand-authority-checker" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Brand Authority Checker</Link></li>
              <li><Link href="/free-ai-seo-tools/chatgpt-citation-checker" className="text-xs text-muted-foreground hover:text-foreground transition-colors">ChatGPT Citation Checker</Link></li>
            </ul>
          </div>

          {/* ── Industries ──────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Industries
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/industries" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium">All Industries →</Link></li>
              <li><Link href="/industries/dentists" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dentists</Link></li>
              <li><Link href="/industries/lawyers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Lawyers</Link></li>
              <li><Link href="/industries/saas" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SaaS</Link></li>
              <li><Link href="/industries/hotels" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Hotels</Link></li>
              <li><Link href="/industries/ecommerce" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Ecommerce</Link></li>
              <li><Link href="/industries/clinics" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clinics</Link></li>
              <li><Link href="/industries/agencies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Agencies</Link></li>
              <li><Link href="/industries/universities" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Universities</Link></li>
              <li><Link href="/industries/real-estate" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Real Estate</Link></li>
              <li><Link href="/industries/insurance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Insurance</Link></li>
            </ul>
          </div>

          {/* ── Compare ─────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Compare
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/compare" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium">All Comparisons →</Link></li>
              <li><Link href="/compare/ahrefs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SeoSights vs Ahrefs</Link></li>
              <li><Link href="/compare/semrush" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SeoSights vs Semrush</Link></li>
              <li><Link href="/compare/surfer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SeoSights vs Surfer</Link></li>
              <li><Link href="/compare/profound" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SeoSights vs Profound</Link></li>
              <li><Link href="/compare/goodie" className="text-xs text-muted-foreground hover:text-foreground transition-colors">SeoSights vs Goodie</Link></li>
            </ul>
          </div>

          {/* ── Benchmarks ──────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Benchmarks
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/benchmarks" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium">All Rankings →</Link></li>
              <li><Link href="/benchmarks/dentists" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top Dentists</Link></li>
              <li><Link href="/benchmarks/law-firms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top Law Firms</Link></li>
              <li><Link href="/benchmarks/saas" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top SaaS</Link></li>
              <li><Link href="/benchmarks/hotels" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top Hotels</Link></li>
              <li><Link href="/benchmarks/agencies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top Agencies</Link></li>
              <li><Link href="/benchmarks/ecommerce" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top Ecommerce</Link></li>
            </ul>
          </div>

          {/* ── Directory ───────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Directory
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/directory" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium">AI Visibility Directory™ →</Link></li>
              <li><Link href="/directory?engine=chatgpt" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top by ChatGPT</Link></li>
              <li><Link href="/directory?engine=claude" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top by Claude</Link></li>
              <li><Link href="/directory?engine=gemini" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top by Gemini</Link></li>
              <li><Link href="/directory?engine=perplexity" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Top by Perplexity</Link></li>
              <li><Link href="/directory?location=usa" className="text-xs text-muted-foreground hover:text-foreground transition-colors">USA</Link></li>
              <li><Link href="/directory?location=europe" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Europe</Link></li>
              <li><Link href="/directory?location=serbia" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Serbia</Link></li>
            </ul>
          </div>

          {/* ── Resources & Company ─────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Resources
            </h3>
            <ul className="space-y-1.5">
              <li><Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/observatory" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Observatory</Link></li>
              <li><Link href="/prompt-library" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Prompt Library</Link></li>
              <li><Link href="/api" className="text-xs text-muted-foreground hover:text-foreground transition-colors">API Docs</Link></li>
              <li><Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/affiliates" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Affiliates</Link></li>
              <li><Link href="/os" className="text-xs text-muted-foreground hover:text-foreground transition-colors">AI Visibility OS</Link></li>
              <li><Link href="/status" className="text-xs text-muted-foreground hover:text-foreground transition-colors">System Status</Link></li>
              <li><a href="mailto:hello@seosights.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        {/* ── Bottom bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {year} seosights. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
              Terms
            </a>
            <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5">
              Verified by <span className="text-emerald-400 font-medium">Observatory™</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
