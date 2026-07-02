'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Crown,
  Cpu,
  Megaphone,
  Palette,
  Landmark,
  Heart,
  Swords,
  Terminal,
  Building2,
  ChevronDown,
  ChevronUp,
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

const perspectives = [
  {
    role: 'AI CEO™',
    icon: Crown,
    accent: 'amber',
    score: 88,
    topConcern: 'Onboarding is losing us users',
    recommendation: 'Fix the onboarding today',
    analysis: 'The product is strong overall, but we\'re bleeding users during onboarding. A 50% drop-off at step 3 is unacceptable. If this were my startup, I\'d pause everything else and fix this first. The conversion rate from signup to first action is only 9% — that means 91% of people who sign up never experience the core value. This is the single biggest lever we have. Everything else is optimization; this is survival. The homepage is also too feature-focused — it should lead with value, not features.',
  },
  {
    role: 'AI CTO™',
    icon: Cpu,
    accent: 'blue',
    score: 94,
    topConcern: 'API error handling needs work',
    recommendation: 'Add circuit breakers and better error boundaries',
    analysis: 'Technical debt is low at 12 items, which is excellent. The codebase is well-structured and the architecture is sound. However, the API error handling is a concern — /api/search is timing out and /api/settings is degraded. We need circuit breakers, retry logic, and better error boundaries in the frontend. The security posture is strong (97/100) and CORS policy is tight. Source maps being exposed is a minor issue that should be fixed. Performance is good but the dashboard bundle at 245KB could be split.',
  },
  {
    role: 'AI CMO™',
    icon: Megaphone,
    accent: 'rose',
    score: 76,
    topConcern: 'Homepage doesn\'t convert',
    recommendation: 'Simplify value prop, add social proof',
    analysis: 'The homepage would convert better with a simpler value proposition. "Leverage AI to leverage your leverage" is, frankly, terrible copy. We need a clear, specific headline that speaks to the user\'s pain point. The CTA "Get Started Free" is good but it\'s competing with two other CTAs on the hero. One CTA, one message, one action. We also need social proof above the fold — logos, testimonials, or a compelling stat. The pricing page needs a "Most Popular" badge to guide choice. Blog content is good for SEO but doesn\'t link to product pages enough.',
  },
  {
    role: 'AI UX Lead™',
    icon: Palette,
    accent: 'violet',
    score: 82,
    topConcern: '3 screens are confusing for first-time users',
    recommendation: 'Reduce cognitive load with progressive disclosure',
    analysis: 'Three screens are particularly confusing for first-time users: the dashboard (too much information), the onboarding (7 steps is excessive), and the settings page (too wide, hard to scan). The spacing issues are significant — the gap between header and hero is 0px, creating visual compression. Cards have inconsistent border radii. Animation is mostly absent, making the app feel static. I\'d prioritize: (1) Guided onboarding with 3 steps instead of 7, (2) Dashboard smart view with progressive disclosure, (3) Consistent spacing and animation system.',
  },
  {
    role: 'AI Investor™',
    icon: Landmark,
    accent: 'emerald',
    score: 85,
    topConcern: 'Churn in first 30 days',
    recommendation: 'Improve time-to-value and add onboarding metrics',
    analysis: 'I\'d invest. The product scores well across most dimensions (92 product, 97 engineering, 95 research). What scares me is the churn in first 30 days — the onboarding drop-off and low conversion from signup to first action (9%) suggests users aren\'t reaching value quickly enough. The conversion score of 81 is the weakest link. I\'d want to see: (1) Time-to-value metric tracked, (2) Onboarding funnel analytics, (3) A/B test on simplified onboarding. The 94% confidence in the QA assessment is reassuring — we can trust these numbers.',
  },
  {
    role: 'AI Customer™',
    icon: Heart,
    accent: 'pink',
    score: 79,
    topConcern: 'I need to see value faster',
    recommendation: 'Show a quick win in the first 60 seconds',
    analysis: 'I\'d pay for this, but I need to see value faster. After signing up, I went through 7 steps before I could even try the product. By step 4, I was wondering if it was worth it. The dashboard is overwhelming — there are 12 cards and I don\'t know where to look. I wish there was a "quick start" or "try it now" option. The features are powerful but hidden. The pricing is confusing — too many tiers and I\'m not sure which one I need. Customer delight at 79 feels right — the product works, but the experience of getting to it is painful.',
  },
  {
    role: 'AI Competitor™',
    icon: Swords,
    accent: 'red',
    score: 72,
    topConcern: 'The AI Visibility niche is attackable',
    recommendation: 'Double down on differentiation before competitors catch up',
    analysis: 'If I were Ahrefs, I\'d attack the AI Visibility niche. This product has first-mover advantage but the moat isn\'t deep enough yet. The core differentiator — AI visibility scoring — could be replicated in 3-6 months by any major SEO tool. I\'d focus on: (1) Building proprietary AI visibility data that\'s hard to replicate, (2) Speed — the 2.4s LCP is okay but not industry-leading, (3) Enterprise features — the SOC2 badge and SLA page are missing, which blocks big deals. The 97 security score is a strength to leverage in enterprise sales.',
  },
  {
    role: 'AI Hacker™',
    icon: Terminal,
    accent: 'green',
    score: 96,
    topConcern: 'Source maps exposed in production',
    recommendation: 'Remove source maps from production builds',
    analysis: 'No critical vulnerabilities found. CORS policy is tight — well done. The CSP with nonce-based inline scripts is a good practice. Two things caught my eye: (1) Source maps are publicly accessible for 2 files — this reveals your source code structure and makes it easier to find vulnerabilities. Fix this immediately. (2) The Permissions-Policy header is not set — while not critical, it\'s defense-in-depth. Cookie analysis looks good except for one cookie missing the Secure flag and the tracking cookie with SameSite=None. The API error at /api/search returning a timeout could be a DoS vector — add rate limiting.',
  },
  {
    role: 'AI Enterprise Buyer™',
    icon: Building2,
    accent: 'cyan',
    score: 78,
    topConcern: 'Missing trust signals for enterprise',
    recommendation: 'Add SOC2 badge, SLA page, and data processing agreement',
    analysis: 'Trust is high — the security score of 97 and the transparent pricing are good signs. But I\'m missing some critical enterprise requirements: (1) No SOC2 badge or certification page — this is table stakes for enterprise deals. (2) No SLA page — I need guaranteed uptime and response times. (3) No data processing agreement — required for GDPR compliance. (4) No role-based access control documentation — I see you have 5 roles but no audit log. The product is strong (84 enterprise readiness), but these trust gaps would block our procurement process. Add these and I\'d evaluate seriously.',
  },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const accentMap: Record<string, { text: string; bg: string; border: string; progress: string; iconBg: string }> = {
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', progress: '[&>div]:bg-amber-500', iconBg: 'bg-amber-500/15' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', progress: '[&>div]:bg-blue-500', iconBg: 'bg-blue-500/15' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', progress: '[&>div]:bg-rose-500', iconBg: 'bg-rose-500/15' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', progress: '[&>div]:bg-violet-500', iconBg: 'bg-violet-500/15' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', progress: '[&>div]:bg-emerald-500', iconBg: 'bg-emerald-500/15' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', progress: '[&>div]:bg-pink-500', iconBg: 'bg-pink-500/15' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', progress: '[&>div]:bg-red-500', iconBg: 'bg-red-500/15' },
  green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', progress: '[&>div]:bg-green-500', iconBg: 'bg-green-500/15' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', progress: '[&>div]:bg-cyan-500', iconBg: 'bg-cyan-500/15' },
}

