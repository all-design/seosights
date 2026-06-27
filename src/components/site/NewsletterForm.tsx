'use client'

import { useState } from 'react'

/**
 * NewsletterForm — small client component for the blog newsletter signup.
 * Lives in its own file so the blog hub (server component) can render it
 * without passing event handlers across the server/client boundary.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 sm:p-10 text-center backdrop-blur-sm">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-emerald-400">
          You are subscribed ✓
        </h2>
        <p className="text-base text-muted-foreground">
          Look out for our next AI SEO briefing in your inbox. Unsubscribe anytime.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 p-8 sm:p-10 text-center backdrop-blur-sm">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">
        Get the weekly AI SEO briefing
      </h2>
      <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
        One email every Tuesday. What changed in ChatGPT, Claude, and Perplexity search —
        plus one actionable AEO tip. No spam, unsubscribe anytime.
      </p>
      <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 min-h-[48px] rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          aria-label="Email address"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 min-h-[48px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300"
        >
          Subscribe
        </button>
      </form>
    </div>
  )
}
