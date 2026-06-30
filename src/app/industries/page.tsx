import type { Metadata } from 'next'
import IndustriesPageClient from './industries-page-client'

const SITE_URL = 'https://seosights.com'

export const metadata: Metadata = {
  title: 'AI Visibility by Industry — SeoSights',
  description:
    'See how AI recommends businesses in your industry. Real-time AI Visibility Scores, real citations, and real recommendations across ChatGPT, Claude, Gemini, Perplexity and more.',
  keywords: [
    'ai visibility by industry',
    'ai search optimization',
    'chatgpt visibility',
    'ai recommendation score',
    'aeo industry',
    'geo industry',
    'ai search ranking',
  ],
  alternates: { canonical: '/industries' },
  openGraph: {
    title: 'AI Visibility by Industry — SeoSights',
    description:
      'See how AI recommends businesses in your industry. Real-time scores, real citations, real recommendations.',
    url: `${SITE_URL}/industries`,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1344,
        height: 768,
        alt: 'AI Visibility by Industry — SeoSights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Visibility by Industry — SeoSights',
    description:
      'See how AI recommends businesses in your industry. Real-time scores, real citations, real recommendations.',
    images: ['/og-image.png'],
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'AI Visibility by Industry',
      item: `${SITE_URL}/industries`,
    },
  ],
}

export default function IndustriesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <IndustriesPageClient />
    </>
  )
}