// ── Perspective Card Component ─────────────────────────────────────────

function PerspectiveCard({ perspective }: { perspective: typeof perspectives[0] }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = perspective.icon
  const styles = accentMap[perspective.accent]

  return (
    <motion.div variants={itemVariants}>
      <Card className={`bg-zinc-900/80 ${styles.border} hover:border-opacity-60 transition-colors`}>
        <CardContent className="pt-5 pb-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${styles.iconBg}`}>
              <Icon className={`w-5 h-5 ${styles.text}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${styles.text}`}>{perspective.role}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${styles.progress.replace('[&>div]:bg-', 'bg-').replace(/-\d+$/, '-500')}`} style={{ width: `${perspective.score}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{perspective.score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Concern */}
          <div className="mb-3">
            <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">Top Concern</p>
            <p className="text-xs text-zinc-300">{perspective.topConcern}</p>
          </div>

          {/* Recommendation */}
          <div className="mb-3">
            <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">#1 Recommendation</p>
            <p className={`text-xs ${styles.text} font-medium`}>{perspective.recommendation}</p>
          </div>

          {/* Expandable Analysis */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? 'Hide' : 'Show'} full analysis
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-zinc-800/40"
            >
              <p className="text-xs text-zinc-400 leading-relaxed">{perspective.analysis}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Perspectives Page ─────────────────────────────────────────────

export function PerspectivesPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Users className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Executive Perspectives</p>
                <h2 className="text-xl font-bold text-rose-400">9 AI Executive Views</h2>
                <p className="text-xs text-zinc-500 mt-1">Each perspective scores the product from their unique lens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Perspective Cards (2-column grid) ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perspectives.map((perspective) => (
          <PerspectiveCard key={perspective.role} perspective={perspective} />
        ))}
      </div>
    </motion.div>
  )
}
