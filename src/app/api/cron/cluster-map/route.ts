/**
 * Cron API — Monthly Cluster Mapping
 *
 * POST /api/cron/cluster-map
 *
 * Uses the Keyword Researcher agent (via z-ai-web-dev-sdk LLM) to generate
 * 90 topic clusters for a Client Zero project. These topics are stored in
 * the internal_content_queue table with scheduled publish times spread
 * across the month (3 per day at 09:00, 13:00, 18:00).
 *
 * This endpoint should be called once per month (e.g., on the 1st).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

interface ClusterMapBody {
  projectId?: string // optional: limit to specific project
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClusterMapBody

    // Find Client Zero projects
    const whereClause: Record<string, unknown> = {
      isInternalAutopilot: true,
    }
    if (body.projectId) {
      whereClause.id = body.projectId
    }

    const projects = await db.project.findMany({
      where: whereClause,
    })

    if (projects.length === 0) {
      return NextResponse.json({
        message: 'No Client Zero projects found',
        topicsGenerated: 0,
      })
    }

    let totalTopicsGenerated = 0

    for (const project of projects) {
      const postsPerMonth = project.autopilotPostsPerMonth || 90

      // Check if topics were already generated this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const existingTopics = await db.internalContentQueue.count({
        where: {
          projectId: project.id,
          createdAt: { gte: startOfMonth },
        },
      })

      if (existingTopics >= postsPerMonth) {
        console.log(`[Cluster Map] Project ${project.domain} already has ${existingTopics} topics for this month — skipping`)
        continue
      }

      // Generate topic clusters using LLM
      const topics = await generateTopicClusters(project.domain, postsPerMonth - existingTopics)

      // Schedule topics across the month at 09:00, 13:00, 18:00
      const scheduledTopics = scheduleTopicsAcrossMonth(topics, now, existingTopics)

      // Insert into content queue
      for (const topic of scheduledTopics) {
        await db.internalContentQueue.create({
          data: {
            projectId: project.id,
            keywordTarget: topic.keyword,
            suggestedTitle: topic.title,
            pillar: topic.pillar,
            cluster: topic.cluster,
            status: 'pending',
            scheduledFor: topic.scheduledFor,
          },
        })
      }

      totalTopicsGenerated += scheduledTopics.length
      console.log(`[Cluster Map] Generated ${scheduledTopics.length} topics for ${project.domain}`)
    }

    return NextResponse.json({
      message: 'Cluster mapping complete',
      topicsGenerated: totalTopicsGenerated,
    })
  } catch (error) {
    console.error('[Cron Cluster Map API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cluster map' },
      { status: 500 }
    )
  }
}

// ── Topic Cluster Generator via LLM ──────────────────────────────────────────

interface TopicEntry {
  keyword: string
  title: string
  pillar: string
  cluster: string
}

async function generateTopicClusters(domain: string, count: number): Promise<TopicEntry[]> {
  try {
    const zai = await getZAI()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are the Keyword Researcher agent of an AI-powered SEO platform called seosights. Your job is to generate high-value blog post topics that will rank on Google AND get cited by AI search engines (ChatGPT, Perplexity, Claude, etc.).

You must return ONLY a valid JSON array — no markdown, no backticks, no commentary.`,
        },
        {
          role: 'user',
          content: `Generate ${count} SEO/AEO/GEO blog post topics for the website "${domain}". 

Requirements:
- Each topic should target a specific long-tail keyword
- Mix of SEO (traditional search), AEO (answer engine/featured snippet), and GEO (generative engine/AI citation) focus
- Topics should form thematic clusters
- Include Q&A format titles that are likely to be cited by AI engines
- Use E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals

Return a JSON array with this exact structure:
[
  {
    "keyword": "target keyword phrase",
    "title": "Engaging blog post title with keyword",
    "pillar": "seo|aeo|geo|all",
    "cluster": "Thematic cluster name"
  }
]

Ensure roughly equal distribution across pillars (seo, aeo, geo, all).
Ensure topics are grouped into 8-12 distinct clusters.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Parse the JSON response
    let topics: TopicEntry[]
    try {
      // Try to extract JSON from the response (in case there's any surrounding text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      topics = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText)
    } catch {
      console.error('[Cluster Map] Failed to parse LLM response, using fallback')
      topics = generateFallbackTopics(count)
    }

    return topics.slice(0, count)
  } catch (error) {
    console.error('[Cluster Map] LLM error:', error)
    return generateFallbackTopics(count)
  }
}

// ── Schedule Topics Across Month ────────────────────────────────────────────

function scheduleTopicsAcrossMonth(
  topics: TopicEntry[],
  referenceDate: Date,
  offset: number
): (TopicEntry & { scheduledFor: Date })[] {
  const result: (TopicEntry & { scheduledFor: Date })[] = []
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Publish times: 09:00, 13:00, 18:00
  const publishHours = [9, 13, 18]

  for (let i = 0; i < topics.length; i++) {
    const globalIndex = i + offset
    const dayIndex = Math.floor(globalIndex / 3) // 3 posts per day
    const slotIndex = globalIndex % 3 // which of the 3 daily slots

    // If we've exceeded the days in the month, wrap around
    const day = Math.min((dayIndex % daysInMonth) + 1, daysInMonth)
    const hour = publishHours[slotIndex]

    const scheduledFor = new Date(year, month, day, hour, 0, 0)

    // If the scheduled time is in the past, push to next available slot
    if (scheduledFor <= referenceDate) {
      scheduledFor.setDate(scheduledFor.getDate() + 1)
    }

    result.push({
      ...topics[i],
      scheduledFor,
    })
  }

  return result
}

// ── Fallback Topic Generator ────────────────────────────────────────────────

function generateFallbackTopics(count: number): TopicEntry[] {
  const clusters = [
    'SEO Fundamentals',
    'AEO Strategy',
    'GEO Optimization',
    'AI Search Engines',
    'Technical SEO',
    'Content Strategy',
    'Link Building',
    'Schema Markup',
    'Keyword Research',
    'E-E-A-T Signals',
  ]

  const pillarDistributions: Array<'seo' | 'aeo' | 'geo' | 'all'> = ['seo', 'aeo', 'geo', 'all']

  const topics: TopicEntry[] = []
  for (let i = 0; i < count; i++) {
    const cluster = clusters[i % clusters.length]
    const pillar = pillarDistributions[i % pillarDistributions.length]
    const keywordVariants = [
      `${cluster.toLowerCase()} guide 2025`,
      `how to improve ${cluster.toLowerCase()}`,
      `${cluster.toLowerCase()} best practices`,
      `${cluster.toLowerCase()} for beginners`,
      `advanced ${cluster.toLowerCase()} techniques`,
    ]

    topics.push({
      keyword: keywordVariants[i % keywordVariants.length],
      title: `${cluster}: The Complete Guide to ${pillar.toUpperCase()} Optimization in 2025`,
      pillar,
      cluster,
    })
  }

  return topics
}
