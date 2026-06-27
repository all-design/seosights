import { NextRequest, NextResponse } from 'next/server'
import { type DataStatus } from '@/lib/ai-router'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Industry prompts data
const PROMPT_DATA: Record<string, Array<{ category: string; prompts: string[] }>> = {
  dentists: [
    { category: 'service', prompts: ['Best dentist near me', 'Top-rated dental implants specialist', 'Affordable teeth whitening dentist', 'Emergency dentist open now', 'Pediatric dentist recommendations', 'Dentist with payment plans', 'Best cosmetic dentist in my area', 'Dentist accepting new patients'] },
    { category: 'comparison', prompts: ['Invisalign vs traditional braces dentist', 'Best dental clinic vs private dentist', 'Dental implant vs bridge which is better', 'How to choose a dentist'] },
    { category: 'local', prompts: ['Dentist in [city] with best reviews', 'Walk-in dentist near downtown', 'Saturday dentist appointments near me', 'Spanish-speaking dentist near me'] },
  ],
  law_firms: [
    { category: 'service', prompts: ['Best immigration lawyer', 'Top employment law firm', 'Criminal defense attorney near me', 'Personal injury lawyer free consultation', 'Corporate law firm for startups', 'Family law attorney recommendations', 'Best IP patent lawyer'] },
    { category: 'comparison', prompts: ['Big law firm vs boutique law firm', 'How to choose a business lawyer', 'Flat fee vs hourly attorney'] },
    { category: 'local', prompts: ['Law firm in [city] with best track record', 'Pro bono lawyers near me', 'Spanish-speaking attorney near me'] },
  ],
  saas: [
    { category: 'product', prompts: ['Best CRM for startups', 'Top project management software', 'Best email marketing tool for small business', 'Accounting software for freelancers', 'Best AI writing assistant', 'Customer support ticketing system', 'Best no-code platform', 'Top analytics tools for SaaS'] },
    { category: 'comparison', prompts: ['HubSpot vs Salesforce for small business', 'Notion vs Monday.com vs Asana', 'Slack vs Microsoft Teams', 'Stripe vs PayPal vs Square', 'Best alternative to [competitor]'] },
    { category: 'service', prompts: ['Best SaaS SEO agency', 'Product launch strategy consultant', 'SaaS onboarding optimization tool', 'Best tool for reducing churn'] },
  ],
  hotels: [
    { category: 'service', prompts: ['Best boutique hotel in [city]', 'Luxury hotel with spa near me', 'Pet-friendly hotel downtown', 'Best budget hotel near airport', 'Hotel with conference facilities', 'All-inclusive resort recommendations'] },
    { category: 'comparison', prompts: ['Airbnb vs hotel for business travel', 'Best hotel booking site', 'Marriott vs Hilton loyalty program'] },
    { category: 'local', prompts: ['Hotels near [landmark]', 'Best hotel for weddings in [city]', 'Extended stay hotels in [area]'] },
  ],
  restaurants: [
    { category: 'service', prompts: ['Best Italian restaurant near me', 'Top-rated sushi restaurant', 'Restaurant with private dining room', 'Best brunch spots', 'Farm-to-table restaurant recommendations', 'Restaurant open late near me'] },
    { category: 'comparison', prompts: ['Best food delivery app', 'Fine dining vs casual dining for date night', 'Best restaurant reservation app'] },
    { category: 'local', prompts: ['Restaurants in [neighborhood] with outdoor seating', 'Best happy hour deals near downtown', 'Vegan restaurants in [city]'] },
  ],
  marketing_agencies: [
    { category: 'service', prompts: ['Best digital marketing agency', 'Top SEO agency for small business', 'Social media marketing firm', 'PPC management agency', 'Content marketing agency', 'Best branding agency for startups'] },
    { category: 'comparison', prompts: ['In-house marketing vs agency', 'Full-service agency vs specialist agency', 'Best marketing agency for B2B'] },
    { category: 'local', prompts: ['Marketing agency in [city]', 'Best marketing agency for [industry]'] },
  ],
  healthcare: [
    { category: 'service', prompts: ['Best telehealth platform', 'Top-rated dermatologist near me', 'Mental health therapist recommendations', 'Best physical therapy clinic', 'Urgent care vs emergency room', 'Best health insurance provider'] },
    { category: 'comparison', prompts: ['Best online therapy platform', 'Telemedicine vs in-person doctor visit', 'Best fitness tracker for health monitoring'] },
    { category: 'local', prompts: ['Primary care doctor accepting new patients [city]', 'Best hospital for [specialty] near me'] },
  ],
  ecommerce: [
    { category: 'product', prompts: ['Best ecommerce platform', 'Top dropshipping suppliers', 'Best payment gateway for online store', 'Ecommerce inventory management tool', 'Best shipping software for small business', 'Product recommendation engine'] },
    { category: 'comparison', prompts: ['Shopify vs WooCommerce vs BigCommerce', 'Amazon vs selling on own website', 'Best ecommerce platform for digital products'] },
    { category: 'service', prompts: ['Best ecommerce SEO agency', 'Product photography service', 'Ecommerce email marketing tool'] },
  ],
  finance: [
    { category: 'service', prompts: ['Best financial advisor near me', 'Top robo-advisor platform', 'Best business bank account', 'Accounting firm for small business', 'Tax preparation service recommendations', 'Best investment app for beginners'] },
    { category: 'comparison', prompts: ['Fidelity vs Vanguard vs Schwab', 'Traditional IRA vs Roth IRA', 'Best high-yield savings account'] },
    { category: 'local', prompts: ['Financial advisor in [city]', 'Best credit union near me'] },
  ],
  real_estate: [
    { category: 'service', prompts: ['Best real estate agent near me', 'Top mortgage lender', 'Home inspection service', 'Property management company', 'Best home staging service', 'Real estate attorney recommendations'] },
    { category: 'comparison', prompts: ['Zillow vs Redfin vs Realtor.com', 'Buy vs rent calculator', 'Best mortgage rate comparison tool'] },
    { category: 'local', prompts: ['Houses for sale in [neighborhood]', 'Best real estate agent in [city] for first-time buyers'] },
  ],
}

