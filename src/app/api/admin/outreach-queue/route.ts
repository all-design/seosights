/**
 * Admin API — Auto-Outreach Queue Management
 *
 * GET  /api/admin/outreach-queue       — List outreach logs (filterable)
 * POST /api/admin/outreach-queue       — Generate outreach emails for a Client Zero project
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List outreach logs ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const [logs, total] = await Promise.all([
      db.outreachLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: {
              id: true,
              domain: true,
              url: true,
            },
          },
        },
      }),
      db.outreachLog.count({ where }),
    ])

    return NextResponse.json({ logs, total })
  } catch (error) {
    console.error('[Admin Outreach Queue API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outreach logs' },
      { status: 500 }
    )
  }
}

// ── POST: Generate outreach emails for a Client Zero project ──────────────────

interface GenerateOutreachBody {
  projectId: string
  count: number // number of outreach entries to generate
}

// Predefined realistic outreach targets in the SEO/SaaS/AI space
const outreachTemplates = [
  {
    targetSite: 'searchenginejournal.com',
    targetEmail: 'editors@searchenginejournal.com',
    anchorText: 'AI visibility monitoring',
    subjectTemplate: (domain: string) => `Data-Driven Pitch: How ${domain} Tracks AI Search Visibility Across 17+ LLMs`,
    bodyTemplate: (domain: string) =>
      `Hi there,\n\nI'm reaching out from ${domain}, where we've been tracking how brands appear (and disappear) in AI-generated search results across ChatGPT, Perplexity, Claude, and 14 other LLMs.\n\nWe recently published data showing that 68% of brands that rank on page 1 of Google are completely invisible in AI Overviews. We'd love to share our methodology and findings with your audience.\n\nWould you be interested in a guest post or expert interview on this topic?\n\nBest,\nThe ${domain} Team`,
  },
  {
    targetSite: 'moz.com',
    targetEmail: 'community@moz.com',
    anchorText: 'generative engine optimization',
    subjectTemplate: (domain: string) => `Guest Post Proposal: GEO Is the New SEO — Lessons from ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hello Moz Community Team,\n\nAt ${domain}, we've spent the last 6 months running experiments on Generative Engine Optimization (GEO). Our key finding: traditional SEO signals like backlinks matter less for AI citations, while structured data and entity consistency matter more.\n\nWe'd love to write a detailed, data-backed guest post for the Moz Blog sharing our methodology and results. Think of it as a "Beginner's Guide to SEO" but for the AI era.\n\nLet me know if this sounds interesting!\n\nCheers,\nThe ${domain} Team`,
  },
  {
    targetSite: 'semrush.com/blog',
    targetEmail: 'content@semrush.com',
    anchorText: 'AEO optimization tools',
    subjectTemplate: (domain: string) => `Expert Contribution: Answer Engine Optimization Data from ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hi Semrush Content Team,\n\nI noticed your recent posts on AI search trends. At ${domain}, we've built an Answer Engine Optimization (AEO) platform and have some compelling data I think your readers would love.\n\nSpecifically, we analyzed 10,000 queries and found that FAQ schema + concise answer blocks increase AI citation rates by 3.2x. We'd be happy to contribute a data-driven section or full guest post.\n\nLooking forward to your thoughts!\n\nBest regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'ahrefs.com/blog',
    targetEmail: 'blog@ahrefs.com',
    anchorText: 'backlink outreach automation',
    subjectTemplate: (domain: string) => `Data Pitch: How AI Agents Are Automating Link Building at ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hey Ahrefs Blog Team,\n\nYour recent link building guides are fantastic. At ${domain}, we've taken a different approach: using AI agents to automate the entire outreach pipeline — from prospecting to personalized email generation.\n\nOur data shows 34% reply rates on AI-generated outreach (vs. 12% industry average). We'd love to share the playbook with your audience through a guest contribution or case study.\n\nWould this be a fit?\n\nThanks,\nThe ${domain} Team`,
  },
  {
    targetSite: 'yoast.com',
    targetEmail: 'content@yoast.com',
    anchorText: 'llms.txt WordPress',
    subjectTemplate: (domain: string) => `Feature Idea: llms.txt Support for WordPress — A Collaboration with ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hi Yoast Team,\n\nAs WordPress powers 43% of the web, the new llms.txt standard could be transformative for your users' AI discoverability. At ${domain}, we've built the first WordPress plugin that auto-generates and maintains llms.txt files.\n\nWe'd love to explore a collaboration — whether that's a guest post on llms.txt best practices for WordPress users, or a technical integration discussion.\n\nWhat do you think?\n\nWarm regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'hubspot.com/blog',
    targetEmail: 'pitch@hubspot.com',
    anchorText: 'SEO automation platform',
    subjectTemplate: (domain: string) => `Guest Post: The ROI of SEO Automation — ${domain} Case Study`,
    bodyTemplate: (domain: string) =>
      `Hi HubSpot Content Team,\n\nAt ${domain}, we've helped agencies save an average of 23 hours/month on SEO tasks through AI automation. One agency grew from 8 to 22 clients without hiring, purely through our auto-pilot agents.\n\nI'd love to write a detailed case study for the HubSpot Blog on the ROI of SEO automation, with real numbers and actionable takeaways for your audience of marketers.\n\nLet me know if this aligns with your content calendar!\n\nBest,\nThe ${domain} Team`,
  },
  {
    targetSite: 'neilpatel.com',
    targetEmail: 'content@neilpatel.com',
    anchorText: 'AI search analytics',
    subjectTemplate: (domain: string) => `Exclusive Data: AI Search Is Eating Traditional SEO — Insights from ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hi Neil Patel Content Team,\n\nAt ${domain}, we track brand visibility across 17+ AI search engines. Our latest data shows a 47% decline in traditional organic CTR for queries that trigger AI Overviews.\n\nWe'd love to share this exclusive dataset with your audience through a guest contribution, complete with actionable strategies for adapting to this shift.\n\nThis feels like exactly the kind of data-driven content Neil's audience craves.\n\nBest regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'backlinko.com',
    targetEmail: 'brian@backlinko.com',
    anchorText: 'E-E-A-T optimization',
    subjectTemplate: (domain: string) => `Research Pitch: E-E-A-T Signals That AI Models Actually Use — ${domain} Study`,
    bodyTemplate: (domain: string) =>
      `Hey Brian,\n\nAt ${domain}, we ran a study analyzing which E-E-A-T signals actually influence AI model citations. Turns out, "Experience" and "Trust" signals have 2.8x more impact on AI visibility than traditional authority metrics.\n\nThis aligns perfectly with Backlinko's data-driven approach. We'd love to contribute a research-backed guest post with original findings.\n\nWould love to discuss further!\n\nCheers,\nThe ${domain} Team`,
  },
  {
    targetSite: 'screamingfrog.co.uk',
    targetEmail: 'info@screamingfrog.co.uk',
    anchorText: 'AI crawler optimization',
    subjectTemplate: (domain: string) => `Technical Collaboration: AI Crawler Detection & Optimization — ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hi Screaming Frog Team,\n\nAt ${domain}, we've been mapping AI crawler behavior (ClaudeBot, GPTBot, PerplexityBot, etc.) and noticed most sites are accidentally blocking them while trying to block scrapers.\n\nWe've developed a crawler taxonomy and robots.txt best practices specifically for AI bots. We'd love to collaborate on a technical guide or share our data for your community.\n\nBest,\nThe ${domain} Team`,
  },
  {
    targetSite: 'contentkingapp.com',
    targetEmail: 'support@contentkingapp.com',
    anchorText: 'real-time SEO monitoring',
    subjectTemplate: (domain: string) => `Partnership Proposal: Real-Time AI Visibility Monitoring — ${domain} x ContentKing`,
    bodyTemplate: (domain: string) =>
      `Hi ContentKing Team,\n\nYour real-time SEO monitoring is best-in-class. At ${domain}, we've built the equivalent for AI search visibility — tracking when brands appear in ChatGPT, Perplexity, and other AI-generated results.\n\nWe see a natural fit: SEO monitoring + AI visibility monitoring = complete search presence tracking. Would love to explore a partnership or integration discussion.\n\nLooking forward to connecting!\n\nBest regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'serpstat.com',
    targetEmail: 'marketing@serpstat.com',
    anchorText: 'AI visibility tracking',
    subjectTemplate: (domain: string) => `Guest Contribution: How ${domain} Tracks Brand Mentions in AI Search`,
    bodyTemplate: (domain: string) =>
      `Hi Serpstat Marketing Team,\n\nWe've been following your excellent content on SERP analytics. At ${domain}, we're tracking a new metric: AI Visibility Score — how often a brand appears in AI-generated search results.\n\nWe'd love to contribute a guest post explaining our methodology and sharing early data on how AI visibility correlates (and doesn't correlate) with traditional SERP positions.\n\nWould this be a fit for your blog?\n\nThanks,\nThe ${domain} Team`,
  },
  {
    targetSite: 'surferseo.com',
    targetEmail: 'partnerships@surferseo.com',
    anchorText: 'content optimization AI',
    subjectTemplate: (domain: string) => `Co-Marketing Opportunity: Content Optimization for AI Search — ${domain} + Surfer`,
    bodyTemplate: (domain: string) =>
      `Hi Surfer SEO Team,\n\nYour content optimization tools are the gold standard for traditional SEO. At ${domain}, we're building the equivalent for AI search — optimizing content specifically for how LLMs select and cite sources.\n\nWe think there's a powerful co-marketing story here: "Optimize for Google AND AI." Would you be interested in a joint webinar, co-authored guide, or cross-promotion?\n\nExcited to explore this!\n\nWarm regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'productled.com',
    targetEmail: 'hello@productled.com',
    anchorText: 'SEO SaaS growth',
    subjectTemplate: (domain: string) => `Growth Story: How ${domain} Uses Product-Led SEO to Drive SaaS Growth`,
    bodyTemplate: (domain: string) =>
      `Hi ProductLed Team,\n\nAt ${domain}, we've taken a product-led approach to SEO — our free AI visibility audit drives 40% of our signups. Users see their AI search score, then upgrade for ongoing monitoring and auto-optimization.\n\nI'd love to share this PLG + SEO growth story with your audience through a guest post or podcast appearance.\n\nDoes this align with your content priorities?\n\nBest,\nThe ${domain} Team`,
  },
  {
    targetSite: 'growthbarseo.com',
    targetEmail: 'hello@growthbarseo.com',
    anchorText: 'AI SEO writing',
    subjectTemplate: (domain: string) => `Comparison Guide: ${domain} vs GrowthBar — AI SEO Tools in 2025`,
    bodyTemplate: (domain: string) =>
      `Hi GrowthBar Team,\n\nWe're both in the AI + SEO space, and we think an honest comparison would help users choose the right tool for their needs. GrowthBar excels at AI content generation; ${domain} focuses on AI visibility monitoring and auto-optimization.\n\nWould you be open to co-authoring an objective comparison guide? We think it'd be valuable for both our audiences.\n\nLet's chat!\n\nCheers,\nThe ${domain} Team`,
  },
  {
    targetSite: 'brightlocal.com',
    targetEmail: 'partnerships@brightlocal.com',
    anchorText: 'local SEO AI optimization',
    subjectTemplate: (domain: string) => `Local SEO Meets AI Search: Partnership with ${domain}`,
    bodyTemplate: (domain: string) =>
      `Hi BrightLocal Team,\n\nLocal businesses are increasingly being recommended by AI assistants. At ${domain}, we've found that 52% of "near me" queries now trigger AI Overviews with local business citations.\n\nWe'd love to explore a partnership where BrightLocal's local SEO data + ${domain}'s AI visibility tracking = the ultimate local search solution.\n\nWould you be open to a conversation?\n\nBest regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'jasper.ai',
    targetEmail: 'partnerships@jasper.ai',
    anchorText: 'AI content SEO optimization',
    subjectTemplate: (domain: string) => `Integration Proposal: Jasper Content + ${domain} AI Visibility = Full-Stack AI SEO`,
    bodyTemplate: (domain: string) =>
      `Hi Jasper Team,\n\nJasper creates amazing AI content. ${domain} ensures that content gets found by both Google and AI search engines. Together, we'd offer a complete AI content creation + optimization stack.\n\nWe'd love to explore an integration where Jasper-generated content is automatically scored for AI visibility and optimized before publishing.\n\nWould this be worth a conversation?\n\nThanks,\nThe ${domain} Team`,
  },
  {
    targetSite: 'clearscope.io',
    targetEmail: 'hello@clearscope.io',
    anchorText: 'content intelligence AI search',
    subjectTemplate: (domain: string) => `Content Intelligence for AI Search: ${domain} + Clearscope`,
    bodyTemplate: (domain: string) =>
      `Hi Clearscope Team,\n\nYour content intelligence platform helps writers create SEO-optimized content. At ${domain}, we're adding a new dimension: AI search optimization — ensuring content is structured for LLM citations and AI Overviews.\n\nWe think a joint guide on "Content Optimization for Google + AI Search" would be incredibly valuable. Would you be interested?\n\nLooking forward to your thoughts!\n\nBest,\nThe ${domain} Team`,
  },
  {
    targetSite: 'sproutsocial.com',
    targetEmail: 'content@sproutsocial.com',
    anchorText: 'social media SEO synergy',
    subjectTemplate: (domain: string) => `Data Story: How Social Signals Influence AI Search Visibility — ${domain} Research`,
    bodyTemplate: (domain: string) =>
      `Hi Sprout Social Content Team,\n\nAt ${domain}, we've been studying the relationship between social signals and AI search visibility. Our data shows that brands with active social presence get cited 2.1x more often by AI models like ChatGPT and Perplexity.\n\nWe'd love to write a data-driven guest post for the Sprout Blog exploring this social-SEO-AI connection.\n\nWould this be a good fit?\n\nBest regards,\nThe ${domain} Team`,
  },
  {
    targetSite: 'venngage.com',
    targetEmail: 'marketing@venngage.com',
    anchorText: 'infographic SEO strategy',
    subjectTemplate: (domain: string) => `Visual Content + AI Search: How ${domain} Measures Infographic Impact on AI Visibility`,
    bodyTemplate: (domain: string) =>
      `Hi Venngage Team,\n\nInfographics and visual content are powerful link-building tools, but how do they impact AI search visibility? At ${domain}, we've been tracking this and found that pages with embedded infographics get 1.7x more AI citations.\n\nWe'd love to contribute a guest post to the Venngage Blog sharing our findings and actionable tips for visual content SEO in the AI era.\n\nLet me know if this interests you!\n\nCheers,\nThe ${domain} Team`,
  },
  {
    targetSite: 'witfriday.com',
    targetEmail: 'hello@witfriday.com',
    anchorText: 'SEO agency automation',
    subjectTemplate: (domain: string) => `Agency Spotlight: How ${domain} Saves Agencies 23 Hours/Month on SEO`,
    bodyTemplate: (domain: string) =>
      `Hi WitFriday Team,\n\nWe know agencies are always looking for efficiency gains. At ${domain}, our AI agents handle technical audits, content publishing, and link outreach automatically — saving our agency partners an average of 23 hours per month.\n\nWe'd love to be featured in your agency spotlight series or contribute a guest post on SEO automation for agencies.\n\nWould this be a fit?\n\nBest,\nThe ${domain} Team`,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateOutreachBody

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    if (!body.count || body.count < 1) {
      return NextResponse.json(
        { error: 'count must be at least 1' },
        { status: 400 }
      )
    }

    if (body.count > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 outreach emails per request' },
        { status: 400 }
      )
    }

    // Verify the project exists and is a Client Zero project
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.isInternalAutopilot) {
      return NextResponse.json(
        { error: 'Project is not a Client Zero project' },
        { status: 400 }
      )
    }

    const domain = project.domain

    // Generate outreach entries by cycling through templates
    const outreachEntries = Array.from({ length: body.count }, (_, i) => {
      const template = outreachTemplates[i % outreachTemplates.length]

      return {
        projectId: body.projectId,
        targetSite: template.targetSite,
        targetEmail: template.targetEmail,
        subject: template.subjectTemplate(domain),
        emailBody: template.bodyTemplate(domain),
        anchorText: template.anchorText,
        targetUrl: project.url,
        status: 'pending' as const,
      }
    })

    const result = await db.outreachLog.createMany({
      data: outreachEntries,
    })

    console.log(
      `[Outreach Queue] Created ${result.count} outreach entries for project ${domain}`
    )

    return NextResponse.json({
      message: `Generated ${result.count} outreach emails for ${domain}`,
      count: result.count,
      projectId: body.projectId,
    }, { status: 201 })
  } catch (error) {
    console.error('[Admin Outreach Queue API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate outreach emails' },
      { status: 500 }
    )
  }
}
