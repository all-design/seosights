'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedScore } from '@/components/delight/AnimatedScore'

interface MetricCardProps {
  label: string
  value: number
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  progress?: number
  format?: 'number' | 'percent' | 'currency'
  className?: string
}

function formatValue(value: number, format: NonNullable<MetricCardProps['format']>): string {
  switch (format) {
    case 'percent':
      return `${value}%`
    case 'currency':
      return `$${value.toLocaleString()}`
    case 'number':
    default:
      return value.toLocaleString()
  }
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  progress,
  format = 'number',
  className,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn('group relative', className)}
    >
      {/* Emerald border glow on hover */}
      <div
        className={cn(
          'absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none'
        )}
      />

      <Card
        className={cn(
          'relative overflow-hidden transition-shadow duration-300',
          'group-hover:shadow-lg group-hover:shadow-emerald-500/5',
          'border-zinc-200 dark:border-zinc-800'
        )}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            {/* Label + icon */}
            <div className="flex items-center gap-2 min-w-0">
              {icon && (
                <div className="flex-shrink-0 text-zinc-400 dark:text-zinc-500">
                  {icon}
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate">{label}</span>
            </div>

            {/* Delta badge */}
            {delta !== undefined && delta !== 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-medium flex-shrink-0',
                  isPositive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  isNegative && 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                )}
              >
                {isPositive ? '+' : ''}{delta}
                {deltaLabel && <span className="ml-1 opacity-70">{deltaLabel}</span>}
              </Badge>
            )}
          </div>

          {/* Animated value */}
          <div className="mt-2 flex items-baseline gap-1">
            {format === 'number' ? (
              <AnimatedScore
                value={value}
                delta={delta}
                size="lg"
                showDelta={false}
              />
            ) : (
              <span className="text-6xl font-bold tabular-nums tracking-tight">
                {formatValue(value, format)}
              </span>
            )}
          </div>

          {/* Optional progress bar */}
          {progress !== undefined && (
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
