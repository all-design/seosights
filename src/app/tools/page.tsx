import type { Metadata } from 'next'
import { freeTools } from '@/data/free-tools'
import ToolsPageClient from './tools-page-client'

const SITE_URL = 'https://seosights.com'

export const metadata: Metadata = {
  title: 'Free AI Visibility Tools — SeoSights',
  description:
    '200+ free tools to understand, measure and improve your AI Visibility. AI Visibility Checker, Schema Generator, Entity Analyzer, GEO Audit, AEO Audit and more. No signup required.',
  keywords: [
    'free ai visibility tools',
    'ai seo tools',
    'aeo tools',
    'geo tools',
    'ai visibility checker',
    'llms.txt generator',
    'schema generator',
    'entity analyzer',
    'ai search tools',
    'free seo tools',
  ],
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Free AI Visibility Tools — SeoSights',
    description:
      '200+ free tools to understand, measure and improve your AI Visibility. No signup required.',
    url: `${SITE_URL}/tools`,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1344,
        height: 768,
        alt: 'Free AI Visibility Tools by SeoSights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Visibility Tools — SeoSights',
    description:
      '200+ free tools to understand, measure and improve your AI Visibility. No signup required.',
    images: ['/og-image.png'],
  },
}

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Free AI Visibility Tools',
  description:
    '200+ free tools to understand, measure and improve your AI Visibility. No signup required.',
  itemListElement: freeTools.map((tool, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/free-ai-seo-tools/${tool.slug}`,
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Free AI Visibility Tools',
      item: `${SITE_URL}/tools`,
    },
  ],
}

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ToolsPageClient tools={freeTools} />
    </>
  )
}
