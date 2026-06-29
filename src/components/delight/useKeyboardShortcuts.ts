'use client'

import { useEffect, useCallback, useState } from 'react'

interface UseKeyboardShortcutsOptions {
  onToggleAI?: () => void
  onToggleShortcutsHelp?: () => void
  onCloseAll?: () => void
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    onToggleAI,
    onToggleShortcutsHelp,
    onCloseAll,
  } = options

  const [helpVisible, setHelpVisible] = useState(false)

  const toggleHelp = useCallback(() => {
    setHelpVisible(prev => !prev)
  }, [])

  const closeHelp = useCallback(() => {
    setHelpVisible(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey
      const isCtrl = e.ctrlKey
      const isShift = e.shiftKey

      // Cmd/Ctrl + K — Toggle Spotlight
      if ((isMeta || isCtrl) && !isShift && e.key === 'k') {
        // Handled by SpotlightSearch component itself
        return
      }

      // Cmd/Ctrl + Shift + A — Open Admin
      if ((isMeta || isCtrl) && isShift && e.key === 'A') {
        // Handled by existing page.tsx shortcut
        return
      }

      // Cmd/Ctrl + . — Toggle Floating AI Assistant
      if ((isMeta || isCtrl) && e.key === '.') {
        e.preventDefault()
        // Dispatch custom event that FloatingAIAssistant listens for
        window.dispatchEvent(new CustomEvent('seosights:toggle-ai'))
        onToggleAI?.()
        return
      }

      // ? — Show keyboard shortcuts help (only when not in an input)
      if (e.key === '?' && !isMeta && !isCtrl && !isShift) {
        const target = e.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isInput) {
          e.preventDefault()
          if (onToggleShortcutsHelp) {
            onToggleShortcutsHelp()
          } else {
            toggleHelp()
          }
          return
        }
      }

      // Escape — Close any open overlay
      if (e.key === 'Escape') {
        onCloseAll?.()
        setHelpVisible(false)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleAI, onToggleShortcutsHelp, onCloseAll, toggleHelp])

  return {
    helpVisible,
    toggleHelp,
    closeHelp,
  }
}

// Export the shortcuts definition for the overlay to use
export const SHORTCUT_GROUPS = [
  {
    heading: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open Spotlight Search', winKeys: ['Ctrl', 'K'] },
      { keys: ['Esc'], description: 'Close any open overlay', winKeys: ['Esc'] },
    ],
  },
  {
    heading: 'AI Assistant',
    shortcuts: [
      { keys: ['⌘', '.'], description: 'Toggle Floating AI Assistant', winKeys: ['Ctrl', '.'] },
    ],
  },
  {
    heading: 'Admin',
    shortcuts: [
      { keys: ['⌘', '⇧', 'A'], description: 'Open Superadmin Panel', winKeys: ['Ctrl', 'Shift', 'A'] },
      { keys: ['⌘', '⇧', 'W'], description: 'Open Webhooks Panel', winKeys: ['Ctrl', 'Shift', 'W'] },
      { keys: ['⌘', '⇧', 'F'], description: 'Open Affiliate Portal', winKeys: ['Ctrl', 'Shift', 'F'] },
      { keys: ['⌘', '⇧', 'O'], description: 'Open Operations Center', winKeys: ['Ctrl', 'Shift', 'O'] },
    ],
  },
  {
    heading: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts', winKeys: ['?'] },
    ],
  },
] as const

export type ShortcutGroup = typeof SHORTCUT_GROUPS[number]
export type ShortcutEntry = ShortcutGroup['shortcuts'][number]
