'use client'

import { useMemo } from 'react'
import SeoSightsPage from './SeoSightsPage'
import ObservatoryPage from './ObservatoryPage'

/**
 * Host-based routing:
 * - ai.seosights.com → Observatory (standalone research product)
 * - seosights.com / localhost → SeoSights SaaS landing page
 *
 * In development/sandbox, use ?view=observatory to preview Observatory.
 * Default is the SeoSights SaaS landing page.
 */

export default function Home() {
  const view = useMemo(() => {
    if (typeof window === 'undefined') return 'seo'
    const host = window.location.hostname
    const isObservatorySubdomain = host.startsWith('ai.') || host === 'ai.seosights.com'
    const params = new URLSearchParams(window.location.search)
    const viewParam = params.get('view')
    if (isObservatorySubdomain || viewParam === 'observatory') return 'observatory'
    return 'seo'
  }, [])

  if (view === 'observatory') {
    return <ObservatoryPage />
  }

  return <SeoSightsPage />
}
