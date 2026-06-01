'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Globe, Loader2 } from 'lucide-react'

const steps = [
  { label: 'Scanning your website', icon: '🔍' },
  { label: 'Analyzing content & structure', icon: '📄' },
  { label: 'Checking AI citation landscape', icon: '🤖' },
  { label: 'Running AI-powered SEO analysis', icon: '⚡' },
  { label: 'Parsing analysis results', icon: '📊' },
  { label: 'Finalizing your strategy', icon: '🎯' },
]

export default function AnalyzingView() {
  const { targetUrl, analysisProgress, analysisStep } = useAppStore()

  const currentStepIndex = steps.findIndex(
    (s) => analysisStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0].toLowerCase())
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/10 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
        {/* Animated Globe */}
        <motion.div
          className="w-24 h-24 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8"
          animate={{
            boxShadow: [
              '0 0 30px rgba(16,185,129,0.2)',
              '0 0 60px rgba(16,185,129,0.4)',
              '0 0 30px rgba(16,185,129,0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Globe className="w-12 h-12 text-emerald-400" />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Analyzing Your Site
        </motion.h2>

        {/* URL */}
        <motion.p
          className="text-emerald-400 font-mono text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {targetUrl}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${analysisProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Progress Percentage & Step */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-muted-foreground">{analysisStep}</span>
          <span className="text-sm font-mono text-emerald-400">{analysisProgress}%</span>
        </div>

        {/* Step Indicators */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isActive = i === currentStepIndex
            const isDone = i < currentStepIndex || analysisProgress > 90
            return (
              <motion.div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : isDone
                    ? 'bg-white/5 border border-white/5 opacity-60'
                    : 'bg-transparent border border-transparent opacity-30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-lg">{step.icon}</span>
                <span className={`text-sm ${isActive ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
                {isActive && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin ml-auto" />}
                {isDone && !isActive && <span className="ml-auto text-emerald-500">✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
