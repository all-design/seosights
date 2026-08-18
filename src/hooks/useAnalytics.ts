'use client'

import { useCallback } from 'react'
import { trackEvent } from '@/components/GoogleAnalytics'

/**
 * Hook for tracking GA4 events in React components.
 * Provides typed helpers for common seosights events.
 *
 * @example
 * const analytics = useAnalytics()
 * analytics.ctaClick('start_free_trial', 'hero')
 * analytics.auditStarted('example.com')
 */
export function useAnalytics() {
  const ctaClick = useCallback((button: string, location: string) => {
    trackEvent('cta_click', { button, location })
  }, [])

  const auditStarted = useCallback((domain: string) => {
    trackEvent('audit_started', { domain })
  }, [])

  const auditCompleted = useCallback((domain: string, score: number) => {
    trackEvent('audit_completed', { domain, score })
  }, [])

  const signupStarted = useCallback((method: string) => {
    trackEvent('signup_started', { method })
  }, [])

  const signupCompleted = useCallback((method: string, tier: string) => {
    trackEvent('signup_completed', { method, tier })
  }, [])

  const blogRead = useCallback((slug: string, category: string) => {
    trackEvent('blog_read', { slug, category })
  }, [])

  const pricingViewed = useCallback((tier: string) => {
    trackEvent('pricing_viewed', { tier })
  }, [])

  const checkoutStarted = useCallback((tier: string, price: number) => {
    trackEvent('checkout_started', { tier, price })
  }, [])

  const affiliateClick = useCallback((source: string) => {
    trackEvent('affiliate_click', { source })
  }, [])

  const custom = useCallback((eventName: string, params?: Record<string, unknown>) => {
    trackEvent(eventName, params)
  }, [])

  return {
    ctaClick,
    auditStarted,
    auditCompleted,
    signupStarted,
    signupCompleted,
    blogRead,
    pricingViewed,
    checkoutStarted,
    affiliateClick,
    custom,
  }
}
