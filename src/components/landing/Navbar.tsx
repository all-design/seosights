'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '/#features', external: true },
  { label: 'Free Tools', href: '/free-ai-seo-tools', external: true },
  { label: 'Pricing', href: '/pricing', external: true },
  { label: 'Observatory', href: '/observatory', external: true },
  { label: 'Blog', href: '/blog', external: true },
  { label: 'Affiliates', href: '/affiliates', external: true },
  { label: 'How It Works', href: '/#how-it-works', external: true },
]

export default function Navbar({ onStartFree }: { onStartFree?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Trigger the global admin logo click handler if available
    const globalClick = (window as unknown as Record<string, unknown>).__seosightsLogoClick
    if (typeof globalClick === 'function') {
      ;(globalClick as () => void)()
    }
  }

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Text-only Logo */}
            <div
              className="flex flex-col items-start cursor-pointer select-none"
              onClick={handleLogoClick}
            >
              <span className="font-bold text-xl tracking-tight leading-none bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                seosights
              </span>
              <span className="text-[8px] tracking-[0.2em] text-purple-400/60 uppercase leading-none mt-0.5">
                AI Visibility Intelligence
              </span>
            </div>

            {/* Powered by AI Router™ badge */}
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Powered by AI Router™
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) =>
                link.external ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2.5 min-h-[44px] inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className="px-4 py-2.5 min-h-[44px] inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
                  >
                    {link.label}
                  </button>
                )
              )}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300"
                onClick={onStartFree}
              >
                Analyze Site
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) =>
                  link.external ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block w-full text-left px-4 py-3.5 min-h-[48px] text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      onClick={() => scrollToSection(link.href)}
                      className="block w-full text-left px-4 py-3.5 min-h-[48px] text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
                    >
                      {link.label}
                    </button>
                  )
                )}
                <div className="pt-2">
                  <Button
                    onClick={onStartFree}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold"
                  >
                    Analyze Site
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
