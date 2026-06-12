/**
 * Client Zero / Dogfooding — Pre-defined Content Topics
 *
 * 90 realistic SEO/AEO/GEO blog post topics organized into 9 thematic clusters.
 * Used by the /api/admin/content-queue POST endpoint to populate the internal
 * content queue for Client Zero projects (our own dogfooding sites).
 *
 * Each topic includes:
 * - keywordTarget: AI-relevant SEO/AEO/GEO keyword
 * - suggestedTitle: A compelling blog post title
 * - pillar: Rotated between 'seo', 'aeo', 'geo', 'all'
 * - cluster: Thematic cluster name
 */

export interface ContentTopic {
  keywordTarget: string
  suggestedTitle: string
  pillar: 'seo' | 'aeo' | 'geo' | 'all'
  cluster: string
}

const clusters: ContentTopic[] = [
  // ─── Cluster 1: GEO Fundamentals (10 topics) ──────────────────────────────
  {
    keywordTarget: 'llms.txt file guide',
    suggestedTitle: 'What Is llms.txt and Why Your Website Needs One in 2025',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'AI crawlers robots.txt',
    suggestedTitle: 'How to Configure robots.txt for AI Crawlers Without Blocking Google',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'entity optimization for AI',
    suggestedTitle: 'Entity Optimization: The Missing Link Between SEO and AI Discoverability',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'generative engine optimization basics',
    suggestedTitle: 'GEO 101: A Beginner\'s Guide to Generative Engine Optimization',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'AI search knowledge graphs',
    suggestedTitle: 'How Knowledge Graphs Power AI Search — and How to Get Included',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'structured data for LLMs',
    suggestedTitle: 'Structured Data Strategies That Make LLMs Notice Your Content',
    pillar: 'all',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'AI citation tracking',
    suggestedTitle: 'How to Track When AI Models Cite Your Content',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'ChatGPT plugin SEO',
    suggestedTitle: 'Optimizing for ChatGPT Plugins: A Technical SEO Playbook',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'AI overview optimization',
    suggestedTitle: 'Google AI Overviews: How to Win the New SERP Real Estate',
    pillar: 'all',
    cluster: 'GEO Fundamentals',
  },
  {
    keywordTarget: 'LLM training data inclusion',
    suggestedTitle: 'Is Your Content in LLM Training Data? Here\'s How to Find Out',
    pillar: 'geo',
    cluster: 'GEO Fundamentals',
  },

  // ─── Cluster 2: AEO Mastery (10 topics) ────────────────────────────────────
  {
    keywordTarget: 'FAQ schema markup',
    suggestedTitle: 'FAQ Schema Markup: The Complete Implementation Guide for 2025',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'voice search optimization',
    suggestedTitle: 'Voice Search Optimization: 12 Techniques That Actually Move the Needle',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'featured snippets strategy',
    suggestedTitle: 'How to Win Featured Snippets in the Age of AI Search',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'answer engine optimization',
    suggestedTitle: 'AEO vs SEO: How Answer Engine Optimization Differs and Why It Matters',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'people also ask optimization',
    suggestedTitle: 'Dominating "People Also Ask" Boxes with Structured Answer Blocks',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'conversational search queries',
    suggestedTitle: 'Optimizing for Conversational Queries: The Future of Search Intent',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'how-to schema rich results',
    suggestedTitle: 'How-To Schema: Drive Rich Results with Step-by-Step Markup',
    pillar: 'all',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'zero-click search optimization',
    suggestedTitle: 'Zero-Click Searches: How to Get Visibility Without the Click',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'natural language query optimization',
    suggestedTitle: 'NLQ Optimization: Writing Content That AI Understands Natively',
    pillar: 'aeo',
    cluster: 'AEO Mastery',
  },
  {
    keywordTarget: 'Google SGE optimization',
    suggestedTitle: 'Google SGE: 8 Optimization Tactics to Appear in AI-Generated Results',
    pillar: 'all',
    cluster: 'AEO Mastery',
  },

  // ─── Cluster 3: SEO Technical (10 topics) ──────────────────────────────────
  {
    keywordTarget: 'Core Web Vitals 2025',
    suggestedTitle: 'Core Web Vitals in 2025: INP, LCP, CLS — What Matters Most Now',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'website crawlability audit',
    suggestedTitle: 'The Ultimate Crawlability Audit: 15 Checks for Maximum Indexation',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'JavaScript SEO rendering',
    suggestedTitle: 'JavaScript SEO: Server-Side Rendering vs Dynamic Rendering in 2025',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'indexation problems fix',
    suggestedTitle: 'Discovered but Not Indexed: How to Fix Google\'s Most Frustrating Status',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'site architecture for SEO',
    suggestedTitle: 'Flat vs Deep Site Architecture: Which Structure Ranks Better?',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'technical SEO checklist',
    suggestedTitle: 'The 2025 Technical SEO Checklist: 50 Items You Can\'t Afford to Skip',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'canonical tags best practices',
    suggestedTitle: 'Canonical Tags Done Right: Avoiding Duplicate Content in the AI Era',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'hreflang implementation guide',
    suggestedTitle: 'Hreflang Implementation: The Definitive Guide for Multi-Regional Sites',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'page speed optimization',
    suggestedTitle: 'Page Speed Optimization: From 8s to Under 2s — A Real Case Study',
    pillar: 'seo',
    cluster: 'SEO Technical',
  },
  {
    keywordTarget: 'log file analysis SEO',
    suggestedTitle: 'Log File Analysis: What Googlebot Is Really Doing on Your Site',
    pillar: 'all',
    cluster: 'SEO Technical',
  },

  // ─── Cluster 4: AI Search Trends (10 topics) ───────────────────────────────
  {
    keywordTarget: 'Perplexity SEO optimization',
    suggestedTitle: 'How to Optimize Your Content for Perplexity AI Search',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'ChatGPT citations ranking',
    suggestedTitle: 'Getting Cited by ChatGPT: What We Learned from 500 AI Responses',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'ClaudeBot crawl optimization',
    suggestedTitle: 'ClaudeBot Optimization: How Anthropic\'s Crawler Discovers Your Content',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'AI search market share 2025',
    suggestedTitle: 'AI Search Market Share in 2025: Perplexity, ChatGPT, Copilot and Beyond',
    pillar: 'all',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'Bing Chat SEO',
    suggestedTitle: 'Bing Chat (Copilot) SEO: Why Microsoft\'s AI Search Matters for Your Strategy',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'Google Gemini search impact',
    suggestedTitle: 'Google Gemini and Search: How AI Models Are Reshaping the SERP',
    pillar: 'all',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'AI search vs traditional SEO',
    suggestedTitle: 'AI Search vs Traditional SEO: A Data-Driven Comparison for 2025',
    pillar: 'all',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'multi-model AI optimization',
    suggestedTitle: 'Optimizing for Multiple AI Models: One Content Strategy to Rule Them All',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'AI hallucination impact on brands',
    suggestedTitle: 'When AI Gets It Wrong: How Hallucinations Affect Brand Visibility',
    pillar: 'geo',
    cluster: 'AI Search Trends',
  },
  {
    keywordTarget: 'search generative experience trends',
    suggestedTitle: 'SGE Trends 2025: What 10,000 Queries Reveal About AI Search Behavior',
    pillar: 'all',
    cluster: 'AI Search Trends',
  },

  // ─── Cluster 5: Competitive Analysis (10 topics) ───────────────────────────
  {
    keywordTarget: 'competitor SEO benchmarking',
    suggestedTitle: 'SEO Competitor Benchmarking: A Framework for Outranking Your Rivals',
    pillar: 'seo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'brand mentions tracking AI',
    suggestedTitle: 'Brand Mention Tracking in AI: Monitoring How LLMs Reference Your Brand',
    pillar: 'geo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'competitor backlink gap analysis',
    suggestedTitle: 'Backlink Gap Analysis: Finding Link Opportunities Your Competitors Miss',
    pillar: 'seo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'AI search competitor monitoring',
    suggestedTitle: 'How to Monitor Your Competitors\' AI Search Visibility (Step by Step)',
    pillar: 'geo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'SERP feature competitor analysis',
    suggestedTitle: 'SERP Feature Analysis: Which Rich Results Your Competitors Own (And You Don\'t)',
    pillar: 'seo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'content gap analysis strategy',
    suggestedTitle: 'Content Gap Analysis 2.0: Using AI to Find Topics Your Competitors Haven\'t Covered',
    pillar: 'all',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'competitive keyword mapping',
    suggestedTitle: 'Keyword Mapping Your Competition: Visualizing the Battle for Search',
    pillar: 'seo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'AI visibility competitor comparison',
    suggestedTitle: 'AI Visibility Scorecards: How to Compare Your Brand vs Competitors in LLM Results',
    pillar: 'geo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'share of voice SEO',
    suggestedTitle: 'Share of Voice in SEO: Measuring True Market Dominance Beyond Rankings',
    pillar: 'seo',
    cluster: 'Competitive Analysis',
  },
  {
    keywordTarget: 'competitive intelligence SEO tools',
    suggestedTitle: 'The Best Competitive Intelligence Tools for SEO in 2025 (Compared)',
    pillar: 'all',
    cluster: 'Competitive Analysis',
  },

  // ─── Cluster 6: Content Strategy (10 topics) ───────────────────────────────
  {
    keywordTarget: 'E-E-A-T optimization guide',
    suggestedTitle: 'E-E-A-T in 2025: Experience, Expertise, Authority, Trust for AI and Google',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'content cluster strategy',
    suggestedTitle: 'Content Clusters That Rank: Building Topical Authority the Right Way',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'answer block optimization',
    suggestedTitle: 'Answer Block Optimization: Writing Content AI Models Love to Cite',
    pillar: 'aeo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'topical authority building',
    suggestedTitle: 'Topical Authority: The Step-by-Step Playbook to Dominate Your Niche',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'AI content quality signals',
    suggestedTitle: 'Quality Signals AI Search Engines Use to Rank Content in 2025',
    pillar: 'all',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'pillar page content strategy',
    suggestedTitle: 'Pillar Pages 2.0: How to Structure Content for Both Google and AI',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'content freshness SEO',
    suggestedTitle: 'Content Freshness: How Often Should You Update Blog Posts for SEO?',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'long-form vs short-form SEO',
    suggestedTitle: 'Long-Form vs Short-Form: Which Content Format Wins in AI Search?',
    pillar: 'all',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'SEO content brief template',
    suggestedTitle: 'The Perfect SEO Content Brief: A Template That Produces Ranking Articles',
    pillar: 'seo',
    cluster: 'Content Strategy',
  },
  {
    keywordTarget: 'AI-generated content SEO',
    suggestedTitle: 'AI-Generated Content and SEO: Google\'s Stance and What Works in 2025',
    pillar: 'all',
    cluster: 'Content Strategy',
  },

  // ─── Cluster 7: Link Building (10 topics) ──────────────────────────────────
  {
    keywordTarget: 'backlink outreach strategy',
    suggestedTitle: 'Backlink Outreach That Gets Replies: 7 Email Templates That Work',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'guest posting SEO 2025',
    suggestedTitle: 'Guest Posting in 2025: White-Hat Strategies That Still Build Authority',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'domain authority building',
    suggestedTitle: 'Building Domain Authority: From DA 10 to DA 50 in 12 Months',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'link building for AI visibility',
    suggestedTitle: 'Can Backlinks Influence AI Visibility? What the Data Shows',
    pillar: 'geo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'broken link building',
    suggestedTitle: 'Broken Link Building: The Scalable Tactic Most SEOs Overlook',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'digital PR link building',
    suggestedTitle: 'Digital PR for Link Building: How to Earn Links from Top-Tier Publications',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: ' HARO link building strategy',
    suggestedTitle: 'HARO and Journalist Outreach: Earning High-DA Links Through Expert Commentary',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'resource page link building',
    suggestedTitle: 'Resource Page Link Building: The Forgotten Tactic That Still Delivers',
    pillar: 'seo',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'link building ROI measurement',
    suggestedTitle: 'Measuring Link Building ROI: From Cost Per Link to Revenue Attribution',
    pillar: 'all',
    cluster: 'Link Building',
  },
  {
    keywordTarget: 'toxic backlink disavow',
    suggestedTitle: 'When to Disavow: Identifying and Removing Toxic Backlinks Safely',
    pillar: 'seo',
    cluster: 'Link Building',
  },

  // ─── Cluster 8: Agency Playbook (10 topics) ────────────────────────────────
  {
    keywordTarget: 'white-label SEO reports',
    suggestedTitle: 'White-Label SEO Reports: How Agencies Deliver Value Under Their Brand',
    pillar: 'seo',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'SEO client onboarding',
    suggestedTitle: 'The SEO Client Onboarding Playbook: From Discovery to First Deliverable',
    pillar: 'seo',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'SEO ROI reporting',
    suggestedTitle: 'Proving SEO ROI to Clients: Dashboards, Metrics, and Reporting Frameworks',
    pillar: 'all',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'agency SEO pricing models',
    suggestedTitle: 'SEO Agency Pricing Models in 2025: Retainers, Performance, and Hybrid',
    pillar: 'seo',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'scaling SEO operations',
    suggestedTitle: 'Scaling SEO Operations: Automation, AI Agents, and Agency Workflows',
    pillar: 'all',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'SEO proposal template',
    suggestedTitle: 'The SEO Proposal That Wins Clients: Template + Real Examples',
    pillar: 'seo',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'multi-client SEO management',
    suggestedTitle: 'Managing 20+ SEO Clients Without Burning Out: Tools and Systems',
    pillar: 'seo',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'AI SEO tools for agencies',
    suggestedTitle: 'AI SEO Tools for Agencies: Which Ones Actually Save Time?',
    pillar: 'all',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'SEO client retention strategies',
    suggestedTitle: 'Client Retention for SEO Agencies: Reducing Churn in the AI Era',
    pillar: 'all',
    cluster: 'Agency Playbook',
  },
  {
    keywordTarget: 'white-label AI SEO platform',
    suggestedTitle: 'White-Label AI SEO Platforms: Comparing Options for Agencies',
    pillar: 'all',
    cluster: 'Agency Playbook',
  },

  // ─── Cluster 9: Product Updates (10 topics) ────────────────────────────────
  {
    keywordTarget: 'seosights AI visibility monitoring',
    suggestedTitle: 'Introducing seosights AI Visibility Monitoring: Track 17+ LLMs in Real-Time',
    pillar: 'geo',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights case study results',
    suggestedTitle: 'Case Study: How seosights Increased AI Citations by 340% in 90 Days',
    pillar: 'all',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights vs competitor comparison',
    suggestedTitle: 'seosights vs [Competitor]: A Feature-by-Feature Comparison for 2025',
    pillar: 'all',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights auto-pilot feature',
    suggestedTitle: 'Auto-Pilot Mode: How seosights Agents Execute SEO Without Human Input',
    pillar: 'geo',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights WordPress plugin',
    suggestedTitle: 'The seosights WordPress Plugin: Auto-Publish SEO Content Directly to Your Site',
    pillar: 'seo',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights content queue feature',
    suggestedTitle: 'Content Queue: Plan, Generate, and Auto-Publish 90 Blog Posts Per Month',
    pillar: 'seo',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights three sights methodology',
    suggestedTitle: 'The Three Sights Methodology: Why SEO + AEO + GEO Beats SEO Alone',
    pillar: 'all',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights outreach automation',
    suggestedTitle: 'Automated Link Outreach: How seosights Builds Backlinks on Autopilot',
    pillar: 'seo',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights agency features',
    suggestedTitle: 'Agency Features: White-Label Reports, Multi-Client Dashboards, and ROI Tracking',
    pillar: 'all',
    cluster: 'Product Updates',
  },
  {
    keywordTarget: 'seosights E-E-A-T audit',
    suggestedTitle: 'New: E-E-A-T Audit Agent — Automated Trust Signal Analysis for Your Site',
    pillar: 'seo',
    cluster: 'Product Updates',
  },
]

/**
 * generateContentTopics — Returns 90 pre-defined realistic SEO/AEO/GEO topics
 * for Client Zero projects. Topics are organized into 9 thematic clusters
 * with 10 topics each, rotating pillars across 'seo', 'aeo', 'geo', and 'all'.
 */
export function generateContentTopics(): ContentTopic[] {
  return clusters
}
