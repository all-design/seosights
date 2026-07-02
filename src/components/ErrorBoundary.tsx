'use client'

import React from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — class component (required by React API).
 *
 * Catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Features:
 *   - Shows error message and retry button
 *   - Logs errors to console for debugging
 *   - "Reset" button resets the error state
 *   - "Go Home" button navigates back to landing page
 *   - Configurable fallback title and message per boundary instance
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = (): void => {
    // Use the Zustand store to navigate back to landing view
    import('@/lib/store').then(({ useAppStore }) => {
      const store = useAppStore.getState()
      store.setView('landing')
    }).catch(() => {
      // Fallback: use window.location
      window.location.href = '/'
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Something went wrong'
      const message = this.props.fallbackMessage || 'An unexpected error occurred. You can try again or go back to the home page.'

      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Error details
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
