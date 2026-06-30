// ── Shared Compare Data ────────────────────────────────────────────────
// Used by both the Compare API route and the Compare page client component.

export interface Competitor {
  name: string
  slug: string
  color: string
  borderColor: string
  iconColor: string
  differentiator: string
  description: string
}

export type FeatureCheck = { seosights: boolean; [key: string]: boolean }

export interface Feature {
  name: string
  icon: string
  data: FeatureCheck
}

export interface TableHeader {
  key: string
  label: string
  highlight?: boolean
}

export const competitors: Competitor[] = [
  {
    name: 'Ahrefs',
    slug: 'ahrefs',
    color: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400',
    differentiator: 'Backlinks & keywords — not AI recommendations',
    description: 'Ahrefs excels at traditional SEO metrics like backlinks and keyword rankings, but has zero visibility into how AI models recommend businesses.',
  },
  {
    name: 'Semrush',
    slug: 'semrush',
    color: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    differentiator: 'SEO toolkit — blind to AI search',
    description: 'Semrush offers a comprehensive SEO toolkit, but cannot track or improve how ChatGPT, Claude, or Gemini recommend your business.',
  },
  {
    name: 'Surfer SEO',
    slug: 'surfer-seo',
    color: 'from-sky-500/20 to-sky-600/10',
    borderColor: 'border-sky-500/30',
    iconColor: 'text-sky-400',
    differentiator: 'Content optimization — no AI visibility layer',
    description: 'Surfer SEO optimizes content for traditional search, but doesn\'t measure whether AI models actually cite or recommend your content.',
  },
  {
    name: 'Profound',
    slug: 'profound',
    color: 'from-violet-500/20 to-violet-600/10',
    borderColor: 'border-violet-500/30',
    iconColor: 'text-violet-400',
    differentiator: 'AI analytics — no execution engine',
    description: 'Profound offers AI citation tracking but lacks the Auto Execute engine and Mission Control that turns insights into automated actions.',
  },
  {
    name: 'Goodie',
    slug: 'goodie',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    differentiator: 'AI monitoring — limited engine coverage',
    description: 'Goodie monitors some AI mentions, but covers fewer engines and lacks the multi-model scoring methodology of the Observatory.',
  },
  {
    name: 'Jasper',
    slug: 'jasper',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    differentiator: 'AI content writing — no visibility tracking',
    description: 'Jasper generates AI-written content, but provides no insight into whether AI models actually recommend your business to users.',
  },
  {
    name: 'Writer',
    slug: 'writer',
    color: 'from-teal-500/20 to-teal-600/10',
    borderColor: 'border-teal-500/30',
    iconColor: 'text-teal-400',
    differentiator: 'Enterprise AI writing — no search intelligence',
    description: 'Writer focuses on enterprise AI content governance, but doesn\'t track or improve your AI search visibility.',
  },
  {
    name: 'Perplexity Pro',
    slug: 'perplexity-pro',
    color: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    differentiator: 'AI search engine — not a visibility platform',
    description: 'Perplexity is an AI search engine, not a platform to measure and improve how all AI models recommend your business across every engine.',
  },
]

export const features: Feature[] = [
  { name: 'AI Visibility Score', icon: 'Eye', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: true, goodie: true, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'ChatGPT Tracking', icon: 'Brain', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: true, goodie: true, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Claude Tracking', icon: 'Cpu', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Gemini Tracking', icon: 'Zap', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: true, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Citation Monitoring', icon: 'FileText', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: true, goodie: true, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'AI Crawler Detection', icon: 'ShieldCheck', data: { seosights: true, ahrefs: true, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'llms.txt Generation', icon: 'FileText', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Entity Authority', icon: 'Target', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Auto Execute', icon: 'Zap', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
  { name: 'Daily Missions', icon: 'BarChart3', data: { seosights: true, ahrefs: false, semrush: false, surfer_seo: false, profound: false, goodie: false, jasper: false, writer: false, perplexity_pro: false } },
]

export const tableHeaders: TableHeader[] = [
  { key: 'seosights', label: 'SeoSights', highlight: true },
  { key: 'ahrefs', label: 'Ahrefs' },
  { key: 'semrush', label: 'Semrush' },
  { key: 'surfer_seo', label: 'Surfer' },
  { key: 'profound', label: 'Profound' },
  { key: 'goodie', label: 'Goodie' },
  { key: 'jasper', label: 'Jasper' },
  { key: 'writer', label: 'Writer' },
  { key: 'perplexity_pro', label: 'Perplexity' },
]
