'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// ── HeroSkeleton ─────────────────────────────────────────────────────────
// Matches HeroSection layout: headline, subtext, URL input, scan button

export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24',
        className
      )}
    >
      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <Skeleton className="mx-auto h-6 w-40 rounded-full mb-6" />

        {/* Headline */}
        <Skeleton className="mx-auto h-12 w-full max-w-3xl mb-4" />
        <Skeleton className="mx-auto h-12 w-2/3 max-w-xl mb-6" />

        {/* Subtext */}
        <Skeleton className="mx-auto h-5 w-full max-w-xl mb-8" />
        <Skeleton className="mx-auto h-5 w-2/3 max-w-md mb-10" />

        {/* URL input row */}
        <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 w-28 rounded-lg" />
        </div>

        {/* Score rings placeholder (appears after scan) */}
        <div className="mt-12 flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── DashboardPreviewSkeleton ──────────────────────────────────────────────
// Matches DashboardPreview layout: tabs, KPI cards, chart area, engine pills

export function DashboardPreviewSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn('px-4 sm:px-6 py-16 sm:py-24', className)}>
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-72 mx-auto mb-10" />

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>

        {/* Dashboard card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Chart area */}
          <Skeleton className="h-48 w-full rounded-lg mb-4" />

          {/* Engine pills row */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FeaturesSkeleton ─────────────────────────────────────────────────────
// Matches FeaturesSection layout: 3 sight categories with feature cards

export function FeaturesSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn('px-4 sm:px-6 py-16 sm:py-24', className)}>
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <Skeleton className="h-8 w-56 mx-auto mb-2" />
        <Skeleton className="h-5 w-80 mx-auto mb-12" />

        {/* 3 category columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, catIdx) => (
            <div
              key={catIdx}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 space-y-4"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>

              {/* Feature rows */}
              {Array.from({ length: 5 }).map((_, featIdx) => (
                <div key={featIdx} className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Additional features row */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2 p-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
