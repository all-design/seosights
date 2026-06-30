'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SHORTCUT_GROUPS } from './useKeyboardShortcuts'

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean
  onClose: () => void
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return true
  return /Mac|iPhone|iPad/.test(navigator.userAgent)
}

export default function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
  const mac = isMac()

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9997] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Overlay Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9998] w-[calc(100vw-2rem)] max-w-[480px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Keyboard Shortcuts
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                onClick={onClose}
                aria-label="Close shortcuts overlay"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Shortcuts List */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.heading}>
                  <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    {group.heading}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut) => {
                      const keys = mac ? shortcut.keys : shortcut.winKeys
                      return (
                        <div
                          key={shortcut.description}
                          className="flex items-center justify-between py-1.5"
                        >
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {keys.map((key, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 shadow-sm">
                                  {key}
                                </kbd>
                                {i < keys.length - 1 && (
                                  <span className="text-zinc-300 dark:text-zinc-600 text-xs">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400 text-center">
                Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-[9px]">?</kbd> to toggle this panel at any time
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
