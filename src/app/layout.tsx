import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://seosights.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "seosights — Will AI Recommend Your Business?",
    template: "%s — seosights",
  },
  description:
    "SeoSights helps companies understand, measure and improve how AI models recommend their business. AI Visibility Intelligence Platform with Observatory and AI Visibility OS.",
  keywords: [
    "AI visibility",
    "AI Visibility Score",
    "AI citations",
    "ChatGPT SEO",
    "Claude citations",
    "Perplexity citations",
    "Gemini visibility",
    "seosights",
    "AI search optimization",
    "recommendation simulator",
    "AI crawler",
    "llms.txt",
    "entity SEO",
  ],
  authors: [{ name: "seosights" }],
  applicationName: "seosights",
  creator: "seosights",
  publisher: "seosights",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-transparent.png", type: "image/png" },
    ],
    apple: [{ url: "/logo-transparent.png", type: "image/png" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "seosights — Will AI Recommend Your Business?",
    description:
      "The operating system for AI visibility. Track your AI Visibility Score across ChatGPT, Claude, Gemini & Perplexity. See who AI recommends — and become the answer.",
    url: SITE_URL,
    siteName: "seosights",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "seosights — The Operating System for AI Visibility",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "seosights — Will AI Recommend Your Business?",
    description:
      "The operating system for AI visibility. Track your AI Visibility Score across ChatGPT, Claude, Gemini & Perplexity.",
    images: ["/og-image.png"],
    creator: "@seosights",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "seosights",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-transparent.png`,
      description:
        "Unified SEO, AEO, and GEO platform powered by 8 AI agents.",
      sameAs: [
        "https://twitter.com/seosights",
        "https://www.linkedin.com/company/seosights",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "seosights",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "seosights",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "seosights is a unified SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization) platform powered by 8 AI agents that audit, strategize, and auto-execute your search strategy.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "29",
          priceCurrency: "USD",
          description: "Free 1-month trial, then $29/month",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "79",
          priceCurrency: "USD",
          description: "Full 8-agent suite for growing teams",
        },
        {
          "@type": "Offer",
          name: "Agency / Managed",
          price: "Custom",
          priceCurrency: "USD",
          description: "White-label & multi-client management",
        },
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "First Sight: Traditional SEO audit & strategy",
        "Second Sight: AEO — Answer Engine Optimization",
        "Third Sight: GEO — Generative Engine Optimization",
        "8 autonomous AI agents",
        "llms.txt generator",
        "90-day auto-executed roadmap",
        "Backlink outreach automation",
        "CMS publishing integration",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is seosights?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "seosights is a unified platform that gives you Three Sights on modern search: First Sight (traditional SEO), Second Sight (AEO — Answer Engine Optimization), and Third Sight (GEO — Generative Engine Optimization). 8 AI agents audit, strategize, and auto-execute your search strategy 24/7.",
          },
        },
        {
          "@type": "Question",
          name: "How does the 8-agent system work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A Master Director agent orchestrates 7 specialist agents that analyze your SEO, AEO, and GEO in parallel. They produce a 90-day auto-executed roadmap with weekly actions, code snippets, content briefs, and backlink targets.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a free trial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. seosights offers a 1-month free trial with no credit card required. You can run a full 8-agent analysis and receive your complete strategy before deciding to subscribe.",
          },
        },
        {
          "@type": "Question",
          name: "What is AEO and GEO?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AEO (Answer Engine Optimization) ensures your site is cited by AI assistants like ChatGPT and Perplexity. GEO (Generative Engine Optimization) ensures visibility in generative search results like Google AI Overviews. seosights handles both alongside traditional SEO.",
          },
        },
        {
          "@type": "Question",
          name: "Does seosights offer an affiliate program?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. seosights has a 5-tier affiliate program with recurring commissions from 10% up to 50%. Affiliates earn on every recurring payment for the lifetime of referred customers.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" data-scroll-behavior="smooth">
      <head>
        {/* next/font/google automatically injects preconnect for fonts.gstatic.com */}
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
          {/* noscript fallback for accessibility & SEO crawlers */}
          <noscript>
            <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>seosights</h1>
              <p style={{ marginBottom: "1rem" }}>
                seosights is a unified SEO, AEO, and GEO platform powered by 8 AI agents.
                Please enable JavaScript to run the full 8-agent analysis and access the interactive dashboard.
              </p>
              <p>
                <a href="mailto:hello@seosights.com" style={{ color: "#10b981" }}>
                  Contact us at hello@seosights.com
                </a>
              </p>
            </div>
          </noscript>
        </ThemeProvider>
      </body>
    </html>
  );
}
