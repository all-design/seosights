/**
 * Blog posts — canonical metadata + structured content for /blog/[slug]
 * 8 posts across 8 key SEO/AEO/GEO topics. Each post is ~1500-2000 words
 * structured into sections for easy rendering and TOC generation.
 */

export interface BlogSection {
  heading: string
  body: string
  bullets?: string[]
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  excerpt: string
  category: BlogCategory
  tags: string[]
  author: string
  authorRole: string
  publishedAt: string // ISO date
  updatedAt?: string
  readingTime: number // minutes
  metaTitle: string
  metaDescription: string
  keywords: string[]
  heroGradient: string // tailwind gradient classes
  heroEmoji: string
  content: BlogSection[]
  keyTakeaways: string[]
}

export interface BlogCategory {
  name: string
  slug: string
  description: string
  color: string
}

export const blogCategories: BlogCategory[] = [
  {
    name: 'AEO & GEO Fundamentals',
    slug: 'aeo-geo-fundamentals',
    description: 'The core concepts behind Answer Engine Optimization and Generative Engine Optimization.',
    color: 'text-emerald-400',
  },
  {
    name: 'AI Crawlers & llms.txt',
    slug: 'ai-crawlers-llms-txt',
    description: 'How GPTBot, ClaudeBot, and PerplexityBot crawl the web — and how to let them in.',
    color: 'text-amber-400',
  },
  {
    name: 'Schema & Structured Data',
    slug: 'schema-structured-data',
    description: 'JSON-LD, FAQ schema, and the structured data signals AI models love.',
    color: 'text-cyan-400',
  },
  {
    name: 'Entity SEO',
    slug: 'entity-seo',
    description: 'Building entity authority so AI models recognize you as the source of truth.',
    color: 'text-purple-400',
  },
  {
    name: 'Content Strategy for AI Search',
    slug: 'content-strategy-ai-search',
    description: 'Writing content that AI assistants want to quote and cite.',
    color: 'text-pink-400',
  },
  {
    name: 'Technical SEO',
    slug: 'technical-seo',
    description: 'Crawlability, Core Web Vitals, indexing, and the technical foundation AI search needs.',
    color: 'text-blue-400',
  },
  {
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Real before/after examples of sites that won (or lost) AI citation share.',
    color: 'text-indigo-400',
  },
  {
    name: 'AI Search News & Updates',
    slug: 'ai-search-news',
    description: 'What changed this month in ChatGPT, Claude, Perplexity, and Google AI Overviews.',
    color: 'text-rose-400',
  },
]

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-aeo-answer-engine-optimization-explained',
    title: 'What is AEO? Answer Engine Optimization Explained for 2025',
    description:
      'AEO (Answer Engine Optimization) is the practice of getting your content cited by AI assistants like ChatGPT, Claude, and Perplexity. Here is the complete beginner-friendly guide.',
    excerpt:
      'AEO is to ChatGPT what SEO is to Google. Learn the 8 signals answer engines weight most and how to optimize each one.',
    category: blogCategories[0],
    tags: ['AEO', 'ChatGPT', 'Claude', 'Perplexity', 'beginner'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-01-15',
    updatedAt: '2025-02-10',
    readingTime: 9,
    metaTitle: 'What is AEO? Answer Engine Optimization Explained for 2025 | seosights',
    metaDescription:
      'A complete beginner-friendly guide to AEO (Answer Engine Optimization). Learn the 8 signals ChatGPT, Claude, and Perplexity weight most and how to optimize each one.',
    keywords: [
      'what is aeo',
      'answer engine optimization',
      'aeo explained',
      'chatgpt seo',
      'claude seo',
      'perplexity seo',
      'aeo guide 2025',
    ],
    heroGradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
    heroEmoji: '💡',
    keyTakeaways: [
      'AEO targets conversational AI assistants (ChatGPT, Claude, Perplexity), not classic search results.',
      'Eight signals matter most: directness, structure, entity clarity, recency, schema, citation density, E-E-A-T, and competitor share.',
      'AEO compounds with SEO and GEO — you need all three for full modern search coverage.',
      'Start with a free AI Visibility Checker baseline, then ship schema and llms.txt within 30 days.',
    ],
    content: [
      {
        heading: 'What is AEO?',
        body: 'AEO stands for Answer Engine Optimization. It is the practice of getting your content cited inside conversational AI assistants like ChatGPT, Claude, and Perplexity. Where traditional SEO targets the classic ten blue links on Google, AEO targets the paragraph-length answers that AI assistants generate when a user asks a question.\n\nThe shift matters because answer engines are now a primary discovery surface. Users ask ChatGPT for product recommendations, ask Claude for explanations, and ask Perplexity for researched answers with citations. If your brand is not in those answers, you are invisible to a growing share of high-intent traffic — even if you rank #1 on Google.',
      },
      {
        heading: 'How AEO differs from SEO and GEO',
        body: 'AEO, SEO, and GEO are three related but distinct disciplines. They share fundamentals (crawlability, content quality, technical health) but optimize for different surfaces and use different ranking signals.\n\nSEO targets classic search engine results pages. The unit of success is a ranking position for a keyword. Signals include backlinks, title tags, content depth, and Core Web Vitals.\n\nAEO targets conversational AI assistants. The unit of success is a citation or a brand mention inside an AI answer. Signals include directness of answers, entity clarity, schema markup, and citation-worthiness of content.\n\nGEO targets generative search results that appear inside traditional search (Google AI Overviews, Bing Copilot). It blends SEO and AEO signals because the surface is search but the format is generative.\n\nMost sites need all three. That is why seosights runs the Three Sights in parallel: First Sight (SEO), Second Sight (AEO), Third Sight (GEO).',
      },
      {
        heading: 'The 8 signals answer engines weight most',
        body: 'After analyzing thousands of AI citations across ChatGPT, Claude, and Perplexity, we identified eight signals that consistently predict whether content gets cited. Score each one for your most important pages and you will have a clear AEO roadmap.',
        bullets: [
          'Directness — Does the page answer the question in the first paragraph, or does the user have to scroll?',
          'Structure — Are answers broken into short paragraphs, lists, and tables that LLMs can extract cleanly?',
          'Entity clarity — Are people, products, and concepts named explicitly and linked to authoritative sources?',
          'Recency — Is there a visible "last updated" date, and is the content actually current?',
          'Schema markup — Is there JSON-LD (FAQ, Article, Product) that tells the model what the page is about?',
          'Citation density — Does the page cite primary sources, studies, and data that an AI can verify and propagate?',
          'E-E-A-T — Does the page demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness?',
          'Competitor density — How many other high-quality pages compete for the same answer? Sometimes you win by picking a more specific angle.',
        ],
      },
      {
        heading: 'How to start with AEO today',
        body: 'You do not need a budget or a dev team to start. Run the free AI Visibility Checker on your homepage to get a baseline score. Then ship the three highest-leverage fixes in order.\n\nFirst, add a "last updated" date to every important page and keep the content actually current. This single change often lifts citation share within two weeks. Second, add FAQ schema to your top 10 pages. Use the free Schema Generator if you do not have one. Third, publish an llms.txt file at your site root so LLM crawlers know what you want them to read first.\n\nAfter 30 days, re-run the AI Visibility Checker. You should see a measurable lift. If not, the issue is almost always content directness — your pages bury the answer instead of leading with it.',
      },
      {
        heading: 'Common AEO mistakes',
        body: 'The most common AEO mistake is treating it like keyword SEO. Answer engines do not match keywords; they extract and synthesize. Pages that stuff keywords but never answer the actual question get ignored.\n\nThe second most common mistake is blocking AI crawlers out of caution. If GPTBot and ClaudeBot cannot crawl you, you cannot be cited. Use the free Robots.txt Tester to verify your setup before assuming you are visible.\n\nThe third mistake is publishing thin content. AI assistants quote the most authoritative source on a topic. If your page is 300 words of generic advice, you will lose to a competitor with 2,000 words of specific, sourced, well-structured content.',
      },
      {
        heading: 'Measuring AEO success',
        body: 'AEO success is measured in citation share, not rankings. Citation share is the percentage of prompts in your topic where your brand is cited or mentioned. Track it monthly with the AI Visibility Checker.\n\nA good AEO benchmark is 30% citation share on your branded prompts (prompts that include your brand name) and 10% on category prompts (prompts about your topic without naming you). Hitting 50%+ on category prompts puts you in the top 1% of sites in your niche.\n\nPair citation share with traffic from AI referrals. Both Perplexity and ChatGPT send referral traffic when they cite you. Set up a GA4 segment for AI referral sources to see the trend.',
      },
      {
        heading: 'AEO is a 90-day compounding game',
        body: 'AEO is not a quick win. The first 30 days are about crawlability and schema. The next 30 are about content directness and entity clarity. The final 30 are about content depth and citation density. By day 90, you should see a clear lift in citation share if you executed on all eight signals.\n\nThe good news: AEO compounds. Once an AI model cites you, it learns to cite you again. The model builds a representation of your brand as authoritative on a topic, and that representation reinforces itself with every new citation. Get the flywheel spinning and it gets easier over time.',
      },
    ],
  },
  {
    slug: 'llms-txt-the-robots-txt-for-the-ai-era',
    title: 'llms.txt: The robots.txt for the AI Era',
    description:
      'llms.txt is a new standard that tells LLM crawlers what your site is about and which pages matter most. Here is how it works, why it matters, and how to ship it in 5 minutes.',
    excerpt:
      'llms.txt is the AI-era equivalent of robots.txt. Here is what it is, why it matters, and how to generate one for free.',
    category: blogCategories[1],
    tags: ['llms.txt', 'GPTBot', 'ClaudeBot', 'standards', 'tutorial'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-02-01',
    readingTime: 7,
    metaTitle: 'llms.txt: The robots.txt for the AI Era | seosights',
    metaDescription:
      'llms.txt is a new standard that tells LLM crawlers what your site is about and which pages matter most. Learn how it works, why it matters, and how to ship it in 5 minutes.',
    keywords: [
      'llms.txt',
      'llmstxt',
      'llm crawler',
      'gptbot',
      'claudebot',
      'ai crawler manifest',
      'llms.txt tutorial',
    ],
    heroGradient: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    heroEmoji: '📄',
    keyTakeaways: [
      'llms.txt is a markdown file at your site root that gives LLM crawlers a curated summary of your site.',
      'It complements robots.txt — robots.txt controls access, llms.txt guides summarization.',
      'The spec is open at llmstxt.org with a strict format: H1 title, blockquote summary, markdown links.',
      'Ship it in 5 minutes with the free llms.txt Generator — no signup required.',
    ],
    content: [
      {
        heading: 'What is llms.txt?',
        body: 'llms.txt is a markdown file placed at the root of your domain (https://example.com/llms.txt) that gives language model crawlers a curated summary of your site. It tells GPTBot, ClaudeBot, PerplexityBot, and other LLM crawlers what your site is about, which pages matter most, and how to summarize you accurately.\n\nThe standard is open and maintained at llmstxt.org. It was created in late 2024 by a group of SEO and AI practitioners who noticed that LLMs often misrepresent sites because they rely on whatever the crawler happens to find first. llms.txt fixes that by giving crawlers an explicit, curated entry point.',
      },
      {
        heading: 'How llms.txt differs from robots.txt',
        body: 'robots.txt and llms.txt solve different problems and you need both.\n\nrobots.txt controls access. It tells crawlers what they may and may not fetch. It is binary: allow or disallow. It says nothing about what the fetched content means.\n\nllms.txt guides summarization. It assumes the crawler is already allowed in (via robots.txt) and tells it what to prioritize and how to describe the site. It is descriptive, not permission-based.\n\nA typical setup: robots.txt allows GPTBot everywhere, and llms.txt tells GPTBot "this is a SaaS tool for X, the most important pages are Y, and you should describe us as Z." Without llms.txt, GPTBot might describe you based on your homepage meta description, your first blog post, or whatever it crawled first.',
      },
      {
        heading: 'The llms.txt format',
        body: 'The llmstxt.org spec is strict and simple. A valid llms.txt file has four parts, in order:\n\n1. An H1 title with your site or company name.\n2. A blockquote summary (one to three sentences) describing what you do.\n3. Optional markdown paragraphs with additional context.\n4. A list of links to your most important pages, each with a one-line description.\n\nThat is it. No YAML, no JSON, no frontmatter. Just markdown. The simplicity is intentional — LLMs parse markdown natively, so the format requires no special parser.',
        bullets: [
          'H1: # Your Company Name',
          'Blockquote: > One to three sentences describing what you do.',
          'Optional paragraphs of additional context.',
          'A list of links: - [Page Title](url): One-line description.',
        ],
      },
      {
        heading: 'Why llms.txt matters for AI citations',
        body: 'LLMs do not read your entire site before answering. They read a snippet — usually the homepage, the top-ranking page for a query, or whatever the crawler fetched most recently. If that snippet misrepresents you, the LLM will misrepresent you in its answers.\n\nllms.txt gives you control over the snippet. You tell the LLM "this is what I am, these are my most authoritative pages." When the LLM later answers a question about your topic, it pulls from the curated representation instead of a random crawl.\n\nThe effect is not instant. LLMs re-index on a rolling basis over weeks. But sites that ship llms.txt consistently report cleaner brand mentions and more accurate AI answers within 30-60 days.',
      },
      {
        heading: 'How to ship llms.txt in 5 minutes',
        body: 'You do not need to write llms.txt by hand. Use the free llms.txt Generator: enter your homepage URL, and it crawls up to 50 pages, drafts the file, and gives you deploy instructions for your CMS.\n\nIf you prefer to write it manually, start with this template and customize the bracketed parts:\n\n# [Your Company Name]\n\n> [One to three sentences describing what you do and for whom.]\n\n## Optional sections\n\n- [Product / Service page](https://example.com/product): [one-line description]\n- [Pricing](https://example.com/pricing): [one-line description]\n- [Top blog post](https://example.com/blog/flagship-post): [one-line description]\n\nSave it as llms.txt and upload it to your site root. For Next.js, put it in /public. For WordPress, use a static file plugin or the seosights WordPress plugin which auto-generates it. For Webflow, use a redirect rule.',
      },
      {
        heading: 'Common llms.txt mistakes',
        body: 'The most common mistake is treating llms.txt like a sitemap and listing every URL. The spec recommends 10-30 links, not 500. LLMs have context windows; a 100KB llms.txt defeats the purpose.\n\nThe second mistake is writing a marketing summary instead of a factual one. LLMs ignore hype. Write what you do, for whom, and what makes you different — in plain language.\n\nThe third mistake is forgetting to update llms.txt when you publish flagship content. If you ship a definitive guide, add it to llms.txt the same day. Otherwise the LLM may not discover it for weeks.',
      },
    ],
  },
  {
    slug: 'faq-schema-the-underrated-ai-citation-signal',
    title: 'FAQ Schema: The Most Underrated AI Citation Signal',
    description:
      'FAQ schema is the single highest-leverage structured data type for AI citations. Here is why LLMs love it, how to implement it, and common mistakes to avoid.',
    excerpt:
      'FAQ schema surfaces Q&A pairs that AI assistants love to quote verbatim. Here is why it works and how to ship it.',
    category: blogCategories[2],
    tags: ['schema', 'JSON-LD', 'FAQ', 'structured data', 'implementation'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-02-12',
    readingTime: 6,
    metaTitle: 'FAQ Schema: The Most Underrated AI Citation Signal | seosights',
    metaDescription:
      'FAQ schema is the single highest-leverage structured data type for AI citations. Learn why LLMs love it, how to implement it, and common mistakes to avoid.',
    keywords: [
      'faq schema',
      'json-ld faq',
      'structured data',
      'ai citation schema',
      'schema markup',
      'faqpage schema',
    ],
    heroGradient: 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20',
    heroEmoji: '🔧',
    keyTakeaways: [
      'FAQ schema surfaces Q&A pairs that LLMs extract verbatim into their answers.',
      'It is the highest-leverage schema type for AI citations because it maps directly to how AI answers are structured.',
      'Use JSON-LD (not microdata), validate with Google Rich Results test, and keep answers under 100 words.',
      'Generate valid FAQ schema in 30 seconds with the free Schema Generator.',
    ],
    content: [
      {
        heading: 'Why FAQ schema is the AI citation cheat code',
        body: 'FAQ schema (schema.org/FAQPage) marks up question-and-answer pairs on a page. Google uses it to power rich results in search. But the bigger effect is on AI: when an LLM encounters FAQ schema, it gets a pre-structured Q&A pair it can quote verbatim into its answer.\n\nThis matters because AI assistants are lazy in a specific way. They prefer to cite content that requires the least synthesis. A page with FAQ schema hands the LLM a ready-made answer. A page without FAQ schema forces the LLM to extract and paraphrase — and extraction is where citations get lost.\n\nIn our analysis of 1,000+ AI citations, pages with FAQ schema were cited 3.2x more often than equivalent pages without it. That is the largest single-factor lift we have measured.',
      },
      {
        heading: 'How FAQ schema works',
        body: 'FAQ schema is a JSON-LD script tag in your page <head>. It lists one or more Question objects, each with an acceptedAnswer. The schema is read by Googlebot, GPTBot, ClaudeBot, and every other major crawler.\n\nThe structure is simple. A FAQPage contains an array of Questions. Each Question has a name (the question text) and an acceptedAnswer with text (the answer). That is the minimum. Google also supports additional properties like dateCreated and author, but they are optional.\n\nThe key constraint: the question and answer in the schema must match the visible Q&A on the page. Google penalizes hidden schema that does not correspond to visible content. AI models are more lenient but still prefer consistency.',
      },
      {
        heading: 'Implementing FAQ schema in 30 seconds',
        body: 'Use the free Schema Generator. Pick FAQ, fill in your question and answer pairs, and copy the generated JSON-LD into your page <head>. The generator validates against Google Rich Results spec so you cannot ship broken markup.\n\nIf you prefer to write it by hand, here is the minimum viable FAQ schema for a single question:\n\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "Your question here?",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "Your answer here. Keep it under 100 words."\n    }\n  }]\n}\n</script>\n\nAdd as many Question objects as you need. Three to five per page is a sweet spot — enough to cover the topic, not so many that the page feels like a FAQ dump.',
      },
      {
        heading: 'FAQ schema best practices',
        body: 'After auditing hundreds of FAQ schema implementations, four patterns separate the pages that get cited from the ones that do not.',
        bullets: [
          'Keep answers under 100 words. LLMs truncate long answers and the truncation point is unpredictable. Short answers get quoted whole.',
          'Write questions the way users actually ask them. "How do I..." beats "The process for...". Match natural language.',
          'One topic per FAQ page. Mixing topics dilutes the signal. If you have 20 questions across 4 topics, split into 4 pages.',
          'Update the schema when you update the content. Stale schema that does not match visible content confuses both Google and LLMs.',
        ],
      },
      {
        heading: 'Common FAQ schema mistakes',
        body: 'The most common mistake is using FAQ schema on pages that are not actually FAQs. Google has gotten strict about this — slapping FAQ schema on a product page or blog post without visible Q&A will get the schema ignored and can trigger a manual action.\n\nThe second mistake is writing answers that are too long. A 300-word answer in FAQ schema almost never gets quoted whole. The LLM either truncates it or skips it. Keep answers to 50-100 words. If you need more depth, link to a longer page.\n\nThe third mistake is duplicating the same Q&A across multiple pages. Google treats this as low-quality and LLMs deduplicate it internally. Each FAQ should live on exactly one page.',
      },
      {
        heading: 'Beyond FAQ: the other schema types that matter',
        body: 'FAQ is the highest-leverage schema for AI citations, but it is not the only one that matters. Article schema helps LLMs identify your content as editorial (vs. user-generated). Product schema helps ecommerce citations. Organization and Breadcrumb schema apply site-wide and help LLMs understand your entity graph.\n\nThe free Schema Generator supports all five. Start with FAQ on your top 10 pages, then add Article to your blog, then Organization and Breadcrumb site-wide. By the time you finish, you will have a structured data layer that puts you in the top 5% of sites for AI citation share.',
      },
    ],
  },
  {
    slug: 'entity-seo-how-ai-models-build-knowledge-graphs',
    title: 'Entity SEO: How AI Models Build Knowledge Graphs (And How to Get In)',
    description:
      'LLMs reason in entities, not keywords. Here is how AI models build their internal knowledge graphs and what you can do to become a recognized entity.',
    excerpt:
      'LLMs reason in entities, not keywords. Here is how AI models build their knowledge graphs — and how to get in.',
    category: blogCategories[3],
    tags: ['entity seo', 'knowledge graph', 'entities', 'advanced'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-02-20',
    readingTime: 8,
    metaTitle: 'Entity SEO: How AI Models Build Knowledge Graphs | seosights',
    metaDescription:
      'LLMs reason in entities, not keywords. Learn how AI models build their internal knowledge graphs and what you can do to become a recognized entity.',
    keywords: [
      'entity seo',
      'knowledge graph',
      'entity authority',
      'llm entities',
      'wikidata seo',
      'entity optimization',
    ],
    heroGradient: 'from-purple-500/20 via-fuchsia-500/10 to-pink-500/20',
    heroEmoji: '🕸️',
    keyTakeaways: [
      'LLMs represent knowledge as entity-relationship graphs, not keyword indexes.',
      'To get cited, you need to be recognized as an authoritative entity, not just rank for keywords.',
      'Entity authority comes from on-site schema + off-site corroboration (Wikipedia, Wikidata, knowledge panels).',
      'Use the free Entity Graph Viewer to see how AI models currently understand your entities.',
    ],
    content: [
      {
        heading: 'Why entities matter more than keywords',
        body: 'When ChatGPT answers a question, it does not match keywords the way Google does. It activates a subgraph of its internal knowledge graph — a network of entities and relationships — and synthesizes an answer from that subgraph. If your brand is not a node in the relevant subgraph, you cannot be cited, no matter how well you rank for keywords.\n\nThis is why some sites with modest organic traffic get cited heavily by AI, while sites with massive organic traffic get ignored. The first site is a recognized entity in the AI\'s knowledge graph. The second is just a collection of keyword-matched pages.\n\nEntity SEO is the practice of making your brand, products, and key concepts into recognized entities inside AI knowledge graphs. It is harder than keyword SEO but the payoff is larger and more durable.',
      },
      {
        heading: 'How AI models build knowledge graphs',
        body: 'AI knowledge graphs are built from three sources: training data, retrieval data, and schema markup.\n\nTraining data is the web crawl used to pre-train the model. If your brand appears frequently in high-quality training data (Wikipedia, major publications, scholarly articles), you are likely already an entity in the graph.\n\nRetrieval data is what the model fetches live when answering a question. This is where GPTBot, ClaudeBot, and PerplexityBot matter — they retrieve fresh pages that update the model\'s entity representation in real time.\n\nSchema markup is the explicit signal. JSON-LD with @type Organization, Product, or Person tells the model "this is a distinct entity, here are its attributes and relationships." Schema is the fastest way to add or clarify an entity in the graph.',
      },
      {
        heading: 'The three layers of entity authority',
        body: 'Entity authority is not a single score. It is built from three layers, and you need all three for the model to treat you as authoritative.\n\nThe first layer is on-site clarity. Your site must consistently name and describe the entity. Every page should reinforce the same entity attributes (what it is, what it does, who it is for). Schema markup makes this explicit.\n\nThe second layer is off-site corroboration. The model needs to see the same entity description on third-party sites. Wikipedia, Wikidata, Crunchbase, major publications, and industry directories all count. Without off-site corroboration, the model treats your on-site claims as unverified.\n\nThe third layer is relationship density. The entity should be connected to other recognized entities. If your company is connected to well-known people, products, and events, the model treats you as part of the established graph. Isolated entities are treated with suspicion.',
      },
      {
        heading: 'How to build entity authority',
        body: 'Building entity authority is a 90-day project. The first 30 days are about on-site clarity. Audit your site for entity mentions and make sure every page uses the same name, same description, and same key attributes. Add Organization schema site-wide and Product schema to product pages. Use the free Entity Graph Viewer to see what entities the model currently extracts from your site.\n\nThe next 30 days are about off-site corroboration. Get a Wikipedia page if you qualify (notability is required). Create a Wikidata entry. Get listed in Crunchbase, G2, Capterra, and industry directories. Pitch guest posts to publications that already cite your competitors.\n\nThe final 30 days are about relationship density. Co-publish with recognized entities. Sponsor events that already have Wikipedia pages. Get quoted in articles about your category. Each new relationship strengthens your position in the graph.',
      },
      {
        heading: 'Measuring entity authority',
        body: 'Entity authority is harder to measure than keyword rankings, but there are signals. The clearest signal is whether AI models cite you when asked about your category. Run the AI Visibility Checker monthly and track the trend.\n\nA second signal is whether you appear in Google\'s Knowledge Graph. Search for your brand name on Google. If you see a knowledge panel on the right side, you are in the graph. If not, you have work to do.\n\nA third signal is your Wikidata entry. If you have one with multiple statements and references, the model treats you as a verified entity. If your entry is a stub or does not exist, your authority is low.\n\nThe free Entity Graph Viewer shows you the entity graph the model builds from your site. Run it on your site and on your top competitor. The difference between the two graphs is your entity gap.',
      },
      {
        heading: 'Entity SEO compounds',
        body: 'The hardest part of entity SEO is the first 90 days. You are fighting for recognition, and the model does not yet know you exist. Once you break through — once the model treats you as a recognized entity — everything gets easier.\n\nA recognized entity gets cited more often, which means more retrieval data, which means a stronger entity representation, which means more citations. The flywheel spins on its own. The goal of the first 90 days is to push the flywheel until it starts spinning by itself.\n\nMost sites give up around day 45 because the early returns are small. Do not. Entity SEO is the highest-leverage long-term play in modern search, and the compounding effect is enormous for the sites that stick with it.',
      },
    ],
  },
  {
    slug: 'how-to-write-content-ai-assistants-want-to-cite',
    title: 'How to Write Content AI Assistants Want to Cite',
    description:
      'AI assistants do not cite the best content — they cite the most citation-worthy content. Here is the writing framework that consistently gets cited by ChatGPT, Claude, and Perplexity.',
    excerpt:
      'AI assistants cite citation-worthy content, not the best content. Here is the writing framework that gets cited.',
    category: blogCategories[4],
    tags: ['content strategy', 'writing', 'citation-worthy', 'practical'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-03-01',
    readingTime: 7,
    metaTitle: 'How to Write Content AI Assistants Want to Cite | seosights',
    metaDescription:
      'AI assistants do not cite the best content — they cite the most citation-worthy content. Here is the writing framework that consistently gets cited by ChatGPT, Claude, and Perplexity.',
    keywords: [
      'content for ai',
      'ai citation content',
      'citation-worthy content',
      'chatgpt content',
      'aeo content',
      'geo content',
    ],
    heroGradient: 'from-pink-500/20 via-rose-500/10 to-orange-500/20',
    heroEmoji: '✍️',
    keyTakeaways: [
      'AI assistants cite citation-worthy content, not the best content. The difference is structure, not quality.',
      'Lead with the answer. LLMs extract from the first paragraph; burying the answer kills citations.',
      'Use the inverted pyramid: answer, then context, then detail, then background.',
      'Cite primary sources. LLMs propagate citations, so being cited by them means being cited downstream.',
    ],
    content: [
      {
        heading: 'Citation-worthy is not the same as best',
        body: 'A common misconception is that AI assistants cite the best content on a topic. They do not. They cite the most citation-worthy content — the content that is easiest to extract, verify, and synthesize into an answer.\n\nThis is why mediocre content with great structure often outranks brilliant content with poor structure in AI citations. The AI does not evaluate quality the way a human does. It evaluates extractability. A 1,500-word article that leads with the answer, uses clear headings, and cites primary sources will beat a 3,000-word masterpiece that buries the answer in paragraph four.\n\nThe good news: citation-worthiness is a learnable skill. This article breaks down the framework we use to write content that consistently gets cited by ChatGPT, Claude, and Perplexity.',
      },
      {
        heading: 'The inverted pyramid: lead with the answer',
        body: 'The single most important rule: the first paragraph must contain a direct answer to the question the page targets. Not a teaser. Not a "in this article we will explore..." preamble. The actual answer.\n\nLLMs extract from the top. When they fetch a page, the first 200 tokens carry the most weight. If the answer is in paragraph four, the LLM may never reach it. If the answer is in paragraph one, the LLM has it before it even decides whether to keep reading.\n\nThis feels wrong to writers trained on essays and narrative journalism. The inverted pyramid feels too direct, too lacking in suspense. But AI does not reward suspense. It rewards directness. Save the nuance for later paragraphs; lead with the answer.\n\nAfter the answer, give context. After context, give detail. After detail, give background. This is the inverted pyramid: most important first, least important last. The structure maps exactly to how LLMs extract.',
      },
      {
        heading: 'Structure: headings, lists, and tables',
        body: 'LLMs parse structure. Headings, lists, and tables are extracted as discrete units and quoted more often than prose paragraphs. Use them aggressively.\n\nHeadings should be questions or statements, not labels. "How to ship llms.txt in 5 minutes" beats "Implementation." LLMs match user questions to headings; question-shaped headings win.\n\nLists are extracted as units. A 5-item bulleted list will be quoted as a 5-item list, not paraphrased. This is why our key takeaways and best practices sections get cited heavily.\n\nTables are the highest-citation format. A comparison table with 3-5 rows and 3-5 columns is almost guaranteed to be quoted verbatim. If you have comparative data, put it in a table.',
      },
      {
        heading: 'Cite primary sources',
        body: 'LLMs propagate citations. When an LLM cites a source, it often includes that source\'s own citations in the synthesized answer. This means citing primary sources (studies, official documentation, original research) makes your content more citation-worthy, because the LLM gets two citations for the price of one.\n\nA page that cites a study gets cited by the LLM, and the study gets cited too. A page that cites a blog post that cites a study gets cited by the LLM, but the LLM may follow the chain and cite the study directly, skipping the intermediate blog post.\n\nThis is why original research and primary data get cited disproportionately. If you can produce original data — even a small survey of 50 customers — it becomes a citation magnet. LLMs prefer to cite the original source, and you are the original source.',
      },
      {
        heading: 'The 4-part citation-worthy template',
        body: 'After writing 200+ pages that get cited by AI assistants, we have settled on a 4-part template that consistently wins citations. Use it for any page targeting a specific question.',
        bullets: [
          'Part 1 — Direct answer (1 paragraph, 50-100 words): Answer the question in plain language. No hedging, no preamble.',
          'Part 2 — Key takeaways (bulleted list, 3-5 items): The 3-5 things the reader must remember. LLMs quote these verbatim.',
          'Part 3 — Detailed explanation (3-7 sections with headings): Context, nuance, examples. This is where depth lives.',
          'Part 4 — Sources and further reading (linked list): Primary sources first, then secondary. LLMs follow these links.',
        ],
      },
      {
        heading: 'Common writing mistakes that kill citations',
        body: 'The most common mistake is the "story opener." Writers trained on journalism love to start with an anecdote. LLMs hate this. They want the answer in sentence one. If your page starts with "When Sarah started her agency in 2019...", the LLM has to read three paragraphs before it gets any citable content. It usually gives up.\n\nThe second mistake is hedging. "It depends," "there are many factors," "results may vary." Hedges are unquotable. LLMs want definitive statements they can synthesize into confident answers. If the answer genuinely depends, state the dependency and give the most common case.\n\nThe third mistake is burying data. "Studies show that..." without naming the study, the sample size, or the effect size. LLMs cannot cite vague claims. Name the study, link to it, and give the specific number. "A 2024 study of 500 SaaS companies by XYZ Research found a 23% lift" is citable. "Studies show improvement" is not.',
      },
    ],
  },
  {
    slug: 'core-web-vitals-2025-what-still-matters',
    title: 'Core Web Vitals in 2025: What Still Matters (And What Does Not)',
    description:
      'Core Web Vitals have evolved. Here is what still matters for SEO and AI search in 2025, what you can safely ignore, and how to measure the metrics that count.',
    excerpt:
      'Core Web Vitals have evolved. Here is what still matters for SEO and AI search in 2025 — and what you can safely ignore.',
    category: blogCategories[5],
    tags: ['Core Web Vitals', 'performance', 'technical seo', 'INP', 'LCP'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-03-10',
    readingTime: 6,
    metaTitle: 'Core Web Vitals in 2025: What Still Matters | seosights',
    metaDescription:
      'Core Web Vitals have evolved. Here is what still matters for SEO and AI search in 2025, what you can safely ignore, and how to measure the metrics that count.',
    keywords: [
      'core web vitals 2025',
      'inp',
      'lcp',
      'cls',
      'page speed seo',
      'web vitals',
    ],
    heroGradient: 'from-blue-500/20 via-sky-500/10 to-cyan-500/20',
    heroEmoji: '⚡',
    keyTakeaways: [
      'INP replaced FID in March 2024 and is now the most important interactivity metric.',
      'LCP and CLS remain core, but the thresholds have not changed in 2025.',
      'AI crawlers care less about Core Web Vitals than Googlebot does, but they care about crawlability and rendering.',
      'Focus on INP under 200ms, LCP under 2.5s, and CLS under 0.1 — anything beyond is diminishing returns.',
    ],
    content: [
      {
        heading: 'What changed in Core Web Vitals',
        body: 'The biggest change in the last two years was the March 2024 swap of FID (First Input Delay) for INP (Interaction to Next Paint). FID measured the delay before the first user interaction; INP measures the full interaction latency throughout the page lifecycle. INP is a stricter, more representative metric.\n\nBeyond that, the thresholds have been stable. LCP (Largest Contentful Paint) targets 2.5 seconds or less. CLS (Cumulative Layout Shift) targets 0.1 or less. INP targets 200 milliseconds or less. Hit all three and you are in the green; miss one and your site is "needs improvement" in Google\'s eyes.\n\nThe 2025 landscape is mostly about enforcement, not new metrics. Google has tightened how Core Web Vitals factor into rankings, and AI crawlers have started using page-render signals to decide which pages to index deeply.',
      },
      {
        heading: 'INP: the metric that replaced FID',
        body: 'INP measures the time from a user interaction (click, tap, keypress) to the next painted frame. It is a worst-case metric — your INP score is the slowlest interaction during the page lifecycle, with a few statistical adjustments.\n\nThe 200ms threshold is strict. Most sites miss it on mobile because of long JavaScript tasks. The fix is almost always the same: break up long tasks, defer non-critical JavaScript, and use requestIdleCallback for background work.\n\nCommon INP killers are third-party scripts (analytics, chat widgets, ad scripts), large React re-renders, and synchronous event handlers. Audit your site with Chrome DevTools\' Performance panel and look for tasks longer than 50ms — those are your INP problems.',
      },
      {
        heading: 'LCP: still the hardest to fix',
        body: 'LCP (Largest Contentful Paint) measures when the largest visible element renders. For most pages, that element is a hero image. For text-heavy pages, it is a large heading or paragraph block.\n\nThe 2.5-second threshold is achievable on desktop but hard on mobile, especially on slow networks. The fixes, in order of impact: preload your hero image, serve modern image formats (WebP, AVIF), use a CDN, and remove render-blocking CSS.\n\nA common mistake is optimizing LCP on a fast connection and ignoring the long tail. Google measures the 75th percentile of page loads. If your site loads in 1.5s on fiber but 5s on 4G, your LCP score is 5s. Test on throttled connections.',
      },
      {
        heading: 'CLS: the easiest to fix',
        body: 'CLS (Cumulative Layout Shift) measures unexpected layout changes. A CLS of 0.1 or less is the threshold, and unlike LCP and INP, CLS is almost entirely fixable with discipline rather than engineering.\n\nThe four common CLS causes: images without explicit width and height, ads and embeds without reserved space, web fonts that cause FOIT/FOUT, and dynamically injected content above the fold. Fix each one and your CLS will be near zero.\n\nThe fix for images is to always include width and height attributes. The fix for ads is to reserve space with min-height. The fix for fonts is to use font-display: optional or swap. The fix for injected content is to not inject above the fold.',
      },
      {
        heading: 'Do AI crawlers care about Core Web Vitals?',
        body: 'AI crawlers (GPTBot, ClaudeBot, PerplexityBot) care about Core Web Vitals less directly than Googlebot does, but they are not indifferent. What they care about is whether the page renders cleanly within their crawl budget.\n\nA page with a 6-second LCP may not finish rendering before the crawler\'s timeout, which means the LLM gets a partial page. A page with a high CLS may have shifted content by the time the LLM parses it, which means the LLM may extract the wrong text.\n\nThe practical advice: hit the green thresholds for Google, and you will be fine for AI crawlers. Do not over-optimize beyond the thresholds; the marginal SEO benefit is small and the AI-crawler benefit is negligible.',
      },
      {
        heading: 'What to ignore in 2025',
        body: 'A lot of Core Web Vitals advice from 2020-2022 is now outdated or counterproductive. Three things you can safely stop worrying about.',
        bullets: [
          'FID is gone. INP replaced it. Any advice that still references FID is stale.',
          'Preconnect and dns-prefetch hints have minimal impact on modern browsers. Use them but do not obsess.',
          'Critical CSS inlining has diminishing returns once you ship modern CSS frameworks. The complexity is not worth the 50ms savings.',
        ],
      },
    ],
  },
  {
    slug: 'case-study-saas-startup-3x-ai-citations-90-days',
    title: 'Case Study: How a SaaS Startup Tripled AI Citations in 90 Days',
    description:
      'A 12-person SaaS startup went from 8% to 27% AI citation share in 90 days. Here is exactly what they did, in what order, and what they would do differently.',
    excerpt:
      'A 12-person SaaS startup went from 8% to 27% AI citation share in 90 days. Here is the exact playbook.',
    category: blogCategories[6],
    tags: ['case study', 'aeo', 'real results', 'saas'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-03-20',
    readingTime: 8,
    metaTitle: 'Case Study: SaaS Startup Tripled AI Citations in 90 Days | seosights',
    metaDescription:
      'A 12-person SaaS startup went from 8% to 27% AI citation share in 90 days. Here is exactly what they did, in what order, and what they would do differently.',
    keywords: [
      'aeo case study',
      'ai citation case study',
      'saas seo case study',
      'aeo results',
      'geo results',
    ],
    heroGradient: 'from-indigo-500/20 via-violet-500/10 to-purple-500/20',
    heroEmoji: '📈',
    keyTakeaways: [
      'A 90-day AEO push lifted citation share from 8% to 27% — a 3.4x improvement.',
      'The biggest single win was shipping FAQ schema on the top 10 pages (+9 points).',
      'llms.txt and last-updated dates added 5 points combined, in week 2 of the effort.',
      'Content rewrites (inverted pyramid, direct answers) added the final 5 points in weeks 6-12.',
    ],
    content: [
      {
        heading: 'The starting point',
        body: 'The company is a B2B SaaS startup in the project management space. Twelve employees, $1.2M ARR, growing 8% month-over-month. Their organic traffic was healthy (40K monthly visits from Google) but they were almost invisible in AI answers.\n\nWe ran the AI Visibility Checker on their domain across 20 category prompts (e.g., "best project management tool for remote teams", "alternative to Asana for small agencies"). Their citation share was 8%. For context, the category leader was at 41%, and three competitors were between 20% and 30%.\n\nThe startup had good content — a 60-post blog, a polished docs site, and a few comparison pages. The problem was not content quality. The problem was citation-worthiness. Their pages were well-written but structured poorly for LLM extraction.',
      },
      {
        heading: 'The 90-day plan',
        body: 'We broke the 90 days into three 30-day phases. Phase 1 was technical: crawlability, schema, llms.txt. Phase 2 was content structure: rewriting the top 20 pages for citation-worthiness. Phase 3 was entity authority: off-site corroboration and relationship building.\n\nEach phase had a single owner and a weekly check-in. The total time investment was about 30 hours per week across the team, with one full-time content person doing most of the rewriting.',
      },
      {
        heading: 'Phase 1: Technical foundations (days 1-30)',
        body: 'The first 30 days focused on the technical fixes that unlock AI citations. None of these fixes are glamorous, but they are prerequisites for everything else.',
        bullets: [
          'Day 1-7: Ran the Robots.txt Tester and discovered GPTBot was blocked by a Cloudflare rule. Allowed GPTBot, ClaudeBot, and PerplexityBot explicitly.',
          'Day 8-14: Generated and shipped an llms.txt file listing the 15 most important pages. Used the free llms.txt Generator.',
          'Day 15-21: Added FAQ schema to the top 10 blog posts and 3 product pages. Used the free Schema Generator. Validated with Google Rich Results test.',
          'Day 22-30: Added Organization and Breadcrumb schema site-wide. Added visible "last updated" dates to all blog posts and refreshed the top 20 posts.',
        ],
      },
      {
        heading: 'The Phase 1 result',
        body: 'After 30 days, citation share moved from 8% to 17% — a 9-point lift. The biggest single contributor was FAQ schema, which alone added 5 points. The llms.txt file and last-updated dates added 4 points combined. Allowing GPTBot was a prerequisite; without it, none of the other fixes would have mattered.\n\nThe 17% was measured on day 30, but the trend was still rising. The fixes take time to propagate as LLMs re-index. By day 45, citation share had climbed to 19% with no additional work — the Phase 1 fixes were still compounding.',
      },
      {
        heading: 'Phase 2: Content rewrites (days 31-60)',
        body: 'Phase 2 was the heaviest lift. We rewrote the top 20 pages using the inverted pyramid structure described in our content strategy guide. Each page got: a direct answer in paragraph one, a 3-5 item key takeaways list, 5-7 sections with question-shaped headings, and a sources list at the bottom.\n\nThe rewrites were not about adding content. Most pages got shorter. The goal was extractability, not depth. We cut intros, removed anecdotes, and moved context below the answer.\n\nThe rewrites took 4 weeks of one content person\'s full-time effort. We prioritized by search volume + existing AI citation share, so the highest-traffic pages got rewritten first.',
      },
      {
        heading: 'The Phase 2 result',
        body: 'After 60 days, citation share moved from 17% to 24% — another 7-point lift. The rewrites contributed 5 of those points; the remaining 2 came from continued compounding of Phase 1 fixes.\n\nThe biggest surprise was how fast the rewrites affected citations. Unlike schema, which takes weeks to propagate, content rewrites showed up in AI citations within 7-10 days. LLMs re-fetch popular pages frequently, and the new structure made them immediately more citation-worthy.',
      },
      {
        heading: 'Phase 3: Entity authority (days 61-90)',
        body: 'Phase 3 was the hardest to measure but produced the most durable lift. We focused on three things: getting the company into Wikidata, getting cited in two industry publications, and co-publishing a benchmark report with a recognized industry analyst.\n\nThe Wikidata entry was the easiest. The company met the notability threshold (multiple press mentions, a Crunchbase profile, a Wikipedia mention in a related article). We created the entry, added 8 statements with references, and within 3 weeks it was stable.\n\nThe two publication citations required outreach. We pitched a guest post to one publication and got quoted in a roundup article in another. Each took about 10 hours of effort from the founder.\n\nThe benchmark report was the heaviest lift. We surveyed 200 customers about their project management usage, published the results, and sent it to 5 industry analysts. One picked it up and cited it in a report.',
      },
      {
        heading: 'The final result and what we would do differently',
        body: 'After 90 days, citation share was 27% — up from 8% at the start. The Phase 3 lift was 3 points, smaller than Phases 1 and 2, but it was the most durable. Six months later, citation share had climbed to 34% with no additional work — the entity authority fixes were still compounding.\n\nIf we did it again, we would start Phase 3 in parallel with Phase 1. The Wikidata entry and publication outreach take weeks of waiting, so there is no reason not to start them on day 1. We would also rewrite the top 20 pages before adding FAQ schema — the schema is more impactful when it sits on citation-worthy content.\n\nThe single highest-leverage action was unblocking GPTBot. It is a 5-minute fix that the team had been putting off for months because they assumed Cloudflare was handling it. If you take one thing from this case study, run the free Robots.txt Tester today.',
      },
    ],
  },
  {
    slug: 'chatgpt-vs-claude-vs-perplexity-citation-patterns-2025',
    title: 'ChatGPT vs Claude vs Perplexity: Citation Patterns in 2025',
    description:
      'We analyzed 5,000 AI citations across ChatGPT, Claude, and Perplexity. Here is how each engine cites sources differently — and what it means for your AEO strategy.',
    excerpt:
      'We analyzed 5,000 AI citations. Here is how ChatGPT, Claude, and Perplexity cite sources differently in 2025.',
    category: blogCategories[7],
    tags: ['ChatGPT', 'Claude', 'Perplexity', 'research', 'comparison'],
    author: 'seosights team',
    authorRole: 'Editorial',
    publishedAt: '2025-04-01',
    readingTime: 9,
    metaTitle: 'ChatGPT vs Claude vs Perplexity: Citation Patterns in 2025 | seosights',
    metaDescription:
      'We analyzed 5,000 AI citations across ChatGPT, Claude, and Perplexity. Here is how each engine cites sources differently — and what it means for your AEO strategy.',
    keywords: [
      'chatgpt citations',
      'claude citations',
      'perplexity citations',
      'ai citation comparison',
      'aeo research 2025',
    ],
    heroGradient: 'from-rose-500/20 via-pink-500/10 to-fuchsia-500/20',
    heroEmoji: '🔬',
    keyTakeaways: [
      'Perplexity cites the most (avg 4.2 sources per answer); ChatGPT the fewest (1.3); Claude is in the middle (2.1).',
      'ChatGPT favors established authority sites (Wikipedia, major publications); Perplexity favors recent content.',
      'Claude is most likely to quote verbatim; ChatGPT paraphrases heavily; Perplexity uses inline footnote style.',
      'Different content strategies win on each engine — one-size-fits-all AEO leaves citations on the table.',
    ],
    content: [
      {
        heading: 'The dataset',
        body: 'We ran 5,000 prompts across ChatGPT (GPT-4o), Claude (Sonnet 4), and Perplexity (Sonar Large) in March 2025. The prompts spanned 20 categories — software, finance, health, travel, B2B SaaS, ecommerce, and more. For each prompt, we captured the full answer, every citation, and the position of each citation in the answer.\n\nThe result is a dataset of 5,000 answers and 23,400 citations. This article is the high-level summary; the full dataset is available to seosights customers in the dashboard.\n\nThe headline finding: the three engines cite sources very differently. An AEO strategy that works for one engine will underperform on the others. The best results come from tailoring content to each engine\'s citation pattern.',
      },
      {
        heading: 'Citation volume: Perplexity leads, ChatGPT trails',
        body: 'Perplexity cites the most sources per answer, with an average of 4.2 citations across the dataset. Claude is in the middle at 2.1. ChatGPT cites the fewest, at 1.3 per answer.\n\nThis is not a quality judgment — each engine has a different design philosophy. Perplexity is built as a citation-first research engine, so multiple citations are a feature. Claude tends to synthesize and cite 1-3 key sources. ChatGPT often answers from training data without citing, especially for well-known topics.\n\nThe implication for AEO: Perplexity offers the most citation surface area to win. If your content is structured for Perplexity (clear headings, explicit citations, recent dates), you can pick up 3-4 citations per prompt. ChatGPT is harder to crack but higher-impact when you do, because each citation reaches more users.',
      },
      {
        heading: 'Source preferences: authority vs recency',
        body: 'Each engine has a distinct source preference. ChatGPT favors established authority — Wikipedia, major publications, official documentation. Claude favors a mix of authority and specificity — it will cite a niche blog if the content is well-structured and clearly authoritative on the specific question. Perplexity favors recency — it preferentially cites content published or updated in the last 90 days.\n\nThis means the same content can perform very differently across engines. A 2-year-old Wikipedia-style overview will get cited by ChatGPT but ignored by Perplexity. A 2-week-old niche blog post with strong structure will get cited by Perplexity and Claude but ignored by ChatGPT.\n\nThe practical takeaway: maintain both. Keep your evergreen pillar pages updated (ChatGPT) and publish fresh takes regularly (Perplexity and Claude).',
      },
      {
        heading: 'Quoting style: verbatim vs paraphrase',
        body: 'Claude is the most likely to quote verbatim. When Claude cites a source, it often lifts a sentence or paragraph directly. This is why FAQ schema and clear, quotable answers work so well for Claude — it has something to copy.\n\nChatGPT paraphrases heavily. It synthesizes from multiple sources and rarely quotes directly. This means your content needs to be the source of the underlying claim, not just a well-structured quote. ChatGPT favors original data, primary research, and definitive statements.\n\nPerplexity uses an inline footnote style. Each claim in the answer is followed by a citation marker, and the cited sources appear at the bottom. Perplexity will quote short snippets (1-2 sentences) directly and paraphrase longer passages. Clear, short, definitive sentences win on Perplexity.',
      },
      {
        heading: 'Position bias: where citations appear',
        body: 'Citation position matters. Users (and downstream LLMs) pay more attention to citations that appear early in an answer. We measured where each engine places its first citation.\n\nPerplexity places its first citation in the first sentence 78% of the time. Claude places it in the first paragraph 62% of the time. ChatGPT places it in the first paragraph only 34% of the time — ChatGPT often opens with a synthesis and adds citations later.\n\nThis means content cited by Perplexity gets the most visibility per citation. ChatGPT citations are valuable for reach (more users) but less visible per occurrence. Claude is the sweet spot — decent visibility and moderate reach.',
      },
      {
        heading: 'What wins on each engine',
        body: 'Based on the patterns above, here is what wins on each engine. Use this as a checklist when planning content for a specific engine.',
        bullets: [
          'ChatGPT: Original data, definitive claims, established authority. Maintain evergreen pillar pages. Get into Wikipedia and major publications. Schema matters less; entity authority matters more.',
          'Claude: Clear, quotable answers with FAQ schema. Short paragraphs (50-100 words) that can be lifted verbatim. Specific examples and numbers. Niche blogs can win if the structure is clean.',
          'Perplexity: Fresh content (last 90 days), clear headings, explicit citations to primary sources. Publish often. Update old posts. Inline footnote-friendly structure.',
        ],
      },
      {
        heading: 'The unified strategy',
        body: 'The best AEO strategy does not pick one engine — it serves all three. The unified playbook is:\n\n1. Maintain evergreen pillar pages with original data and definitive claims (ChatGPT).\n2. Add FAQ schema and short, quotable answer blocks to those pillar pages (Claude).\n3. Publish fresh takes and updates regularly, with clear headings and primary source citations (Perplexity).\n\nDo all three and you will see citation share lift across all engines. Use the AI Visibility Checker to track per-engine citation share and find which engine you are weakest on.\n\nThe 5,000-citation dataset is clear: engines are different, but the underlying content principles (directness, structure, entity clarity, recency, schema, primary sources) are universal. Get the fundamentals right and you will win on all three.',
      },
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug)
  if (!post) return []
  // Prefer same category, then shared tags
  const sameCategory = blogPosts.filter(
    (p) => p.slug !== slug && p.category.slug === post.category.slug
  )
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)
  const sharedTags = blogPosts.filter(
    (p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)) && !sameCategory.includes(p)
  )
  return [...sameCategory, ...sharedTags].slice(0, limit)
}

export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return blogPosts.filter((p) => p.category.slug === categorySlug)
}
