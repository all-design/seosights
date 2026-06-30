// ── Shared Directory Data ──────────────────────────────────────────────
// Used by both the Directory API route and the Directory page client component.

export interface DirectoryCompany {
  slug: string
  name: string
  industry: string
  location: string
  countryCode: string
  aiVisibilityScore: number
  chatgptScore: number
  claudeScore: number
  geminiScore: number
  perplexityScore: number
  trend: number
  citations: number
  recommendationRate: number
  verified: boolean
  description: string
}

export const directoryCompanies: DirectoryCompany[] = [
  // SaaS
  { slug: 'salesforce', name: 'Salesforce', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 97, chatgptScore: 98, claudeScore: 96, geminiScore: 97, perplexityScore: 97, trend: 1, citations: 8420, recommendationRate: 94, verified: true, description: 'Leading CRM platform for sales, service, and marketing automation.' },
  { slug: 'hubspot', name: 'HubSpot', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 95, chatgptScore: 96, claudeScore: 94, geminiScore: 95, perplexityScore: 95, trend: 3, citations: 6890, recommendationRate: 91, verified: true, description: 'All-in-one marketing, sales, and service platform.' },
  { slug: 'slack', name: 'Slack', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 93, chatgptScore: 95, claudeScore: 91, geminiScore: 92, perplexityScore: 94, trend: 2, citations: 5620, recommendationRate: 88, verified: true, description: 'Business communication platform with channels and messaging.' },
  { slug: 'notion', name: 'Notion', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 91, chatgptScore: 93, claudeScore: 89, geminiScore: 90, perplexityScore: 92, trend: 6, citations: 4980, recommendationRate: 86, verified: true, description: 'All-in-one workspace for notes, docs, wikis, and projects.' },
  { slug: 'stripe', name: 'Stripe', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 1, citations: 4510, recommendationRate: 82, verified: false, description: 'Payment processing platform for internet businesses.' },
  { slug: 'zapier', name: 'Zapier', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 84, chatgptScore: 86, claudeScore: 82, geminiScore: 83, perplexityScore: 85, trend: 4, citations: 3870, recommendationRate: 79, verified: true, description: 'Automation platform connecting 6000+ apps.' },
  { slug: 'monday-com', name: 'Monday.com', industry: 'SaaS', location: 'Israel', countryCode: '🇮🇱', aiVisibilityScore: 79, chatgptScore: 81, claudeScore: 77, geminiScore: 78, perplexityScore: 80, trend: 0, citations: 2940, recommendationRate: 74, verified: false, description: 'Work OS platform for project and team management.' },
  { slug: 'airtable', name: 'Airtable', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 74, chatgptScore: 76, claudeScore: 72, geminiScore: 73, perplexityScore: 75, trend: 2, citations: 2310, recommendationRate: 68, verified: false, description: 'Low-code platform for building collaborative apps.' },
  { slug: 'clickup', name: 'ClickUp', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 69, chatgptScore: 71, claudeScore: 67, geminiScore: 68, perplexityScore: 70, trend: -1, citations: 1850, recommendationRate: 63, verified: false, description: 'Productivity platform for docs, projects, and goals.' },

  // Agencies
  { slug: 'wpp', name: 'WPP', industry: 'Agencies', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 2, citations: 4120, recommendationRate: 83, verified: true, description: 'World\'s largest advertising and PR group.' },
  { slug: 'omnicom', name: 'Omnicom', industry: 'Agencies', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 1, citations: 3680, recommendationRate: 80, verified: true, description: 'Global marketing and corporate communications company.' },
  { slug: 'publicis-groupe', name: 'Publicis Groupe', industry: 'Agencies', location: 'France', countryCode: '🇫🇷', aiVisibilityScore: 82, chatgptScore: 84, claudeScore: 80, geminiScore: 81, perplexityScore: 83, trend: 3, citations: 3150, recommendationRate: 77, verified: true, description: 'French multinational advertising and PR company.' },
  { slug: 'dentsu', name: 'Dentsu', industry: 'Agencies', location: 'Japan', countryCode: '🇯🇵', aiVisibilityScore: 77, chatgptScore: 79, claudeScore: 75, geminiScore: 76, perplexityScore: 78, trend: 0, citations: 2680, recommendationRate: 72, verified: false, description: 'Japanese international advertising and PR holding company.' },
  { slug: 'accenture-song', name: 'Accenture Song', industry: 'Agencies', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 67, chatgptScore: 69, claudeScore: 65, geminiScore: 66, perplexityScore: 68, trend: 5, citations: 1640, recommendationRate: 62, verified: true, description: 'Accenture\'s tech-powered creative agency.' },
  { slug: 'deloitte-digital', name: 'Deloitte Digital', industry: 'Agencies', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 62, chatgptScore: 64, claudeScore: 60, geminiScore: 61, perplexityScore: 63, trend: 2, citations: 1280, recommendationRate: 57, verified: false, description: 'Global creative digital consultancy.' },
  { slug: 'rga', name: 'R/GA', industry: 'Agencies', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 56, chatgptScore: 58, claudeScore: 54, geminiScore: 55, perplexityScore: 57, trend: -2, citations: 920, recommendationRate: 51, verified: false, description: 'Innovation consultancy for the digital age.' },

  // Law Firms
  { slug: 'latham-watkins', name: 'Latham & Watkins', industry: 'Law Firms', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 92, chatgptScore: 94, claudeScore: 90, geminiScore: 91, perplexityScore: 93, trend: 2, citations: 5230, recommendationRate: 89, verified: true, description: 'Leading global law firm for M&A, capital markets, and litigation.' },
  { slug: 'kirkland-ellis', name: 'Kirkland & Ellis', industry: 'Law Firms', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 90, chatgptScore: 92, claudeScore: 88, geminiScore: 89, perplexityScore: 91, trend: 1, citations: 4810, recommendationRate: 87, verified: true, description: 'Global law firm focused on private equity and M&A.' },
  { slug: 'baker-mckenzie', name: 'Baker McKenzie', industry: 'Law Firms', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 87, chatgptScore: 89, claudeScore: 85, geminiScore: 86, perplexityScore: 88, trend: 4, citations: 4320, recommendationRate: 84, verified: true, description: 'Global law firm with 77 offices across 47 countries.' },
  { slug: 'dla-piper', name: 'DLA Piper', industry: 'Law Firms', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 82, chatgptScore: 84, claudeScore: 80, geminiScore: 81, perplexityScore: 83, trend: -1, citations: 3540, recommendationRate: 78, verified: false, description: 'Multinational law firm with offices in 40+ countries.' },
  { slug: 'clifford-chance', name: 'Clifford Chance', industry: 'Law Firms', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 79, chatgptScore: 81, claudeScore: 77, geminiScore: 78, perplexityScore: 80, trend: 3, citations: 3080, recommendationRate: 75, verified: true, description: 'Multinational law firm headquartered in London.' },
  { slug: 'skadden-arps', name: 'Skadden Arps', industry: 'Law Firms', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 75, chatgptScore: 77, claudeScore: 73, geminiScore: 74, perplexityScore: 76, trend: 0, citations: 2560, recommendationRate: 71, verified: false, description: 'Leading law firm for corporate transactions and litigation.' },

  // Hotels
  { slug: 'marriott', name: 'Marriott', industry: 'Hotels', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 1, citations: 7210, recommendationRate: 92, verified: true, description: 'World\'s largest hotel chain with 8,000+ properties.' },
  { slug: 'hilton', name: 'Hilton', industry: 'Hotels', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 93, chatgptScore: 95, claudeScore: 91, geminiScore: 92, perplexityScore: 94, trend: 2, citations: 6180, recommendationRate: 89, verified: true, description: 'Global hospitality company with 7,000+ properties.' },
  { slug: 'hyatt', name: 'Hyatt', industry: 'Hotels', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 88, chatgptScore: 90, claudeScore: 86, geminiScore: 87, perplexityScore: 89, trend: 0, citations: 4890, recommendationRate: 83, verified: true, description: 'Global hospitality company with luxury and lifestyle brands.' },
  { slug: 'four-seasons', name: 'Four Seasons', industry: 'Hotels', location: 'Canada', countryCode: '🇨🇦', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 3, citations: 4120, recommendationRate: 80, verified: false, description: 'Luxury hotel and resort chain worldwide.' },
  { slug: 'ihg-hotels', name: 'IHG Hotels', industry: 'Hotels', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 80, chatgptScore: 82, claudeScore: 78, geminiScore: 79, perplexityScore: 81, trend: -1, citations: 3560, recommendationRate: 75, verified: false, description: 'International hotel group with 6,000+ hotels.' },
  { slug: 'accor', name: 'Accor', industry: 'Hotels', location: 'France', countryCode: '🇫🇷', aiVisibilityScore: 74, chatgptScore: 76, claudeScore: 72, geminiScore: 73, perplexityScore: 75, trend: 2, citations: 2890, recommendationRate: 69, verified: true, description: 'French hospitality group with 5,400+ properties.' },

  // Ecommerce
  { slug: 'amazon', name: 'Amazon', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 99, chatgptScore: 99, claudeScore: 98, geminiScore: 99, perplexityScore: 99, trend: 0, citations: 12400, recommendationRate: 98, verified: true, description: 'The world\'s largest online marketplace and cloud provider.' },
  { slug: 'shopify', name: 'Shopify', industry: 'Ecommerce', location: 'Canada', countryCode: '🇨🇦', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 2, citations: 8970, recommendationRate: 93, verified: true, description: 'Ecommerce platform for online stores and retail POS.' },
  { slug: 'ebay', name: 'eBay', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 90, chatgptScore: 92, claudeScore: 88, geminiScore: 89, perplexityScore: 91, trend: -1, citations: 6120, recommendationRate: 85, verified: true, description: 'Global online marketplace for consumer-to-consumer sales.' },
  { slug: 'etsy', name: 'Etsy', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 85, chatgptScore: 87, claudeScore: 83, geminiScore: 84, perplexityScore: 86, trend: 3, citations: 4780, recommendationRate: 79, verified: false, description: 'Marketplace for handmade, vintage, and craft items.' },
  { slug: 'woocommerce', name: 'WooCommerce', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 81, chatgptScore: 83, claudeScore: 79, geminiScore: 80, perplexityScore: 82, trend: 4, citations: 3920, recommendationRate: 75, verified: true, description: 'Open-source ecommerce plugin for WordPress.' },
  { slug: 'zalando', name: 'Zalando', industry: 'Ecommerce', location: 'Germany', countryCode: '🇩🇪', aiVisibilityScore: 55, chatgptScore: 57, claudeScore: 53, geminiScore: 54, perplexityScore: 56, trend: 2, citations: 1340, recommendationRate: 48, verified: false, description: 'European online fashion and lifestyle platform.' },

  // Healthcare
  { slug: 'mayo-clinic', name: 'Mayo Clinic', industry: 'Healthcare', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 1, citations: 9820, recommendationRate: 95, verified: true, description: 'World-leading academic medical center and research institution.' },
  { slug: 'cleveland-clinic', name: 'Cleveland Clinic', industry: 'Healthcare', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 91, chatgptScore: 93, claudeScore: 89, geminiScore: 90, perplexityScore: 92, trend: 2, citations: 7640, recommendationRate: 89, verified: true, description: 'Multispecialty academic medical center.' },
  { slug: 'johns-hopkins', name: 'Johns Hopkins Medicine', industry: 'Healthcare', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 89, chatgptScore: 91, claudeScore: 87, geminiScore: 88, perplexityScore: 90, trend: 0, citations: 6890, recommendationRate: 86, verified: true, description: 'Premier academic medical institution.' },
  { slug: 'mount-sinai', name: 'Mount Sinai', industry: 'Healthcare', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 78, chatgptScore: 80, claudeScore: 76, geminiScore: 77, perplexityScore: 79, trend: 3, citations: 4120, recommendationRate: 73, verified: false, description: 'Leading NYC healthcare system and research center.' },
  { slug: 'charite', name: 'Charité', industry: 'Healthcare', location: 'Germany', countryCode: '🇩🇪', aiVisibilityScore: 71, chatgptScore: 73, claudeScore: 69, geminiScore: 70, perplexityScore: 72, trend: 4, citations: 2890, recommendationRate: 65, verified: true, description: 'Europe\'s largest university hospital in Berlin.' },

  // Education
  { slug: 'harvard', name: 'Harvard University', industry: 'Education', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 98, chatgptScore: 99, claudeScore: 97, geminiScore: 98, perplexityScore: 98, trend: 0, citations: 11200, recommendationRate: 97, verified: true, description: 'Ivy League research university in Cambridge, Massachusetts.' },
  { slug: 'stanford', name: 'Stanford University', industry: 'Education', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 96, chatgptScore: 97, claudeScore: 95, geminiScore: 96, perplexityScore: 96, trend: 1, citations: 9650, recommendationRate: 94, verified: true, description: 'Research university in Silicon Valley.' },
  { slug: 'mit', name: 'MIT', industry: 'Education', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 94, chatgptScore: 96, claudeScore: 92, geminiScore: 93, perplexityScore: 95, trend: 2, citations: 8420, recommendationRate: 92, verified: true, description: 'World-leading research institute for technology and science.' },
  { slug: 'oxford', name: 'University of Oxford', industry: 'Education', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 93, chatgptScore: 95, claudeScore: 91, geminiScore: 92, perplexityScore: 94, trend: 0, citations: 7810, recommendationRate: 90, verified: true, description: 'Collegiate research university in Oxford, England.' },
  { slug: 'eth-zurich', name: 'ETH Zurich', industry: 'Education', location: 'Switzerland', countryCode: '🇨🇭', aiVisibilityScore: 82, chatgptScore: 84, claudeScore: 80, geminiScore: 81, perplexityScore: 83, trend: 3, citations: 4230, recommendationRate: 77, verified: false, description: 'Leading technical university in Switzerland.' },
  { slug: 'university-melbourne', name: 'University of Melbourne', industry: 'Education', location: 'Australia', countryCode: '🇦🇺', aiVisibilityScore: 72, chatgptScore: 74, claudeScore: 70, geminiScore: 71, perplexityScore: 73, trend: 1, citations: 2980, recommendationRate: 66, verified: false, description: 'Australia\'s top-ranked university.' },

  // More SaaS & mixed
  { slug: 'figma', name: 'Figma', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 86, chatgptScore: 88, claudeScore: 84, geminiScore: 85, perplexityScore: 87, trend: 5, citations: 3940, recommendationRate: 81, verified: true, description: 'Collaborative interface design tool.' },
  { slug: 'canva', name: 'Canva', industry: 'SaaS', location: 'Australia', countryCode: '🇦🇺', aiVisibilityScore: 83, chatgptScore: 85, claudeScore: 81, geminiScore: 82, perplexityScore: 84, trend: 2, citations: 3520, recommendationRate: 78, verified: true, description: 'Online graphic design platform for non-designers.' },
  { slug: 'linear', name: 'Linear', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 65, chatgptScore: 67, claudeScore: 63, geminiScore: 64, perplexityScore: 66, trend: 7, citations: 1480, recommendationRate: 59, verified: false, description: 'Streamlined issue tracking for modern product teams.' },
  { slug: 'vercel', name: 'Vercel', industry: 'SaaS', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 72, chatgptScore: 74, claudeScore: 70, geminiScore: 71, perplexityScore: 73, trend: 8, citations: 2180, recommendationRate: 66, verified: true, description: 'Frontend cloud platform for web frameworks.' },

  // More Agencies
  { slug: 'nitro-digital', name: 'Nitro Digital', industry: 'Agencies', location: 'Serbia', countryCode: '🇷🇸', aiVisibilityScore: 48, chatgptScore: 50, claudeScore: 46, geminiScore: 47, perplexityScore: 49, trend: 6, citations: 620, recommendationRate: 42, verified: true, description: 'Digital marketing and AI visibility agency in Belgrade.' },
  { slug: 'degordian', name: 'Degordian', industry: 'Agencies', location: 'Croatia', countryCode: '🇭🇷', aiVisibilityScore: 42, chatgptScore: 44, claudeScore: 40, geminiScore: 41, perplexityScore: 43, trend: 3, citations: 480, recommendationRate: 37, verified: false, description: 'Full-service digital agency based in Zagreb.' },

  // More Law
  { slug: 'linklaters', name: 'Linklaters', industry: 'Law Firms', location: 'UK', countryCode: '🇬🇧', aiVisibilityScore: 66, chatgptScore: 68, claudeScore: 64, geminiScore: 65, perplexityScore: 67, trend: -2, citations: 1980, recommendationRate: 60, verified: false, description: 'Multinational law firm headquartered in London.' },
  { slug: 'white-case', name: 'White & Case', industry: 'Law Firms', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 70, chatgptScore: 72, claudeScore: 68, geminiScore: 69, perplexityScore: 71, trend: 2, citations: 2240, recommendationRate: 64, verified: false, description: 'Global law firm with offices in major financial centers.' },

  // More Hotels
  { slug: 'ritz-carlton', name: 'Ritz-Carlton', industry: 'Hotels', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 69, chatgptScore: 71, claudeScore: 67, geminiScore: 68, perplexityScore: 70, trend: 5, citations: 2190, recommendationRate: 63, verified: false, description: 'Luxury hotel brand known for exceptional service.' },
  { slug: 'sofitel', name: 'Sofitel', industry: 'Hotels', location: 'France', countryCode: '🇫🇷', aiVisibilityScore: 52, chatgptScore: 54, claudeScore: 50, geminiScore: 51, perplexityScore: 53, trend: 1, citations: 1120, recommendationRate: 45, verified: false, description: 'French luxury hotel brand with global presence.' },

  // More Ecommerce
  { slug: 'bigcommerce', name: 'BigCommerce', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 73, chatgptScore: 75, claudeScore: 71, geminiScore: 72, perplexityScore: 74, trend: 1, citations: 2180, recommendationRate: 67, verified: false, description: 'Open SaaS ecommerce platform for growing businesses.' },
  { slug: 'magento', name: 'Magento (Adobe)', industry: 'Ecommerce', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 70, chatgptScore: 72, claudeScore: 68, geminiScore: 69, perplexityScore: 71, trend: -3, citations: 1960, recommendationRate: 64, verified: false, description: 'Open-source ecommerce platform by Adobe.' },

  // More Healthcare
  { slug: 'kp', name: 'Kaiser Permanente', industry: 'Healthcare', location: 'USA', countryCode: '🇺🇸', aiVisibilityScore: 76, chatgptScore: 78, claudeScore: 74, geminiScore: 75, perplexityScore: 77, trend: 1, citations: 3450, recommendationRate: 71, verified: true, description: 'Integrated health system and health plan.' },
  { slug: 'bsr', name: 'Bumrungrad Hospital', industry: 'Healthcare', location: 'Thailand', countryCode: '🇹🇭', aiVisibilityScore: 58, chatgptScore: 60, claudeScore: 56, geminiScore: 57, perplexityScore: 59, trend: 4, citations: 1420, recommendationRate: 52, verified: false, description: 'World-renowned international hospital in Bangkok.' },
]

// Filter options derived from the data
export const directoryCategories = ['All', 'SaaS', 'Agencies', 'Law Firms', 'Hotels', 'Ecommerce', 'Healthcare', 'Education'] as const
export const directoryLocations = ['Global', 'USA', 'UK', 'Germany', 'Europe', 'Australia', 'Serbia', 'Croatia'] as const
export const directoryAiEngines = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'] as const
