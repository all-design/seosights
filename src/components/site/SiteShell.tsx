'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/**
 * SiteShell — shared page wrapper for inner routes.
 * Renders SiteHeader (with a Link-based "Analyze Site" CTA) + main + SiteFooter.
 * The footer sticks to the bottom of the viewport when content is short
 * (min-h-screen flex flex-col + mt-auto on footer) per the project's UI rules.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader onStartFree={undefined} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

/**
 * SiteAnalyzeButton — used in inner page heroes instead of a callback.
 * Routes to the homepage with the analyze intent encoded in the hash.
 */
export function SiteAnalyzeButton({
  className,
  children,
  variant = 'default',
}: {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
}) {
  return (
    <Link href="/#cta" className={className}>
      <Button
        variant={variant}
        className={
          variant === 'default'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300'
            : ''
        }
      >
        {children}
      </Button>
    </Link>
  )
}
