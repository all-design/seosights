'use client'

import { motion } from 'framer-motion'
import {
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  Bot,
  Globe,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── Mock Data ──────────────────────────────────────────────────────────

const metaTags = [
  { page: '/', title: 'SeoSights — AI Visibility Platform', description: 'Get found by AI, not just search engines. The first AI visibility audit tool.', issues: null },
  { page: '/features', title: 'Features — SeoSights', description: 'Explore our AI-powered visibility tools.', issues: 'Description too short (42 chars, recommended 120-160)' },
  { page: '/pricing', title: 'Pricing', description: 'Choose the plan that fits your needs. From free to enterprise.', issues: 'Title missing brand name' },
  { page: '/blog', title: 'Blog — SeoSights', description: '', issues: 'Missing meta description' },
  { page: '/docs', title: 'API Documentation', description: 'Learn how to integrate SeoSights API into your workflow.', issues: 'Title missing brand name' },
  { page: '/about', title: 'About Us', description: 'We are building the future of AI visibility.', issues: 'Description too short (42 chars) and title missing brand' },
]

const schemaMarkup = [
  { type: 'Organization', status: 'valid', detail: 'Properly structured with name, url, logo' },
  { type: 'WebSite', status: 'valid', detail: 'SearchAction potential action defined' },
  { type: 'BreadcrumbList', status: 'valid', detail: 'Present on all pages except blog' },
  { type: 'FAQPage', status: 'invalid', detail: 'Missing required "mainEntity" property' },
  { type: 'SoftwareApplication', status: 'valid', detail: 'Properly structured on pricing page' },
  { type: 'Article', status: 'invalid', detail: 'Blog posts missing datePublished field' },
]

const canonicalUrls = [
  { page: '/', canonical: 'https://seo.com/', status: 'pass' },
  { page: '/features', canonical: 'https://seo.com/features', status: 'pass' },
  { page: '/pricing', canonical: 'https://seo.com/pricing', status: 'pass' },
  { page: '/blog', canonical: 'https://seo.com/blog', status: 'fail', issue: 'Points to /blog/page/1 instead of /blog' },
  { page: '/docs', canonical: 'https://seo.com/docs', status: 'pass' },
  { page: '/about', canonical: 'https://seo.com/about', status: 'pass' },
]

const internalLinks = {
  totalPages: 47,
  totalLinks: 312,
  avgLinksPerPage: 6.6,
  orphanPages: 3,
  brokenLinks: 2,
  deepLinks: 8,
  issues: [
    '3 pages have no internal links pointing to them (orphan pages)',
    '2 broken internal links return 404',
    '8 pages are 4+ clicks from homepage (deep pages)',
    'Blog posts don\'t interlink with product pages',
  ],
}

const robotsTxt = {
  status: 'valid',
  sitemap: 'Found at /sitemap.xml',
  disallowed: ['/admin', '/api', '/internal'],
  allowed: ['/', '/features', '/pricing', '/blog', '/docs'],
  issues: [
    'Crawl-delay not set — may be crawled too aggressively',
    '/blog/tag/ paths not disallowed — creates thin pages',
  ],
}

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Main SEO Page ──────────────────────────────────────────────────────

export function SEOPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <Search className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">SEO Score</p>
                <span className="text-5xl font-bold text-teal-400 tracking-tighter">89</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Meta Tags Table ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Meta Tags</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Page</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Title</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Description</th>
                    <th className="text-left text-zinc-500 font-medium pb-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {metaTags.map((tag) => (
                    <tr key={tag.page} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-3 text-zinc-300 font-mono">{tag.page}</td>
                      <td className="py-2.5 pr-3 text-zinc-400 max-w-[180px] truncate">{tag.title}</td>
                      <td className="py-2.5 pr-3 text-zinc-500 max-w-[200px] truncate">{tag.description || <span className="text-red-400">Missing</span>}</td>
                      <td className="py-2.5">
                        {tag.issues ? (
                          <span className="text-amber-400 text-[10px]">{tag.issues}</span>
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Schema Markup + Canonical URLs Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Schema Markup */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Schema Markup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <span className="text-2xl font-bold text-emerald-400">{schemaMarkup.filter(s => s.status === 'valid').length}</span>
                  <p className="text-[10px] text-zinc-500 mt-1">Valid Schemas</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                  <span className="text-2xl font-bold text-red-400">{schemaMarkup.filter(s => s.status === 'invalid').length}</span>
                  <p className="text-[10px] text-zinc-500 mt-1">Invalid Schemas</p>
                </div>
              </div>
              <div className="space-y-1">
                {schemaMarkup.map((schema) => (
                  <div key={schema.type} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    {schema.status === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-zinc-300 font-mono flex-1">{schema.type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Canonical URLs */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-teal-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Canonical URLs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {canonicalUrls.map((url) => (
                  <div key={url.page} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    {url.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs text-zinc-300 font-mono flex-1">{url.page}</span>
                    {url.status === 'fail' && (
                      <span className="text-[10px] text-amber-400">{url.issue}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Internal Links Analysis ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-teal-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Internal Links Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40 text-center">
                <span className="text-xl font-bold text-zinc-200">{internalLinks.totalPages}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Total Pages</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40 text-center">
                <span className="text-xl font-bold text-zinc-200">{internalLinks.totalLinks}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Total Links</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                <span className="text-xl font-bold text-red-400">{internalLinks.orphanPages}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Orphan Pages</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                <span className="text-xl font-bold text-amber-400">{internalLinks.brokenLinks}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Broken Links</p>
              </div>
            </div>
            <div className="space-y-2">
              {internalLinks.issues.map((issue, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-zinc-400">{issue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Robots.txt Status ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Robots.txt Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  {robotsTxt.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Sitemap</p>
                <span className="text-xs text-teal-400">{robotsTxt.sitemap}</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Disallowed Paths</p>
                <span className="text-xs text-zinc-400 font-mono">{robotsTxt.disallowed.join(', ')}</span>
              </div>
            </div>
            {robotsTxt.issues.length > 0 && (
              <div className="space-y-2">
                {robotsTxt.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-zinc-400">{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
