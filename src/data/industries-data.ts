// ── Shared Industries Data ──────────────────────────────────────────────
// Used by both the Industries API route and the Industries page client component.

export interface Industry {
  slug: string
  name: string
  icon: string
  category: string
  companiesTracked: number
  avgVisibilityScore: number
  topEngine: string
  trend: 'rising' | 'stable' | 'declining'
  description: string
}

export const industries: Industry[] = [
  {
    slug: 'dentists',
    name: 'Dentists',
    icon: 'Stethoscope',
    category: 'Healthcare',
    companiesTracked: 2847,
    avgVisibilityScore: 42,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Dental practices are gaining AI visibility as patients increasingly ask ChatGPT for local dentist recommendations.',
  },
  {
    slug: 'lawyers',
    name: 'Lawyers',
    icon: 'Scale',
    category: 'Professional',
    companiesTracked: 3291,
    avgVisibilityScore: 38,
    topEngine: 'Perplexity',
    trend: 'stable',
    description:
      'Legal firms see moderate AI visibility with Perplexity leading citation for legal queries and case references.',
  },
  {
    slug: 'saas',
    name: 'SaaS',
    icon: 'Monitor',
    category: 'Technology',
    companiesTracked: 4102,
    avgVisibilityScore: 56,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'SaaS companies have the highest average AI visibility, driven by strong content and entity signals.',
  },
  {
    slug: 'hotels',
    name: 'Hotels',
    icon: 'Building2',
    category: 'Hospitality',
    companiesTracked: 1953,
    avgVisibilityScore: 31,
    topEngine: 'Gemini',
    trend: 'stable',
    description:
      'Hotel visibility varies by location. Gemini leads travel recommendations via Google Maps integration.',
  },
  {
    slug: 'ecommerce',
    name: 'Ecommerce',
    icon: 'ShoppingBag',
    category: 'Retail',
    companiesTracked: 5234,
    avgVisibilityScore: 48,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Ecommerce brands benefit from structured product data. ChatGPT frequently cites product comparison content.',
  },
  {
    slug: 'clinics',
    name: 'Clinics',
    icon: 'Heart',
    category: 'Healthcare',
    companiesTracked: 2176,
    avgVisibilityScore: 36,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Medical clinics are climbing in AI visibility as health-related queries surge on AI platforms.',
  },
  {
    slug: 'universities',
    name: 'Universities',
    icon: 'GraduationCap',
    category: 'Education',
    companiesTracked: 1847,
    avgVisibilityScore: 61,
    topEngine: 'Perplexity',
    trend: 'rising',
    description:
      'Universities have strong AI visibility due to authoritative content and .edu domain trust signals.',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    icon: 'Home',
    category: 'Professional',
    companiesTracked: 3012,
    avgVisibilityScore: 33,
    topEngine: 'Gemini',
    trend: 'declining',
    description:
      'Real estate AI visibility is under pressure as AI engines prioritize listing aggregators over individual agencies.',
  },
  {
    slug: 'insurance',
    name: 'Insurance',
    icon: 'Shield',
    category: 'Professional',
    companiesTracked: 1523,
    avgVisibilityScore: 29,
    topEngine: 'ChatGPT',
    trend: 'stable',
    description:
      'Insurance providers see modest AI visibility. Complex policy comparisons remain challenging for AI engines.',
  },
  {
    slug: 'travel',
    name: 'Travel',
    icon: 'Plane',
    category: 'Hospitality',
    companiesTracked: 2487,
    avgVisibilityScore: 44,
    topEngine: 'Gemini',
    trend: 'rising',
    description:
      "Travel companies benefit from Gemini's Google integration. Rich itinerary data drives strong citations.",
  },
  {
    slug: 'restaurants',
    name: 'Restaurants',
    icon: 'UtensilsCrossed',
    category: 'Hospitality',
    companiesTracked: 6721,
    avgVisibilityScore: 52,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Restaurants lead local AI visibility. ChatGPT frequently cites review and menu data in dining recommendations.',
  },
  {
    slug: 'construction',
    name: 'Construction',
    icon: 'HardHat',
    category: 'Services',
    companiesTracked: 1834,
    avgVisibilityScore: 25,
    topEngine: 'Perplexity',
    trend: 'stable',
    description:
      'Construction firms have low AI visibility but steady. Perplexity cites project portfolios and reviews.',
  },
  {
    slug: 'marketing-agencies',
    name: 'Marketing Agencies',
    icon: 'Megaphone',
    category: 'Services',
    companiesTracked: 3567,
    avgVisibilityScore: 47,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Marketing agencies are well-cited by AI engines, especially those with strong thought leadership content.',
  },
  {
    slug: 'accounting',
    name: 'Accounting',
    icon: 'Calculator',
    category: 'Professional',
    companiesTracked: 2145,
    avgVisibilityScore: 35,
    topEngine: 'ChatGPT',
    trend: 'stable',
    description:
      'Accounting firms have moderate visibility. AI engines frequently cite tax and compliance content.',
  },
  {
    slug: 'fitness',
    name: 'Fitness',
    icon: 'Dumbbell',
    category: 'Healthcare',
    companiesTracked: 2890,
    avgVisibilityScore: 41,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Fitness brands are gaining visibility as AI engines increasingly recommend gyms and wellness programs.',
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    icon: 'Car',
    category: 'Retail',
    companiesTracked: 2678,
    avgVisibilityScore: 39,
    topEngine: 'Gemini',
    trend: 'stable',
    description:
      'Auto dealerships see moderate visibility. Gemini leads through Google Maps and review integrations.',
  },
  {
    slug: 'veterinary',
    name: 'Veterinary',
    icon: 'PawPrint',
    category: 'Healthcare',
    companiesTracked: 1243,
    avgVisibilityScore: 34,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Veterinary clinics are emerging in AI recommendations as pet owners increasingly turn to AI for care advice.',
  },
  {
    slug: 'architecture',
    name: 'Architecture',
    icon: 'Compass',
    category: 'Professional',
    companiesTracked: 987,
    avgVisibilityScore: 28,
    topEngine: 'Perplexity',
    trend: 'stable',
    description:
      'Architecture firms have lower AI visibility but Perplexity frequently cites portfolio-rich firms.',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    icon: 'Wrench',
    category: 'Services',
    companiesTracked: 3456,
    avgVisibilityScore: 37,
    topEngine: 'ChatGPT',
    trend: 'rising',
    description:
      'Plumbing services are climbing in local AI search results, driven by emergency query patterns.',
  },
  {
    slug: 'cleaning',
    name: 'Cleaning',
    icon: 'SprayCan',
    category: 'Services',
    companiesTracked: 2891,
    avgVisibilityScore: 32,
    topEngine: 'ChatGPT',
    trend: 'stable',
    description:
      'Cleaning services see moderate AI visibility with steady local citation rates across AI platforms.',
  },
]

// Category filter options derived from the data
export const industryCategories = [
  'All',
  'Healthcare',
  'Professional',
  'Technology',
  'Hospitality',
  'Retail',
  'Education',
  'Services',
] as const
