'use client'

/**
 * Global Error Boundary — catches errors not caught by any route-level error.tsx.
 *
 * This is the last line of defense. When this renders, the entire layout is
 * unmounted, so we must render our own <html> and <body> tags.
 *
 * We keep it minimal to avoid depending on any layout components that might
 * themselves be broken.
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalErrorBoundary]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0a0a0a',
        color: '#e5e7eb',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(239,68,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          {error.message && (
            <details style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <summary style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>
                Error details
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                overflow: 'auto',
                maxHeight: '8rem',
              }}>
                {error.message}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
