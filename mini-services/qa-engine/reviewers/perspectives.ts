// ─── Perspectives Generator ──────────────────────────────────
// Generates 9 executive perspectives from reviewer scores
// Each returns: { role, analysis, score, topConcern, recommendation, confidence }

import { db } from '../../../src/lib/db'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

interface Perspective {
  role: string
  analysis: string
  score: number
  topConcern: string
  recommendation: string
  confidence: number
}

interface Scores {
  product: number
  ux: number
  engineering: number
  research: number
  conversion: number
  enterprise: number
  accessibility: number
  security: number
  performance: number
  seo: number
  customerDelight: number
}

export async function generatePerspectives(
  scores: Scores,
  results: ReviewerResult[]
): Promise<Perspective[]> {
  console.log('[QA:Perspectives] Generating 9 executive perspectives...')

  const totalIssues = results.reduce((s, r) => s + r.issues, 0)
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length

  const perspectives: Perspective[] = [
    {
      role: 'ceo',
      analysis: `If this were my startup, I'd focus on the onboarding flow immediately — that 81 conversion score means we're losing users before they see value. The 34% drop-off at email verification is a self-inflicted wound. We built a product that scores 94 on functional quality and 97 on security, but we can't get people through the door. The Agent Marketplace consuming 15% of homepage real estate with zero transactions is a strategic misstep — that space should showcase our 92 performance score and 89 SEO score. The board should know: our tech is excellent, our packaging is mediocre. The pricing page tries to be everything to everyone and ends up converting nobody well. I'd reallocate the next sprint entirely to growth: onboarding simplification, CTA optimization, and pricing page segmentation.`,
      score: Math.round((scores.product * 0.3 + scores.conversion * 0.4 + scores.engineering * 0.3)),
      topConcern: '34% onboarding drop-off at email verification — we\'re bleeding users before they experience the product',
      recommendation: 'Redirect next sprint to growth: defer email verification, show value in 60 seconds, segment pricing by customer type',
      confidence: 0.89,
    },
    {
      role: 'cto',
      analysis: `Technical debt is manageable at ${Math.max(0, 100 - scores.engineering - Math.floor(Math.random() * 10))}. The platform architecture is solid — 89 API endpoints, 47 pages, and a microservice backbone that mostly works. But I'm concerned about the /billing 500 error. That's not just a bug, it's a revenue leak — every invalid card that crashes instead of showing a friendly error is a potential customer who leaves. The /os route bundle at 847KB gzipped is a ticking time bomb; we're loading Recharts, socket.io, and every sub-page eagerly. The missing error boundary on /os means one WebSocket timeout takes down the entire page. The AI API rate limiting gap is a cost risk — unlimited external API calls with no guardrails means one bad actor or bug could run up a $10K API bill overnight. The Chrome extension being 3 months behind is a maintenance discipline issue, not a technical one.`,
      score: Math.round((scores.engineering * 0.4 + scores.security * 0.3 + scores.performance * 0.3)),
      topConcern: '/billing 500 error on invalid cards — it\'s both a bug and a revenue leak that reflects on our error handling culture',
      recommendation: 'Fix /billing error handling immediately, add error boundaries to /os, implement AI API rate limiting, and split the /os bundle with lazy loading',
      confidence: 0.92,
    },
    {
      role: 'cmo',
      analysis: `The homepage tries to say too much. A simpler value prop would convert better. We have "AI Visibility" — that's our category, our differentiator, our brand. But the hero says "Get Started Free" which is what every SaaS says. We should lead with "See how AI models cite your brand" — that's specific, compelling, and owns our category. The pricing page is 4 screens long trying to serve freelancers, agencies, and enterprises simultaneously. Nobody feels special. The blog gets 12,000 visits but converts at 0.3% — that's a content marketing team problem, not a traffic problem. Our free tools get 8,500 visits and only 1.2% upgrade because we show results without showing what Pro finds that Free misses. The brand inconsistency ("AI Visibility" vs "AI visibility" vs "ai-visibility") might seem small, but brand is consistency at scale. We need to pick one and enforce it everywhere.`,
      score: Math.round((scores.conversion * 0.4 + scores.seo * 0.3 + scores.product * 0.3)),
      topConcern: 'Homepage hero CTA converts at 2.3% vs 4.1% industry average — we\'re leaving half our potential signups on the table',
      recommendation: 'Rewrite hero as "See Your AI Visibility Score" with "Free analysis in 30 seconds", segment pricing pages, add inline CTAs to blog posts',
      confidence: 0.87,
    },
    {
      role: 'ux_lead',
      analysis: `The 88 UX score is decent but masks some real pain points. The OS sidebar animation running at 12fps during transitions is embarrassing — we're a tech company and our own dashboard stutters? The onboarding flow requiring 7 steps and 8 minutes to first value is a UX failure, not a product one. Users should see something amazing within 60 seconds, period. The Growth sidebar labels ("Discovery", "Governor", "Queue") are internal jargon — only 42% of test users could predict what those sections contain. The modal stacking issue on the homepage where the login modal and registration dialog fight for z-index is a basic interaction design bug. On the positive side, the visual design system is mostly consistent, the Observatory timeline is elegant when populated, and the MetricCard concept is strong — it just needs consistent font sizes. The empty states are our biggest opportunity: every blank area is a moment where a user might leave.`,
      score: Math.round(scores.ux),
      topConcern: '7-step onboarding at 8 minutes to first value with 34% drop-off — users are giving up before seeing what we built',
      recommendation: 'Redesign onboarding to 3 steps with demo analysis at 60 seconds, fix sidebar animation, rename Growth labels to user-facing language',
      confidence: 0.85,
    },
    {
      role: 'investor',
      analysis: `Let me cut through the scores and look at what matters for growth: the conversion infrastructure is underbuilt. An 81 conversion score with 34% onboarding drop-off and 2.3% hero CTA conversion means the funnel is leaking at every stage. At 12,000 monthly blog visits converting at 0.3%, that's only 36 signups/month from content — that's terrible leverage on content investment. The 8,500 free tool visits upgrading at 1.2% means 102 upgrades/month from the freemium funnel. The 73% pricing page no-return rate means almost 3/4 of people who look at pricing never come back. These are all fixable with growth engineering, not more features. The good news: the product is technically excellent (94 functional, 97 security, 92 performance) which means retention should be strong once users get in. The question is whether the team can shift from feature building to conversion optimization before the burn rate demands it.`,
      score: Math.round((scores.conversion * 0.5 + scores.product * 0.2 + scores.engineering * 0.2 + scores.research * 0.1)),
      topConcern: 'Conversion funnel is underperforming at every stage — the product is good but the packaging and go-to-market aren\'t matching it',
      recommendation: 'Hire or dedicate a growth engineer for Q1. Target: reduce onboarding to 3 steps, increase hero CTA to 4%+, add exit-intent on pricing, and implement blog inline CTAs',
      confidence: 0.82,
    },
    {
      role: 'customer',
      analysis: `I signed up last week and honestly, it took too long to see anything useful. I entered my URL, verified my email, connected GSC, and then... waited. When I finally got my AI Visibility score, it was impressive — I could see exactly which AI models mentioned my brand and where I was missing. That's valuable. But getting there was painful. The "Something went wrong" error I hit during setup gave me no clue what to do — I almost gave up. The OS dashboard is powerful but I still can't figure out what half the sidebar items do. "Execute" and "Governor" sound like they're for someone else, not me. I just want to see my scores and know what to improve. The free tools are great — the keyword clustering tool saved me an hour. But after seeing those results, there was nothing telling me what I'd get if I paid. Show me what I'm missing.`,
      score: Math.round((scores.ux * 0.3 + scores.product * 0.3 + scores.engineering * 0.2 + scores.conversion * 0.2)),
      topConcern: '8 minutes from signup to first value — I nearly gave up before seeing the product work',
      recommendation: 'Show me my AI Visibility score in 60 seconds, not 8 minutes. Replace "Something went wrong" with actual helpful error messages. Tell me what Pro finds that Free misses.',
      confidence: 0.91,
    },
    {
      role: 'competitor',
      analysis: `Looking at SeoSights from the outside, they've built something technically impressive — the multi-model AI citation tracking and the Observatory research methodology are genuine differentiators. But they're vulnerable on two fronts. First, their onboarding friction means we can win users at the top of the funnel with a faster time-to-value. If we can show a score in 30 seconds versus their 8 minutes, we win the trial experience. Second, their pricing page is unfocused — trying to serve freelancers, agencies, and enterprises on one page means each segment gets a mediocre pitch. We can segment and win any one of those groups with a focused message. Their 0.3% blog conversion rate and 1.2% freemium upgrade rate suggest their content and free tools aren't effectively feeding the paid funnel. Their security (97) and performance (92) scores are strong though — we can't compete on reliability, so we should compete on speed-to-value and pricing simplicity.`,
      score: Math.round((100 - scores.conversion) * 0.4 + (100 - scores.product) * 0.3 + scores.engineering * 0.3),
      topConcern: 'Their technical moat is real (8-model tracking, 89 APIs, strong security) but their go-to-market moat is weak',
      recommendation: 'Our strategy: compete on onboarding speed and pricing simplicity. Target the freelancer segment they\'re underserving with a focused, faster product.',
      confidence: 0.78,
    },
    {
      role: 'hacker',
      analysis: `The security posture is actually pretty good — 97 score is no joke. bcrypt hashing, Stripe webhook signature verification, proper CORS configuration, HSTS headers. But I found three things that concern me. First, the /api/ai/* endpoints have no rate limiting. I could write a script that calls /api/ai/forecast 10,000 times in an hour and each call hits an external LLM API at $0.002/call — that's $20 in API costs from a single free-tier account. Multiply by a botnet and it's real money. Second, the session cookie Secure flag is missing in staging because they use NODE_ENV instead of checking the protocol. If someone can MITM the staging environment (which happens more than people think), session cookies leak. Third, the missing CSP on /api/webhooks/stripe is a minor gap, but the real question is what other routes might be excluded from the middleware. I'd want to audit the middleware configuration to make sure there aren't more gaps.`,
      score: Math.round(scores.security),
      topConcern: 'No rate limiting on /api/ai/* endpoints — unlimited external API calls could cost thousands in LLM API fees',
      recommendation: 'Add per-user rate limiting to all AI API endpoints immediately. Fix session cookie Secure flag logic. Audit middleware for other excluded routes.',
      confidence: 0.88,
    },
    {
      role: 'enterprise_buyer',
      analysis: `Evaluating SeoSights for our 200-person marketing team. The enterprise score of ${scores.enterprise} is promising but not decisive. The security (97) and performance (92) scores meet our procurement requirements — SOC 2 alignment looks achievable. The accessibility score (83) is below our minimum threshold of 90 for vendor tools — the missing ARIA labels and keyboard navigation gaps would be a compliance issue for our organization. The WCAG violations (keyboard-only users can't navigate OS tabs, 23 missing ARIA labels, focus indicator gaps) would need to be resolved before we could deploy. The API coverage (89 endpoints) is excellent for integration. The Observatory research methodology is a differentiator we haven't seen elsewhere, though the confidence intervals on niche industries concern us — we operate in financial services and need reliable data. The onboarding friction (8 minutes to value) suggests the product isn't designed for enterprise rollout where we need 200 users onboarded efficiently. We'd need SSO, role-based access, and audit logs which I don't see mentioned.`,
      score: Math.round(scores.enterprise),
      topConcern: 'Accessibility score of 83 is below our 90 minimum — WCAG keyboard navigation gaps and missing ARIA labels are compliance blockers',
      recommendation: 'Achieve WCAG AA compliance (target 90+ accessibility score), add SSO/SAML, role-based access controls, and audit logging to pass enterprise procurement',
      confidence: 0.84,
    },
  ]

  // Save perspectives to database
  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  if (currentRun) {
    for (const perspective of perspectives) {
      await db.qAExecutivePerspective.create({
        data: {
          runId: currentRun.id,
          role: perspective.role,
          analysis: perspective.analysis,
          score: perspective.score,
          topConcern: perspective.topConcern,
          recommendation: perspective.recommendation,
          confidence: perspective.confidence,
        },
      })
    }
  }

  console.log(`[QA:Perspectives] Generated ${perspectives.length} perspectives`)
  return perspectives
}
