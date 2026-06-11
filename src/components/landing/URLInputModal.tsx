'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Globe, ArrowRight, MapPin, Bot, User } from 'lucide-react'
import { useAppStore, AnalysisMode } from '@/lib/store'

const markets = [
  { value: 'Global', label: '🌍 Global' },
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Spain', label: '🇪🇸 Spain' },
  { value: 'Italy', label: '🇮🇹 Italy' },
  { value: 'Netherlands', label: '🇳🇱 Netherlands' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Brazil', label: '🇧🇷 Brazil' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'Serbia', label: '🇷🇸 Serbia' },
  { value: 'Croatia', label: '🇭🇷 Croatia' },
  { value: 'Bosnia', label: '🇧🇦 Bosnia & Herzegovina' },
  { value: 'Montenegro', label: '🇲🇪 Montenegro' },
  { value: 'Austria', label: '🇦🇹 Austria' },
  { value: 'Switzerland', label: '🇨🇭 Switzerland' },
  { value: 'Sweden', label: '🇸🇪 Sweden' },
  { value: 'Norway', label: '🇳🇴 Norway' },
  { value: 'Denmark', label: '🇩🇰 Denmark' },
  { value: 'Finland', label: '🇫🇮 Finland' },
  { value: 'Poland', label: '🇵🇱 Poland' },
  { value: 'Czech Republic', label: '🇨🇿 Czech Republic' },
  { value: 'Romania', label: '🇷🇴 Romania' },
  { value: 'Belgium', label: '🇧🇪 Belgium' },
  { value: 'Portugal', label: '🇵🇹 Portugal' },
  { value: 'Ireland', label: '🇮🇪 Ireland' },
  { value: 'Mexico', label: '🇲🇽 Mexico' },
  { value: 'South Korea', label: '🇰🇷 South Korea' },
  { value: 'UAE', label: '🇦🇪 UAE' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'South Africa', label: '🇿🇦 South Africa' },
]

interface URLInputModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function URLInputModal({ isOpen, onClose }: URLInputModalProps) {
  const [url, setUrl] = useState('')
  const [market, setMarket] = useState('Global')
  const [mode, setMode] = useState<AnalysisMode>('auto-pilot')
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
    startAnalysis(cleanUrl, market, mode)
    onClose()
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
                Analyze Your Website
              </h3>
              <p className="text-muted-foreground text-center mb-8">
                Full SEO · AEO · GEO analysis with E-E-A-T, AI crawler, and brand signals.
              </p>

              {/* Input Fields */}
              <div className="space-y-4">
                {/* URL Input */}
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

                {/* Market Selector */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 z-10" />
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger className="pl-12 h-14 bg-white/5 border-white/10 focus:border-emerald-500/50 text-lg">
                      <SelectValue placeholder="Select target market" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 max-h-64">
                      {markets.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-base">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Execution Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('auto-pilot')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        mode === 'auto-pilot'
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        mode === 'auto-pilot' ? 'bg-emerald-500/20' : 'bg-white/5'
                      }`}>
                        <Bot className={`w-5 h-5 ${mode === 'auto-pilot' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-sm font-semibold ${mode === 'auto-pilot' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        Auto-Pilot
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 text-center leading-tight">
                        Agents execute automatically
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('co-pilot')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        mode === 'co-pilot'
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        mode === 'co-pilot' ? 'bg-amber-500/20' : 'bg-white/5'
                      }`}>
                        <User className={`w-5 h-5 ${mode === 'co-pilot' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-sm font-semibold ${mode === 'co-pilot' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        Co-Pilot
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 text-center leading-tight">
                        Agents need your approval
                      </span>
                    </button>
                  </div>
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
                  {mode === 'auto-pilot' ? 'Analyze My Site' : 'Analyze & Review Actions'}
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
