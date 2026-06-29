'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Home,
  DollarSign,
  BookOpen,
  Wrench,
  Users,
  Shield,
  Brain,
  Camera,
  Play,
  PenTool,
  GraduationCap,
  Search,
  FileText,
  Code2,
  Bot,
  BarChart3,
  Zap,
  HelpCircle,
  Mail,
  LayoutDashboard,
  Target,
} from 'lucide-react'

interface SpotlightItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
}

interface SpotlightCategory {
  heading: string
  items: SpotlightItem[]
}

export default function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const closeSpotlight = useCallback(() => {
    setIsOpen(false)
  }, [])

  const navigateTo = useCallback((path: string) => {
    closeSpotlight()
    // In a single-page app context, we scroll to sections or trigger actions
    if (path.startsWith('#')) {
      const el = document.querySelector(path)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener')
    }
  }, [closeSpotlight])

  const triggerAction = useCallback((action: string) => {
    closeSpotlight()
    switch (action) {
      case 'analyze':
        // Trigger the URL input modal via custom event
        window.dispatchEvent(new CustomEvent('seosights:open-modal'))
        break
      case 'demo':
        window.dispatchEvent(new CustomEvent('seosights:open-modal'))
        break
      case 'dashboard':
        window.dispatchEvent(new CustomEvent('seosights:open-modal'))
        break
      case 'mission':
        // Open admin panel via keyboard shortcut simulation
        window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'A' }))
        break
      default:
        break
    }
  }, [closeSpotlight])

  const categories: SpotlightCategory[] = [
    {
      heading: 'Pages',
      items: [
        { id: 'page-home', label: 'Home', icon: Home, action: () => navigateTo('#hero') },
        { id: 'page-pricing', label: 'Pricing', icon: DollarSign, shortcut: 'P', action: () => navigateTo('#pricing') },
        { id: 'page-blog', label: 'Blog', icon: BookOpen, action: () => navigateTo('#features') },
        { id: 'page-tools', label: 'Free Tools', icon: Wrench, shortcut: 'T', action: () => navigateTo('#free-tools') },
        { id: 'page-affiliates', label: 'Affiliates', icon: Users, action: () => navigateTo('#affiliate') },
        { id: 'page-superadmin', label: 'Superadmin', icon: Shield, shortcut: '⇧⌘A', action: () => triggerAction('mission') },
      ],
    },
    {
      heading: 'Features',
      items: [
        { id: 'feat-score', label: 'AI Visibility Score', icon: BarChart3, action: () => navigateTo('#features') },
        { id: 'feat-recorder', label: 'Recorder', icon: Camera, action: () => navigateTo('#recorder') },
        { id: 'feat-replay', label: 'Replay', icon: Play, action: () => navigateTo('#replay') },
        { id: 'feat-engine', label: 'Content Engine', icon: PenTool, action: () => navigateTo('#features') },
        { id: 'feat-learning', label: 'Learning System', icon: GraduationCap, action: () => navigateTo('#features') },
        { id: 'feat-growth-brain', label: 'Growth Brain', icon: Brain, action: () => navigateTo('#features') },
      ],
    },
    {
      heading: 'Tools',
      items: [
        { id: 'tool-visibility', label: 'AI Visibility Checker', icon: Search, action: () => navigateTo('#free-tools') },
        { id: 'tool-llmstxt', label: 'llms.txt Generator', icon: FileText, action: () => navigateTo('#free-tools') },
        { id: 'tool-schema', label: 'Schema Generator', icon: Code2, action: () => navigateTo('#free-tools') },
        { id: 'tool-robots', label: 'Robots.txt Tester', icon: Bot, action: () => navigateTo('#free-tools') },
      ],
    },
    {
      heading: 'Actions',
      items: [
        { id: 'action-analyze', label: 'Analyze Site', icon: Target, shortcut: '⌘↵', action: () => triggerAction('analyze') },
        { id: 'action-demo', label: 'Run Free Demo', icon: Zap, action: () => triggerAction('demo') },
        { id: 'action-dashboard', label: 'View Dashboard', icon: LayoutDashboard, action: () => triggerAction('dashboard') },
        { id: 'action-mission', label: 'Execute Mission', icon: Brain, action: () => triggerAction('mission') },
      ],
    },
    {
      heading: 'Help',
      items: [
        { id: 'help-how', label: 'How It Works', icon: HelpCircle, action: () => navigateTo('#how-it-works') },
        { id: 'help-api', label: 'API Docs', icon: Code2, action: () => navigateTo('https://docs.seosights.com') },
        { id: 'help-contact', label: 'Contact Support', icon: Mail, action: () => navigateTo('#footer') },
      ],
    },
  ]

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
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={closeSpotlight}
          />

          {/* Spotlight Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-[640px]"
          >
            <Command className="rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-950">
              <CommandInput placeholder="Search pages, features, tools, actions..." />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>No results found. Try a different search term.</CommandEmpty>
                {categories.map((category) => (
                  <CommandGroup key={category.heading} heading={category.heading}>
                    {category.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.label} ${category.heading}`}
                          onSelect={item.action}
                          className="cursor-pointer"
                        >
                          <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <CommandShortcut>
                              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                                {item.shortcut}
                              </kbd>
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
              <div className="border-t border-zinc-200 dark:border-zinc-700 px-3 py-2 flex items-center gap-4 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono">Esc</kbd>
                  Close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
