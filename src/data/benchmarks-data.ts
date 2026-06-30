// ── Shared Benchmarks Data ──────────────────────────────────────────────
// Used by both the Benchmarks API route and the Benchmarks page client component.

export interface BenchmarkCompany {
  rank: number
  name: string
  slug: string
  aiVisibilityScore: number
  chatgptScore: number
  claudeScore: number
  geminiScore: number
  perplexityScore: number
  trend: number
  verified: boolean
}

export interface IndustryBenchmark {
  slug: string
  name: string
  emoji: string
  companies: BenchmarkCompany[]
}

export const industryBenchmarks: IndustryBenchmark[] = [
  {
    slug: 'dentists',
    name: 'Dentists',
    emoji: '🦷',
    companies: [
      { rank: 1, name: 'SmileDirectClub', slug: 'smiledirectclub', aiVisibilityScore: 94, chatgptScore: 96, claudeScore: 92, geminiScore: 93, perplexityScore: 95, trend: 3, verified: true },
      { rank: 2, name: 'Aspen Dental', slug: 'aspen-dental', aiVisibilityScore: 89, chatgptScore: 91, claudeScore: 87, geminiScore: 88, perplexityScore: 90, trend: 1, verified: true },
      { rank: 3, name: 'ClearChoice Dental', slug: 'clearchoice-dental', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 5, verified: true },
      { rank: 4, name: 'Pacific Dental Services', slug: 'pacific-dental', aiVisibilityScore: 78, chatgptScore: 80, claudeScore: 76, geminiScore: 77, perplexityScore: 79, trend: 2, verified: false },
      { rank: 5, name: 'Heartland Dental', slug: 'heartland-dental', aiVisibilityScore: 74, chatgptScore: 76, claudeScore: 72, geminiScore: 73, perplexityScore: 75, trend: -1, verified: false },
      { rank: 6, name: 'DDS Dentures', slug: 'dds-dentures', aiVisibilityScore: 68, chatgptScore: 70, claudeScore: 66, geminiScore: 67, perplexityScore: 69, trend: 4, verified: true },
      { rank: 7, name: 'Kool Smiles', slug: 'kool-smiles', aiVisibilityScore: 63, chatgptScore: 65, claudeScore: 61, geminiScore: 62, perplexityScore: 64, trend: 0, verified: false },
      { rank: 8, name: 'Bright Now Dental', slug: 'bright-now-dental', aiVisibilityScore: 58, chatgptScore: 60, claudeScore: 56, geminiScore: 57, perplexityScore: 59, trend: -2, verified: false },
      { rank: 9, name: 'Dental Care Alliance', slug: 'dental-care-alliance', aiVisibilityScore: 52, chatgptScore: 54, claudeScore: 50, geminiScore: 51, perplexityScore: 53, trend: 1, verified: false },
      { rank: 10, name: 'American Dental Partners', slug: 'american-dental-partners', aiVisibilityScore: 47, chatgptScore: 49, claudeScore: 45, geminiScore: 46, perplexityScore: 48, trend: -3, verified: false },
    ],
  },
  {
    slug: 'law-firms',
    name: 'Law Firms',
    emoji: '⚖️',
    companies: [
      { rank: 1, name: 'Latham & Watkins', slug: 'latham-watkins', aiVisibilityScore: 92, chatgptScore: 94, claudeScore: 90, geminiScore: 91, perplexityScore: 93, trend: 2, verified: true },
      { rank: 2, name: 'Kirkland & Ellis', slug: 'kirkland-ellis', aiVisibilityScore: 90, chatgptScore: 92, claudeScore: 88, geminiScore: 89, perplexityScore: 91, trend: 1, verified: true },
      { rank: 3, name: 'Baker McKenzie', slug: 'baker-mckenzie', aiVisibilityScore: 87, chatgptScore: 89, claudeScore: 85, geminiScore: 86, perplexityScore: 88, trend: 4, verified: true },
      { rank: 4, name: 'DLA Piper', slug: 'dla-piper', aiVisibilityScore: 82, chatgptScore: 84, claudeScore: 80, geminiScore: 81, perplexityScore: 83, trend: -1, verified: false },
      { rank: 5, name: 'Clifford Chance', slug: 'clifford-chance', aiVisibilityScore: 79, chatgptScore: 81, claudeScore: 77, geminiScore: 78, perplexityScore: 80, trend: 3, verified: true },
      { rank: 6, name: 'Skadden Arps', slug: 'skadden-arps', aiVisibilityScore: 75, chatgptScore: 77, claudeScore: 73, geminiScore: 74, perplexityScore: 76, trend: 0, verified: false },
      { rank: 7, name: 'White & Case', slug: 'white-case', aiVisibilityScore: 70, chatgptScore: 72, claudeScore: 68, geminiScore: 69, perplexityScore: 71, trend: 2, verified: false },
      { rank: 8, name: 'Linklaters', slug: 'linklaters', aiVisibilityScore: 66, chatgptScore: 68, claudeScore: 64, geminiScore: 65, perplexityScore: 67, trend: -2, verified: false },
      { rank: 9, name: 'Allen & Overy', slug: 'allen-overy', aiVisibilityScore: 61, chatgptScore: 63, claudeScore: 59, geminiScore: 60, perplexityScore: 62, trend: 1, verified: false },
      { rank: 10, name: 'Freshfields', slug: 'freshfields', aiVisibilityScore: 56, chatgptScore: 58, claudeScore: 54, geminiScore: 55, perplexityScore: 57, trend: -1, verified: false },
    ],
  },
  {
    slug: 'saas',
    name: 'SaaS',
    emoji: '☁️',
    companies: [
      { rank: 1, name: 'Salesforce', slug: 'salesforce', aiVisibilityScore: 97, chatgptScore: 98, claudeScore: 96, geminiScore: 97, perplexityScore: 97, trend: 1, verified: true },
      { rank: 2, name: 'HubSpot', slug: 'hubspot', aiVisibilityScore: 95, chatgptScore: 96, claudeScore: 94, geminiScore: 95, perplexityScore: 95, trend: 3, verified: true },
      { rank: 3, name: 'Slack', slug: 'slack', aiVisibilityScore: 93, chatgptScore: 95, claudeScore: 91, geminiScore: 92, perplexityScore: 94, trend: 2, verified: true },
      { rank: 4, name: 'Notion', slug: 'notion', aiVisibilityScore: 91, chatgptScore: 93, claudeScore: 89, geminiScore: 90, perplexityScore: 92, trend: 6, verified: true },
      { rank: 5, name: 'Stripe', slug: 'stripe', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 1, verified: false },
      { rank: 6, name: 'Zapier', slug: 'zapier', aiVisibilityScore: 84, chatgptScore: 86, claudeScore: 82, geminiScore: 83, perplexityScore: 85, trend: 4, verified: true },
      { rank: 7, name: 'Monday.com', slug: 'monday-com', aiVisibilityScore: 79, chatgptScore: 81, claudeScore: 77, geminiScore: 78, perplexityScore: 80, trend: 0, verified: false },
      { rank: 8, name: 'Airtable', slug: 'airtable', aiVisibilityScore: 74, chatgptScore: 76, claudeScore: 72, geminiScore: 73, perplexityScore: 75, trend: 2, verified: false },
      { rank: 9, name: 'ClickUp', slug: 'clickup', aiVisibilityScore: 69, chatgptScore: 71, claudeScore: 67, geminiScore: 68, perplexityScore: 70, trend: -1, verified: false },
      { rank: 10, name: 'Asana', slug: 'asana', aiVisibilityScore: 64, chatgptScore: 66, claudeScore: 62, geminiScore: 63, perplexityScore: 65, trend: -3, verified: false },
    ],
  },
  {
    slug: 'hotels',
    name: 'Hotels',
    emoji: '🏨',
    companies: [
      { rank: 1, name: 'Marriott', slug: 'marriott', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 1, verified: true },
      { rank: 2, name: 'Hilton', slug: 'hilton', aiVisibilityScore: 93, chatgptScore: 95, claudeScore: 91, geminiScore: 92, perplexityScore: 94, trend: 2, verified: true },
      { rank: 3, name: 'Hyatt', slug: 'hyatt', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 0, verified: true },
      { rank: 4, name: 'Four Seasons', slug: 'four-seasons', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 3, verified: false },
      { rank: 5, name: 'IHG Hotels', slug: 'ihg-hotels', aiVisibilityScore: 80, chatgptScore: 82, claudeScore: 78, geminiScore: 79, perplexityScore: 81, trend: -1, verified: false },
      { rank: 6, name: 'Accor', slug: 'accor', aiVisibilityScore: 74, chatgptScore: 76, claudeScore: 72, geminiScore: 73, perplexityScore: 75, trend: 2, verified: true },
      { rank: 7, name: 'Ritz-Carlton', slug: 'ritz-carlton', aiVisibilityScore: 69, chatgptScore: 71, claudeScore: 67, geminiScore: 68, perplexityScore: 70, trend: 5, verified: false },
      { rank: 8, name: 'W Hotels', slug: 'w-hotels', aiVisibilityScore: 63, chatgptScore: 65, claudeScore: 61, geminiScore: 62, perplexityScore: 64, trend: -2, verified: false },
      { rank: 9, name: 'Sheraton', slug: 'sheraton', aiVisibilityScore: 57, chatgptScore: 59, claudeScore: 55, geminiScore: 56, perplexityScore: 58, trend: 1, verified: false },
      { rank: 10, name: 'Radisson', slug: 'radisson', aiVisibilityScore: 51, chatgptScore: 53, claudeScore: 49, geminiScore: 50, perplexityScore: 52, trend: -4, verified: false },
    ],
  },
  {
    slug: 'ecommerce',
    name: 'Ecommerce',
    emoji: '🛒',
    companies: [
      { rank: 1, name: 'Amazon', slug: 'amazon', aiVisibilityScore: 99, chatgptScore: 99, claudeScore: 98, geminiScore: 99, perplexityScore: 99, trend: 0, verified: true },
      { rank: 2, name: 'Shopify', slug: 'shopify', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 2, verified: true },
      { rank: 3, name: 'eBay', slug: 'ebay', aiVisibilityScore: 90, chatgptScore: 92, claudeScore: 88, geminiScore: 89, perplexityScore: 91, trend: -1, verified: true },
      { rank: 4, name: 'Etsy', slug: 'etsy', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 3, verified: false },
      { rank: 5, name: 'WooCommerce', slug: 'woocommerce', aiVisibilityScore: 81, chatgptScore: 83, claudeScore: 79, geminiScore: 80, perplexityScore: 82, trend: 4, verified: true },
      { rank: 6, name: 'BigCommerce', slug: 'bigcommerce', aiVisibilityScore: 73, chatgptScore: 75, claudeScore: 71, geminiScore: 72, perplexityScore: 74, trend: 1, verified: false },
      { rank: 7, name: 'Walmart', slug: 'walmart', aiVisibilityScore: 68, chatgptScore: 70, claudeScore: 66, geminiScore: 67, perplexityScore: 69, trend: 0, verified: false },
      { rank: 8, name: 'Target', slug: 'target', aiVisibilityScore: 62, chatgptScore: 64, claudeScore: 60, geminiScore: 61, perplexityScore: 63, trend: -2, verified: false },
      { rank: 9, name: 'Zalando', slug: 'zalando', aiVisibilityScore: 55, chatgptScore: 57, claudeScore: 53, geminiScore: 54, perplexityScore: 56, trend: 2, verified: false },
      { rank: 10, name: 'Wayfair', slug: 'wayfair', aiVisibilityScore: 48, chatgptScore: 50, claudeScore: 46, geminiScore: 47, perplexityScore: 49, trend: -3, verified: false },
    ],
  },
  {
    slug: 'agencies',
    name: 'Agencies',
    emoji: '🎯',
    companies: [
      { rank: 1, name: 'WPP', slug: 'wpp', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 2, verified: true },
      { rank: 2, name: 'Omnicom', slug: 'omnicom', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 1, verified: true },
      { rank: 3, name: 'Publicis Groupe', slug: 'publicis-groupe', aiVisibilityScore: 82, chatgptScore: 84, claudeScore: 80, geminiScore: 81, perplexityScore: 83, trend: 3, verified: true },
      { rank: 4, name: 'Dentsu', slug: 'dentsu', aiVisibilityScore: 77, chatgptScore: 79, claudeScore: 75, geminiScore: 76, perplexityScore: 78, trend: 0, verified: false },
      { rank: 5, name: 'Interpublic', slug: 'interpublic', aiVisibilityScore: 72, chatgptScore: 74, claudeScore: 70, geminiScore: 71, perplexityScore: 73, trend: -1, verified: false },
      { rank: 6, name: 'Accenture Song', slug: 'accenture-song', aiVisibilityScore: 67, chatgptScore: 69, claudeScore: 65, geminiScore: 66, perplexityScore: 68, trend: 5, verified: true },
      { rank: 7, name: 'Deloitte Digital', slug: 'deloitte-digital', aiVisibilityScore: 62, chatgptScore: 64, claudeScore: 60, geminiScore: 61, perplexityScore: 63, trend: 2, verified: false },
      { rank: 8, name: 'R/GA', slug: 'rga', aiVisibilityScore: 56, chatgptScore: 58, claudeScore: 54, geminiScore: 55, perplexityScore: 57, trend: -2, verified: false },
      { rank: 9, name: 'Droga5', slug: 'droga5', aiVisibilityScore: 50, chatgptScore: 52, claudeScore: 48, geminiScore: 49, perplexityScore: 51, trend: 1, verified: false },
      { rank: 10, name: 'Wieden+Kennedy', slug: 'wieden-kennedy', aiVisibilityScore: 44, chatgptScore: 46, claudeScore: 42, geminiScore: 43, perplexityScore: 45, trend: -1, verified: false },
    ],
  },
]
