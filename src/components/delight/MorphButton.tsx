'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

interface MorphButtonProps {
  onClick: () => Promise<void>
  children: React.ReactNode
  loadingLabel?: string
  successLabel?: string
  errorLabel?: string
  className?: string
  disabled?: boolean
}

export function MorphButton({
  onClick,
  children,
  successLabel = 'Done ✓',
  errorLabel = 'Error',
  className,
  disabled = false,
}: MorphButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')

  const handleClick = useCallback(async () => {
    if (state !== 'idle' || disabled) return

    setState('loading')
    try {
      await onClick()
      setState('success')
      setTimeout(() => setState('idle'), 1500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 1200)
    }
  }, [onClick, state, disabled])

  // Shared dimensions: the button is always at least the height of the idle state
  const isCompact = state === 'loading' || state === 'success'

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state !== 'idle'}
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center',
        'font-medium rounded-lg transition-colors',
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
        'text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        state === 'error' && 'bg-red-600 hover:bg-red-700',
        className
      )}
      animate={{
        width: isCompact ? 44 : 'auto',
        paddingLeft: isCompact ? 0 : undefined,
        paddingRight: isCompact ? 0 : undefined,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Error shake animation */}
      <motion.div
        className="flex items-center justify-center"
        animate={
          state === 'error'
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="px-5 py-2.5 whitespace-nowrap"
            >
              {children}
            </motion.span>
          )}

          {state === 'loading' && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                opacity: { duration: 0.15 },
                scale: { duration: 0.2 },
                rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
              }}
              className="flex items-center justify-center w-5 h-5"
            >
              <Loader2 className="w-5 h-5" />
            </motion.span>
          )}

          {state === 'success' && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center justify-center w-5 h-5"
            >
              <Check className="w-5 h-5" />
            </motion.span>
          )}

          {state === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center justify-center w-5 h-5"
            >
              <X className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Success expanded label (appears after checkmark) */}
      <AnimatePresence>
        {state === 'success' && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden whitespace-nowrap pr-4 pl-1 text-sm"
          >
            {successLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
