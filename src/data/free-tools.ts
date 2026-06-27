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
