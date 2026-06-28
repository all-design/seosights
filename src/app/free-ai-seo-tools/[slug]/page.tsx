import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { freeTools, getToolBySlug, getRelatedTools } from '@/data/free-tools'
import { ChevronRight } from 'lucide-react'
import ToolPageClient from './tool-page-client'

const SITE_URL = 'https://seosights.com'

export const dynamicParams = false

export function generateStaticParams() {
  return freeTools.map((tool) => ({ slug: tool.slug }))
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const tool = getToolBySlug(slug)
    if (!tool) return { title: 'Tool not found' }
    return {
      title: tool.metaTitle,
      description: tool.metaDescription,
      keywords: tool.keywords,
      alternates: { canonical: `/free-ai-seo-tools/${tool.slug}` },
      openGraph: {
        title: tool.metaTitle,
        description: tool.metaDescription,
        url: `${SITE_URL}/free-ai-seo-tools/${tool.slug}`,
        type: 'website',
        images: [{ url: '/og-image.png', width: 1344, height: 768, alt: tool.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: tool.metaTitle,
        description: tool.metaDescription,
        images: ['/og-image.png'],
      },
    }
  })
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = getToolBySlug(slug)
  if (!tool) notFound()
  const related = getRelatedTools(slug)

  // JSON-LD: WebApplication + FAQPage + BreadcrumbList
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/free-ai-seo-tools/${tool.slug}`,
    applicationCategory: 'SEO Utility',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free, no signup required',
    },
    publisher: { '@type': 'Organization', name: 'seosights', url: SITE_URL },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Free AI SEO Tools', item: `${SITE_URL}/free-ai-seo-tools` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}/free-ai-seo-tools/${tool.slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ToolPageClient tool={tool} related={related} />

      {/* Hidden semantic breadcrumb for crawlers */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/free-ai-seo-tools">Free AI SEO Tools</Link></li>
          <li>
            <span aria-current="page">{tool.name}</span>
            <ChevronRight className="inline w-3 h-3" aria-hidden="true" />
          </li>
        </ol>
      </nav>
    </>
  )
}
