'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedScoreProps {
  value: number
  delta?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDelta?: boolean
  className?: string
}

const sizeClasses: Record<NonNullable<AnimatedScoreProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
}

// EaseOutExpo: 1 - 2^(-10 * t)
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedScore({
  value,
  delta,
  size = 'md',
  showDelta = true,
  className,
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [glowing, setGlowing] = useState(false)
  const [deltaVisible, setDeltaVisible] = useState(false)
  const prevValueRef = useRef<number>(value)
  const isFirstRender = useRef(true)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startValueRef = useRef(0)

  const animateTo = useCallback(
    (from: number, to: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      const duration = Math.min(1200, 400 + Math.abs(to - from) * 8)

      startTimeRef.current = performance.now()
      startValueRef.current = from

      const step = (now: number) => {
        const elapsed = now - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutExpo(progress)
        const current = Math.round(startValueRef.current + (to - startValueRef.current) * eased)
        setDisplayValue(current)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    },
    []
  )

  useEffect(() => {
    const prev = prevValueRef.current

    if (isFirstRender.current) {
      // Initial mount animation from 0
      isFirstRender.current = false
      animateTo(0, value)
    } else if (value !== prev) {
      // Value changed — trigger glow + delta + animate
      // Use setTimeout(0) to avoid synchronous setState in effect body
      const glowOnTimer = setTimeout(() => setGlowing(true), 0)
      const deltaOnTimer =
        showDelta && delta !== undefined && delta !== 0
          ? setTimeout(() => setDeltaVisible(true), 0)
          : null
      animateTo(prev, value)

      const glowOffTimer = setTimeout(() => setGlowing(false), 600)
      const deltaOffTimer = setTimeout(() => setDeltaVisible(false), 1200)

      prevValueRef.current = value

      return () => {
        clearTimeout(glowOnTimer)
        clearTimeout(glowOffTimer)
        if (deltaOnTimer) clearTimeout(deltaOnTimer)
        clearTimeout(deltaOffTimer)
      }
    }
  }, [value, showDelta, delta, animateTo])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <motion.span
        className={cn(
          sizeClasses[size],
          'font-bold tabular-nums tracking-tight transition-all duration-300',
          glowing && 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]'
        )}
        animate={
          glowing
            ? { scale: [1, 1.05, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {displayValue}
      </motion.span>

      {/* +delta floating badge */}
      <AnimatePresence>
        {deltaVisible && delta !== undefined && delta !== 0 && (
          <motion.span
            className={cn(
              'absolute -top-2 -right-1 text-xs font-semibold pointer-events-none whitespace-nowrap',
              delta > 0 ? 'text-emerald-400' : 'text-red-400'
            )}
            initial={{ opacity: 0, y: 4, x: -8 }}
            animate={{ opacity: 1, y: -8, x: 0 }}
            exit={{ opacity: 0, y: -16, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {delta > 0 ? `+${delta}` : `${delta}`}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
