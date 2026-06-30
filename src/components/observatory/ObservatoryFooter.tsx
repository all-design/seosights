'use client'

import { Satellite, Github, Twitter, Mail, Rss } from 'lucide-react'

export default function ObservatoryFooter() {
  const currentYear = new Date().getFullYear()

  const links = {
    Research: [
      { label: 'Latest Findings', href: '#observatory-pulse' },
      { label: 'AI Search Weather', href: '#observatory-weather' },
      { label: 'Observatory Index', href: '#observatory-index' },
      { label: 'Public Charts', href: '#observatory-charts' },
      { label: 'Archive', href: '#observatory-archive' },
    ],
    API: [
      { label: 'Public API Docs', href: '#' },
      { label: 'Latest Research', href: '#' },
      { label: 'Models Endpoint', href: '#' },
      { label: 'Industries Endpoint', href: '#' },
    ],
    About: [
      { label: 'Methodology', href: '#observatory-methodology' },
      { label: 'Data Integrity', href: '#observatory-methodology' },
      { label: 'Citation Warehouse', href: '#observatory-archive' },
      { label: 'SeoSights', href: '/' },
    ],
  }

  return (
    <footer className="bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Satellite className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-bold text-sm">AI Search Observatory™</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Independent research center that daily analyzes the behavior of leading AI models
              based on real queries. Only findings with sufficient evidence and statistical weight
              are published.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="RSS Feed"
              >
                <Rss className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-700">
            © {currentYear} AI Search Observatory™ by SeoSights. All data collected from public AI
            model responses.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-700">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Systems Operational
            </span>
            <span>API v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
