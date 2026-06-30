import type { Metadata } from 'next'
import SeoSightsPage from './SeoSightsPage'

/**
 * seosights.com — AI Visibility Intelligence Platform.
 * Understand, Measure, Improve how AI recommends your business.
 */

export const metadata: Metadata = {
  title: 'seosights — AI Visibility Intelligence Platform',
  description:
    'Understand, measure and improve how AI recommends your business. Track your AI Visibility Score across ChatGPT, Claude, Gemini & Perplexity. Daily updates. 40+ signals.',
}

export default function Home() {
  return <SeoSightsPage />
}
