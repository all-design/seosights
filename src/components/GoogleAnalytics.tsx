'use client'

import Script from 'next/script'

/**
 * Google Analytics 4 component.
 * Loads gtag.js only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * Works in production only (skipped in dev to avoid polluting real data).
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GoogleAnalytics() {
  // Skip if no measurement ID or in development
  if (!GA_ID || process.env.NODE_ENV === 'development') return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.dataLayer = window.dataLayer || []
          window.gtag = function (...args: unknown[]) {
            window.dataLayer.push(args)
          }
          window.gtag('js', new Date())
          window.gtag('config', GA_ID, {
            send_page_view: true, // automatic page views with Next.js router
            cookie_flags: 'SameSite=None;Secure',
          })
        }}
      />
    </>
  )
}

/**
 * Track a custom event in GA4.
 * Safe to call anywhere — no-ops if gtag isn't loaded.
 *
 * @example
 * trackEvent('cta_click', { button: 'start_free_trial', location: 'hero' })
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

/**
 * Track a page view manually (useful for SPAs or custom routing).
 */
export function trackPageView(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_ID, { page_path: url })
}
