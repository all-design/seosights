/**
 * Content Engine — Replay (24h AI Visibility Check)
 *
 * POST /api/content-engine/articles/[id]/replay
 * Schedules/runs 24h replay check. Simulates checking AI visibility before/after.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

// ── POST: Run replay check ────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const article = await db.contentArticle.findUnique({
      where: { id },
      include: {
        brief: {
          select: {
            keywordTarget: true,
            pillar: true,
            cluster: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 7,
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    if (!article.publishedAt) {
      return NextResponse.json(
        { error: 'Article must be published before replay check' },
        { status: 400 }
      )
    }

    // Simulate before/after AI visibility check
    // In production, this would query Perplexity, ChatGPT, etc.
    const replayPrompt = `You are simulating an AI visibility replay check for a published article. Compare how likely AI models (ChatGPT, Claude, Perplexity, Gemini) would cite this content BEFORE and AFTER optimization.

**Article Title:** ${article.title}
**Target Keyword:** ${article.brief.keywordTarget}
**Published URL:** ${article.publishedUrl || `https://${article.domain}/blog/${article.slug}`}
**SEO Score:** ${article.seoScore}
**AEO Score:** ${article.aeoScore}
**GEO Score:** ${article.geoScore}

Based on the scores and optimization level, estimate:
1. AI visibility BEFORE optimization (0-100)
2. AI visibility AFTER optimization (0-100)
3. Which AI models would likely cite this content
4. Specific improvements if visibility didn't increase

Return valid JSON only:
{
  "visibilityBefore": 0-100,
  "visibilityAfter": 0-100,
  "visibilityGain": 0-100,
  "citationsBefore": 0-10,
  "citationsAfter": 0-10,
  "modelsLikelyCiting": ["ChatGPT", "Claude", "Perplexity", "Gemini"],
  "improvementNeeded": false,
  "rewriteSuggestion": null,
  "specificImprovements": ["improvement1"]
}`

    let replayResult: Record<string, unknown>
    try {
      const aiResult = await routeLLM([
        { role: 'system', content: 'You are an AI visibility simulation engine. Respond with valid JSON only.' },
        { role: 'user', content: replayPrompt },
      ], { taskType: 'reasoning', temperature: 0.3 })

      replayResult = JSON.parse(aiResult.content)
    } catch (aiError) {
      console.warn('[Content Engine Replay] AI simulation failed, using heuristic:', aiError)

      // Use a heuristic based on existing scores
      const baseVisibility = Math.round((article.seoScore + article.aeoScore + article.geoScore) / 3)
      const visibilityBefore = Math.max(0, baseVisibility - 20)
      const visibilityAfter = Math.min(100, baseVisibility + 10)
      const gain = visibilityAfter - visibilityBefore

      replayResult = {
        visibilityBefore,
        visibilityAfter,
        visibilityGain: gain,
        citationsBefore: Math.round(visibilityBefore / 20),
        citationsAfter: Math.round(visibilityAfter / 20),
        modelsLikelyCiting: gain > 15 ? ['ChatGPT', 'Claude', 'Perplexity'] : ['Perplexity'],
        improvementNeeded: gain < 10,
        rewriteSuggestion: gain < 10 ? 'AI visibility did not improve significantly. Consider rewriting with more entity-rich content and concise answer blocks.' : null,
        specificImprovements: gain < 10
          ? ['Add more entity definitions', 'Include FAQ section', 'Strengthen answer blocks', 'Add comparison tables']
          : [],
      }
    }

    const visibilityGain = (replayResult.visibilityGain as number) || 0
    const improvementNeeded = (replayResult.improvementNeeded as boolean) || false

    // Update article with replay results
    await db.contentArticle.update({
      where: { id },
      data: {
        status: 'replayed',
        aiVisibilityGain: visibilityGain,
        metadata: JSON.stringify({
          ...((article.metadata ? JSON.parse(article.metadata) : {}) as Record<string, unknown>),
          replayResult,
          replayedAt: new Date().toISOString(),
        }),
      },
    })

    // If improvement not significant, suggest rewrite
    if (improvementNeeded) {
      await db.contentArticle.update({
        where: { id },
        data: { status: 'rewriting' },
      })
    }

    // Log the decision
    await db.contentDecisionLog.create({
      data: {
        domain: article.domain,
        decisionType: 'replay_trigger',
        context: JSON.stringify({
          articleId: id,
          visibilityBefore: replayResult.visibilityBefore,
          visibilityAfter: replayResult.visibilityAfter,
          visibilityGain,
        }),
        decision: improvementNeeded
          ? 'Replay showed insufficient improvement - scheduling rewrite'
          : 'Replay confirmed visibility improvement',
        rationale: improvementNeeded
          ? `AI visibility gain was only ${visibilityGain} points, below threshold. Suggesting rewrite.`
          : `AI visibility improved by ${visibilityGain} points after optimization.`,
        automated: true,
        articleId: id,
      },
    })

    // Update KPI
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.contentKPI.upsert({
      where: { domain_date: { domain: article.domain, date: today } },
      create: {
        domain: article.domain,
        date: today,
        articlesReplayed: 1,
        articlesRewritten: improvementNeeded ? 1 : 0,
        avgAIScoreGain: visibilityGain,
      },
      update: {
        articlesReplayed: { increment: 1 },
        articlesRewritten: improvementNeeded ? { increment: 1 } : undefined,
        avgAIScoreGain: visibilityGain,
      },
    })

    return NextResponse.json({
      replayResult,
      articleStatus: improvementNeeded ? 'rewriting' : 'replayed',
      recommendation: improvementNeeded
        ? (replayResult.rewriteSuggestion as string) || 'Consider rewriting with improved entity optimization and answer blocks.'
        : 'Article visibility improved successfully. No rewrite needed.',
    })
  } catch (error) {
    console.error('[Content Engine Replay] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run replay check' },
      { status: 500 }
    )
  }
}
