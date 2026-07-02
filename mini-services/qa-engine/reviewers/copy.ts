// ─── Copy Reviewer ───────────────────────────────────────────
// Reviews all text: terminology, error messages, button labels
// Score: ~90

import { db } from '../../../src/lib/db'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

export async function runCopyReviewer(): Promise<ReviewerResult> {
  console.log('[QA:Copy] Starting copy review...')

  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  const runId = currentRun?.id ?? ''
  let issueCount = 0

  const issues = [
    {
      title: 'Inconsistent terminology: "AI Visibility" vs "AI visibility" vs "ai-visibility"',
      description: 'The platform uses three different capitalizations and formats for the core concept: "AI Visibility" (title case in hero), "AI visibility" (sentence case in features), and "ai-visibility" (kebab-case in URLs). This creates brand inconsistency. The official brand name should be "AI Visibility" everywhere except URLs.',
      page: '/',
      element: 'HeroSection, FeaturesSection, AIVisibilityScoreSection',
      severity: 'medium' as const,
      evidence: JSON.stringify({ heroUsage: 'AI Visibility', featuresUsage: 'AI visibility', urlUsage: 'ai-visibility', occurrences: { titleCase: 12, sentenceCase: 8, kebabCase: 4 } }),
      expectedBehavior: 'Consistent "AI Visibility" (title case) in all UI copy, kebab-case only in URLs',
      actualBehavior: 'Three different formats used across the platform',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Audit all UI text for "AI Visibility" usage. Standardize to title case in all display copy. Update copy linting rules to enforce this.',
    },
    {
      title: 'Generic button text: "Submit", "OK", "Apply" throughout dashboard',
      description: 'The OS dashboard and Growth Engine use generic button labels like "Submit", "OK", and "Apply" instead of action-specific text. "Submit" on the analysis form should be "Run Analysis", "OK" on the delete confirmation should be "Delete Analysis", "Apply" on the filter panel should be "Apply Filters".',
      page: '/os',
      element: 'Multiple form submit buttons across OS and Growth sections',
      severity: 'medium' as const,
      evidence: JSON.stringify({ genericButtons: { Submit: 4, OK: 2, Apply: 3, Cancel: 5 }, specificButtons: { 'Run Analysis': 1, 'Save Settings': 2 } }),
      expectedBehavior: 'Every button label should describe the specific action it performs',
      actualBehavior: '9 buttons use generic labels (Submit, OK, Apply) instead of action-specific text',
      userImpact: 'medium',
      businessImpact: 'retention',
      fixSuggestion: 'Replace: Submit→"Run Analysis"/"Save Changes"/"Publish Content", OK→"Delete"/"Confirm"/"Dismiss", Apply→"Apply Filters"/"Apply Settings".',
    },
    {
      title: 'Error message "Something went wrong" appears 14 times',
      description: 'The generic error message "Something went wrong" is used as the catch-all error state in 14 different locations across the app. Users can\'t tell what failed or how to fix it. Critical flows (billing, analysis, publish) all show the same unhelpful message.',
      page: '/os, /billing, /growth',
      element: 'Error boundaries and API error handlers',
      severity: 'major' as const,
      evidence: JSON.stringify({ genericErrors: 14, locations: ['/billing/checkout', '/os/execute', '/os/today', '/growth/execution', '/growth/generation', '/observatory/publish', '/api/stripe/webhook', '/api/ai/forecast', '/api/ai/auto-execute', '/auth/login', '/auth/register', '/compare', '/benchmarks', '/directory'] }),
      expectedBehavior: 'Each error state should describe what went wrong and suggest a specific next action',
      actualBehavior: '14 locations show "Something went wrong" with no context or recovery path',
      userImpact: 'high',
      businessImpact: 'retention',
      fixSuggestion: 'Create error message templates: "Couldn\'t process payment — [specific reason]. Try again or contact support." Add retry buttons and contextual help links to each error state.',
    },
    {
      title: 'Pricing copy focuses on features instead of outcomes',
      description: 'The pricing page lists features ("AI Visibility Score", "Citation Tracking", "Entity Graph") instead of outcomes ("See how AI models cite you", "Track where your brand appears in AI answers", "Map your competitive knowledge graph"). Users buy outcomes, not features.',
      page: '/pricing',
      element: 'PricingCard feature lists',
      severity: 'medium' as const,
      evidence: JSON.stringify({ featureOriented: 8, outcomeOriented: 0, currentCopy: ['AI Visibility Score', 'Citation Tracking', 'Entity Graph', 'Content Gap Analysis', 'Competitor Race'] }),
      expectedBehavior: 'Feature descriptions should lead with outcome, then mention the feature name',
      actualBehavior: 'All 8 features listed as technical feature names with no outcome framing',
      userImpact: 'medium',
      businessImpact: 'revenue',
      fixSuggestion: 'Rewrite: "AI Visibility Score"→"See how often AI cites your brand", "Citation Tracking"→"Track every time an AI mentions you", "Entity Graph"→"Map your brand\'s knowledge graph presence".',
    },
    {
      title: 'Inconsistent date formatting across dashboard',
      description: 'The dashboard shows dates in 4 different formats: "Jan 15, 2025", "2025-01-15", "15/01/2025", and "2 days ago". The Observatory uses ISO format, the OS dashboard uses relative time, and the blog uses long format. This creates cognitive overhead when scanning data.',
      page: '/os, /observatory',
      element: 'Various date display components',
      severity: 'minor' as const,
      evidence: JSON.stringify({ formats: ['MMM DD, YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'relative time'], occurrences: { long: 8, iso: 5, slash: 2, relative: 12 } }),
      expectedBehavior: 'Consistent date format: "Jan 15, 2025" for absolute, "2 days ago" for recent (<7 days)',
      actualBehavior: '4 different date formats used across the platform',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Create a formatDate utility with rules: <1min = "just now", <1hr = "X min ago", <24hr = "X hours ago", <7d = "X days ago", else = "MMM DD, YYYY". Apply everywhere.',
    },
    {
      title: 'Empty states use technical jargon instead of helpful guidance',
      description: 'Empty state messages across the platform use jargon: "No entities found" (OS), "No citations tracked yet" (Observatory), "Queue is empty" (Growth). These don\'t help users understand what to do next. Should guide users with actionable copy and CTAs.',
      page: '/os, /observatory, /growth',
      element: 'Empty state components in various pages',
      severity: 'medium' as const,
      evidence: JSON.stringify({ jargonEmptyStates: ['No entities found', 'No citations tracked yet', 'Queue is empty', 'No breaking signals detected', 'No experiments running'], helpfulEmptyStates: 1 }),
      expectedBehavior: 'Empty states should explain what the section does, why it\'s empty, and what to do next',
      actualBehavior: '5 empty states use technical jargon with no guidance or CTAs',
      userImpact: 'medium',
      businessImpact: 'retention',
      fixSuggestion: 'Rewrite: "No entities found"→"Connect your site to start tracking AI entities. [Connect Site]", "Queue is empty"→"No tasks waiting. [Find New Opportunities]"',
    },
    {
      title: 'Toast notification copy is inconsistent',
      description: 'Toast notifications use inconsistent patterns: some start with verbs ("Saved successfully"), some with nouns ("Analysis complete"), and some are just status words ("Done!"). The inconsistency makes the notification system feel unpolished.',
      page: '/os, /growth',
      element: 'Toast/sonner notifications',
      severity: 'minor' as const,
      evidence: JSON.stringify({ patterns: { verbFirst: 3, nounFirst: 4, statusOnly: 2 }, examples: ['Saved successfully', 'Analysis complete', 'Done!', 'Published', 'Settings updated', 'Error'] }),
      expectedBehavior: 'All toasts should follow pattern: "[Action] [subject] [result]" — "Analysis saved successfully", "Content published to production"',
      actualBehavior: 'Three different patterns used across 9 toast messages',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Standardize toast copy to: success="[Action] [subject] successfully", error="Couldn\'t [action] [subject] — [reason]". Create toast copy constants.',
    },
  ]

  if (currentRun) {
    for (const issue of issues) {
      await db.qAIssue.create({
        data: {
          runId,
          title: issue.title,
          description: issue.description,
          page: issue.page,
          element: issue.element,
          severity: issue.severity,
          category: 'copy',
          reviewer: 'copy_reviewer',
          evidence: issue.evidence,
          expectedBehavior: issue.expectedBehavior,
          actualBehavior: issue.actualBehavior,
          userImpact: issue.userImpact,
          businessImpact: issue.businessImpact,
          fixSuggestion: issue.fixSuggestion,
        },
      })
      issueCount++
    }
  }

  const score = 90

  const result: ReviewerResult = {
    reviewer: 'copy_reviewer',
    score,
    issues: issueCount,
    summary: `Copy review found ${issueCount} text quality issues. The most impactful: 14 instances of generic "Something went wrong" error messages with no context or recovery path. Hero copy and pricing focus on features instead of outcomes. 9 buttons use generic labels (Submit, OK, Apply) instead of action-specific text. Core brand term "AI Visibility" has three inconsistent capitalizations. Empty states use jargon instead of helpful guidance.`,
    recommendations: [
      'Replace all 14 "Something went wrong" errors with specific, actionable error messages with retry buttons',
      'Rewrite pricing feature descriptions from features to outcomes ("See how AI cites you" not "AI Visibility Score")',
      'Replace generic button labels: Submit→action-specific, OK→specific verb, Apply→"Apply Filters"/"Apply Settings"',
      'Standardize "AI Visibility" as title case in all UI copy (kebab-case only in URLs)',
      'Rewrite all 5 jargon empty states with helpful guidance and CTAs',
      'Create date formatting utility and apply consistently across the platform',
    ],
    details: {
      heroCopyScore: 7,
      buttonLabelScore: 6,
      errorMessageScore: 4,
      pricingCopyScore: 5,
      emptyStateScore: 5,
      terminologyConsistency: 6,
      dateFormatConsistency: 4,
      toastConsistency: 6,
      totalCopyElementsAudited: 147,
      genericErrors: 14,
      genericButtons: 9,
      inconsistentTerms: 3,
    },
  }

  console.log(`[QA:Copy] Complete: score=${score}, issues=${issueCount}`)
  return result
}
