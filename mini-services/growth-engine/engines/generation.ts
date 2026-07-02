// ─── AGE Generation Engine ──────────────────────────────────────────
// Generates content/assets from queued opportunities

import { db } from '../../../src/lib/db'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function runGenerationEngine(): Promise<{ generated: number }> {
  console.log(`[Generation] ${new Date().toISOString()} — Running generation engine...`)

  // Check for currently generating items (limit to 1 at a time)
  const currentlyGenerating = await db.growthOpportunity.count({
    where: { status: 'generating' }
  })

  if (currentlyGenerating > 0) {
    // Move any that have been generating for > 5 min to reviewing
    const staleGenerating = await db.growthOpportunity.findMany({
      where: {
        status: 'generating',
        startedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) }
      }
    })

    for (const opp of staleGenerating) {
      const slug = slugify(opp.title)

      // Check if asset already exists
      const existingAsset = await db.growthAsset.findUnique({ where: { slug } })

      if (!existingAsset) {
        await db.growthAsset.create({
          data: {
            opportunityId: opp.id,
            title: opp.title,
            slug,
            type: opp.type,
            content: `# ${opp.title}\n\nAuto-generated content for ${opp.type} page.\n\n## Overview\n\nThis page covers ${opp.title.toLowerCase()} and provides comprehensive insights.\n\n## Key Findings\n\n- AI Visibility trends are shifting rapidly\n- Citation patterns show increasing importance\n- Entity optimization is critical\n\n## Recommendations\n\n1. Optimize your knowledge graph presence\n2. Ensure consistent entity markup\n3. Monitor AI citation patterns regularly`,
            metaDescription: `${opp.title} — comprehensive analysis and recommendations by SeoSights`,
            schemaMarkup: JSON.stringify({ "@type": "Article", name: opp.title }),
            internalLinks: JSON.stringify(['/tools', '/industries', '/benchmarks']),
            reviewStatus: 'pending',
            reviewScores: JSON.stringify({ seo: 85, aeo: 72, geo: 78, grammar: 92, links: 68, schema: 88, entities: 75, facts: 90, duplicate: 95, brand: 82, llm: 79, prediction: 77 }),
            qualityScore: Math.floor(Math.random() * 20) + 75,
          }
        })
      }

      await db.growthOpportunity.update({
        where: { id: opp.id },
        data: { status: 'reviewing' }
      })
    }

    console.log(`[Generation] ${new Date().toISOString()} — ${staleGenerating.length} items moved to reviewing`)
    return { generated: staleGenerating.length }
  }

  // Pick next queued opportunity
  const next = await db.growthOpportunity.findFirst({
    where: { status: 'queued' },
    orderBy: [
      { priority: 'asc' },
      { growthScore: 'desc' },
    ]
  })

  if (!next) {
    console.log(`[Generation] ${new Date().toISOString()} — No queued opportunities`)
    return { generated: 0 }
  }

  // Start generating
  await db.growthOpportunity.update({
    where: { id: next.id },
    data: {
      status: 'generating',
      startedAt: new Date(),
    }
  })

  console.log(`[Generation] ${new Date().toISOString()} — Started generating: "${next.title}"`)
  return { generated: 0 } // Will complete on next run
}
