import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

const INDUSTRIES = [
  { id: 'dentists', label: 'Dentists' },
  { id: 'law_firms', label: 'Law Firms' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'saas', label: 'SaaS Companies' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'marketing_agencies', label: 'Marketing Agencies' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'ecommerce', label: 'E-Commerce' },
  { id: 'finance', label: 'Financial Services' },
  { id: 'education', label: 'Education' },
  { id: 'travel', label: 'Travel & Tourism' },
  { id: 'fitness', label: 'Fitness & Wellness' },
  { id: 'construction', label: 'Construction' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'nonprofit', label: 'Non-Profit' },
  { id: 'retail', label: 'Retail' },
  { id: 'tech_startups', label: 'Tech Startups' },
]

// GET /api/ai/benchmarks?industry=saas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const industryId = searchParams.get('industry')

    // Try database first
    if (industryId) {
      const existing = await safeQuery(
        (d) => d.industryBenchmark.findUnique({ where: { industry: industryId } }),
        null
      )
      if (existing) {
        return NextResponse.json({
          industry: existing,
          _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
        })
      }
    } else {
      const all = await safeQuery(
        (d) => d.industryBenchmark.findMany({ orderBy: { avgAIVisibility: 'desc' } }),
        []
      )
      if (all.length > 0) {
        return NextResponse.json({
          industries: all,
          _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
        })
      }
    }

    // No database data — generate via LLM
    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an AI visibility benchmarking system. You estimate average AI Visibility Scores for different industries based on typical online presence patterns. Return ONLY valid JSON.' },
        { role: 'user', content: `Generate AI Visibility Score benchmarks for these industries: ${INDUSTRIES.map(i => i.label).join(', ')}.

For each industry, provide:
- Average AI Visibility Score (0-100)
- Average Trust Score (0-100) 
- Average Freshness Score (0-100)
- Average Authority Score (0-100)
- Per-engine scores (chatgpt, claude, gemini, perplexity, copilot)

Base estimates on:
- How active the industry is online
- How much structured data they typically have
- How likely AI engines are to cite sources from this industry
- How much content they produce

Return JSON:
{
  "benchmarks": [
    {
      "industry": "industry_id",
      "industryLabel": "Industry Name",
      "avgAIVisibility": 0-100,
      "avgTrust": 0-100,
      "avgFreshness": 0-100,
      "avgAuthority": 0-100,
      "perEngine": { "chatgpt": 0-100, "claude": 0-100, "gemini": 0-100, "perplexity": 0-100, "copilot": 0-100 },
      "sampleSize": number
    }
  ]
}` }
      ],
      { taskType: 'scoring', temperature: 0.3, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      return NextResponse.json({
        industries: getSimulationBenchmarks(),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
      })
    }

    let parsed: Record<string, unknown>
    try {
      const c = routerResult.content.trim()
      const m = c.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = m ? m[1].trim() : c.replace(/,\s*([}\]])/g, '$1')
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({
        industries: getSimulationBenchmarks(),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const benchmarks = (parsed.benchmarks as Array<Record<string, unknown>> || []).map(b => ({
      id: `bench-${b.industry}`,
      industry: String(b.industry || ''),
      industryLabel: String(b.industryLabel || ''),
      avgAIVisibility: Math.min(100, Math.max(0, Number(b.avgAIVisibility) || 0)),
      avgTrust: Math.min(100, Math.max(0, Number(b.avgTrust) || 0)),
      avgFreshness: Math.min(100, Math.max(0, Number(b.avgFreshness) || 0)),
      avgAuthority: Math.min(100, Math.max(0, Number(b.avgAuthority) || 0)),
      perEngine: JSON.stringify(b.perEngine || {}),
      sampleSize: Number(b.sampleSize) || 100,
      updatedAt: new Date().toISOString(),
    }))

    if (industryId) {
      const match = benchmarks.find(b => b.industry === industryId)
      return NextResponse.json({
        industry: match || benchmarks[0],
        _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
      })
    }

    return NextResponse.json({
      industries: benchmarks,
      _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/benchmarks] Error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({
      industries: getSimulationBenchmarks(),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

function getSimulationBenchmarks() {
  return [
    { id: 'bench-saas', industry: 'saas', industryLabel: 'SaaS Companies', avgAIVisibility: 62, avgTrust: 55, avgFreshness: 71, avgAuthority: 58, perEngine: '{"chatgpt":68,"claude":55,"gemini":60,"perplexity":72,"copilot":51}', sampleSize: 234, updatedAt: new Date().toISOString() },
    { id: 'bench-dentists', industry: 'dentists', industryLabel: 'Dentists', avgAIVisibility: 43, avgTrust: 38, avgFreshness: 52, avgAuthority: 35, perEngine: '{"chatgpt":48,"claude":38,"gemini":42,"perplexity":50,"copilot":35}', sampleSize: 512, updatedAt: new Date().toISOString() },
    { id: 'bench-law_firms', industry: 'law_firms', industryLabel: 'Law Firms', avgAIVisibility: 58, avgTrust: 62, avgFreshness: 45, avgAuthority: 65, perEngine: '{"chatgpt":62,"claude":58,"gemini":55,"perplexity":60,"copilot":52}', sampleSize: 389, updatedAt: new Date().toISOString() },
    { id: 'bench-hotels', industry: 'hotels', industryLabel: 'Hotels', avgAIVisibility: 61, avgTrust: 52, avgFreshness: 68, avgAuthority: 55, perEngine: '{"chatgpt":65,"claude":58,"gemini":63,"perplexity":62,"copilot":55}', sampleSize: 728, updatedAt: new Date().toISOString() },
    { id: 'bench-restaurants', industry: 'restaurants', industryLabel: 'Restaurants', avgAIVisibility: 29, avgTrust: 22, avgFreshness: 45, avgAuthority: 20, perEngine: '{"chatgpt":32,"claude":25,"gemini":30,"perplexity":35,"copilot":22}', sampleSize: 1240, updatedAt: new Date().toISOString() },
    { id: 'bench-real_estate', industry: 'real_estate', industryLabel: 'Real Estate', avgAIVisibility: 47, avgTrust: 42, avgFreshness: 55, avgAuthority: 40, perEngine: '{"chatgpt":52,"claude":45,"gemini":48,"perplexity":50,"copilot":38}', sampleSize: 456, updatedAt: new Date().toISOString() },
    { id: 'bench-marketing_agencies', industry: 'marketing_agencies', industryLabel: 'Marketing Agencies', avgAIVisibility: 55, avgTrust: 48, avgFreshness: 65, avgAuthority: 50, perEngine: '{"chatgpt":60,"claude":52,"gemini":55,"perplexity":58,"copilot":48}', sampleSize: 312, updatedAt: new Date().toISOString() },
    { id: 'bench-healthcare', industry: 'healthcare', industryLabel: 'Healthcare', avgAIVisibility: 51, avgTrust: 58, avgFreshness: 42, avgAuthority: 60, perEngine: '{"chatgpt":55,"claude":52,"gemini":48,"perplexity":53,"copilot":45}', sampleSize: 678, updatedAt: new Date().toISOString() },
    { id: 'bench-ecommerce', industry: 'ecommerce', industryLabel: 'E-Commerce', avgAIVisibility: 57, avgTrust: 45, avgFreshness: 72, avgAuthority: 48, perEngine: '{"chatgpt":62,"claude":50,"gemini":58,"perplexity":65,"copilot":48}', sampleSize: 534, updatedAt: new Date().toISOString() },
    { id: 'bench-finance', industry: 'finance', industryLabel: 'Financial Services', avgAIVisibility: 64, avgTrust: 68, avgFreshness: 48, avgAuthority: 72, perEngine: '{"chatgpt":68,"claude":62,"gemini":60,"perplexity":65,"copilot":58}', sampleSize: 298, updatedAt: new Date().toISOString() },
    { id: 'bench-education', industry: 'education', industryLabel: 'Education', avgAIVisibility: 52, avgTrust: 55, avgFreshness: 50, avgAuthority: 58, perEngine: '{"chatgpt":56,"claude":52,"gemini":50,"perplexity":55,"copilot":45}', sampleSize: 445, updatedAt: new Date().toISOString() },
    { id: 'bench-travel', industry: 'travel', industryLabel: 'Travel & Tourism', avgAIVisibility: 59, avgTrust: 50, avgFreshness: 68, avgAuthority: 52, perEngine: '{"chatgpt":63,"claude":55,"gemini":60,"perplexity":62,"copilot":52}', sampleSize: 367, updatedAt: new Date().toISOString() },
    { id: 'bench-fitness', industry: 'fitness', industryLabel: 'Fitness & Wellness', avgAIVisibility: 41, avgTrust: 35, avgFreshness: 55, avgAuthority: 32, perEngine: '{"chatgpt":45,"claude":38,"gemini":42,"perplexity":48,"copilot":32}', sampleSize: 289, updatedAt: new Date().toISOString() },
    { id: 'bench-construction', industry: 'construction', industryLabel: 'Construction', avgAIVisibility: 25, avgTrust: 22, avgFreshness: 30, avgAuthority: 20, perEngine: '{"chatgpt":28,"claude":22,"gemini":25,"perplexity":30,"copilot":20}', sampleSize: 198, updatedAt: new Date().toISOString() },
    { id: 'bench-automotive', industry: 'automotive', industryLabel: 'Automotive', avgAIVisibility: 48, avgTrust: 42, avgFreshness: 52, avgAuthority: 45, perEngine: '{"chatgpt":52,"claude":45,"gemini":48,"perplexity":50,"copilot":42}', sampleSize: 256, updatedAt: new Date().toISOString() },
    { id: 'bench-insurance', industry: 'insurance', industryLabel: 'Insurance', avgAIVisibility: 53, avgTrust: 58, avgFreshness: 40, avgAuthority: 62, perEngine: '{"chatgpt":58,"claude":52,"gemini":50,"perplexity":55,"copilot":48}', sampleSize: 178, updatedAt: new Date().toISOString() },
    { id: 'bench-consulting', industry: 'consulting', industryLabel: 'Consulting', avgAIVisibility: 56, avgTrust: 52, avgFreshness: 60, avgAuthority: 55, perEngine: '{"chatgpt":60,"claude":55,"gemini":55,"perplexity":58,"copilot":50}', sampleSize: 145, updatedAt: new Date().toISOString() },
    { id: 'bench-nonprofit', industry: 'nonprofit', industryLabel: 'Non-Profit', avgAIVisibility: 33, avgTrust: 38, avgFreshness: 28, avgAuthority: 35, perEngine: '{"chatgpt":35,"claude":32,"gemini":30,"perplexity":38,"copilot":28}', sampleSize: 98, updatedAt: new Date().toISOString() },
    { id: 'bench-retail', industry: 'retail', industryLabel: 'Retail', avgAIVisibility: 45, avgTrust: 38, avgFreshness: 55, avgAuthority: 40, perEngine: '{"chatgpt":48,"claude":42,"gemini":45,"perplexity":50,"copilot":38}', sampleSize: 567, updatedAt: new Date().toISOString() },
    { id: 'bench-tech_startups', industry: 'tech_startups', industryLabel: 'Tech Startups', avgAIVisibility: 68, avgTrust: 52, avgFreshness: 78, avgAuthority: 55, perEngine: '{"chatgpt":72,"claude":62,"gemini":68,"perplexity":75,"copilot":58}', sampleSize: 423, updatedAt: new Date().toISOString() },
  ]
}
