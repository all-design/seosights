import type { Metadata } from 'next'
import ComparePageClient from './compare-page-client'

export const metadata: Metadata = {
  title: 'SeoSights vs Competitors — AI Visibility Comparison',
  description:
    'See how AI Visibility Intelligence compares to traditional SEO tools like Ahrefs, Semrush, Surfer SEO, and AI writing tools. A new category. A new metric.',
  openGraph: {
    title: 'SeoSights vs Competitors — AI Visibility Comparison',
    description:
      'See how AI Visibility Intelligence compares to traditional SEO tools. A new category. A new metric.',
  },
}

export default function ComparePage() {
  return <ComparePageClient />
}
