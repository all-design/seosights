'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

/**
 * SiteHeader — Link-based navigation for inner pages (not the landing scroll-nav).
 * Used on /free-ai-seo-tools, /pricing, /blog, /affiliates and their children.
 * Mirrors the landing Navbar visual style but every link is a real route.
 */
const siteNavLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Free Tools', href: '/free-ai-seo-tools' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Affiliates', href: '/affiliates' },
]

export default function SiteHeader({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]'
            : 'bg-background/40 backdrop-blur-md border-b border-white/5'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-start cursor-pointer select-none group">
              <span className="font-bold text-xl tracking-tight leading-none bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-indigo-300 group-hover:to-blue-300 transition-all">
                seosights
              </span>
              <span className="text-[8px] tracking-[0.2em] text-purple-400/60 uppercase leading-none mt-0.5">
                LOVE AT FIRST SIGHT
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {siteNavLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2.5 min-h-[44px] inline-flex items-center text-sm rounded-lg transition-all duration-200 ${
                    isActive(link.href)
                      ? 'text-foreground bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
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
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Spacer so content does not hide under fixed header */}
      <div className="h-16" aria-hidden="true" />

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
                {siteNavLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full text-left px-4 py-3.5 min-h-[48px] rounded-lg transition-all duration-200 ${
                      isActive(link.href)
                        ? 'text-foreground bg-white/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
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
