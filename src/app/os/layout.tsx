import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Visibility OS™ — SeoSights',
  description:
    'Your operating system for AI visibility. Executive, Builder, and Developer modes. AI Executive Mode, Growth Brain, Confidence Learning, and Memory Graph.',
}

export default function OSLayout({ children }: { children: React.ReactNode }) {
  return children
}
