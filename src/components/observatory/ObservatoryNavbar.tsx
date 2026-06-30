'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Satellite,
  Activity,
  BarChart3,
  Database,
  CloudSun,
  FileSearch,
  Shield,
  Menu,
  X,
} from 'lucide-react'

interface ObservatoryNavbarProps {
  onNavigate?: (section: string) => void
}

export default function ObservatoryNavbar({ onNavigate }: ObservatoryNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Simulated live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { id: 'pulse', label: 'Pulse', icon: Activity },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'index', label: 'Index', icon: BarChart3 },
    { id: 'archive', label: 'Archive', icon: Database },
    { id: 'charts', label: 'Charts', icon: FileSearch },
    { id: 'methodology', label: 'Methodology', icon: Shield },
  ]

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`observatory-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileOpen(false)
    onNavigate?.(id)
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-md border-b border-white/5 shadow-lg'
          : 'bg-slate-950/80 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Satellite className="w-6 h-6 text-emerald-400" />
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-tight">
                AI Search Observatory
              </span>
              <span className="text-[10px] font-mono text-emerald-400/70 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span>{liveCount.toLocaleString()} responses archived</span>
            </div>
            <Button
              size="sm"
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs h-7"
              onClick={() => scrollToSection('pulse')}
            >
              View Live Data
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/5"
        >
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 px-3 py-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                {liveCount.toLocaleString()} responses archived
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
