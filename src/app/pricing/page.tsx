import type { Metadata } from 'next'
import Link from 'next/link'
import PricingPageClient from './pricing-page-client'

const SITE_URL = 'https://seosights.com'

export const metadata: Metadata = {
  title: 'Pricing — seosights | SEO · AEO · GEO Plans from $19/mo',
  description:
    'Simple pricing for seosights. Starter $19/mo, Pro $79/mo, Agency $199/mo, Enterprise custom. 14-day free trial, no credit card required. All Three Sights included on every plan.',
  keywords: [
    'seosights pricing',
    'seo pricing',
    'aeo pricing',
    'geo pricing',
    'ai seo tool price',
    'white label seo pricing',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — seosights | SEO · AEO · GEO Plans from $19/mo',
    description:
      'Starter $19, Pro $79, Agency $199, Enterprise custom. 14-day free trial, no credit card required.',
    url: `${SITE_URL}/pricing`,
    type: 'website',
    images: [{ url: '/og-image.png', width: 1344, height: 768, alt: 'seosights Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'seosights Pricing — Plans from $19/mo',
    description: 'Starter $19, Pro $79, Agency $199, Enterprise custom. 14-day free trial.',
    images: ['/og-image.png'],
  },
}

// JSON-LD: Offer catalog
const offersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'seosights Pricing Plans',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Offer',
        name: 'Starter',
        price: '19',
        priceCurrency: 'USD',
        description: 'For website owners, bloggers, and small businesses.',
        url: `${SITE_URL}/pricing#starter`,
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Offer',
        name: 'Pro',
        price: '79',
        priceCurrency: 'USD',
        description: 'For SEO freelancers and growing marketing teams.',
        url: `${SITE_URL}/pricing#pro`,
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Offer',
        name: 'Agency',
        price: '199',
        priceCurrency: 'USD',
        description: 'White-label for agencies generating reports for clients.',
        url: `${SITE_URL}/pricing#agency`,
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'Offer',
        name: 'Enterprise',
        price: 'Custom',
        priceCurrency: 'USD',
        description: 'Done-for-you & custom.',
        url: `${SITE_URL}/pricing#enterprise`,
      },
    },
  ],
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_URL}/pricing` },
  ],
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offersJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-background to-background" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm rounded-full mb-6">
            One Platform. Three Sights. Zero Agency Fees.
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Pricing that scales{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              with your ambition
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            14-day free trial. No credit card required. No contracts — cancel anytime. All Three
            Sights (SEO · AEO · GEO) included on every plan.
          </p>
        </div>
      </section>

      {/* Pricing cards + comparison + FAQ all in client component */}
      <PricingPageClient />

      {/* Trust strip */}
      <section className="py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Cancel anytime
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SOC 2 ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              GDPR compliant
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 p-8 sm:p-12 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Still have questions?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Book a 20-minute call with our team. We will walk you through the platform, the Three
              Sights, and which plan fits your goals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#cta"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                Start free trial
              </Link>
              <a
                href="mailto:hello@seosights.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-foreground font-semibold rounded-lg transition-all duration-300"
              >
                Talk to sales
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
