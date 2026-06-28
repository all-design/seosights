/**
 * Free AI SEO Tools — canonical metadata for /free-ai-seo-tools/[slug]
 * Single source of truth shared by the hub page, individual tool pages,
 * the homepage FreeToolsSection, and the navbar/footer links.
 */

export type ToolStatus = 'live' | 'coming-soon'

export interface FreeToolStep {
  title: string
  description: string
}

export interface FreeToolFaq {
  question: string
  answer: string
}

export interface FreeTool {
  slug: string
  name: string
  tagline: string
  description: string
  longDescription: string
  icon: string // lucide icon name — resolved in client components
  color: string // tailwind text color class
  bg: string // tailwind bg color class
  status: ToolStatus
  category: 'Visibility' | 'Crawlers' | 'Schema' | 'Audits' | 'Entities'
  metaTitle: string
  metaDescription: string
  keywords: string[]
  howItWorks: FreeToolStep[]
  keyBenefits: string[]
  faq: FreeToolFaq[]
  relatedSlugs: string[]
  inputLabel: string
  inputPlaceholder: string
  ctaText: string
  resultsIntro: string
}

export const freeTools: FreeTool[] = [
  {
    slug: 'ai-visibility-checker',
    name: 'AI Visibility Checker',
    tagline: 'See if ChatGPT, Claude & Perplexity can cite you',
    description:
      'Instantly discover whether ChatGPT, Claude, Perplexity, and Google AI Overviews cite your website when users ask questions about your topic. Free, no signup required.',
    longDescription:
      'The AI Visibility Checker runs a real-time probe against the most popular LLM-powered answer engines and reports whether your domain is cited, mentioned, or absent. Paste a URL, pick a few representative prompts, and get a shareable visibility score in under 30 seconds. Use it to benchmark against competitors and track progress over time as you ship schema, llms.txt, and entity signals.',
    icon: 'Eye',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free AI Visibility Checker — ChatGPT, Claude & Perplexity | seosights',
    metaDescription:
      'Free AI visibility checker. Instantly see if ChatGPT, Claude, Perplexity, and Google AI Overviews cite your website. No signup required. Run your free AEO visibility audit now.',
    keywords: [
      'ai visibility checker',
      'chatgpt citation check',
      'claude citation',
      'perplexity visibility',
      'aeo audit',
      'llm visibility',
      'free aeo tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL',
        description:
          'Paste the page or domain you want to test. We fetch basic signals (title, meta, schema, robots) in the background.',
      },
      {
        title: 'Pick representative prompts',
        description:
          'Choose 3-5 questions your customers would ask an AI assistant. These become your visibility benchmark.',
      },
      {
        title: 'We probe the answer engines',
        description:
          'Our agent simulates the prompts against ChatGPT, Claude, Perplexity, and Google AI Overviews and records every citation and mention.',
      },
      {
        title: 'Get your visibility score',
        description:
          'Receive a 0-100 visibility score, a per-engine breakdown, and the exact snippets where you were (or were not) cited.',
      },
    ],
    keyBenefits: [
      'Real-time probe of 4 major AI answer engines',
      'Per-engine citation breakdown with exact snippets',
      'Shareable benchmark URL you can re-run monthly',
      'Competitor comparison included',
      'No signup, no credit card — results in 30 seconds',
    ],
    faq: [
      {
        question: 'Is the AI Visibility Checker really free?',
        answer:
          'Yes. You can run unlimited visibility checks without an account. We rate-limit by IP to keep the service fast for everyone. Sign up for a free trial to unlock scheduled re-checks, alerts, and historical trending.',
      },
      {
        question: 'Which AI engines do you probe?',
        answer:
          'We currently probe ChatGPT (GPT-4o family), Claude (Sonnet/Opus), Perplexity (Sonar), and Google AI Overviews. Enterprise customers can add custom LLM endpoints.',
      },
      {
        question: 'How is the visibility score calculated?',
        answer:
          'The score is a weighted blend of citation frequency, mention frequency, snippet placement (top vs. buried), and competitor share. A score of 80+ means you are cited in most prompts for your topic.',
      },
      {
        question: 'Can I check competitors too?',
        answer:
          'Yes. Enter any competitor URL and we will run the same prompts so you can compare side by side. The full seosights dashboard supports up to 10 tracked competitors per project.',
      },
    ],
    relatedSlugs: ['gptbot-checker', 'geo-audit', 'aeo-audit', 'prompt-visibility-checker'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Check My AI Visibility',
    resultsIntro: 'Your AI Visibility Score is ready. Here is how each engine cites you:',
  },
  {
    slug: 'llms-txt-generator',
    name: 'llms.txt Generator',
    tagline: 'Generate llms.txt for your site in 1 click',
    description:
      'Create a valid llms.txt file that helps GPTBot, ClaudeBot, and other LLM crawlers understand and cite your most important content. Free, standards-compliant, no signup.',
    longDescription:
      'The llms.txt standard (llmstxt.org) is the robots.txt for the AI era. It tells language model crawlers which pages matter most, what your site is about, and how to summarize you accurately. Our generator crawls your site, extracts your canonical content, and produces a ready-to-publish llms.txt file in markdown format — all in one click.',
    icon: 'FileText',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
    category: 'Schema',
    metaTitle: 'Free llms.txt Generator — One-Click LLM Crawler Manifest | seosights',
    metaDescription:
      'Generate a valid llms.txt file for your website in one click. Help GPTBot, ClaudeBot, and PerplexityBot crawl and cite your content. Free, no signup. llmstxt.org compliant.',
    keywords: [
      'llms.txt generator',
      'llmstxt',
      'llm crawler manifest',
      'gptbot llms.txt',
      'ai crawler file',
      'free llms.txt tool',
    ],
    howItWorks: [
      {
        title: 'Enter your homepage URL',
        description:
          'We crawl your site up to 50 pages and identify your most authoritative content using on-page signals and internal links.',
      },
      {
        title: 'We draft your llms.txt',
        description:
          'The generator writes a markdown summary, lists your key URLs with one-line descriptions, and structures everything per the llmstxt.org spec.',
      },
      {
        title: 'Review and download',
        description:
          'Edit the draft in-browser, then download as llms.txt and drop it at your site root. We give you the exact deployment instructions for your CMS.',
      },
    ],
    keyBenefits: [
      'Crawls up to 50 pages automatically',
      'llmstxt.org spec compliant (H1 title, blockquote summary, markdown links)',
      'One-click deploy instructions for WordPress, Next.js, Webflow, Shopify',
      'Editable in-browser before download',
      'Free forever — no account required',
    ],
    faq: [
      {
        question: 'What is llms.txt?',
        answer:
          'llms.txt is a markdown file placed at your site root that gives language model crawlers a curated summary of your site and links to your most important pages. It is the AI-era equivalent of robots.txt and is supported by the open llmstxt.org standard.',
      },
      {
        question: 'Does llms.txt help me get cited by ChatGPT?',
        answer:
          'A well-structured llms.txt improves how LLM crawlers index and summarize your content. It does not guarantee citations, but it removes the most common crawlability and summarization barriers that cause sites to be overlooked.',
      },
      {
        question: 'Where do I put the llms.txt file?',
        answer:
          'At the root of your domain, e.g. https://example.com/llms.txt. Most CMS platforms let you add it via a static file upload, a redirect rule, or a small plugin. We give you exact instructions for your stack.',
      },
      {
        question: 'Is this the same as robots.txt?',
        answer:
          'No. robots.txt tells crawlers what they may or may not access. llms.txt tells LLM crawlers what is most important and how to summarize it. You need both, and they complement each other.',
      },
    ],
    relatedSlugs: ['schema-generator', 'robots-txt-tester', 'gptbot-checker'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Generate My llms.txt',
    resultsIntro: 'Your llms.txt draft is ready. Review it below, then download.',
  },
  {
    slug: 'schema-generator',
    name: 'Schema Generator',
    tagline: 'FAQ, Article, Product schema markup',
    description:
      'Generate JSON-LD schema markup for FAQ, Article, Product, Organization, and Breadcrumb types. Copy-paste ready, Google Rich Results validated, free.',
    longDescription:
      'Structured data (schema.org) is one of the strongest signals AI and traditional search engines use to understand and cite your content. Our schema generator produces clean, validated JSON-LD for the five most impactful schema types — no need to hand-write markup or wrestle with Google\'s Rich Results test.',
    icon: 'Code',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
    category: 'Schema',
    metaTitle: 'Free JSON-LD Schema Generator — FAQ, Article, Product | seosights',
    metaDescription:
      'Free schema markup generator. Create JSON-LD for FAQ, Article, Product, Organization, and Breadcrumb schema. Copy-paste ready, Google Rich Results validated. No signup.',
    keywords: [
      'schema generator',
      'json-ld generator',
      'faq schema',
      'article schema',
      'product schema',
      'structured data generator',
      'free schema tool',
    ],
    howItWorks: [
      {
        title: 'Pick a schema type',
        description:
          'Choose from FAQ, Article, Product, Organization, or Breadcrumb. Each type has a tailored form with only the fields that matter.',
      },
      {
        title: 'Fill in the form',
        description:
          'We use smart defaults and your page URL to pre-fill what we can. Required fields are validated inline so you cannot ship broken markup.',
      },
      {
        title: 'Copy the JSON-LD',
        description:
          'Get a single <script type="application/ld+json"> block you can paste into your page <head>. We validate it against Google\'s Rich Results spec before showing it to you.',
      },
    ],
    keyBenefits: [
      'Five schema types: FAQ, Article, Product, Organization, Breadcrumb',
      'Validated against Google Rich Results spec',
      'Copy-paste single script tag — no dependencies',
      'Smart pre-fill from your page URL',
      'Free, no signup, no watermark',
    ],
    faq: [
      {
        question: 'Which schema type should I use?',
        answer:
          'If you publish tutorials or Q&A content, use FAQ. For blog posts and news, use Article. For ecommerce, use Product. Organization and Breadcrumb apply to almost every site and should be added site-wide.',
      },
      {
        question: 'Will schema markup get me into Google Rich Results?',
        answer:
          'Valid schema is required but not sufficient. Google also evaluates content quality, E-E-A-T signals, and manual review eligibility. Our generator guarantees the technical layer is correct so you can focus on content.',
      },
      {
        question: 'Does schema help with AI citations?',
        answer:
          'Yes. LLMs use schema to identify entities, facts, and relationships. FAQ schema in particular surfaces Q&A pairs that AI assistants love to quote verbatim.',
      },
      {
        question: 'JSON-LD or microdata?',
        answer:
          'Always JSON-LD. Google, OpenAI, and Anthropic all prefer JSON-LD. It lives in a single script tag, is easy to maintain, and does not pollute your visible HTML.',
      },
    ],
    relatedSlugs: ['llms-txt-generator', 'aeo-audit', 'entity-graph-viewer'],
    inputLabel: 'Page URL (optional, for pre-fill)',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Generate Schema',
    resultsIntro: 'Your validated JSON-LD is ready. Copy the script tag below into your <head>.',
  },
  {
    slug: 'robots-txt-tester',
    name: 'Robots.txt Tester',
    tagline: 'Check if AI bots are blocked',
    description:
      'Test your robots.txt against GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, and 12 more AI crawlers. See exactly who can crawl what — free.',
    longDescription:
      'Your robots.txt is the gatekeeper between your content and the AI crawlers that feed ChatGPT, Claude, and Perplexity. A single misplaced Disallow rule can quietly erase you from AI answers. Our robots.txt tester fetches your live file, parses it with Google\'s spec, and reports exactly which AI bots are allowed or blocked — with line-by-line explanations.',
    icon: 'Bot',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    status: 'live',
    category: 'Crawlers',
    metaTitle: 'Free Robots.txt Tester for AI Crawlers — GPTBot, ClaudeBot | seosights',
    metaDescription:
      'Free robots.txt tester. Check if GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot can crawl your site. Line-by-line analysis. No signup required.',
    keywords: [
      'robots.txt tester',
      'gptbot robots.txt',
      'claudebot check',
      'ai crawler robots',
      'perplexitybot',
      'free robots tester',
    ],
    howItWorks: [
      {
        title: 'Enter your domain',
        description:
          'We fetch https://yourdomain.com/robots.txt in real time. If none exists we tell you what that means for AI crawlers.',
      },
      {
        title: 'Parse against the spec',
        description:
          'Our parser follows RFC 9309 (the robots.txt standard) and Google\'s longest-match rules so the result matches real crawler behavior.',
      },
      {
        title: 'See per-bot results',
        description:
          'Get a color-coded grid of every AI crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bytespider, and more) with the exact rule that applies.',
      },
    ],
    keyBenefits: [
      'Tests 17+ AI crawlers in one shot',
      'RFC 9309 + Google longest-match compliant parser',
      'Line-by-line explanation of which rule applies to each bot',
      'Detects accidental Disallow: / that blocks everyone',
      'Suggests the exact fix to allow specific bots safely',
    ],
    faq: [
      {
        question: 'Why is GPTBot blocked on my site?',
        answer:
          'The most common cause is a blanket Disallow: / rule, or a CMS default that blocks unknown bots. Some hosting providers (WP Engine, Kinsta) also block AI crawlers at the edge. We show you the exact rule responsible and the minimal change to allow GPTBot while keeping bad bots out.',
      },
      {
        question: 'Should I allow all AI crawlers?',
        answer:
          'It depends on your strategy. Allowing GPTBot, ClaudeBot, PerplexityBot, and Google-Extended is recommended if you want AI citations. Blocking them protects your content from being used as training data but also removes you from AI answers. We show you the trade-offs so you can decide per bot.',
      },
      {
        question: 'What is Google-Extended?',
        answer:
          'Google-Extended is a separate User-agent Google uses for its AI products (Gemini, AI Overviews). It is independent of Googlebot, so you can allow Googlebot for regular search while controlling AI training separately.',
      },
      {
        question: 'Does this work for subfolders and subdomains?',
        answer:
          'Yes. We respect the robots.txt file that applies to the path you test. For subdomains, enter the full subdomain URL and we fetch the correct robots.txt for that origin.',
      },
    ],
    relatedSlugs: ['gptbot-checker', 'claudebot-checker', 'llms-txt-generator'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Test My robots.txt',
    resultsIntro: 'Here is what each AI crawler sees when it visits your site:',
  },
  {
    slug: 'gptbot-checker',
    name: 'GPTBot Checker',
    tagline: 'Can OpenAI crawl your site?',
    description:
      'Check whether GPTBot (OpenAI\'s crawler that powers ChatGPT) can crawl your site. Get the exact robots.txt rule, last-crawl estimate, and a fix if blocked. Free.',
    longDescription:
      'GPTBot is OpenAI\'s web crawler. If it cannot reach your content, ChatGPT will not cite you — no matter how good your content is. The GPTBot Checker fetches your robots.txt, isolates the GPTBot-specific rules, estimates your last-crawl window based on public logs, and tells you exactly what to fix if you are blocked.',
    icon: 'Search',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'live',
    category: 'Crawlers',
    metaTitle: 'Free GPTBot Checker — Can OpenAI Crawl Your Site? | seosights',
    metaDescription:
      'Free GPTBot checker. Find out if OpenAI\'s GPTBot can crawl your site, see the exact robots.txt rule, and get a fix if blocked. No signup required.',
    keywords: [
      'gptbot checker',
      'openai crawler',
      'chatgpt crawl',
      'gptbot robots.txt',
      'is gptbot blocked',
      'free gptbot tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL',
        description:
          'We fetch your robots.txt and look for User-agent: GPTBot rules. If none exist, GPTBot is allowed by default.',
      },
      {
        title: 'Verify crawlability',
        description:
          'We check for path-level Disallow rules, edge-level blocks (Cloudflare, WP Engine), and the presence of a recent GPTBot hit in your logs (if you connect them).',
      },
      {
        title: 'Get your GPTBot status',
        description:
          'Receive a clear Allowed / Blocked verdict, the responsible rule, and a copy-paste fix to allow GPTBot without opening the door to scrapers.',
      },
    ],
    keyBenefits: [
      'Definitive Allowed / Blocked verdict for GPTBot',
      'Identifies edge-level blocks (Cloudflare, WP Engine, Kinsta)',
      'Copy-paste robots.txt snippet to safely allow GPTBot',
      'Side-by-side comparison with ClaudeBot and PerplexityBot',
      'Free, instant, no account needed',
    ],
    faq: [
      {
        question: 'What is GPTBot?',
        answer:
          'GPTBot is OpenAI\'s web crawler. It fetches public web pages that are used to ground ChatGPT answers and to train future OpenAI models. Allowing GPTBot is the single most important step to get cited by ChatGPT.',
      },
      {
        question: 'Will allowing GPTBot slow down my site?',
        answer:
          'No. GPTBot respects normal crawl-delay conventions and is rate-limited by OpenAI. You can also add a Crawl-delay directive if you want to be extra cautious. Most sites see no measurable impact.',
      },
      {
        question: 'If I allow GPTBot, am I opting into AI training?',
        answer:
          'Allowing GPTBot lets OpenAI use your content for both grounding and training. If you only want grounding (citations) without training, you cannot separate them via robots.txt — that is an OpenAI-side policy decision.',
      },
      {
        question: 'Why am I still not cited even though GPTBot is allowed?',
        answer:
          'Crawlability is necessary but not sufficient. You also need strong content, entity signals, and schema markup. Run the AI Visibility Checker to see where you stand and what to fix next.',
      },
    ],
    relatedSlugs: ['robots-txt-tester', 'claudebot-checker', 'ai-visibility-checker'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Check GPTBot Access',
    resultsIntro: 'GPTBot status for your site:',
  },
  {
    slug: 'claudebot-checker',
    name: 'ClaudeBot Checker',
    tagline: 'Can Anthropic crawl your site?',
    description:
      'Check whether ClaudeBot (Anthropic\'s crawler that powers Claude) can crawl your site. Get the exact robots.txt rule and a fix if blocked. Free, no signup.',
    longDescription:
      'ClaudeBot is Anthropic\'s web crawler used to ground Claude\'s answers and to collect training data. If ClaudeBot is blocked, Claude will not cite your content. The ClaudeBot Checker inspects your robots.txt, isolates ClaudeBot-specific rules, and gives you a one-click fix to allow ClaudeBot safely.',
    icon: 'Search',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    status: 'coming-soon',
    category: 'Crawlers',
    metaTitle: 'Free ClaudeBot Checker — Can Anthropic Crawl Your Site? | seosights',
    metaDescription:
      'Free ClaudeBot checker. Find out if Anthropic\'s ClaudeBot can crawl your site, see the exact robots.txt rule, and get a fix if blocked. No signup required.',
    keywords: [
      'claudebot checker',
      'anthropic crawler',
      'claude crawl',
      'claudebot robots.txt',
      'is claudebot blocked',
      'free claudebot tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL',
        description:
          'We fetch your robots.txt and look for User-agent: ClaudeBot and anthropic-ai rules. Either can block Claude independently.',
      },
      {
        title: 'Verify crawlability',
        description:
          'We check for path-level Disallow rules and known edge-level blocks. Anthropic rotates IPs so we also check for IP-based rate limits.',
      },
      {
        title: 'Get your ClaudeBot status',
        description:
          'Receive a clear Allowed / Blocked verdict, the responsible rule, and a copy-paste fix to allow ClaudeBot without compromising security.',
      },
    ],
    keyBenefits: [
      'Definitive Allowed / Blocked verdict for ClaudeBot',
      'Detects both ClaudeBot and anthropic-ai User-agent rules',
      'Copy-paste robots.txt snippet to safely allow ClaudeBot',
      'Side-by-side comparison with GPTBot and PerplexityBot',
      'Free, instant, no account needed',
    ],
    faq: [
      {
        question: 'What is the difference between ClaudeBot and anthropic-ai?',
        answer:
          'Anthropic uses both User-agent strings. ClaudeBot is the older identifier; anthropic-ai is the newer one. Our checker tests both so you are never surprised by a partial block.',
      },
      {
        question: 'Is ClaudeBot aggressive?',
        answer:
          'ClaudeBot has been reported to crawl aggressively in some periods. You can add a Crawl-delay directive if you notice load. Anthropic respects reasonable rate limits.',
      },
      {
        question: 'If I block ClaudeBot, will Claude still answer questions about me?',
        answer:
          'Claude may still answer questions about you using third-party summaries, but the answers will be less accurate and less likely to cite you directly. Blocking is a trade-off between training-data control and citation visibility.',
      },
      {
        question: 'How is this different from the GPTBot Checker?',
        answer:
          'Each AI vendor uses a different crawler with different rules, IPs, and behaviors. We provide dedicated checkers so you get vendor-specific guidance and fixes, not a generic guess.',
      },
    ],
    relatedSlugs: ['gptbot-checker', 'robots-txt-tester', 'ai-visibility-checker'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Check ClaudeBot Access',
    resultsIntro: 'ClaudeBot status for your site:',
  },
  {
    slug: 'geo-audit',
    name: 'GEO Audit',
    tagline: 'Quick generative engine audit',
    description:
      'Run a free GEO (Generative Engine Optimization) audit. See how your site performs in Google AI Overviews, Perplexity, and Bing Copilot — with actionable fixes.',
    longDescription:
      'GEO (Generative Engine Optimization) is the discipline of getting your content cited inside AI-generated answers. Our free GEO Audit runs a 12-point check covering crawlability, schema, entity clarity, content structure, citation signals, and competitor share — then ranks your top 5 fixes by impact.',
    icon: 'Globe',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free GEO Audit — Generative Engine Optimization Check | seosights',
    metaDescription:
      'Free GEO audit. See how your site performs in Google AI Overviews, Perplexity, and Bing Copilot. 12-point check with actionable fixes. No signup required.',
    keywords: [
      'geo audit',
      'generative engine optimization',
      'google ai overviews',
      'perplexity seo',
      'bing copilot citations',
      'free geo tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL',
        description:
          'We crawl your homepage and up to 10 key pages, looking at technical, content, and entity-level signals.',
      },
      {
        title: 'Run the 12-point GEO check',
        description:
          'We score you on AI crawlability, schema coverage, E-E-A-T signals, entity clarity, citation-worthiness, content structure, and competitor benchmarking.',
      },
      {
        title: 'Get your top 5 fixes',
        description:
          'Receive a prioritized action list ranked by expected impact on AI citation share. Each fix includes a one-paragraph how-to.',
      },
    ],
    keyBenefits: [
      '12-point GEO scoring rubric',
      'Covers Google AI Overviews, Perplexity, and Bing Copilot',
      'Prioritized top-5 fixes with effort estimates',
      'Competitor benchmark included',
      'Free, no signup — full report downloadable as PDF on trial',
    ],
    faq: [
      {
        question: 'What is GEO and how is it different from SEO?',
        answer:
          'SEO targets the classic 10 blue links. GEO targets AI-generated answers — the paragraphs and citations you see in Google AI Overviews, Perplexity, and Bing Copilot. GEO shares many SEO fundamentals but emphasizes entity clarity, citation-worthiness, and structured Q&A content.',
      },
      {
        question: 'Does GEO replace SEO?',
        answer:
          'No. The two work together. seosights runs Three Sights in parallel: SEO (classic), AEO (answer engines like ChatGPT/Claude), and GEO (generative results like AI Overviews). Most sites need all three.',
      },
      {
        question: 'How long until I see GEO results?',
        answer:
          'Citation share typically starts improving 2-4 weeks after you ship the top fixes, because LLMs re-index on a rolling basis. The full effect compounds over 60-90 days.',
      },
      {
        question: 'Can I audit any domain, including competitors?',
        answer:
          'Yes. Enter any public URL. The audit only sees what a crawler can see, so it works equally well on your site or a competitor\'s.',
      },
    ],
    relatedSlugs: ['aeo-audit', 'ai-visibility-checker', 'entity-graph-viewer'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Run My GEO Audit',
    resultsIntro: 'Your GEO audit is ready. Here are your scores and top fixes:',
  },
  {
    slug: 'aeo-audit',
    name: 'AEO Audit',
    tagline: 'Answer engine readiness check',
    description:
      'Run a free AEO (Answer Engine Optimization) audit. See how well ChatGPT, Claude, and Perplexity can answer questions about your topic — and how to fix the gaps.',
    longDescription:
      'AEO (Answer Engine Optimization) focuses on getting cited inside conversational AI assistants like ChatGPT, Claude, and Perplexity. Our free AEO Audit checks your content against the 8 signals answer engines weight most — directness, structure, entity clarity, recency, schema, citations, E-E-A-T, and competitor density — and outputs a prioritized fix list.',
    icon: 'MessageSquare',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free AEO Audit — Answer Engine Optimization Check | seosights',
    metaDescription:
      'Free AEO audit. See how well ChatGPT, Claude, and Perplexity can answer questions about your topic. 8-point check with prioritized fixes. No signup required.',
    keywords: [
      'aeo audit',
      'answer engine optimization',
      'chatgpt seo',
      'claude seo',
      'perplexity seo',
      'free aeo tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL and a sample prompt',
        description:
          'Tell us a question your customers would ask ChatGPT. We use it as the benchmark for your audit.',
      },
      {
        title: 'Run the 8-point AEO check',
        description:
          'We score your content on directness, structure, entity clarity, recency, schema, citation density, E-E-A-T, and competitor share for that prompt.',
      },
      {
        title: 'Get your fix list',
        description:
          'Receive a prioritized list of fixes ranked by impact on answer-engine citation share. Each fix includes a concrete content or technical action.',
      },
    ],
    keyBenefits: [
      '8-point AEO scoring rubric',
      'Covers ChatGPT, Claude, and Perplexity in one run',
      'Benchmark against the actual prompt your customers ask',
      'Prioritized fix list with effort estimates',
      'Free, no signup — full report downloadable on trial',
    ],
    faq: [
      {
        question: 'What is AEO and how is it different from GEO?',
        answer:
          'AEO targets conversational AI assistants (ChatGPT, Claude, Perplexity) where users ask questions in natural language. GEO targets generative search results (Google AI Overviews, Bing Copilot) that appear inside traditional search. The two overlap but use different ranking signals.',
      },
      {
        question: 'What makes content citation-worthy for ChatGPT?',
        answer:
          'Answer engines favor direct, structured answers with clear entities, recent dates, supporting citations, and schema markup. Our audit scores each of these dimensions and shows you exactly where to improve.',
      },
      {
        question: 'How often should I run an AEO audit?',
        answer:
          'Monthly is a good cadence for most sites. Run more frequently if you ship a lot of content or after major algorithm/model updates from OpenAI or Anthropic.',
      },
      {
        question: 'Can I audit specific pages, not just the homepage?',
        answer:
          'Yes. Enter any page URL. The audit analyzes the content and signals on that specific page, which is useful for high-priority landing pages and pillar articles.',
      },
    ],
    relatedSlugs: ['geo-audit', 'ai-visibility-checker', 'schema-generator'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Run My AEO Audit',
    resultsIntro: 'Your AEO audit is ready. Here is your answer-engine readiness score:',
  },
  {
    slug: 'prompt-visibility-checker',
    name: 'Prompt Visibility Checker',
    tagline: 'See how AI answers mention you',
    description:
      'Enter any prompt and see how ChatGPT, Claude, and Perplexity answer it — including whether they cite you, mention your competitors, or skip your topic entirely. Free.',
    longDescription:
      'The Prompt Visibility Checker is the prompt-level version of our AI Visibility Checker. Instead of testing your whole domain, it tests a single prompt and shows you the full answer from each engine, with your brand and your competitors\' brands highlighted. Use it to find the prompts where you are missing and to reverse-engineer what content you need to ship to win them.',
    icon: 'Sparkles',
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    status: 'coming-soon',
    category: 'Visibility',
    metaTitle: 'Free Prompt Visibility Checker — How AI Answers Mention You | seosights',
    metaDescription:
      'Enter any prompt and see how ChatGPT, Claude, and Perplexity answer it. Brand and competitor mentions highlighted. Find the prompts where you are missing. Free.',
    keywords: [
      'prompt visibility',
      'chatgpt prompt test',
      'claude prompt test',
      'ai mention checker',
      'brand mention ai',
      'free prompt tool',
    ],
    howItWorks: [
      {
        title: 'Enter your prompt',
        description:
          'Type the question your customers would ask an AI assistant. Be specific — the more specific the prompt, the more actionable the result.',
      },
      {
        title: 'Add your brand and competitors',
        description:
          'List up to 5 brands (yours + competitors) so we can highlight every mention in each engine\'s answer.',
      },
      {
        title: 'Compare engine answers side by side',
        description:
          'See the full answer from ChatGPT, Claude, and Perplexity with your brand and competitors color-coded. Find out where you are missing and why.',
      },
    ],
    keyBenefits: [
      'Side-by-side answers from ChatGPT, Claude, and Perplexity',
      'Brand + competitor mention highlighting',
      'Identify high-value prompts you are losing',
      'Reverse-engineer the content you need to ship to win',
      'Free, no signup — shareable result URL',
    ],
    faq: [
      {
        question: 'How is this different from the AI Visibility Checker?',
        answer:
          'The AI Visibility Checker tests your whole domain across many prompts and gives a visibility score. The Prompt Visibility Checker tests one specific prompt in depth and shows you the full answer text with brand highlights. Use both together for full coverage.',
      },
      {
        question: 'Can I save and re-run prompts?',
        answer:
          'Yes. Each check produces a shareable URL you can bookmark. Sign up for a free trial to schedule recurring re-checks and get alerts when your share changes.',
      },
      {
        question: 'Why do the engines give different answers?',
        answer:
          'Each engine uses different training data, different retrieval systems, and different ranking signals. The same prompt can produce completely different citations across ChatGPT, Claude, and Perplexity. That is why we show all three side by side.',
      },
      {
        question: 'Can I test prompts in other languages?',
        answer:
          'Yes. The checker works in any language the underlying engines support. Results are returned in the language of the prompt.',
      },
    ],
    relatedSlugs: ['ai-visibility-checker', 'aeo-audit', 'geo-audit'],
    inputLabel: 'Prompt to test',
    inputPlaceholder: 'What is the best CRM for a 20-person agency?',
    ctaText: 'Check Prompt Visibility',
    resultsIntro: 'Here is how each AI engine answered your prompt:',
  },
  {
    slug: 'entity-graph-viewer',
    name: 'Entity Graph Viewer',
    tagline: 'Visualize your entity authority',
    description:
      'See how AI models understand the entities (people, products, concepts) on your site. Free entity graph visualization with authority scores and gap analysis.',
    longDescription:
      'LLMs reason in entities, not keywords. The Entity Graph Viewer shows you the entity graph that AI models build from your site — which entities you are authoritative for, which ones are weak, and which ones your competitors dominate. Use it to plan content that strengthens your entity authority in the topics that matter.',
    icon: 'Network',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
    category: 'Entities',
    metaTitle: 'Free Entity Graph Viewer — Visualize Your Entity Authority | seosights',
    metaDescription:
      'Free entity graph viewer. See how AI models understand the entities on your site. Authority scores, gap analysis, and competitor comparison. No signup required.',
    keywords: [
      'entity graph',
      'entity seo',
      'entity authority',
      'knowledge graph seo',
      'ai entity visualization',
      'free entity tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL',
        description:
          'We crawl your site and extract every entity (person, organization, product, concept) using schema markup, content analysis, and NLP.',
      },
      {
        title: 'Build your entity graph',
        description:
          'Entities become nodes, relationships become edges. We compute an authority score for each entity based on frequency, centrality, and external corroboration.',
      },
      {
        title: 'Find your gaps',
        description:
          'Compare your graph to competitors to see which entities they dominate and which ones you should strengthen. Each gap comes with a content recommendation.',
      },
    ],
    keyBenefits: [
      'Interactive force-directed entity graph',
      'Per-entity authority score (0-100)',
      'Competitor gap analysis with content recommendations',
      'Exports to PNG and JSON for reporting',
      'Free, no signup — full graph interactive in-browser',
    ],
    faq: [
      {
        question: 'What is an entity in SEO?',
        answer:
          'An entity is a discrete, well-defined thing — a person, organization, product, place, or concept — that search engines and LLMs can identify and reason about. Entity SEO focuses on being recognized as the authoritative source for specific entities, rather than ranking for keyword strings.',
      },
      {
        question: 'How is entity authority calculated?',
        answer:
          'We compute authority from on-site signals (frequency, centrality, schema coverage) and off-site signals (Wikipedia, Wikidata, knowledge panel presence, third-party mentions). The result is a 0-100 score per entity.',
      },
      {
        question: 'Why do AI models care about entities?',
        answer:
          'LLMs represent knowledge as entity-relationship graphs. When you are recognized as an authoritative entity, you are far more likely to be cited in answers about that entity. Entity clarity is one of the strongest GEO and AEO signals.',
      },
      {
        question: 'Can I view my competitors\' entity graphs?',
        answer:
          'Yes. Enter any competitor URL to generate their graph. You can overlay your graph on theirs to see exactly where you lead and where you lag.',
      },
    ],
    relatedSlugs: ['schema-generator', 'ai-visibility-checker', 'geo-audit'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Build My Entity Graph',
    resultsIntro: 'Your entity graph is ready. Hover any node to see its authority score:',
  },
  {
    slug: 'chatgpt-rank-checker',
    name: 'ChatGPT Rank Checker',
    tagline: 'Will ChatGPT recommend you first?',
    description:
      'Track exactly where your brand ranks in ChatGPT responses across the prompts your customers actually ask. Per-prompt positions, citation snippets, and weekly deltas — free, no signup.',
    longDescription:
      'ChatGPT is the most-used AI assistant on the planet, but ranking inside its answers is invisible to traditional SEO tools. The ChatGPT Rank Checker runs your target prompts against ChatGPT (GPT-4o family) and reports where your brand appears — first mention, second mention, or absent — side by side with the competitors ChatGPT chose instead. Re-run weekly to see whether your AI-visibility work is moving the needle before your visibility score does.',
    icon: 'Bot',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free ChatGPT Rank Checker — Where Does ChatGPT Rank You? | seosights',
    metaDescription:
      'Free ChatGPT rank checker. See exactly where your brand ranks in ChatGPT responses, per-prompt positions, citation snippets, and competitor share. No signup required.',
    keywords: [
      'chatgpt rank checker',
      'chatgpt seo',
      'chatgpt ranking',
      'chatgpt citation',
      'ai visibility chatgpt',
      'chatgpt rank tracking',
      'free chatgpt tool',
      'gpt-4o rank',
    ],
    howItWorks: [
      {
        title: 'Enter your brand and prompts',
        description:
          'Paste your brand name plus 3-10 prompts your customers would ask ChatGPT. These become your rank tracking set.',
      },
      {
        title: 'We query ChatGPT in real time',
        description:
          'Our agent runs each prompt against ChatGPT (GPT-4o family) and captures the full response with every citation and link.',
      },
      {
        title: 'Get your ChatGPT rank',
        description:
          'Receive a per-prompt position (1st, 2nd, 3rd, mentioned, absent), the exact snippet where you appear, and the competitors ChatGPT chose instead.',
      },
      {
        title: 'Track your weekly trend',
        description:
          'Re-run weekly to see your average rank trend, citation share, and the prompts where you are gaining or losing ground.',
      },
    ],
    keyBenefits: [
      'Per-prompt ChatGPT ranking with exact cited snippet',
      'Competitor citation share side by side',
      'Weekly trend with delta vs. last week',
      'GPT-4o and GPT-4o-mini coverage',
      'Free, no signup — shareable rank report URL',
    ],
    faq: [
      {
        question: 'What does "ChatGPT rank" mean?',
        answer:
          'Your ChatGPT rank is your position in ChatGPT\'s response to a given prompt. First-mentioned brand ranks #1. If you are cited third, you rank #3. If you are not mentioned at all, you are unranked for that prompt.',
      },
      {
        question: 'Can ChatGPT rankings be tracked reliably?',
        answer:
          'Yes, with controls. We run each prompt multiple times and report the modal answer, because ChatGPT responses have minor variance. Use weekly re-runs to spot real trends rather than day-to-day noise.',
      },
      {
        question: 'Which ChatGPT model do you query?',
        answer:
          'We query GPT-4o for primary results and GPT-4o-mini for budget runs. Trial customers can add o1-preview, o1-mini, and custom GPTs.',
      },
      {
        question: 'How is this different from the AI Visibility Checker?',
        answer:
          'The AI Visibility Checker gives you an aggregate 0-100 score across engines. The ChatGPT Rank Checker is engine-specific and prompt-level, showing you exactly where you rank inside ChatGPT for each prompt.',
      },
    ],
    relatedSlugs: ['claude-rank-checker', 'ai-citation-checker', 'prompt-visibility-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Check My ChatGPT Rank',
    resultsIntro: 'Here is where ChatGPT ranks you across your prompts:',
  },
  {
    slug: 'claude-rank-checker',
    name: 'Claude Rank Checker',
    tagline: 'Will Claude cite you first?',
    description:
      'Track exactly where your brand ranks in Claude responses across the prompts your customers actually ask. Per-prompt positions, cited URLs, and weekly deltas — free.',
    longDescription:
      'Claude (Anthropic) is the AI assistant of choice for developers, knowledge workers, and enterprises — and it cites sources differently than ChatGPT. The Claude Rank Checker runs your prompts against Claude (Sonnet and Opus) and reports where you appear in each answer, which URLs Claude chose to cite, and where competitors outrank you. Re-run weekly to track your climb.',
    icon: 'Bot',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Claude Rank Checker — Where Does Claude Rank You? | seosights',
    metaDescription:
      'Free Claude rank checker. See where your brand ranks in Claude responses, per-prompt positions, cited URLs, and competitor share. No signup required.',
    keywords: [
      'claude rank checker',
      'claude seo',
      'claude citation',
      'anthropic visibility',
      'claude rank tracking',
      'free claude tool',
      'ai visibility claude',
      'claude sonnet rank',
    ],
    howItWorks: [
      {
        title: 'Enter your brand and prompts',
        description:
          'Paste your brand name plus 3-10 prompts your customers would ask Claude. These become your rank tracking set.',
      },
      {
        title: 'We query Claude in real time',
        description:
          'Our agent runs each prompt against Claude (Sonnet) and captures the full response with every citation.',
      },
      {
        title: 'Get your Claude rank',
        description:
          'Receive per-prompt positions, the exact snippet Claude cited, the URL it linked to, and which competitors Claude preferred instead.',
      },
      {
        title: 'Track your weekly trend',
        description:
          'Re-run weekly to monitor your average rank, citation share, and which prompts you are winning or losing.',
      },
    ],
    keyBenefits: [
      'Per-prompt Claude ranking with cited URL',
      'Competitor share side by side',
      'Weekly trend with delta vs. last week',
      'Sonnet + Opus coverage',
      'Free, no signup — shareable rank report URL',
    ],
    faq: [
      {
        question: 'Why does Claude cite differently than ChatGPT?',
        answer:
          'Claude emphasizes source provenance and tends to cite primary sources (Wikipedia, vendor docs, peer-reviewed content). ChatGPT leans more on community and review sources. That is why your rank can differ wildly between the two engines for the same prompt.',
      },
      {
        question: 'Do you query Claude Sonnet or Opus?',
        answer:
          'Default is Sonnet (the model most Claude users get). Trial customers can switch to Opus and to new Claude models as they ship.',
      },
      {
        question: 'Why is my Claude rank lower than my ChatGPT rank?',
        answer:
          'Usually because Claude favors sources with stronger entity authority (Wikipedia, Wikidata, peer-reviewed). Run the Entity Gap Analyzer to see which entity signals you are missing for Claude specifically.',
      },
      {
        question: 'Can I track competitor ranks in Claude too?',
        answer:
          'Yes. Add up to 5 competitor brands and we will show their rank in every prompt side by side with yours.',
      },
    ],
    relatedSlugs: ['chatgpt-rank-checker', 'gemini-rank-checker', 'ai-citation-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Check My Claude Rank',
    resultsIntro: 'Here is where Claude ranks you across your prompts:',
  },
  {
    slug: 'gemini-rank-checker',
    name: 'Gemini Rank Checker',
    tagline: 'Will Gemini surface you?',
    description:
      'Track exactly where your brand ranks in Google Gemini responses across the prompts your customers actually ask. Per-prompt positions, cited URLs, and weekly deltas — free.',
    longDescription:
      'Gemini is Google\'s flagship AI assistant and the engine behind many AI Overviews. Ranking in Gemini is a strong leading indicator for Google AI Overviews visibility. The Gemini Rank Checker runs your prompts against Gemini Advanced and reports where you appear, which Google-chosen sources it cites, and how that compares to last week.',
    icon: 'Sparkles',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Gemini Rank Checker — Where Does Gemini Rank You? | seosights',
    metaDescription:
      'Free Gemini rank checker. See where your brand ranks in Google Gemini responses, cited URLs, competitor share, and weekly trends. No signup required.',
    keywords: [
      'gemini rank checker',
      'gemini seo',
      'google gemini citation',
      'gemini rank tracking',
      'ai visibility gemini',
      'free gemini tool',
      'gemini advanced rank',
    ],
    howItWorks: [
      {
        title: 'Enter your brand and prompts',
        description:
          'Paste your brand name plus 3-10 prompts your customers would ask Gemini.',
      },
      {
        title: 'We query Gemini in real time',
        description:
          'Our agent runs each prompt against Gemini Advanced and captures the full response with citations.',
      },
      {
        title: 'Get your Gemini rank',
        description:
          'Receive per-prompt positions, the cited URL Gemini chose, and which competitors Gemini preferred.',
      },
      {
        title: 'Track your weekly trend',
        description:
          'Re-run weekly to monitor your average rank, citation share, and which prompts you are winning or losing.',
      },
    ],
    keyBenefits: [
      'Per-prompt Gemini ranking with cited URL',
      'Leading indicator for Google AI Overviews',
      'Competitor share side by side',
      'Weekly trend with delta vs. last week',
      'Free, no signup — shareable rank report URL',
    ],
    faq: [
      {
        question: 'How is Gemini different from Google AI Overviews?',
        answer:
          'Gemini is Google\'s standalone AI assistant (gemini.google.com). AI Overviews are the AI-generated summaries that appear at the top of Google Search. They share underlying signals but appear on different surfaces. Ranking well in Gemini often predicts AI Overviews gains 2-4 weeks later.',
      },
      {
        question: 'Does allowing Google-Extended affect my Gemini rank?',
        answer:
          'Yes. Google-Extended is the User-agent Google uses for Gemini and AI Overviews. If it is blocked, Gemini cannot use your content as a grounding source. Run the Robots.txt Tester to verify.',
      },
      {
        question: 'Why am I ranking in ChatGPT but not Gemini?',
        answer:
          'Gemini leans heavily on Google\'s traditional ranking signals (links, freshness, E-E-A-T) while ChatGPT leans on training-data prominence. Strengthen your classic SEO to lift Gemini rank.',
      },
      {
        question: 'Can I track Gemini in non-English prompts?',
        answer:
          'Yes. We support all languages Gemini supports. Multi-language tracking is available on the trial.',
      },
    ],
    relatedSlugs: ['perplexity-rank-checker', 'chatgpt-rank-checker', 'ai-visibility-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Check My Gemini Rank',
    resultsIntro: 'Here is where Gemini ranks you across your prompts:',
  },
  {
    slug: 'perplexity-rank-checker',
    name: 'Perplexity Rank Checker',
    tagline: 'Will Perplexity cite you?',
    description:
      'Track exactly where your brand ranks in Perplexity responses. Per-prompt positions, cited URLs, and weekly deltas — free, no signup.',
    longDescription:
      'Perplexity is the answer engine that puts citations front and center — every claim links to a source. Ranking well in Perplexity means being the source users click through to. The Perplexity Rank Checker runs your prompts against Perplexity (Sonar) and reports your position, your cited URL, and which competitors Perplexity chose over you.',
    icon: 'Search',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Perplexity Rank Checker — Where Does Perplexity Cite You? | seosights',
    metaDescription:
      'Free Perplexity rank checker. See where your brand ranks in Perplexity answers, your cited URLs, competitor share, and weekly trends. No signup required.',
    keywords: [
      'perplexity rank checker',
      'perplexity seo',
      'perplexity citation',
      'perplexity rank tracking',
      'ai visibility perplexity',
      'free perplexity tool',
      'sonar rank',
    ],
    howItWorks: [
      {
        title: 'Enter your brand and prompts',
        description:
          'Paste your brand name plus 3-10 prompts your customers would ask Perplexity.',
      },
      {
        title: 'We query Perplexity in real time',
        description:
          'Our agent runs each prompt against Perplexity (Sonar) and captures the full response with all citations.',
      },
      {
        title: 'Get your Perplexity rank',
        description:
          'Receive per-prompt positions, your cited URL, and the competitors Perplexity chose instead.',
      },
      {
        title: 'Track your weekly trend',
        description:
          'Re-run weekly to monitor your average rank and which prompts are gaining or losing.',
      },
    ],
    keyBenefits: [
      'Per-prompt Perplexity ranking with cited URL',
      'Identifies "click-through magnet" prompts where you are #1',
      'Competitor share side by side',
      'Weekly trend with delta vs. last week',
      'Free, no signup — shareable rank report URL',
    ],
    faq: [
      {
        question: 'Why is Perplexity different from ChatGPT and Claude?',
        answer:
          'Perplexity is a search-first answer engine. Every claim it makes is linked to a real web source. That means ranking in Perplexity drives direct referral traffic, not just brand exposure — something ChatGPT and Claude rarely generate.',
      },
      {
        question: 'What is Perplexity Sonar?',
        answer:
          'Sonar is Perplexity\'s in-house LLM that powers its answer generation. It blends a retrieval system (live web search) with an LLM, so freshness and crawlability matter more for Perplexity than for ChatGPT or Claude.',
      },
      {
        question: 'Can Perplexity send real traffic to my site?',
        answer:
          'Yes. Perplexity users click cited sources frequently, especially for research queries. Top-cited sites in Perplexity see measurable referral traffic, unlike ChatGPT or Claude which rarely generate clicks.',
      },
      {
        question: 'Why do I rank differently on Perplexity Pro vs Free?',
        answer:
          'Perplexity Pro uses a more powerful Sonar variant with deeper retrieval. We default to Pro-style results for trial customers and Free results otherwise.',
      },
    ],
    relatedSlugs: ['chatgpt-rank-checker', 'ai-citation-checker', 'copilot-rank-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Check My Perplexity Rank',
    resultsIntro: 'Here is where Perplexity ranks you across your prompts:',
  },
  {
    slug: 'copilot-rank-checker',
    name: 'Microsoft Copilot Rank Checker',
    tagline: 'Will Copilot recommend you at work?',
    description:
      'Track exactly where your brand ranks in Microsoft Copilot responses. Per-prompt positions, cited sources, and weekly deltas — free, no signup.',
    longDescription:
      'Microsoft Copilot powers AI answers inside Bing, Edge, Windows, and Microsoft 365 — reaching hundreds of millions of users at work. The Copilot Rank Checker runs your prompts against Copilot (GPT-4 powered, Bing-grounded) and reports where you appear, which sources Copilot cites, and how your rank changes week over week.',
    icon: 'MessageSquare',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Microsoft Copilot Rank Checker — Where Does Copilot Rank You? | seosights',
    metaDescription:
      'Free Microsoft Copilot rank checker. See where your brand ranks in Copilot responses, cited sources, competitor share, and weekly trends. No signup required.',
    keywords: [
      'copilot rank checker',
      'microsoft copilot seo',
      'bing copilot citation',
      'copilot rank tracking',
      'ai visibility copilot',
      'free copilot tool',
      'm365 copilot rank',
    ],
    howItWorks: [
      {
        title: 'Enter your brand and prompts',
        description:
          'Paste your brand name plus 3-10 prompts your customers would ask Copilot.',
      },
      {
        title: 'We query Copilot in real time',
        description:
          'Our agent runs each prompt against Microsoft Copilot (Bing-powered) and captures the full response with citations.',
      },
      {
        title: 'Get your Copilot rank',
        description:
          'Receive per-prompt positions, the source Copilot cited, and which competitors Copilot preferred.',
      },
      {
        title: 'Track your weekly trend',
        description:
          'Re-run weekly to monitor your average rank and competitor share.',
      },
    ],
    keyBenefits: [
      'Per-prompt Copilot ranking with cited source',
      'Critical for B2B reach (Copilot is the default AI at work)',
      'Competitor share side by side',
      'Weekly trend with delta vs. last week',
      'Free, no signup — shareable rank report URL',
    ],
    faq: [
      {
        question: 'Where does Copilot\'s data come from?',
        answer:
          'Microsoft Copilot combines GPT-4 with Bing\'s search index. That means classic Bing SEO (well-structured pages, fresh content, strong links) directly impacts your Copilot rank.',
      },
      {
        question: 'Is Copilot important if I already track ChatGPT?',
        answer:
          'Yes. Copilot is the default AI assistant in Windows, Edge, and Microsoft 365 — so it dominates at-work queries. For B2B brands, Copilot rank often matters more than ChatGPT rank.',
      },
      {
        question: 'Why does my Copilot rank differ from my Bing search rank?',
        answer:
          'Copilot doesn\'t just pull the top Bing result. It synthesizes an answer from multiple sources and weighs authority, recency, and citation density differently than the Bing SERP.',
      },
      {
        question: 'Can I track Copilot for Enterprise queries?',
        answer:
          'Yes. We support Copilot for Microsoft 365 prompts (work context) on the trial plan. The free tool covers public Copilot (consumer).',
      },
    ],
    relatedSlugs: ['perplexity-rank-checker', 'chatgpt-rank-checker', 'gemini-rank-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Check My Copilot Rank',
    resultsIntro: 'Here is where Microsoft Copilot ranks you across your prompts:',
  },
  {
    slug: 'ai-citation-checker',
    name: 'AI Citation Checker',
    tagline: 'Will AI cite you as a source?',
    description:
      'See every place ChatGPT, Claude, Gemini, and Perplexity cite you as a source — with the exact cited URL, snippet, and source context. Free, no signup.',
    longDescription:
      'AI citations are the new backlinks. Each one is a vote of authority that drives traffic, trust, and downstream SEO. The AI Citation Checker scans the four major answer engines for your domain and returns every citation we can find — the URL the engine linked to, the surrounding snippet, and the prompt that triggered it. Use it to find your most-cited pages and your biggest citation gaps.',
    icon: 'Link2',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free AI Citation Checker — Who Cites You Across AI Engines? | seosights',
    metaDescription:
      'Free AI citation checker. See every place ChatGPT, Claude, Gemini, and Perplexity cite you. Cited URL, snippet, and source context. No signup required.',
    keywords: [
      'ai citation checker',
      'chatgpt citation',
      'claude citation',
      'gemini citation',
      'perplexity citation',
      'ai backlinks',
      'free citation tool',
      'ai link checker',
    ],
    howItWorks: [
      {
        title: 'Enter your domain',
        description:
          'Paste your root domain. We will discover your most-cited pages across all four major AI engines.',
      },
      {
        title: 'We scan engine indexes',
        description:
          'Our agent probes ChatGPT, Claude, Gemini, and Perplexity with topic prompts relevant to your content to surface every citation of your domain.',
      },
      {
        title: 'See every citation',
        description:
          'Get a per-engine list of cited URLs with the surrounding snippet, the prompt that triggered it, and the source page\'s authority score.',
      },
      {
        title: 'Find your citation gaps',
        description:
          'Compare your citations to competitors and identify the engines and prompts where you are missing.',
      },
    ],
    keyBenefits: [
      'Per-engine citation inventory (ChatGPT, Claude, Gemini, Perplexity)',
      'Exact cited URL + snippet for every citation',
      'Per-page authority score on cited URLs',
      'Citation gap analysis vs. competitors',
      'Free, no signup — full list downloadable on trial',
    ],
    faq: [
      {
        question: 'What counts as an AI citation?',
        answer:
          'An AI citation is any time an AI answer engine explicitly links to or names your domain as a source. A brand mention without a link does not count — use the Brand Mention Scanner for those.',
      },
      {
        question: 'How is this different from a backlink checker?',
        answer:
          'Traditional backlink checkers (Ahrefs, Semrush) track hyperlinks across the web. The AI Citation Checker tracks citations inside AI-generated answers, which are invisible to those tools but increasingly drive traffic and trust.',
      },
      {
        question: 'Why do I see fewer citations than mentions?',
        answer:
          'Mentions are easier to earn than citations. Engines often mention brands based on training data but only cite sources that are crawlable, structured, and authoritative. Run the AEO Audit to fix citation-blocking issues.',
      },
      {
        question: 'Can I track citations over time?',
        answer:
          'Yes. The free tool gives you a snapshot. The trial unlocks weekly tracking with alerts when new citations appear or old ones disappear.',
      },
    ],
    relatedSlugs: ['brand-mention-scanner', 'citation-velocity-tracker', 'ai-competitor-citation-report'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Check My AI Citations',
    resultsIntro: 'Here are the AI engines and pages that cite you:',
  },
  {
    slug: 'brand-mention-scanner',
    name: 'Brand Mention Scanner',
    tagline: 'Find every AI mention of your brand',
    description:
      'Discover every time ChatGPT, Claude, Gemini, and Perplexity mention your brand — even when they do not link to you. Free, no signup.',
    longDescription:
      'AI engines mention brands far more often than they cite them. A mention shapes how users perceive you even without a link. The Brand Mention Scanner runs hundreds of relevant prompts across the four major engines and surfaces every mention of your brand — with surrounding context, sentiment, and whether the mention came with a citation or stood alone.',
    icon: 'Search',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Brand Mention Scanner — Find Every AI Mention | seosights',
    metaDescription:
      'Free AI brand mention scanner. See every time ChatGPT, Claude, Gemini, and Perplexity mention your brand, with context and sentiment. No signup required.',
    keywords: [
      'ai brand mention',
      'brand mention scanner',
      'chatgpt brand mention',
      'claude brand mention',
      'ai sentiment',
      'free mention tool',
      'ai mention tracking',
    ],
    howItWorks: [
      {
        title: 'Enter your brand name and variations',
        description:
          'Include common misspellings, acronyms, and parent/sub-brand names so we catch every mention.',
      },
      {
        title: 'We run topic-relevant prompts',
        description:
          'Our agent generates hundreds of prompts relevant to your category and runs them across ChatGPT, Claude, Gemini, and Perplexity.',
      },
      {
        title: 'Surface every mention',
        description:
          'Get a per-engine list of every prompt that mentioned you, with the surrounding context, sentiment, and whether it included a citation.',
      },
      {
        title: 'Compare mentions vs. citations',
        description:
          'See where you are mentioned but not cited — the easiest wins for AI visibility.',
      },
    ],
    keyBenefits: [
      'Per-engine mention inventory across 4 major engines',
      'Sentiment and context for every mention',
      'Distinguishes cited mentions from uncited mentions',
      'Topic-cluster view shows which categories you dominate',
      'Free, no signup — shareable report URL',
    ],
    faq: [
      {
        question: 'What is the difference between a mention and a citation?',
        answer:
          'A citation is an explicit link or named source attribution. A mention is when the engine references your brand in prose without linking. Mentions build brand awareness; citations drive traffic and authority.',
      },
      {
        question: 'Why do mentions matter if they do not link?',
        answer:
          'Mentions shape how AI engines describe you. Negative or inaccurate mentions compound over time as the engines re-train on each other. The scanner helps you spot and correct mischaracterizations before they spread.',
      },
      {
        question: 'Can I track sentiment?',
        answer:
          'Yes. Every mention is scored positive, neutral, or negative. The trial unlocks sentiment trend alerts.',
      },
      {
        question: 'How do you handle brand name collisions?',
        answer:
          'Enter context (industry, URL, parent company) and we filter out unrelated mentions. We show you borderline cases for manual review.',
      },
    ],
    relatedSlugs: ['ai-citation-checker', 'citation-velocity-tracker', 'prompt-visibility-checker'],
    inputLabel: 'Your brand name',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Scan My AI Mentions',
    resultsIntro: 'Here is every AI mention of your brand across engines:',
  },
  {
    slug: 'ai-snippet-tester',
    name: 'AI Snippet Tester',
    tagline: 'Will your content become an AI snippet?',
    description:
      'Test whether your pages get featured as AI-cited snippets and see exactly which paragraph each AI engine would quote. Free, no signup.',
    longDescription:
      'When AI engines cite you, they quote a specific paragraph — your AI snippet. The wrong paragraph (marketing fluff, jargon, no clear answer) gets skipped even when your page ranks. The AI Snippet Tester feeds your page to our snippet-extraction model (trained on how ChatGPT, Claude, and Perplexity actually pull quotes) and shows you the paragraph they would cite, plus a rewrite to make it more snippet-worthy.',
    icon: 'Quote',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free AI Snippet Tester — Will Your Content Become an AI Snippet? | seosights',
    metaDescription:
      'Free AI snippet tester. See exactly which paragraph ChatGPT, Claude, and Perplexity would quote from your page, with rewrites to win more citations. No signup.',
    keywords: [
      'ai snippet',
      'snippet tester',
      'chatgpt snippet',
      'ai citation snippet',
      'ai featured snippet',
      'snippet optimization',
      'free snippet tool',
    ],
    howItWorks: [
      {
        title: 'Paste your page URL or content',
        description:
          'We fetch the page (or accept pasted text) and split it into candidate paragraphs.',
      },
      {
        title: 'We simulate AI snippet extraction',
        description:
          'Our model mimics how ChatGPT, Claude, and Perplexity select quote-worthy paragraphs — based on directness, structure, and answer-completeness.',
      },
      {
        title: 'See your winning paragraph',
        description:
          'We show you the paragraph each engine would most likely cite, with a confidence score.',
      },
      {
        title: 'Get a snippet rewrite',
        description:
          'For each engine we provide a tighter, more quotable rewrite that boosts your citation odds.',
      },
    ],
    keyBenefits: [
      'Per-engine snippet prediction (ChatGPT, Claude, Perplexity)',
      'Confidence score on every candidate paragraph',
      'AI-written rewrite that boosts quotability',
      'Detects pages with no snippet-worthy paragraph (a citation killer)',
      'Free, no signup — shareable result URL',
    ],
    faq: [
      {
        question: 'What makes a paragraph snippet-worthy?',
        answer:
          'AI engines prefer paragraphs that directly answer a question in 1-3 sentences, use simple language, contain a specific entity or number, and avoid first-person marketing voice. The tester scores each of these factors.',
      },
      {
        question: 'Can I test competitor pages?',
        answer:
          'Yes. Paste any URL. Comparing your winning paragraph to a competitor\'s is one of the fastest ways to find content gaps.',
      },
      {
        question: 'Why does my page rank well in Google but get no AI citations?',
        answer:
          'Often because the page lacks a quotable paragraph. Traditional SEO rewards comprehensiveness; AI citations reward a single, self-contained answer sentence. The tester shows you exactly where to add one.',
      },
      {
        question: 'How is this different from featured snippet testing?',
        answer:
          'Google featured snippets target search results. AI snippets target conversational answer engines. The selection logic differs — AI engines prefer more natural, less list-heavy paragraphs.',
      },
    ],
    relatedSlugs: ['answer-format-checker', 'ai-content-readability-checker', 'prompt-visibility-checker'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/crm-buying-guide',
    ctaText: 'Test My AI Snippet',
    resultsIntro: 'Here is the paragraph each AI engine would quote:',
  },
  {
    slug: 'citation-velocity-tracker',
    name: 'Citation Velocity Tracker',
    tagline: 'Is your AI authority growing?',
    description:
      'Track how fast your AI citations are growing across ChatGPT, Claude, Gemini, and Perplexity — week over week, with new and lost citations. Free.',
    longDescription:
      'Citation velocity is the leading indicator of AI visibility growth. A site that gains 10 new AI citations this week is almost certain to climb in visibility score next month. The Citation Velocity Tracker monitors your citation count across all four major engines and reports new citations, lost citations, and net velocity — so you know whether your AI-visibility work is compounding before your score moves.',
    icon: 'TrendingUp',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'live',
    category: 'Visibility',
    metaTitle: 'Free Citation Velocity Tracker — AI Citation Growth | seosights',
    metaDescription:
      'Free citation velocity tracker. See how fast your AI citations are growing across ChatGPT, Claude, Gemini, and Perplexity. New, lost, and net citations weekly. No signup.',
    keywords: [
      'citation velocity',
      'ai citation tracking',
      'ai citation growth',
      'chatgpt citation tracking',
      'ai visibility trend',
      'free citation tracker',
      'ai citation velocity',
    ],
    howItWorks: [
      {
        title: 'Enter your domain',
        description:
          'We pull your existing citation baseline from the AI Citation Checker engine.',
      },
      {
        title: 'We re-scan weekly',
        description:
          'Every week we re-probe ChatGPT, Claude, Gemini, and Perplexity for new and lost citations of your domain.',
      },
      {
        title: 'See your velocity',
        description:
          'Get a week-over-week chart of new citations, lost citations, and net velocity per engine.',
      },
      {
        title: 'Spot the cause',
        description:
          'For each major change we link to the prompt that triggered it, so you can trace velocity to a specific content win or loss.',
      },
    ],
    keyBenefits: [
      'Weekly new / lost / net citation chart per engine',
      'Combined velocity score across all 4 engines',
      'Per-event prompt attribution (what triggered the change)',
      'Alerts when velocity drops or spikes (trial)',
      'Free, no signup — shareable trend URL',
    ],
    faq: [
      {
        question: 'What is a healthy citation velocity?',
        answer:
          'It depends on your category, but in general any positive net velocity week-over-week means your AI visibility is growing. Sites with strong GEO programs typically see 5-15 new citations per week within 60 days of starting.',
      },
      {
        question: 'Why did I lose citations this week?',
        answer:
          'Lost citations usually come from one of three causes: the engine updated its model, a competitor published stronger content, or your page changed (especially the H1 or first paragraph). We attribute each loss to the most likely cause.',
      },
      {
        question: 'Can I track competitor velocity?',
        answer:
          'Yes. Add up to 5 competitors on the trial plan. Comparing velocity side by side is the fastest way to spot who is winning the AI visibility race in your category.',
      },
      {
        question: 'How is velocity different from visibility score?',
        answer:
          'Velocity is the rate of change. Visibility score is the absolute level. A site can have a high score but flat velocity (stalled) or a low score but high velocity (about to break out). Track both.',
      },
    ],
    relatedSlugs: ['ai-citation-checker', 'ai-visibility-forecast', 'ai-competitor-citation-report'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Track My Citation Velocity',
    resultsIntro: 'Here is how your AI citations are growing week over week:',
  },
  {
    slug: 'entity-finder',
    name: 'Entity Finder',
    tagline: 'What does AI think you are?',
    description:
      'Discover every entity (person, product, concept, place) that AI engines associate with your brand — with confidence scores and source pages. Free.',
    longDescription:
      'LLMs reason in entities, not keywords. When ChatGPT thinks of your brand, it activates a cluster of related entities — your founder, your category, your competitors, your features. The Entity Finder crawls your site and cross-references the four major AI engines to surface every entity they associate with you, ranked by confidence. Use it to find entity gaps and contradictions that hurt your AI visibility.',
    icon: 'Network',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'live',
    category: 'Entities',
    metaTitle: 'Free Entity Finder — What Entities Does AI Associate With You? | seosights',
    metaDescription:
      'Free entity finder. Discover every entity AI engines associate with your brand — people, products, concepts, places — with confidence scores. No signup required.',
    keywords: [
      'entity finder',
      'ai entity',
      'entity seo',
      'brand entity',
      'knowledge graph entity',
      'ai association',
      'free entity tool',
      'llm entity',
    ],
    howItWorks: [
      {
        title: 'Enter your domain or brand',
        description:
          'We crawl your site and extract candidate entities from schema, content, and links.',
      },
      {
        title: 'Cross-reference with AI engines',
        description:
          'We probe ChatGPT, Claude, Gemini, and Perplexity with brand-related prompts to capture every entity they associate with you.',
      },
      {
        title: 'See your entity map',
        description:
          'Get a ranked list of associated entities with confidence scores and the source pages or prompts that triggered them.',
      },
      {
        title: 'Spot contradictions',
        description:
          'Find entities AI wrongly associates with you (a competitor\'s product, an outdated feature) so you can correct them.',
      },
    ],
    keyBenefits: [
      'Per-entity confidence score across 4 engines',
      'Identifies wrongly-associated entities (a major AI visibility drag)',
      'Source attribution for every entity',
      'Entity category breakdown (person, org, product, concept, place)',
      'Free, no signup — full entity map in-browser',
    ],
    faq: [
      {
        question: 'What is an entity association?',
        answer:
          'An entity association is when an AI engine links your brand to another entity in its internal knowledge graph. For example, "Acme CRM" might be associated with the entities "SaaS", "sales software", and "Acme Inc.".',
      },
      {
        question: 'Why do wrong entity associations hurt me?',
        answer:
          'If AI engines associate you with the wrong category (e.g., calling a B2B tool a "consumer app"), they will not recommend you for the right prompts. Fixing wrong associations is one of the highest-leverage AI visibility moves.',
      },
      {
        question: 'How do you fix a wrong association?',
        answer:
          'By publishing content that explicitly clarifies your category and entities, adding schema markup, and getting mentioned in authoritative sources (Wikipedia, G2, industry publications) with the correct framing. The Entity Gap Analyzer shows you which sources to target.',
      },
      {
        question: 'Can I find entities for competitors?',
        answer:
          'Yes. Run the tool on any competitor domain to see their entity map and compare it to yours.',
      },
    ],
    relatedSlugs: ['entity-gap-analyzer', 'ai-authority-score', 'knowledge-graph-explorer'],
    inputLabel: 'Your website URL or brand name',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Find My Entities',
    resultsIntro: 'Here are the entities AI engines associate with you:',
  },
  {
    slug: 'entity-gap-analyzer',
    name: 'Entity Gap Analyzer',
    tagline: 'Which entities do competitors own that you don\'t?',
    description:
      'Find the entities your competitors are associated with in AI engines that you are missing — with a content plan to close each gap. Free.',
    longDescription:
      'The fastest way to grow AI visibility is to close entity gaps — entities your competitors are known for that AI engines do not yet associate with you. The Entity Gap Analyzer compares your entity map to up to 5 competitors and surfaces the gaps that matter most, ranked by how often those entities appear in AI answers in your category.',
    icon: 'Target',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'live',
    category: 'Entities',
    metaTitle: 'Free Entity Gap Analyzer — Close Your Entity Gaps | seosights',
    metaDescription:
      'Free entity gap analyzer. Find entities your competitors are associated with in AI engines that you are missing, with a content plan to close each gap. No signup.',
    keywords: [
      'entity gap',
      'entity gap analysis',
      'competitor entities',
      'ai entity gap',
      'entity seo',
      'free entity tool',
      'ai visibility gap',
    ],
    howItWorks: [
      {
        title: 'Enter your domain and 1-5 competitors',
        description:
          'We extract each entity map using the Entity Finder engine.',
      },
      {
        title: 'Diff the entity graphs',
        description:
          'We compute entities competitors have that you do not, ranked by frequency in AI answers for your category.',
      },
      {
        title: 'Score each gap',
        description:
          'Each gap gets an impact score based on how often it appears in AI citations and how weak your current association is.',
      },
      {
        title: 'Get a content plan',
        description:
          'For each high-impact gap we recommend a content asset (article, schema, landing page) and the source you should get mentioned on.',
      },
    ],
    keyBenefits: [
      'Side-by-side entity gap diff vs. up to 5 competitors',
      'Per-gap impact score (frequency × weakness)',
      'Content plan per gap (asset type + target source)',
      'Identifies "free wins" (low-effort, high-impact gaps)',
      'Free, no signup — full gap report downloadable on trial',
    ],
    faq: [
      {
        question: 'What is an entity gap?',
        answer:
          'An entity gap is an entity your competitors are associated with in AI engines that you are not. Closing it means publishing content (and getting cited in authoritative sources) that establishes your association with that entity.',
      },
      {
        question: 'How long does it take to close an entity gap?',
        answer:
          'Most gaps close in 30-60 days after you ship the recommended content and schema. High-authority competitors\' gaps may take 90+ days.',
      },
      {
        question: 'Can I prioritize by impact?',
        answer:
          'Yes. Each gap is scored on frequency in AI answers and how weak your current association is. The analyzer surfaces the top 5 gaps to close first for fastest visibility gain.',
      },
      {
        question: 'Do I need schema markup to close gaps?',
        answer:
          'Not always, but it accelerates the process. Schema makes entities explicit and machine-readable. The AI Schema Generator produces entity-rich schema tuned for this purpose.',
      },
    ],
    relatedSlugs: ['entity-finder', 'ai-authority-score', 'ai-opportunity-finder'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Find My Entity Gaps',
    resultsIntro: 'Here are the entities your competitors own that you don\'t:',
  },
  {
    slug: 'ai-authority-score',
    name: 'AI Authority Score',
    tagline: 'How authoritative is your entity to AI?',
    description:
      'Get a 0-100 AI Authority Score that measures how strongly AI engines recognize you as an authoritative source for your category. Free, no signup.',
    longDescription:
      'AI Authority Score is the entity-level equivalent of domain authority — but for AI engines. It measures how strongly ChatGPT, Claude, Gemini, and Perplexity recognize you as authoritative for the entities that matter in your category. The score blends on-site signals (schema, content depth, entity clarity) with off-site signals (Wikipedia, Wikidata, knowledge panel, third-party mentions) into a single 0-100 number.',
    icon: 'Gauge',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    status: 'live',
    category: 'Entities',
    metaTitle: 'Free AI Authority Score — How Authoritative Are You to AI? | seosights',
    metaDescription:
      'Free AI Authority Score. Get a 0-100 score measuring how strongly ChatGPT, Claude, Gemini, and Perplexity recognize you as authoritative. No signup required.',
    keywords: [
      'ai authority score',
      'ai authority',
      'entity authority',
      'ai domain authority',
      'chatgpt authority',
      'ai visibility score',
      'free authority tool',
    ],
    howItWorks: [
      {
        title: 'Enter your domain and primary entity',
        description:
          'Tell us the entity (your brand, product, or topic) you want to be authoritative for.',
      },
      {
        title: 'We score 12 authority signals',
        description:
          'On-site (schema, content depth, entity clarity, internal linking) and off-site (Wikipedia, Wikidata, knowledge panel, third-party mentions, review sites, news, forums).',
      },
      {
        title: 'Compute your 0-100 score',
        description:
          'Each signal is weighted by its observed impact on AI citation frequency. The weighted sum is your AI Authority Score.',
      },
      {
        title: 'See your top 5 fixes',
        description:
          'Each fix is ranked by expected score lift and includes a one-paragraph how-to.',
      },
    ],
    keyBenefits: [
      'Single 0-100 AI Authority Score',
      'Per-signal subscore with weight explanation',
      'Competitor authority score side by side',
      'Top 5 fixes ranked by expected score lift',
      'Free, no signup — shareable score URL',
    ],
    faq: [
      {
        question: 'How is AI Authority Score different from domain authority?',
        answer:
          'Domain authority (Moz, Ahrefs) measures classic SEO strength based on backlinks. AI Authority Score measures how strongly AI engines recognize your entity authority — based on schema, knowledge graph presence, and citation frequency, not just links.',
      },
      {
        question: 'What is a good AI Authority Score?',
        answer:
          '70+ means AI engines strongly recognize you as authoritative in your category. 50-70 means you are recognized but competitors outrank you. Below 50 means you are largely invisible to AI engines.',
      },
      {
        question: 'Why does my AI Authority Score differ from my visibility score?',
        answer:
          'Authority measures your underlying entity strength. Visibility measures how often AI engines actually cite you. A high-authority site with poor crawlability may have low visibility — and vice versa.',
      },
      {
        question: 'How often should I re-check?',
        answer:
          'Monthly. Authority moves slowly (30-90 days) compared to visibility (weekly). Use the Citation Velocity Tracker for weekly tracking.',
      },
    ],
    relatedSlugs: ['entity-finder', 'ai-visibility-checker', 'knowledge-graph-explorer'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Get My AI Authority Score',
    resultsIntro: 'Your AI Authority Score is ready. Here is your breakdown:',
  },
  {
    slug: 'knowledge-graph-explorer',
    name: 'Knowledge Graph Explorer',
    tagline: 'How does Google\'s Knowledge Graph see you?',
    description:
      'See your Google Knowledge Graph presence — entities, properties, related nodes, and gaps that block AI engines from recognizing you. Free.',
    longDescription:
      'Google\'s Knowledge Graph is the structured database that powers Gemini, AI Overviews, and rich results. If your brand is not properly represented in it, AI engines cannot ground their answers in your authority. The Knowledge Graph Explorer queries the Knowledge Graph API for your entities and shows you exactly what Google knows — and what it is missing.',
    icon: 'Network',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'coming-soon',
    category: 'Entities',
    metaTitle: 'Free Knowledge Graph Explorer — See Your Google KG Presence | seosights',
    metaDescription:
      'Free Google Knowledge Graph explorer. See your entities, properties, related nodes, and gaps that block AI engines. No signup required.',
    keywords: [
      'knowledge graph explorer',
      'google knowledge graph',
      'knowledge panel',
      'kg api',
      'entity seo',
      'ai visibility',
      'free kg tool',
    ],
    howItWorks: [
      {
        title: 'Enter your brand or domain',
        description:
          'We query the Google Knowledge Graph Search API for every entity matching your brand.',
      },
      {
        title: 'Map your KG presence',
        description:
          'Get a node graph of your entities, their properties (description, image, URL, type), and related entities.',
      },
      {
        title: 'Spot gaps',
        description:
          'See required properties that are missing (logo, official URL, founder, founding date) — these gaps weaken AI recognition.',
      },
      {
        title: 'Get a fix plan',
        description:
          'For each missing property we tell you where to add it (Wikidata, schema, Wikipedia) to populate the Knowledge Graph.',
      },
    ],
    keyBenefits: [
      'Live Knowledge Graph API query',
      'Per-entity property inventory',
      'Missing-property gap analysis',
      'Action plan per gap (where to add the data)',
      'Free, no signup — full graph in-browser',
    ],
    faq: [
      {
        question: 'What is the Google Knowledge Graph?',
        answer:
          'It is Google\'s structured database of entities (people, places, organizations, concepts) and their relationships. It powers the Knowledge Panel in search and informs Gemini and AI Overviews.',
      },
      {
        question: 'How do I get into the Knowledge Graph?',
        answer:
          'You cannot submit directly. Google builds KG entries from authoritative sources — Wikidata, Wikipedia, schema markup, and trusted third-party data providers. The explorer shows you which sources you need to strengthen.',
      },
      {
        question: 'Why does my Knowledge Panel show different info than my site?',
        answer:
          'The Knowledge Graph aggregates from many sources and may pick up outdated or wrong data. The fix is to update the underlying sources (Wikidata first, then Wikipedia, then schema on your site).',
      },
      {
        question: 'Does being in the Knowledge Graph guarantee AI citations?',
        answer:
          'No, but it dramatically increases the odds. AI engines prefer citing sources they can verify in their own knowledge graphs. Not being in the KG is a near-certain AI visibility drag.',
      },
    ],
    relatedSlugs: ['wikidata-checker', 'entity-finder', 'ai-authority-score'],
    inputLabel: 'Your brand name or URL',
    inputPlaceholder: 'Acme CRM',
    ctaText: 'Explore My Knowledge Graph',
    resultsIntro: 'Here is what Google\'s Knowledge Graph knows about you:',
  },
  {
    slug: 'wikidata-checker',
    name: 'Wikidata Checker',
    tagline: 'Does Wikidata know you exist?',
    description:
      'Verify your Wikidata entity — properties, references, multilingual descriptions, and gaps that block AI engines from citing you. Free.',
    longDescription:
      'Wikidata is the structured-data backbone that feeds Wikipedia, Google\'s Knowledge Graph, and most major AI engines. A correct, well-referenced Wikidata entry is one of the highest-leverage AI visibility assets you can build. The Wikidata Checker queries your entity and reports completeness, accuracy, and missing properties that block AI recognition.',
    icon: 'BookOpen',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
    category: 'Entities',
    metaTitle: 'Free Wikidata Checker — Verify Your Wikidata Entity | seosights',
    metaDescription:
      'Free Wikidata checker. Verify your entity — properties, references, multilingual descriptions, and gaps that block AI engines from citing you. No signup required.',
    keywords: [
      'wikidata checker',
      'wikidata entity',
      'wikidata seo',
      'knowledge graph',
      'ai visibility',
      'free wikidata tool',
      'wikidata audit',
    ],
    howItWorks: [
      {
        title: 'Enter your brand or Wikidata QID',
        description:
          'We query the Wikidata API for your entity and pull every property, reference, and description.',
      },
      {
        title: 'Audit your entry',
        description:
          'Get a completeness score covering required properties (logo, official URL, type, founding date), references, and multilingual descriptions.',
      },
      {
        title: 'Spot gaps and errors',
        description:
          'We flag missing properties, unreferenced claims, and outdated info that weakens AI recognition.',
      },
      {
        title: 'Get fix instructions',
        description:
          'For each gap we give you the exact Wikidata property to add and the reference format required.',
      },
    ],
    keyBenefits: [
      'Live Wikidata API query',
      'Completeness score with required-property checklist',
      'Multilingual description audit',
      'Reference-quality check (unreferenced claims flagged)',
      'Free, no signup — full audit in-browser',
    ],
    faq: [
      {
        question: 'What is Wikidata?',
        answer:
          'Wikidata is the structured-data sister project of Wikipedia. It stores machine-readable facts (entity properties and relationships) that feed Wikipedia, Google\'s Knowledge Graph, and most major AI engines. A correct Wikidata entry is critical for AI visibility.',
      },
      {
        question: 'Do I need a Wikipedia page to be in Wikidata?',
        answer:
          'No. Wikidata accepts any entity that meets its notability criteria, which is broader than Wikipedia\'s. Many notable companies have Wikidata entries without a Wikipedia article.',
      },
      {
        question: 'Can I edit my own Wikidata entry?',
        answer:
          'Yes, with disclosure. Wikidata allows anyone to edit, but you should declare any conflict of interest and provide reliable references for every claim. Self-promotional edits without references get reverted.',
      },
      {
        question: 'Why does my Wikidata entry matter for ChatGPT and Claude?',
        answer:
          'Both OpenAI and Anthropic use Wikidata as a core entity-resolution source. Wrong or missing Wikidata properties directly cause wrong or missing brand mentions in AI answers.',
      },
    ],
    relatedSlugs: ['knowledge-graph-explorer', 'entity-finder', 'ai-authority-score'],
    inputLabel: 'Your brand name or Wikidata QID',
    inputPlaceholder: 'Acme CRM or Q1234567',
    ctaText: 'Check My Wikidata',
    resultsIntro: 'Here is what Wikidata knows about your entity:',
  },
  {
    slug: 'ai-readiness-audit',
    name: 'AI Readiness Audit',
    tagline: 'Is your site ready for AI engines?',
    description:
      'Run a free 40-point AI readiness audit covering crawlability, schema, content, entities, E-E-A-T, and competitive position — with prioritized fixes. Free.',
    longDescription:
      'The AI Readiness Audit is our most comprehensive free tool. It runs a 40-point check across six pillars — AI crawlability, schema coverage, content citation-worthiness, entity authority, E-E-A-T signals, and competitive share — and produces a single AI Readiness Score, a competitor benchmark, and a prioritized fix list ranked by impact. Use it as your quarterly AI visibility health check.',
    icon: 'ShieldCheck',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free AI Readiness Audit — 40-Point AI Visibility Check | seosights',
    metaDescription:
      'Free 40-point AI readiness audit. Crawlability, schema, content, entities, E-E-A-T, and competitor benchmark. Prioritized fixes. No signup required.',
    keywords: [
      'ai readiness audit',
      'ai visibility audit',
      'ai readiness',
      '40-point audit',
      'ai seo audit',
      'free audit tool',
      'ai citation audit',
    ],
    howItWorks: [
      {
        title: 'Enter your URL and a sample prompt',
        description:
          'Tell us your domain and one prompt your customers ask AI assistants.',
      },
      {
        title: 'We run the 40-point check',
        description:
          'Six pillars (crawlability, schema, content, entities, E-E-A-T, competitive position) each scored on 6-8 sub-checks.',
      },
      {
        title: 'Get your AI Readiness Score',
        description:
          'Receive a 0-100 score, pillar-level subscores, and a competitor benchmark.',
      },
      {
        title: 'Receive your prioritized fix list',
        description:
          'Top 10 fixes ranked by expected score lift, each with a concrete how-to and effort estimate.',
      },
    ],
    keyBenefits: [
      '40-point scoring rubric across 6 pillars',
      'Single 0-100 AI Readiness Score with pillar breakdown',
      'Competitor benchmark included',
      'Top 10 prioritized fixes with effort estimates',
      'Free, no signup — full report downloadable on trial',
    ],
    faq: [
      {
        question: 'How is this different from the GEO and AEO audits?',
        answer:
          'The GEO Audit focuses on generative search (AI Overviews, Bing Copilot). The AEO Audit focuses on conversational assistants (ChatGPT, Claude). The AI Readiness Audit is the umbrella tool — it covers both plus crawlability, entities, and E-E-A-T in a single 40-point pass.',
      },
      {
        question: 'How long does the audit take?',
        answer:
          'The free audit runs in under 2 minutes. The trial unlocks deeper crawls (up to 100 pages) and takes 5-10 minutes for a more thorough analysis.',
      },
      {
        question: 'Can I schedule recurring audits?',
        answer:
          'Yes. Trial customers can schedule monthly audits with alerts when scores change. We recommend monthly for active programs and quarterly for maintenance.',
      },
      {
        question: 'What score should I target?',
        answer:
          '70+ means you are AI-ready and should focus on competitive differentiation. 50-70 means you have meaningful gaps to close. Below 50 means AI engines struggle to recognize and cite you.',
      },
    ],
    relatedSlugs: ['geo-audit', 'aeo-audit', 'ai-authority-score'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Run My AI Readiness Audit',
    resultsIntro: 'Your AI Readiness Score is ready. Here is your 40-point breakdown:',
  },
  {
    slug: 'ai-content-readability-checker',
    name: 'AI Readability Checker',
    tagline: 'Is your content citable by AI?',
    description:
      'Test whether your content is structured for AI citation — sentence clarity, answer directness, entity density, and quotability. Free, no signup.',
    longDescription:
      'AI engines cite content they can cleanly extract and restate. Pages written for human reading — long intros, narrative flow, marketing voice — often fail this test. The AI Readability Checker scores your content on the dimensions AI engines actually use: sentence directness, answer-completeness, entity density, quotability, and structure. Each dimension gets a score and a specific rewrite recommendation.',
    icon: 'FileText',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free AI Readability Checker — Is Your Content Citable by AI? | seosights',
    metaDescription:
      'Free AI readability checker. Test if your content is structured for AI citation — sentence clarity, answer directness, entity density, quotability. No signup.',
    keywords: [
      'ai readability',
      'ai citable content',
      'content for ai',
      'ai content check',
      'ai citation content',
      'free readability tool',
      'ai content optimization',
    ],
    howItWorks: [
      {
        title: 'Paste your URL or content',
        description:
          'We fetch the page (or accept pasted text) and split it into analyzable units.',
      },
      {
        title: 'We score 5 AI readability dimensions',
        description:
          'Sentence directness, answer-completeness, entity density, quotability, and structure.',
      },
      {
        title: 'See your score per dimension',
        description:
          'Get a 0-100 score for each, with the specific passages that dragged your score down.',
      },
      {
        title: 'Get a rewrite recommendation',
        description:
          'For each weak dimension we provide a concrete rewrite example using your own content.',
      },
    ],
    keyBenefits: [
      '5-dimension AI readability scoring',
      'Per-dimension rewrite recommendations on your own content',
      'Identifies "uncitable" paragraphs (the #1 cause of low AI citations)',
      'Entity density check (too few entities = invisible to AI)',
      'Free, no signup — shareable report URL',
    ],
    faq: [
      {
        question: 'What makes content "citable" by AI?',
        answer:
          'AI engines favor content that directly answers questions in 1-3 sentences, uses specific entities (not generic terms), is structured with clear headings, and avoids first-person marketing voice. The checker scores each of these factors.',
      },
      {
        question: 'Is AI readability different from human readability?',
        answer:
          'Yes. Content can score well on Flesch-Kincaid (human readability) but poorly on AI readability because it lacks direct answers or entities. The two measure different things.',
      },
      {
        question: 'Should I rewrite my entire site?',
        answer:
          'No. Start with your highest-traffic and highest-intent pages. Rewriting the top 10-20 pages typically delivers 80% of the AI citation lift.',
      },
      {
        question: 'Does this work for non-English content?',
        answer:
          'Yes. The checker supports all major languages. Scoring weights are tuned per language family.',
      },
    ],
    relatedSlugs: ['ai-snippet-tester', 'answer-format-checker', 'ai-readiness-audit'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Check My AI Readability',
    resultsIntro: 'Here is how citable your content is by AI engines:',
  },
  {
    slug: 'answer-format-checker',
    name: 'Answer Format Checker',
    tagline: 'Does your content answer in AI-friendly format?',
    description:
      'Check whether your pages answer questions in the format AI engines prefer — direct Q&A, numbered lists, definitions, and comparison tables. Free.',
    longDescription:
      'AI engines extract answers in predictable formats: direct Q&A pairs, numbered steps, definitions, and comparison tables. Pages that bury answers in paragraphs get skipped. The Answer Format Checker scans your page for these formats, scores your coverage, and tells you exactly which format to add for your highest-intent questions.',
    icon: 'ListChecks',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free Answer Format Checker — Does Your Content Answer AI-Friendly? | seosights',
    metaDescription:
      'Free answer format checker. See whether your pages use the formats AI engines prefer — Q&A, numbered lists, definitions, comparison tables. No signup required.',
    keywords: [
      'answer format',
      'ai answer format',
      'ai content structure',
      'q&a schema',
      'citable format',
      'free content tool',
      'ai citation format',
    ],
    howItWorks: [
      {
        title: 'Paste your URL',
        description:
          'We fetch your page and analyze its structure for AI-friendly answer formats.',
      },
      {
        title: 'We scan for 5 answer formats',
        description:
          'Direct Q&A pairs, numbered step lists, definitions, comparison tables, and key-value fact blocks.',
      },
      {
        title: 'Score your format coverage',
        description:
          'Get a 0-100 coverage score and the specific questions on your page that lack a machine-extractable answer.',
      },
      {
        title: 'Get a format recommendation',
        description:
          'For each missing format we tell you where to add it on the page and what content to write.',
      },
    ],
    keyBenefits: [
      '5-format AI answer structure analysis',
      'Per-question coverage check (which questions on your page have extractable answers)',
      'Concrete format recommendations with placement guidance',
      'Detects paragraphs that should be converted to lists or tables',
      'Free, no signup — shareable report URL',
    ],
    faq: [
      {
        question: 'Which answer formats do AI engines prefer?',
        answer:
          'Direct Q&A pairs (ideal for FAQ), numbered step lists (ideal for how-to), definitions (ideal for "what is" queries), and comparison tables (ideal for "X vs Y" queries). Each format makes it trivially easy for AI to extract and restate your answer.',
      },
      {
        question: 'Should I convert all my paragraphs to lists?',
        answer:
          'No. Paragraphs are still valuable for context and depth. The checker targets specific high-intent questions on your page and recommends the right format for each.',
      },
      {
        question: 'Does this affect featured snippets too?',
        answer:
          'Yes. The same formats that win AI citations tend to win Google featured snippets. Improving your answer format is a double win.',
      },
      {
        question: 'Do I need FAQ schema if my format is good?',
        answer:
          'Schema accelerates but does not replace good format. We recommend pairing strong answer format with the FAQ Schema Generator for maximum AI citation lift.',
      },
    ],
    relatedSlugs: ['ai-snippet-tester', 'faq-schema-generator', 'ai-content-readability-checker'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Check My Answer Format',
    resultsIntro: 'Here is how AI-friendly your answer formats are:',
  },
  {
    slug: 'ai-crawl-tester',
    name: 'AI Crawl Tester',
    tagline: 'Can AI crawlers read your pages?',
    description:
      'Test whether GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot can actually fetch your key pages — beyond robots.txt. Free.',
    longDescription:
      'Robots.txt is necessary but not sufficient. Many sites pass the robots.txt test but still block AI crawlers at the edge (Cloudflare, WAF rules), in their CMS, or through JavaScript-rendered content AI bots cannot parse. The AI Crawl Tester actually fetches your page as each AI crawler and reports the real-world result — including whether the content renders for bots or only for humans.',
    icon: 'Bot',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
    category: 'Crawlers',
    metaTitle: 'Free AI Crawl Tester — Can AI Crawlers Read Your Pages? | seosights',
    metaDescription:
      'Free AI crawl tester. Test if GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot can actually fetch your pages — beyond robots.txt. No signup.',
    keywords: [
      'ai crawl tester',
      'gptbot test',
      'claudebot test',
      'ai crawler test',
      'ai crawlability',
      'javascript seo',
      'free crawl tool',
    ],
    howItWorks: [
      {
        title: 'Enter your page URL',
        description:
          'We fetch the page using a real HTTP client mimicking each AI crawler\'s User-agent.',
      },
      {
        title: 'Test 5 AI crawlers',
        description:
          'GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot — see HTTP status, response size, and whether content rendered.',
      },
      {
        title: 'Detect JS-rendering gaps',
        description:
          'We compare the raw HTML (what bots see) to the rendered DOM (what humans see) and flag missing content.',
      },
      {
        title: 'Get a fix plan',
        description:
          'For each blocked or partial-fetch we tell you the most likely cause (edge rule, CMS setting, JS dependency) and the fix.',
      },
    ],
    keyBenefits: [
      'Real-world fetch test for 5 AI crawlers (not just robots.txt)',
      'JS-rendering gap detection (raw HTML vs rendered DOM)',
      'Identifies edge-level blocks (Cloudflare, WAF, CDN)',
      'Per-crawler fix plan with copy-paste configuration',
      'Free, no signup — shareable report URL',
    ],
    faq: [
      {
        question: 'Why do I pass the robots.txt test but still fail the crawl test?',
        answer:
          'Robots.txt tells crawlers what they may access. But many sites also block bots at the edge (Cloudflare bot management, WAF rules), in the CMS, or through JavaScript that AI crawlers do not execute. The crawl tester catches these real-world blocks.',
      },
      {
        question: 'Do AI crawlers render JavaScript?',
        answer:
          'Mostly no. GPTBot, ClaudeBot, and PerplexityBot fetch raw HTML and do not execute JavaScript. If your content is JS-rendered (SPA, React without SSR), AI crawlers see a blank page. The tester flags this.',
      },
      {
        question: 'How is this different from the GPTBot Checker?',
        answer:
          'The GPTBot Checker focuses on the robots.txt rule and gives you the fix. The AI Crawl Tester actually fetches the page as each crawler and surfaces real-world issues beyond robots.txt — JS rendering, edge blocks, redirect chains.',
      },
      {
        question: 'Can I test multiple pages at once?',
        answer:
          'The free tool tests one page. The trial unlocks bulk testing (up to 100 pages) and scheduled re-checks.',
      },
    ],
    relatedSlugs: ['gptbot-checker', 'claudebot-checker', 'robots-txt-tester'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Test AI Crawlability',
    resultsIntro: 'Here is what each AI crawler actually sees when they visit your page:',
  },
  {
    slug: 'ai-schema-generator',
    name: 'AI Schema Generator',
    tagline: 'Schema tuned for AI citation',
    description:
      'Generate JSON-LD schema tuned specifically for AI engine citation — Organization, Article, FAQ, HowTo, and custom entity schema. Free, no signup.',
    longDescription:
      'Standard schema markup targets Google Rich Results. AI schema targets a different audience — the LLM crawlers that feed ChatGPT, Claude, and Perplexity. The AI Schema Generator produces JSON-LD optimized for AI citation: richer Organization schema, Article schema with explicit citation-ready fields, HowTo schema with step-level entities, and custom entity schema that fills gaps the standard types miss.',
    icon: 'Code',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'coming-soon',
    category: 'Schema',
    metaTitle: 'Free AI Schema Generator — JSON-LD Tuned for AI Citation | seosights',
    metaDescription:
      'Free AI schema generator. JSON-LD tuned for AI engine citation — Organization, Article, FAQ, HowTo, and custom entity schema. No signup required.',
    keywords: [
      'ai schema',
      'ai json-ld',
      'ai citation schema',
      'organization schema',
      'article schema',
      'howto schema',
      'free schema tool',
    ],
    howItWorks: [
      {
        title: 'Enter your URL and pick a schema type',
        description:
          'Choose Organization, Article, FAQ, HowTo, or custom entity schema.',
      },
      {
        title: 'We crawl your page and pre-fill',
        description:
          'The generator pulls title, author, date, entities, and key facts automatically.',
      },
      {
        title: 'Tune for AI citation',
        description:
          'We add fields standard generators skip — sameAs links to Wikipedia/Wikidata/LinkedIn, explicit citationSource fields, and entity disambiguation.',
      },
      {
        title: 'Copy your AI-tuned JSON-LD',
        description:
          'Get a validated script tag with copy-paste deployment instructions for your CMS.',
      },
    ],
    keyBenefits: [
      '5 AI-tuned schema types (Organization, Article, FAQ, HowTo, custom entity)',
      'Auto-included sameAs links to Wikidata, Wikipedia, LinkedIn, Crunchbase',
      'Entity disambiguation fields that prevent AI engine confusion',
      'Validated against Google Rich Results + Schema.org spec',
      'Free, no signup — copy-paste output',
    ],
    faq: [
      {
        question: 'How is AI schema different from regular schema?',
        answer:
          'Standard schema targets Google Rich Results. AI schema adds fields that LLM crawlers specifically use for entity resolution and citation — sameAs links, citationSource, and explicit entity disambiguation. These fields are ignored by Google Rich Results but matter to AI engines.',
      },
      {
        question: 'Do I need both regular and AI schema?',
        answer:
          'No. AI schema is a superset of regular schema. The same JSON-LD block works for both Google Rich Results and AI engines.',
      },
      {
        question: 'What is the sameAs property and why does it matter?',
        answer:
          'sameAs links your entity to authoritative external sources (Wikipedia, Wikidata, LinkedIn, Crunchbase). AI engines use these links to verify your identity and authority. Missing sameAs links are a top cause of weak entity recognition.',
      },
      {
        question: 'Can I generate schema for multiple pages?',
        answer:
          'The free tool generates one schema block at a time. The trial unlocks bulk generation across your site with a single crawl.',
      },
    ],
    relatedSlugs: ['faq-schema-generator', 'schema-generator', 'ai-meta-tag-generator'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/about',
    ctaText: 'Generate AI Schema',
    resultsIntro: 'Your AI-tuned JSON-LD schema is ready. Copy it into your <head>:',
  },
  {
    slug: 'ai-prompt-generator',
    name: 'AI Prompt Generator',
    tagline: 'Generate prompts to test your visibility',
    description:
      'Generate the prompts your customers actually ask AI assistants — so you can test your visibility where it matters. Free, no signup.',
    longDescription:
      'You cannot improve AI visibility for prompts you do not know about. The AI Prompt Generator analyzes your category, competitors, and target keywords to produce the 25-50 prompts your customers actually ask ChatGPT, Claude, and Perplexity. Use them with the Prompt Visibility Checker to find the prompts where you are losing and to plan the content that wins them back.',
    icon: 'Sparkles',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    status: 'coming-soon',
    category: 'Visibility',
    metaTitle: 'Free AI Prompt Generator — Prompts Your Customers Ask | seosights',
    metaDescription:
      'Free AI prompt generator. Discover the 25-50 prompts your customers actually ask ChatGPT, Claude, and Perplexity. Test your visibility where it matters. No signup.',
    keywords: [
      'ai prompt generator',
      'chatgpt prompts',
      'customer prompts',
      'ai visibility prompts',
      'prompt research',
      'free prompt tool',
      'ai seo prompts',
    ],
    howItWorks: [
      {
        title: 'Enter your brand, category, and 1-3 competitors',
        description:
          'We analyze your category, competitors, and target keywords to seed prompt generation.',
      },
      {
        title: 'We generate 25-50 real prompts',
        description:
          'Our model produces the prompts actual users ask AI assistants in your category — informational, comparison, transactional, and troubleshooting.',
      },
      {
        title: 'Cluster by intent',
        description:
          'Prompts are grouped by intent (research, comparison, purchase, support) so you can prioritize by funnel stage.',
      },
      {
        title: 'Export to the Prompt Visibility Checker',
        description:
          'One click sends your prompt set to the Prompt Visibility Checker to test where you currently rank.',
      },
    ],
    keyBenefits: [
      '25-50 customer-realistic prompts per generation',
      'Intent-clustered (research, comparison, purchase, support)',
      'Competitor-aware (we generate prompts where competitors currently win)',
      'One-click handoff to the Prompt Visibility Checker',
      'Free, no signup — exportable prompt list',
    ],
    faq: [
      {
        question: 'How do you know what prompts customers ask?',
        answer:
          'We combine search query data (People Also Ask, related searches), community data (Reddit, Quora, G2 reviews), and LLM simulation to produce prompts that match real user behavior in your category.',
      },
      {
        question: 'Can I generate prompts for a specific funnel stage?',
        answer:
          'Yes. Filter by intent — research, comparison, purchase, support — to focus on the prompts that matter for your current goal.',
      },
      {
        question: 'Why are these prompts different from my keyword list?',
        answer:
          'Keywords are what people type into Google. Prompts are what people ask AI assistants — they are longer, more conversational, and often include context ("for a 20-person agency") that keywords lack.',
      },
      {
        question: 'Can I generate prompts in other languages?',
        answer:
          'Yes. The generator supports all major languages. Prompts are tuned for the phrasing actual speakers use in each language.',
      },
    ],
    relatedSlugs: ['prompt-visibility-checker', 'ai-opportunity-finder', 'chatgpt-rank-checker'],
    inputLabel: 'Your brand, category, and a competitor',
    inputPlaceholder: 'Acme CRM, sales software, Salesforce',
    ctaText: 'Generate My Prompts',
    resultsIntro: 'Here are the prompts your customers actually ask AI:',
  },
  {
    slug: 'faq-schema-generator',
    name: 'FAQ Schema Generator',
    tagline: 'FAQ schema that wins AI citations',
    description:
      'Generate FAQ schema that AI engines love to quote verbatim — properly nested, validated, and tuned for citation. Free, no signup.',
    longDescription:
      'FAQ schema is the single most-cited schema type in AI answers. When done well, AI engines lift your Q&A pairs verbatim and credit you as the source. The FAQ Schema Generator produces JSON-LD tuned specifically for AI citation — proper question phrasing, answer directness, and the mainEntity nesting that AI crawlers actually parse.',
    icon: 'HelpCircle',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    status: 'coming-soon',
    category: 'Schema',
    metaTitle: 'Free FAQ Schema Generator — FAQ Schema That Wins AI Citations | seosights',
    metaDescription:
      'Free FAQ schema generator. JSON-LD tuned for AI citation — proper question phrasing, answer directness, mainEntity nesting. Validated, copy-paste ready. No signup.',
    keywords: [
      'faq schema generator',
      'faq json-ld',
      'faq structured data',
      'ai citation schema',
      'faq schema seo',
      'free faq schema tool',
    ],
    howItWorks: [
      {
        title: 'Enter your page URL or paste Q&A pairs',
        description:
          'We pre-fill from your page if it has visible Q&A content, or accept manual entry.',
      },
      {
        title: 'Tune each Q&A for AI citation',
        description:
          'We rewrite questions to match how users actually ask AI assistants, and tighten answers to 1-3 sentences that AI can quote cleanly.',
      },
      {
        title: 'Generate mainEntity JSON-LD',
        description:
          'Produce properly nested FAQPage schema with Question and acceptedAnswer objects.',
      },
      {
        title: 'Validate and deploy',
        description:
          'We validate against Google Rich Results + Schema.org and give you copy-paste deployment instructions.',
      },
    ],
    keyBenefits: [
      'AI-tuned question phrasing (matches how users ask AI assistants)',
      'Answer tightening to quotable 1-3 sentence form',
      'Proper mainEntity nesting that AI crawlers parse correctly',
      'Validated against Google Rich Results + Schema.org',
      'Free, no signup — copy-paste JSON-LD',
    ],
    faq: [
      {
        question: 'Why does FAQ schema win so many AI citations?',
        answer:
          'AI engines love to quote verbatim. FAQ schema presents questions and answers in the exact format AI engines prefer to extract — clean Q&A pairs with explicit question and answer fields. It is the closest thing to a guaranteed AI citation.',
      },
      {
        question: 'Should every page have FAQ schema?',
        answer:
          'No. Only pages with genuine Q&A content should use FAQ schema. Adding fake FAQ schema to manipulate results can trigger Google penalties and reduce AI trust.',
      },
      {
        question: 'How many Q&A pairs should I include?',
        answer:
          '3-8 per page is ideal. Fewer than 3 looks thin; more than 8 dilutes focus. Pick the questions your customers actually ask, not invented questions.',
      },
      {
        question: 'Can I use FAQ schema on product pages?',
        answer:
          'Yes, if the page has visible Q&A content (common for product pages with shipping, returns, or specs questions). The generator will detect and pre-fill these from your page.',
      },
    ],
    relatedSlugs: ['ai-schema-generator', 'answer-format-checker', 'schema-generator'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/faq',
    ctaText: 'Generate FAQ Schema',
    resultsIntro: 'Your AI-tuned FAQ schema is ready. Copy it into your <head>:',
  },
  {
    slug: 'ai-meta-tag-generator',
    name: 'AI Meta Tag Generator',
    tagline: 'Meta tags optimized for AI crawlers',
    description:
      'Generate meta tags that help AI crawlers summarize you accurately — title, description, og:tags, and AI-specific tags like citation_name and llms.txt hints. Free.',
    longDescription:
      'Standard meta tags target Google Search. AI engines parse additional tags and meta-level signals to decide how to summarize you. The AI Meta Tag Generator produces a complete head-tag bundle tuned for AI citation — title, description, OpenGraph, Twitter Card, plus AI-specific tags that signal your canonical entity, citation name, and content freshness.',
    icon: 'Tag',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    status: 'coming-soon',
    category: 'Schema',
    metaTitle: 'Free AI Meta Tag Generator — Meta Tags for AI Crawlers | seosights',
    metaDescription:
      'Free AI meta tag generator. Title, description, OpenGraph, Twitter Card, and AI-specific tags like citation_name and llms.txt hints. No signup required.',
    keywords: [
      'ai meta tags',
      'meta tag generator',
      'ai crawler tags',
      'citation_name',
      'og tags',
      'ai seo tags',
      'free meta tag tool',
    ],
    howItWorks: [
      {
        title: 'Enter your page URL',
        description:
          'We fetch the page and pre-fill title, description, og tags, and AI-relevant meta from your content.',
      },
      {
        title: 'Tune for AI citation',
        description:
          'We rewrite your title and description to match how AI engines prefer to summarize content (concise, entity-forward, no marketing fluff).',
      },
      {
        title: 'Add AI-specific tags',
        description:
          'Generate citation_name, citation_publication_date, article:author, and llms.txt pointer tags that AI crawlers use.',
      },
      {
        title: 'Copy the head bundle',
        description:
          'Get a complete <head> tag bundle with copy-paste deployment instructions for your CMS.',
      },
    ],
    keyBenefits: [
      'Complete head-tag bundle (title, description, OG, Twitter, AI-specific)',
      'AI-tuned title and description phrasing',
      'AI-specific tags (citation_name, article:author, llms.txt pointer)',
      'Detects missing or duplicate meta tags on your existing page',
      'Free, no signup — copy-paste output',
    ],
    faq: [
      {
        question: 'What are AI-specific meta tags?',
        answer:
          'These are meta tags that AI crawlers (GPTBot, ClaudeBot, PerplexityBot) parse but that are not part of the standard HTML spec — citation_name, citation_publication_date, article:author, and the llms.txt pointer. They help AI engines correctly attribute and date your content.',
      },
      {
        question: 'Do AI engines actually use meta tags?',
        answer:
          'Yes, though less than schema. AI engines use meta tags primarily for content summarization (title, description) and citation attribution (citation_name, article:author). They are less important than schema but easy to get right.',
      },
      {
        question: 'Should I replace my existing meta tags?',
        answer:
          'In most cases, yes. The generator produces a complete bundle that replaces your existing title, description, and og tags with AI-tuned versions. We show you a diff so you can approve each change.',
      },
      {
        question: 'Does this conflict with my SEO plugin?',
        answer:
          'No. The output works alongside Yoast, Rank Math, and other SEO plugins. We give you instructions for integrating with each.',
      },
    ],
    relatedSlugs: ['ai-schema-generator', 'llms-txt-generator', 'faq-schema-generator'],
    inputLabel: 'Your page URL',
    inputPlaceholder: 'https://example.com/blog/my-article',
    ctaText: 'Generate AI Meta Tags',
    resultsIntro: 'Your AI-tuned meta tags are ready. Copy the bundle into your <head>:',
  },
  {
    slug: 'ai-competitor-citation-report',
    name: 'AI Competitor Citation Report',
    tagline: 'How do your AI citations stack up?',
    description:
      'Compare your AI citation share against up to 5 competitors across ChatGPT, Claude, Gemini, and Perplexity — with per-engine deltas and source gaps. Free.',
    longDescription:
      'Knowing your own citation count is not enough — you need to know your share of voice in your category. The AI Competitor Citation Report compares your citation frequency against up to 5 competitors across all four major engines, surfaces the sources where competitors are cited and you are not, and ranks the gaps by closing difficulty.',
    icon: 'BarChart3',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/15',
    status: 'coming-soon',
    category: 'Visibility',
    metaTitle: 'Free AI Competitor Citation Report — Compare AI Citations | seosights',
    metaDescription:
      'Free AI competitor citation report. Compare your AI citation share vs. up to 5 competitors across ChatGPT, Claude, Gemini, and Perplexity. Source gaps ranked. No signup.',
    keywords: [
      'ai competitor citation',
      'citation competitor analysis',
      'ai share of voice',
      'chatgpt competitor',
      'ai competitive report',
      'free competitor tool',
      'ai citation benchmark',
    ],
    howItWorks: [
      {
        title: 'Enter your domain and 1-5 competitors',
        description:
          'We pull citation data for each from the AI Citation Checker engine.',
      },
      {
        title: 'Compute citation share',
        description:
          'Get your percentage share of total citations across all four engines, plus per-engine breakdowns.',
      },
      {
        title: 'Surface source gaps',
        description:
          'See the specific sources (Reddit, Wikipedia, G2, etc.) where competitors are cited and you are not.',
      },
      {
        title: 'Rank gaps by closing difficulty',
        description:
          'Each gap is scored on authority required, content needed, and time to close.',
      },
    ],
    keyBenefits: [
      'Citation share % vs. up to 5 competitors',
      'Per-engine breakdown (ChatGPT, Claude, Gemini, Perplexity)',
      'Source-level gap analysis (which sites cite them, not you)',
      'Per-gap closing-difficulty score',
      'Free, no signup — full report downloadable on trial',
    ],
    faq: [
      {
        question: 'What is AI citation share?',
        answer:
          'Your share of total AI citations in your category across the four major engines. If your category has 100 total AI citations per week and you get 12, your share is 12%. Share is more meaningful than absolute count because it accounts for category size.',
      },
      {
        question: 'Why does my share differ by engine?',
        answer:
          'Each engine weighs sources differently. You might dominate ChatGPT (training data heavy) but lag in Perplexity (freshness heavy). The per-engine breakdown shows where to focus.',
      },
      {
        question: 'How do I close a source gap?',
        answer:
          'Most source gaps close by getting mentioned on the specific source (Reddit thread, G2 review, Wikipedia article). The report links each gap to the source and a concrete action plan.',
      },
      {
        question: 'Can I track share over time?',
        answer:
          'Yes. The trial unlocks weekly share tracking with alerts when your share moves by more than 2 percentage points.',
      },
    ],
    relatedSlugs: ['ai-citation-checker', 'ai-opportunity-finder', 'citation-velocity-tracker'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Compare My AI Citations',
    resultsIntro: 'Here is how your AI citations stack up vs. competitors:',
  },
  {
    slug: 'ai-opportunity-finder',
    name: 'AI Opportunity Finder',
    tagline: 'Find citation gaps you can close',
    description:
      'Find the highest-impact AI citation gaps in your category — prompts where you are absent and competitors are cited, ranked by closing difficulty. Free.',
    longDescription:
      'Most AI visibility programs fail not from lack of effort but from lack of focus. The AI Opportunity Finder surfaces the 10-20 specific opportunities with the best effort-to-impact ratio in your category — prompts where you are absent, competitors are cited, and the gap is realistically closeable in 30-60 days. Work the list top-down for compounding visibility gains.',
    icon: 'Target',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
    category: 'Visibility',
    metaTitle: 'Free AI Opportunity Finder — Find Citation Gaps You Can Close | seosights',
    metaDescription:
      'Free AI opportunity finder. Discover the highest-impact AI citation gaps in your category — prompts where you are absent and competitors are cited. Ranked by difficulty.',
    keywords: [
      'ai opportunity finder',
      'ai citation gap',
      'ai visibility opportunity',
      'chatgpt opportunity',
      'ai seo opportunity',
      'free opportunity tool',
      'ai visibility gaps',
    ],
    howItWorks: [
      {
        title: 'Enter your domain and 1-3 competitors',
        description:
          'We analyze your category\'s prompt space and your current citation footprint.',
      },
      {
        title: 'Identify absent prompts',
        description:
          'Find prompts where competitors are cited and you are absent across ChatGPT, Claude, Gemini, and Perplexity.',
      },
      {
        title: 'Score each opportunity',
        description:
          'Each opportunity is ranked on impact (citation frequency) and difficulty (content needed, authority required, time to close).',
      },
      {
        title: 'Get your top 10 priority list',
        description:
          'Work the list top-down for fastest visibility gains.',
      },
    ],
    keyBenefits: [
      'Top 10 prioritized AI citation opportunities',
      'Per-opportunity impact and difficulty score',
      'Concrete closing plan (content asset, target source, schema to add)',
      'Cross-engine coverage (ChatGPT, Claude, Gemini, Perplexity)',
      'Free, no signup — full list downloadable on trial',
    ],
    faq: [
      {
        question: 'What makes an opportunity "high-impact"?',
        answer:
          'High citation frequency in your category (many users ask the prompt) combined with low difficulty (the content gap is closeable with a reasonable asset). We rank opportunities on the ratio of impact to difficulty.',
      },
      {
        question: 'How quickly can I close an opportunity?',
        answer:
          'Most close in 30-60 days after you ship the recommended content and schema. Some high-difficulty opportunities (Wikipedia-level) take 90+ days.',
      },
      {
        question: 'Should I work the list top-down?',
        answer:
          'Generally yes. The top 3-5 opportunities typically deliver 60-70% of the visibility gain. Closing all 10 delivers 90%+.',
      },
      {
        question: 'Can I generate new opportunities monthly?',
        answer:
          'Yes. The trial unlocks monthly opportunity refreshes as your category evolves and competitors respond.',
      },
    ],
    relatedSlugs: ['ai-competitor-citation-report', 'entity-gap-analyzer', 'ai-prompt-generator'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Find My AI Opportunities',
    resultsIntro: 'Here are your top AI citation opportunities, ranked by impact:',
  },
  {
    slug: 'ai-visibility-forecast',
    name: 'AI Visibility Forecast',
    tagline: 'Where will your score be in 90 days?',
    description:
      'Project your AI Visibility Score 30, 60, and 90 days out based on your current velocity, planned fixes, and category trends. Free.',
    longDescription:
      'AI visibility compounds. A site gaining 8 citations per week will be in a very different position 90 days from now — but only if the velocity holds. The AI Visibility Forecast takes your current citation velocity, your planned fixes, and category trend data to project your AI Visibility Score 30, 60, and 90 days out. Use it to set realistic goals and catch stalls before they happen.',
    icon: 'TrendingUp',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    status: 'coming-soon',
    category: 'Visibility',
    metaTitle: 'Free AI Visibility Forecast — Project Your Score 90 Days Out | seosights',
    metaDescription:
      'Free AI visibility forecast. Project your AI Visibility Score 30, 60, and 90 days out based on your velocity, planned fixes, and category trends. No signup.',
    keywords: [
      'ai visibility forecast',
      'ai visibility prediction',
      'ai visibility score',
      'citation forecast',
      'ai seo forecast',
      'free forecast tool',
      'ai visibility projection',
    ],
    howItWorks: [
      {
        title: 'Enter your domain',
        description:
          'We pull your current AI Visibility Score and citation velocity from the AI Visibility Checker and Citation Velocity Tracker.',
      },
      {
        title: 'Add your planned fixes',
        description:
          'Tell us which fixes you plan to ship in the next 30 days (we suggest the top 5 from your audit).',
      },
      {
        title: 'We forecast your score',
        description:
          'Our model projects your score at 30, 60, and 90 days based on velocity, fix impact, and category trend data.',
      },
      {
        title: 'See your scenario paths',
        description:
          'Get best-case, base-case, and worst-case forecasts so you can plan around uncertainty.',
      },
    ],
    keyBenefits: [
      '30/60/90-day AI Visibility Score projection',
      'Best-case / base-case / worst-case scenarios',
      'Per-fix impact estimate on your forecast',
      'Detects velocity stalls before they hurt your score',
      'Free, no signup — shareable forecast URL',
    ],
    faq: [
      {
        question: 'How accurate is the forecast?',
        answer:
          'Forecasts are directionally accurate (will you go up or down) and reasonably precise on magnitude for the 30-day horizon. 60- and 90-day forecasts have wider confidence intervals because competitor behavior and model updates introduce variance.',
      },
      {
        question: 'What inputs drive the forecast?',
        answer:
          'Three inputs: your current citation velocity, the expected impact of your planned fixes (estimated from historical fix impact data), and category trend data (is your category growing or shrinking in AI queries).',
      },
      {
        question: 'What is a "velocity stall"?',
        answer:
          'A velocity stall is when your weekly net citations flatten or turn negative. Stalls compound — a 4-week stall typically costs 6-10 visibility score points over the following 60 days. The forecast flags stalls early.',
      },
      {
        question: 'Can I share the forecast with my team?',
        answer:
          'Yes. The forecast produces a shareable URL with all scenarios visible. Trial customers can export to PDF or slide deck.',
      },
    ],
    relatedSlugs: ['citation-velocity-tracker', 'ai-visibility-checker', 'ai-opportunity-finder'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Forecast My AI Visibility',
    resultsIntro: 'Here is your projected AI Visibility Score for the next 90 days:',
  },
  {
    slug: 'ai-revenue-calculator',
    name: 'AI Revenue Calculator',
    tagline: 'Turn AI visibility into revenue',
    description:
      'Estimate the revenue impact of improving your AI Visibility Score — by category, conversion rate, and traffic-to-revenue assumptions. Free, no signup.',
    longDescription:
      'AI visibility is a leading indicator of revenue, but most teams cannot quantify the impact. The AI Revenue Calculator translates your AI Visibility Score and citation velocity into projected traffic, leads, and revenue — using your category\'s AI referral conversion rates and your average deal size. Use it to justify your AI visibility investment to leadership.',
    icon: 'Calculator',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    status: 'coming-soon',
    category: 'Audits',
    metaTitle: 'Free AI Revenue Calculator — Turn AI Visibility Into Revenue | seosights',
    metaDescription:
      'Free AI revenue calculator. Estimate the revenue impact of improving your AI Visibility Score — projected traffic, leads, and revenue by category. No signup.',
    keywords: [
      'ai revenue calculator',
      'ai visibility roi',
      'ai revenue impact',
      'ai citation revenue',
      'ai traffic value',
      'free revenue tool',
      'ai visibility business case',
    ],
    howItWorks: [
      {
        title: 'Enter your domain and category',
        description:
          'We pull your current AI Visibility Score and category benchmark data.',
      },
      {
        title: 'Set your assumptions',
        description:
          'Enter your average deal size, conversion rate, and target score improvement (e.g., 50 → 70).',
      },
      {
        title: 'We model the revenue impact',
        description:
          'Our calculator uses category-specific AI referral conversion rates to project traffic, leads, and revenue at your target score.',
      },
      {
        title: 'Get your business case',
        description:
          'Receive a one-page business case (revenue impact, payback period, recommended investment) you can share with leadership.',
      },
    ],
    keyBenefits: [
      'Revenue projection for target AI Visibility Score',
      'Category-specific AI referral conversion rates',
      'One-page business case for leadership',
      'Payback period and ROI estimate',
      'Free, no signup — shareable report URL',
    ],
    faq: [
      {
        question: 'How do you estimate AI referral traffic?',
        answer:
          'We use category-specific data on Perplexity and AI Overview click-through rates combined with citation frequency. Perplexity and AI Overviews are the two engines that drive measurable referral traffic today (ChatGPT and Claude rarely generate clicks).',
      },
      {
        question: 'What if I don\'t know my conversion rate?',
        answer:
          'We pre-fill category-average conversion rates. You can override with your actual number if you have it.',
      },
      {
        question: 'Is the revenue projection realistic?',
        answer:
          'The projection is a directional estimate based on category benchmarks. Real-world results vary based on your brand strength, deal cycle, and category maturity. Use it to size the opportunity, not to set quarterly targets.',
      },
      {
        question: 'Can I model multiple scenarios?',
        answer:
          'Yes. The trial unlocks multi-scenario modeling (conservative, base, aggressive) and export to spreadsheet.',
      },
    ],
    relatedSlugs: ['ai-visibility-checker', 'ai-visibility-forecast', 'ai-readiness-audit'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'Calculate My AI Revenue',
    resultsIntro: 'Here is the revenue impact of improving your AI visibility:',
  },
  {
    slug: 'ai-influence-graph-viewer',
    name: 'AI Influence Graph Viewer',
    tagline: 'See your authority chain to AI engines',
    description:
      'Visualize the full authority chain — from your brand through entities, sources, and references up to the AI engines that cite you. Free, no signup.',
    longDescription:
      'AI engines do not cite you directly — they cite you through a chain of authoritative sources. Your brand → Wikipedia/Wikidata → Reddit/G2/Trustpilot → News → AI engines. Break any link in the chain and your visibility drops. The AI Influence Graph Viewer maps the full chain so you can see which links are strong, weak, or broken.',
    icon: 'Network',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    status: 'coming-soon',
    category: 'Entities',
    metaTitle: 'Free AI Influence Graph Viewer — See Your Authority Chain | seosights',
    metaDescription:
      'Free AI influence graph viewer. Visualize the full authority chain from your brand through entities, sources, and references up to the AI engines that cite you. No signup.',
    keywords: [
      'ai influence graph',
      'authority chain',
      'ai authority',
      'influence graph seo',
      'ai citation chain',
      'free authority tool',
      'ai authority map',
    ],
    howItWorks: [
      {
        title: 'Enter your domain',
        description:
          'We map your brand\'s authority chain from your site up to the AI engines.',
      },
      {
        title: 'Visualize the chain',
        description:
          'See nodes for your brand, your entities (Wikipedia, Wikidata, Crunchbase), review/forum sources (Reddit, G2, Trustpilot), news sources, and AI engines (ChatGPT, Claude, Gemini, Perplexity).',
      },
      {
        title: 'Identify strong / weak / broken links',
        description:
          'Each edge is colored by strength. Broken links (missing Wikipedia article, no Wikidata entry) are flagged as the top causes of low AI visibility.',
      },
      {
        title: 'Get a fix plan',
        description:
          'For each weak or broken link we tell you the exact action to strengthen it.',
      },
    ],
    keyBenefits: [
      'Full authority chain visualization (brand → sources → AI engines)',
      'Per-link strength scoring (strong / weak / broken)',
      'Broken-link identification (the #1 cause of low AI visibility)',
      'Concrete fix plan per weak or broken link',
      'Free, no signup — interactive graph in-browser',
    ],
    faq: [
      {
        question: 'What is an authority chain?',
        answer:
          'The chain of authoritative sources AI engines use to verify and cite your brand. A typical chain: your site → Wikidata/Wikipedia → G2/Reddit/Trustpilot → News → AI engines. AI engines cite you when multiple links in the chain corroborate your authority.',
      },
      {
        question: 'Why do broken links hurt so much?',
        answer:
          'A single broken link (no Wikipedia article, no Wikidata entry, no G2 profile) can collapse your entire authority chain because AI engines use these sources for entity verification. Without verification, they will not cite you even if your content is excellent.',
      },
      {
        question: 'How do I fix a broken link?',
        answer:
          'Each broken link has a specific fix — create a Wikidata entry, claim your G2 profile, get a Wikipedia article, build Reddit presence. The viewer links each fix to a concrete action plan.',
      },
      {
        question: 'Can I view competitors\' influence graphs?',
        answer:
          'Yes. Run the tool on any competitor domain. Comparing graphs is the fastest way to understand why competitors out-rank you in AI engines.',
      },
    ],
    relatedSlugs: ['entity-graph-viewer', 'ai-authority-score', 'knowledge-graph-explorer'],
    inputLabel: 'Your website URL',
    inputPlaceholder: 'https://example.com',
    ctaText: 'View My Influence Graph',
    resultsIntro: 'Here is your authority chain to the AI engines:',
  },
]

export function getToolBySlug(slug: string): FreeTool | undefined {
  return freeTools.find((t) => t.slug === slug)
}

export function getRelatedTools(slug: string): FreeTool[] {
  const tool = getToolBySlug(slug)
  if (!tool) return []
  return tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is FreeTool => Boolean(t))
}

export const freeToolCategories: { name: string; slug: string; description: string }[] = [
  { name: 'Visibility', slug: 'visibility', description: 'See how AI engines cite and mention you' },
  { name: 'Crawlers', slug: 'crawlers', description: 'Test if AI crawlers can reach your content' },
  { name: 'Schema', slug: 'schema', description: 'Generate structured data and llms.txt' },
  { name: 'Audits', slug: 'audits', description: 'Full AEO and GEO readiness audits' },
  { name: 'Entities', slug: 'entities', description: 'Understand your entity authority' },
]
