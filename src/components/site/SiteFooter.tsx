'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { freeTools } from '@/data/free-tools'
import { blogCategories } from '@/data/blog-posts'

/**
 * SiteFooter — rich multi-column footer for inner pages.
 * Includes: brand, free tools (top 6), resources (blog, pricing, affiliates),
 * company links, and legal. Mirrors the landing footer's visual style.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear()
  const topTools = freeTools.slice(0, 6)

  return (
    <footer className="mt-auto border-t border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="flex flex-col items-start cursor-pointer select-none group mb-3">
              <span className="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                seosights
              </span>
              <span className="text-[7px] tracking-[0.15em] text-purple-400/60 uppercase leading-none mt-0.5">
                AI Visibility Intelligence Platform
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The AI Visibility Intelligence Platform. Track, measure, and improve how AI engines
              recommend your business — every day.
            </p>
          </div>

          {/* Free Tools column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Free Tools
            </h3>
            <ul className="space-y-2">
              {topTools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/free-ai-seo-tools/${tool.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/free-ai-seo-tools"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  View all →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              {blogCategories.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/blog#${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/prompt-library"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Prompt Library
                </Link>
              </li>
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/affiliates"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Affiliates
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@seosights.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {year} seosights. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              Terms
            </a>
            <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5">
              Built with <span className="text-purple-400 font-medium">seosights</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
