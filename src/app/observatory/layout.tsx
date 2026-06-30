import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Search Observatory™ — Independent Research Center for AI Model Analysis',
  description:
    'AI Search Observatory™ is an independent research center that daily analyzes the behavior of leading AI models. Real data, no fluff. AI Search Weather™, Observatory Index™, AI Search Archive™, and Public Charts.',
}

export default function ObservatoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
