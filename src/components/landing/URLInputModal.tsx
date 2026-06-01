'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Globe, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface URLInputModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function URLInputModal({ isOpen, onClose }: URLInputModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const { startAnalysis } = useAppStore()

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('Please enter a website URL')
      return
    }

    let cleanUrl = url.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    try {
      new URL(cleanUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setError('')
    // This sets the URL and switches to 'analyzing' view
    // The AnalyzingView component will handle the actual API call
    startAnalysis(cleanUrl)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-4"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)]">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-emerald-400" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center mb-2">
                Enter Your Website URL
              </h3>
              <p className="text-muted-foreground text-center mb-8">
                We&apos;ll analyze your site and generate a complete AI SEO strategy with backlink insights.
              </p>

              {/* URL Input */}
              <div className="space-y-4">
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit()
                    }}
                    placeholder="yourwebsite.com"
                    className="pl-12 h-14 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 text-lg placeholder:text-muted-foreground/40"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    className="text-rose-400 text-sm text-center"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg h-14 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
                >
                  Analyze My Site
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground/50">
                <span>Free Analysis</span>
                <span>•</span>
                <span>No Credit Card</span>
                <span>•</span>
                <span>Full Report</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