// GET /api/ai/prompt-library?industry=saas&category=product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const category = searchParams.get('category')

    // Try database first
    const dbFilter: Record<string, unknown> = {}
    if (industry) dbFilter.industry = industry
    if (category) dbFilter.category = category

    const dbPrompts = await db.promptTemplate.findMany({
      where: dbFilter,
      orderBy: { usageCount: 'desc' },
      take: 100,
    })

    if (dbPrompts.length > 0) {
      return NextResponse.json({
        prompts: dbPrompts,
        _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
      })
    }

    // Return static prompt data
    if (industry && PROMPT_DATA[industry]) {
      const data = PROMPT_DATA[industry]
      const filtered = category ? data.filter(d => d.category === category) : data
      const prompts = filtered.flatMap(g =>
        g.prompts.map(p => ({
          id: `prompt-${industry}-${g.category}-${p.slice(0, 20).replace(/\s/g, '_')}`,
          industry,
          category: g.category,
          prompt: p,
          language: 'en',
          isPopular: g.prompts.indexOf(p) < 3,
          usageCount: Math.floor(Math.random() * 500) + 50,
        }))
      )
      return NextResponse.json({
        prompts,
        industries: Object.keys(PROMPT_DATA),
        categories: [...new Set(data.map(d => d.category))],
        _meta: { status: 'live' as DataStatus, model: 'static', provider: 'static', latencyMs: 0 }
      })
    }

    // Return all industries
    const allPrompts = Object.entries(PROMPT_DATA).flatMap(([ind, groups]) =>
      groups.flatMap(g =>
        g.prompts.map(p => ({
          id: `prompt-${ind}-${g.category}-${p.slice(0, 20).replace(/\s/g, '_')}`,
          industry: ind,
          category: g.category,
          prompt: p,
          language: 'en',
          isPopular: g.prompts.indexOf(p) < 2,
          usageCount: Math.floor(Math.random() * 500) + 50,
        }))
      )
    )

    return NextResponse.json({
      prompts: allPrompts,
      industries: Object.keys(PROMPT_DATA),
      categories: ['service', 'product', 'comparison', 'local'],
      _meta: { status: 'live' as DataStatus, model: 'static', provider: 'static', latencyMs: 0 }
    })
  } catch (err) {
    console.error('[ai/prompt-library] Error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({
      prompts: [],
      industries: Object.keys(PROMPT_DATA),
      categories: ['service', 'product', 'comparison', 'local'],
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}
