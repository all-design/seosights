import type { Metadata } from 'next'
import SeoSightsPage from './SeoSightsPage'

/**
 * seosights.com — SaaS product landing page.
 * Observatory is at /observatory and ai.seosights.com
 */

export const metadata: Metadata = {
  title: 'seosights — Will AI Recommend Your Business?',
  description:
    'SeoSights helps companies understand, measure and improve how AI models recommend their business. Track your AI Visibility Score across ChatGPT, Claude, Gemini & Perplexity.',
}

export default function Home() {
  return <SeoSightsPage />
}
