import type { Metadata } from 'next'
import DirectoryPageClient from './directory-page-client'

export const metadata: Metadata = {
  title: 'AI Visibility Directory™ — Top Companies Recommended by AI',
  description:
    'The only directory ranked by how AI recommends businesses. Not SEO. Not backlinks. AI recommendations. Browse companies by industry, location, and AI engine.',
  openGraph: {
    title: 'AI Visibility Directory™ — Top Companies Recommended by AI',
    description:
      'The only directory ranked by how AI recommends businesses. Not SEO. Not backlinks. AI recommendations.',
  },
}

export default function DirectoryPage() {
  return <DirectoryPageClient />
}
