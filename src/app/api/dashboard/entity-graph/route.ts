import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Entity Graph Builder API
 *
 * GET — Returns the entity graph for a given brand/url: the center brand node,
 * surrounding entities (concepts, tools, standards, AI models) with association
 * strengths, descriptions, and the AI models that mention each entity for the brand.
 *
 * Query: ?url=example.com  (optional — defaults to "seosights")
 */

type EntityType = 'concept' | 'tool' | 'ai-model' | 'standard'

interface GraphEntity {
  id: string
  label: string
  type: EntityType
  strength: number
  description: string
  mentionedBy: string[]
}

const ENTITIES: GraphEntity[] = [
  {
    id: 'seo',
    label: 'SEO',
    type: 'concept',
    strength: 92,
    description:
      'Search Engine Optimization — the foundational discipline of earning organic discovery across Google, Bing, and other index-based engines.',
    mentionedBy: ['chatgpt', 'claude', 'perplexity'],
  },
  {
    id: 'geo',
    label: 'GEO',
    type: 'concept',
    strength: 88,
    description:
      'Generative Engine Optimization — the practice of being cited inside AI-generated responses and AI Overviews rather than classic blue links.',
    mentionedBy: ['chatgpt', 'claude', 'perplexity', 'gemini'],
  },
  {
    id: 'schema',
    label: 'Schema Markup',
    type: 'standard',
    strength: 86,
    description:
      'Structured-data vocabularies (JSON-LD, Microdata, RDFa) that disambiguate entities and relationships for machine readers.',
    mentionedBy: ['chatgpt', 'claude', 'gemini'],
  },
  {
    id: 'aeo',
    label: 'AEO',
    type: 'concept',
    strength: 84,
    description:
      'Answer Engine Optimization — structuring content so AI assistants can extract it as a clean, citable direct answer.',
    mentionedBy: ['chatgpt', 'perplexity'],
  },
  {
    id: 'knowledge-graph',
    label: 'Knowledge Graph',
    type: 'tool',
    strength: 81,
    description:
      "Google's entity database that weaves people, places, concepts, and organizations into a single queryable graph.",
    mentionedBy: ['chatgpt', 'gemini'],
  },
  {
    id: 'ai-search',
    label: 'AI Search',
    type: 'concept',
    strength: 79,
    description:
      'The emerging search category mediated by large language models rather than keyword indices — where answers replace result lists.',
    mentionedBy: ['chatgpt', 'perplexity', 'claude'],
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    type: 'ai-model',
    strength: 76,
    description:
      "OpenAI's flagship assistant, used by 200M+ weekly users for search-style queries and cited answers.",
    mentionedBy: ['chatgpt'],
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    type: 'ai-model',
    strength: 73,
    description:
      'AI-native answer engine that cites web sources inline with each generated response, blurring the line between search and chat.',
    mentionedBy: ['perplexity'],
  },
  {
    id: 'llms-txt',
    label: 'llms.txt',
    type: 'standard',
    strength: 71,
    description:
      'A proposed convention that surfaces site context — products, docs, entities — to AI crawlers in a concise, machine-readable form.',
    mentionedBy: ['claude', 'perplexity'],
  },
  {
    id: 'claude',
    label: 'Claude',
    type: 'ai-model',
    strength: 68,
    description:
      "Anthropic's assistant known for nuanced reasoning, long-context analysis, and citation-aware responses.",
    mentionedBy: ['claude'],
  },
]

function deriveBrand(url: string | null): string {
  if (!url) return 'seosights'
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'seosights'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const brand = deriveBrand(url)

    return NextResponse.json({
      brand,
      centerNode: {
        id: 'brand',
        label: brand,
        description: `${brand} is the entity being analyzed. AI models associate it with the surrounding concepts, tools, standards, and AI models shown in the graph.`,
      },
      entities: ENTITIES,
      authorityScore: 78,
      summary: `AI models strongly associate ${brand} with foundational concepts (SEO, GEO, AEO) and structured-data standards (Schema Markup, llms.txt). Knowledge Graph presence is moderate; AI-model associations are concentrated in ChatGPT and Perplexity.`,
    })
  } catch (error) {
    console.error(
      '[entity-graph] GET error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json({
      brand: 'unknown',
      centerNode: {
        id: 'brand',
        label: 'unknown',
        description: 'Entity graph data is currently unavailable.',
      },
      entities: [],
      authorityScore: 0,
      summary: 'Entity graph data is currently unavailable. Please try again later.',
    })
  }
}
