'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Lock, TrendingUp, AlertTriangle, ShieldAlert, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ── Radial Progress Ring ──────────────────────────────────────
function RadialProgress({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 8,
  trackColor,
  progressColor,
  label,
  subtitle,
  subtitleIcon,
  urgencyLevel,
  agencyHoursSaved,
}: {
  value: number
  maxValue?: number
  size?: number
  strokeWidth?: number
  trackColor: string
  progressColor: string
  label: string
  subtitle?: string
  subtitleIcon?: React.ReactNode
  urgencyLevel?: 'good' | 'warning' | 'critical'
  agencyHoursSaved?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / maxValue) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-black text-2xl leading-none"
            style={{ color: progressColor }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {value}
          </motion.span>
          <span className="text-xs text-muted-foreground mt-0.5">/100</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {subtitle && (
          <div className="flex items-center justify-center gap-1 mt-1">
            {subtitleIcon || (
              urgencyLevel === 'good' ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : urgencyLevel === 'warning' ? (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-rose-400" />
              )
            )}
            <span
              className={`text-xs font-medium ${
                urgencyLevel === 'good'
                  ? 'text-emerald-400'
                  : urgencyLevel === 'warning'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {subtitle}
            </span>
          </div>
        )}
        {agencyHoursSaved !== undefined && agencyHoursSaved > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-400">
              ~{agencyHoursSaved}h agencije uštedeno
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main KPI Widgets Component ────────────────────────────────
export default function KPIWidgets() {
  const { analysis, mode } = useAppStore()

  const seoScore = analysis?.overallScores?.seo ?? 78
  const aeoScore = analysis?.overallScores?.aeo ?? 45
  const geoScore = analysis?.overallScores?.geo ?? 12

  const getUrgency = (score: number): 'good' | 'warning' | 'critical' => {
    if (score >= 70) return 'good'
    if (score >= 40) return 'warning'
    return 'critical'
  }

  // Agency hours saved estimates (would come from Tech & Schema agent in production)
  const totalAgencyHours = 12.5

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* ── 1st Sight: SEO ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm">
            {/* Decorative glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
            <CardContent className="relative pt-6 pb-6 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  1st Sight — SEO Score
                </span>
              </div>
              <RadialProgress
                value={seoScore}
                trackColor="rgba(168, 85, 247, 0.1)"
                progressColor={seoScore >= 70 ? '#a855f7' : seoScore >= 40 ? '#f59e0b' : '#ef4444'}
                label="Traditional SEO"
                subtitle={seoScore >= 70 ? '+3 pozicije na Google-u ove nedelje' : seoScore >= 40 ? 'Umereno — zahteva pažnju' : 'Kritično — hitna akcija potrebna'}
                urgencyLevel={getUrgency(seoScore)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 2nd Sight: AEO ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none" />
            <CardContent className="relative pt-6 pb-6 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  2nd Sight — AEO Score
                </span>
              </div>
              <RadialProgress
                value={aeoScore}
                trackColor="rgba(59, 130, 246, 0.1)"
                progressColor={aeoScore >= 70 ? '#3b82f6' : aeoScore >= 40 ? '#f59e0b' : '#ef4444'}
                label="AI Assistants"
                subtitle={aeoScore >= 70 ? 'Sajt izvučen u 12 Featured Snippets-a' : aeoScore >= 40 ? 'Sajt citiran u nekim AI odgovorima' : 'Nije vidljiv AI asistentima'}
                urgencyLevel={getUrgency(aeoScore)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 3rd Sight: GEO ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent backdrop-blur-sm">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
            <CardContent className="relative pt-6 pb-6 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  3rd Sight — GEO Score
                </span>
              </div>
              <RadialProgress
                value={geoScore}
                trackColor="rgba(99, 102, 241, 0.1)"
                progressColor={geoScore >= 70 ? '#6366f1' : geoScore >= 40 ? '#f59e0b' : '#ef4444'}
                label="Generative Engines"
                subtitle={geoScore >= 70 ? 'Citiran na 17+ AI engine-a' : geoScore >= 40 ? 'Delimičan pristup AI crawler-a' : 'Zabranjen pristup za 4 ključna AI crawlera'}
                urgencyLevel={getUrgency(geoScore)}
                agencyHoursSaved={totalAgencyHours}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mode Indicator + PDF Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Execution Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Režim rada:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            mode === 'audit'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : mode === 'co-pilot'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {mode === 'audit' ? '🔍 Samo Audit' : mode === 'co-pilot' ? '👁️ Co-Pilot' : '⚡ Auto-Pilot'}
          </span>
        </div>

        {/* PDF Download Button — Pro Feature */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
        >
          <Download className="w-3.5 h-3.5" />
          📥 Preuzmi White-Label PDF Izveštaj
          <Lock className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}
