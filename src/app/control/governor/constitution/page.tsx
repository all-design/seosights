'use client'

import { useSyncExternalStore } from 'react'
import {
  Scale, Lock, RefreshCw, Eye, ListChecks,
  Code2, FlaskConical, BookOpen, Gauge as GaugeIcon,
  Brain, Repeat, Target, Sparkles, TrendingUp, Layers,
  GitBranch, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, ArrowDown, Ban, Star, Network,
  Award, Activity, Boxes, Settings2, FileCheck2, Crown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type Priority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

interface GrowthPriority {
  rank: Priority
  rankNum: number
  title: string
  description: string
}

interface GoldenRule {
  id: string
  text: string
}

interface QualityGate {
  label: string
  target: string
  icon: typeof ShieldCheck
}

interface MissionItem {
  label: string
  icon: typeof TrendingUp
}

interface LearningOutput {
  label: string
  icon: typeof Brain
}

// ─── Mock Data ───────────────────────────────────────────

const missionItems: MissionItem[] = [
  { label: 'AI Visibility', icon: Eye },
  { label: 'Product Quality', icon: Star },
  { label: 'User Value', icon: TrendingUp },
  { label: 'Research Quality', icon: FlaskConical },
  { label: 'Documentation Coverage', icon: BookOpen },
  { label: 'Automation', icon: Settings2 },
  { label: 'Stability', icon: ShieldCheck },
]

const goldenRules: GoldenRule[] = [
  { id: 'g1', text: 'Never create features because they are interesting. Only create features because evidence supports them.' },
  { id: 'g2', text: 'Never duplicate functionality. Extend existing systems first.' },
  { id: 'g3', text: 'Never publish simulated research.' },
  { id: 'g4', text: 'Never reduce documentation coverage.' },
  { id: 'g5', text: 'Never reduce QA coverage.' },
  { id: 'g6', text: 'Never reduce Observatory credibility.' },
  { id: 'g7', text: 'Never push directly to production.' },
]

const developmentLoop: string[] = [
  'Observe',
  'Discover',
  'Prioritize',
  'Design',
  'Implement',
  'Test',
  'Document',
  'Deploy Candidate',
  'Measure',
  'Learn',
]

const decisionQuestions: string[] = [
  'Does this solve a real problem?',
  'Is there evidence?',
  'Does it fit the architecture?',
  'Can an existing module solve it?',
  'Will it improve a KPI?',
  'Can it be measured?',
]

const growthPriorities: GrowthPriority[] = [
  { rank: 'P1', rankNum: 1, title: 'Improve existing features', description: 'Refine, polish, and harden what already ships.' },
  { rank: 'P2', rankNum: 2, title: 'Remove unnecessary complexity', description: 'Cut dead code, simplify surfaces, retire cruft.' },
  { rank: 'P3', rankNum: 3, title: 'Increase automation', description: 'Free humans from repetitive operational work.' },
  { rank: 'P4', rankNum: 4, title: 'Increase documentation', description: 'Knowledge compounds when it is written down.' },
  { rank: 'P5', rankNum: 5, title: 'Only then create new features', description: 'New features are the last resort, not the default.' },
]

const pipelineStages: string[] = [
  'Branch',
  'Code',
  'QA',
  'Documentation',
  'Review',
  'Human Approval',
]

const qualityGates: QualityGate[] = [
  { label: 'Code Quality', target: '95+', icon: Code2 },
  { label: 'QA', target: '100%', icon: FileCheck2 },
  { label: 'Documentation', target: '100%', icon: BookOpen },
  { label: 'Performance', target: 'No regression', icon: GaugeIcon },
  { label: 'Accessibility', target: 'AA', icon: ShieldCheck },
  { label: 'Research', target: 'Confidence Gate', icon: FlaskConical },
  { label: 'Observatory', target: 'No simulated data', icon: Eye },
]

const learningOutputs: LearningOutput[] = [
  { label: 'Growth Memory', icon: TrendingUp },
  { label: 'Engineering Memory', icon: Code2 },
  { label: 'Documentation', icon: BookOpen },
  { label: 'Knowledge Graph', icon: Network },
  { label: 'Confidence', icon: Activity },
  { label: 'Replay', icon: Repeat },
]

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function ConstitutionPage() {
  const mounted = useHydrated()

  if (!mounted) return null

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Scale className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">The Constitution</h1>
            <p className="text-slate-400 text-sm">Level 1 — Immutable Supreme Law</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20">
            <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-xs font-bold tracking-wider text-fuchsia-400">IMMUTABLE</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs cursor-not-allowed opacity-60">
            <RefreshCw className="w-3.5 h-3.5" />
            Amend
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Metadata Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-fuchsia-500/5 via-slate-900 to-slate-900 border border-fuchsia-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-fuchsia-400">v1.0.0</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Version</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">Day 1</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Ratified</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">Never</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Last Modified</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">0</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Amendments</div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4 italic">
          This document governs every engine. No engine may violate these rules.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Section 1 — System Directive
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Crown className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">1. System Directive</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article I</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          You are the autonomous engineering organization responsible for evolving Seosights. Your objective
          is <span className="text-fuchsia-400 font-semibold">NOT</span> to write code. Your objective is to
          increase the long-term value of the platform while preserving product philosophy, architecture
          consistency, research integrity and software quality. You may improve the platform only through
          the engines described in this specification.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Section 2 — Mission
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Target className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">2. Mission</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article II</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {missionItems.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.label}
                className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-fuchsia-400" />
                </div>
                <span className="text-sm text-slate-200 font-medium">{m.label}</span>
                <ArrowRight className="w-3 h-3 text-fuchsia-400/40 ml-auto" />
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-500 mt-4 italic">
          Never optimize only for feature count.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Section 3 — Core Rule (prominent callout)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-red-500/10 via-fuchsia-500/5 to-slate-900 border border-fuchsia-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">3. Core Rule</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article III · Non-negotiable</span>
        </div>
        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
          Every change must improve at least one measurable KPI.
          <span className="block mt-2 text-sm font-normal text-fuchsia-400">
            If no measurable improvement exists, <span className="underline decoration-fuchsia-400/50">do nothing</span>.
          </span>
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Section 4 — Development Loop
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Repeat className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">4. Development Loop</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article IV</span>
        </div>

        {/* Loop nodes — flex-wrap with arrows */}
        <div className="flex flex-wrap items-center gap-2">
          {developmentLoop.map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-[10px] font-bold text-fuchsia-400/70">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-xs font-medium text-slate-200">{step}</span>
              </div>
              {idx < developmentLoop.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Repeat arrow back to Observe */}
        <div className="mt-4 flex items-center gap-3 bg-fuchsia-500/5 border border-fuchsia-500/15 rounded-lg p-3">
          <Repeat className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
          <span className="text-xs text-slate-300">
            <span className="font-semibold text-fuchsia-400">Repeat</span> — return to Observe. The loop never closes.
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Section 5 — Golden Rules (7 cards)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">5. Golden Rules</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article V · Seven Inviolable Laws</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {goldenRules.map((rule, idx) => (
            <div
              key={rule.id}
              className="bg-slate-900 border border-fuchsia-500/20 rounded-xl p-4 hover:border-fuchsia-500/40 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-fuchsia-400">{String(idx + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Never</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{rule.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Section 6 — Decision Framework (6 questions → reject callout)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">6. Decision Framework</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article VI</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Before every task, ask:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decisionQuestions.map((q, idx) => (
            <div
              key={q}
              className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3"
            >
              <div className="w-7 h-7 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-fuchsia-400">{idx + 1}</span>
              </div>
              <span className="text-xs text-slate-200 font-medium">{q}</span>
            </div>
          ))}
        </div>

        {/* Arrows down to verdict */}
        <div className="flex justify-center my-3">
          <ArrowDown className="w-4 h-4 text-slate-600" />
        </div>

        {/* Reject callout */}
        <div className="bg-gradient-to-r from-red-500/10 via-fuchsia-500/5 to-transparent border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-white font-semibold">
            If any answer is <span className="text-red-400">NO</span> → <span className="text-fuchsia-400">Reject the task.</span>
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          9. Section 7 — Growth Priorities (ranked 1-5)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">7. Growth Priorities</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article VII · Ranked</span>
        </div>
        <div className="space-y-2">
          {growthPriorities.map((p) => {
            const intensity = 1 - (p.rankNum - 1) * 0.15
            return (
              <div
                key={p.rank}
                className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-fuchsia-500/30 transition-colors"
              >
                {/* Rank badge */}
                <div
                  className="w-12 h-12 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                  style={{ opacity: Math.max(0.4, intensity) }}
                >
                  <span className="text-sm font-bold text-fuchsia-400">{p.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{p.title}</div>
                  <div className="text-[11px] text-slate-400">{p.description}</div>
                </div>
                {/* Priority bar */}
                <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                  <div className="w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fuchsia-400 rounded-full"
                      style={{ width: `${100 - (p.rankNum - 1) * 18}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Priority</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          10. Section 8 — Engineering Constraints (pipeline)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">8. Engineering Constraints</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article VIII · Pipeline</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Never push directly to production. <span className="text-red-400 font-semibold">Always</span> follow this pipeline:
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {pipelineStages.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-[10px] font-bold text-fuchsia-400/70">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-xs font-medium text-slate-200">{stage}</span>
              </div>
              {idx < pipelineStages.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* No direct to production warning */}
        <div className="mt-4 flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[11px] text-red-300">
            Bypassing any stage is a constitutional violation.
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          11. Section 9 — Quality Gates (table)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">9. Quality Gates</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article IX · Current Targets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-2 px-3">Dimension</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-2 px-3">Target</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {qualityGates.map((gate) => {
                const GateIcon = gate.icon
                return (
                  <tr key={gate.label} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center flex-shrink-0">
                          <GateIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                        </div>
                        <span className="text-slate-200 font-medium">{gate.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-fuchsia-400 font-bold font-mono">{gate.target}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          12. Section 10 — Learning (chips/badges)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Brain className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">10. Learning</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article X</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Every completed task must update:</p>
        <div className="flex flex-wrap gap-2">
          {learningOutputs.map((out) => {
            const Icon = out.icon
            return (
              <span
                key={out.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/20 text-xs font-medium text-fuchsia-300"
              >
                <Icon className="w-3.5 h-3.5" />
                {out.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          13. Section 11 — Daily Objective
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-fuchsia-500/10 via-slate-900 to-slate-900 border border-fuchsia-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Award className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">11. Daily Objective</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article XI</span>
        </div>
        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
          Every day make the platform slightly better
          <span className="text-fuchsia-400"> without making it more complicated.</span>
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          14. Section 12 — Success Metric (visual contrast)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
            <Layers className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">12. Success Metric</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Article XII · Final</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* "Features built" — struck through */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Not</span>
            <div className="flex items-center gap-2 relative">
              <Boxes className="w-5 h-5 text-slate-500" />
              <span className="text-xl font-bold text-slate-500 line-through decoration-red-400/60 decoration-2">
                Features built
              </span>
            </div>
            <span className="text-[10px] text-slate-600 mt-2">Vanity metric</span>
          </div>

          {/* "Platform Value Added" — highlighted */}
          <div className="bg-gradient-to-br from-fuchsia-500/15 to-slate-900 border border-fuchsia-500/30 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-fuchsia-400 uppercase tracking-wider mb-2">But</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-fuchsia-400" />
              <span className="text-xl font-bold text-fuchsia-300">
                Platform Value Added
              </span>
            </div>
            <span className="text-[10px] text-fuchsia-400/70 mt-2">The only metric that matters</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          15. Footer — Immutable declarations
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-500/5 border border-fuchsia-500/15 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Sealed & Immutable</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              This Constitution is <span className="text-fuchsia-400 font-semibold">immutable</span>. It was
              ratified on Day 1 and has never been amended.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              All engines are bound by this document.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Crown className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              The <span className="text-fuchsia-400 font-semibold">AI Governor™</span> enforces these rules. No exceptions.
            </p>
          </div>
        </div>

        {/* Seal row */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Constitutional Seal</div>
              <div className="text-[10px] text-fuchsia-400 font-mono">SHA: 0x1MMUT4BL3 · v1.0.0</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            Ratified Day 1 · Last Modified: Never · Amendments: 0
          </div>
        </div>
      </div>

    </div>
  )
}
