import type { Metadata } from 'next'
import AffiliatesPageClient from './affiliates-page-client'

export const metadata: Metadata = {
  title: 'Affiliate Program — Earn Up to 50% Recurring Commission | seosights',
  description:
    'Promote the world\'s first unified SEO + AEO + GEO engine. 5-tier commission scale (10%–50% recurring), 60-day cookie, monthly payouts via Stripe/PayPal. No fees, no minimums.',
  keywords: [
    'SEO affiliate program',
    'AEO affiliate',
    'GEO affiliate',
    'recurring commission',
    'SaaS affiliate',
    'marketing affiliate program',
    'agency affiliate',
  ],
  openGraph: {
    title: 'Earn Up to 50% Recurring Commission with seosights',
    description:
      '5-tier commission scale, 60-day cookie, monthly payouts. Promote the Operating System for AI Search.',
    url: 'https://seosights.com/affiliates',
    siteName: 'seosights',
    type: 'website',
  },
  alternates: {
    canonical: 'https://seosights.com/affiliates',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Offer',
  name: 'seosights Affiliate Program',
  description:
    'Earn up to 50% recurring commission promoting the unified SEO + AEO + GEO engine.',
  url: 'https://seosights.com/affiliates',
  seller: {
    '@type': 'Organization',
    name: 'seosights',
    url: 'https://seosights.com',
  },
  eligibleCustomerType: 'Affiliate Marketers, SEO Agencies, Content Creators',
}

export default function AffiliatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AffiliatesPageClient />
    </>
  )
}
