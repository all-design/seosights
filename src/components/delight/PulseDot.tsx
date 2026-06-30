'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PulseDotProps {
  color?: 'green' | 'amber' | 'red'
  size?: 'sm' | 'md'
  pulse?: boolean
  className?: string
}

const colorMap: Record<NonNullable<PulseDotProps['color']>, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

const sizeMap: Record<NonNullable<PulseDotProps['size']>, string> = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
}

export function PulseDot({
  color = 'green',
  size = 'sm',
  pulse = true,
  className,
}: PulseDotProps) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Pulse ring */}
      {pulse && (
        <motion.span
          className={cn(
            'absolute rounded-full',
            colorMap[color],
            size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Core dot */}
      <span
        className={cn(
          'relative rounded-full',
          colorMap[color],
          sizeMap[size]
        )}
      />
    </span>
  )
}
