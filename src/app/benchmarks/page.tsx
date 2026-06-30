import type { Metadata } from 'next'
import BenchmarksPageClient from './benchmarks-page-client'

export const metadata: Metadata = {
  title: 'AI Visibility Benchmarks — Public Rankings',
  description:
    'Public AI Visibility rankings powered by the AI Search Observatory™. Real-time data. Transparent methodology. See which companies AI recommends most.',
  openGraph: {
    title: 'AI Visibility Benchmarks — Public Rankings',
    description:
      'Public AI Visibility rankings powered by the AI Search Observatory™. Real-time data. Transparent methodology.',
  },
}

export default function BenchmarksPage() {
  return <BenchmarksPageClient />
}
