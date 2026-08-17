'use client'

import Script from 'next/script'

/**
 * Google Analytics 4 component.
 * Loads gtag.js when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * In development: loads gtag + logs events to console for debugging.
 * In production: loads gtag silently.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const IS_DEV = process.env.NODE_ENV === 'development'

export default function GoogleAnalytics() {
  // Skip if no measurement ID
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.dataLayer = window.dataLayer || []
          window.gtag = function (...args: unknown[]) {
            window.dataLayer.push(args)
            // Log events in dev for debugging
            if (IS_DEV && args[0] === 'event') {
              console.log(`[GA4] event: ${args[1]}`, args[2] || '')
            }
          }
          window.gtag('js', new Date())
          window.gtag('config', GA_ID, {
            send_page_view: true,
            ...(IS_DEV ? { debug_mode: true } : {}),
            cookie_flags: 'SameSite=None;Secure',
          })
          if (IS_DEV) {
            console.log(`[GA4] Loaded with ID: ${GA_ID} (debug mode)`)
          }
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
