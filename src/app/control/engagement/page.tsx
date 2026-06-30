'use client'

import { Activity, Bell, Clock, Flame, Inbox, Lock, Mail, Trophy, Zap } from 'lucide-react'

const sections = [
  { name: 'Daily Brief', icon: Mail, description: 'Morning AI briefing', status: 'active', items: 1 },
  { name: 'Missions', icon: Zap, description: 'Today\'s tasks & rewards', status: 'active', items: 3 },
  { name: 'Momentum', icon: Flame, description: '87% — 14-day streak', status: 'active', items: 0 },
  { name: 'Streak', icon: Trophy, description: '14 days improving', status: 'active', items: 0 },
  { name: 'Inbox', icon: Inbox, description: '7 unread notifications', status: 'active', items: 7 },
  { name: 'Countdowns', icon: Clock, description: '2 active countdowns', status: 'active', items: 2 },
  { name: 'Unlocks', icon: Lock, description: 'Vault items unlocking', status: 'idle', items: 0 },
  { name: 'Notifications', icon: Bell, description: 'Real-time alerts', status: 'active', items: 12 },
]

const inboxItems = [
  { type: 'citation_change', headline: 'ChatGPT cited your pricing page', model: 'ChatGPT', time: '2m ago', unread: true },
  { type: 'competitor_drop', headline: 'Competitor dropped from Claude top 10', model: 'Claude', time: '15m ago', unread: true },
  { type: 'opportunity', headline: 'FAQ page opportunity: +4 AI Visibility', model: 'Perplexity', time: '1h ago', unread: true },
  { type: 'prediction_result', headline: 'Your prediction was correct: +3 visibility', model: 'System', time: '2h ago', unread: false },
  { type: 'streak_warning', headline: 'Streak at risk: no improvement today', model: 'System', time: '3h ago', unread: true },
]

export default function EngagementPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          Engagement Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">User momentum, daily habits, and retention signals</p>
      </div>

      {/* Momentum Score */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Momentum</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-emerald-400">87%</span>
              <span className="text-sm text-emerald-400/60">+5 from yesterday</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Active Streak</div>
            <div className="text-2xl font-bold text-amber-400">14 days</div>
          </div>
        </div>
      </div>

      {/* Engagement Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.name} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-emerald-400" />
                {section.items > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{section.items}</span>
                )}
              </div>
              <div className="text-sm font-semibold text-white">{section.name}</div>
              <div className="text-xs text-slate-500 mt-1">{section.description}</div>
            </div>
          )
        })}
      </div>

      {/* Recent Inbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-emerald-400" />
          Recent Inbox
        </h2>
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {inboxItems.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.unread ? 'bg-slate-800/50' : ''}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.unread ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300">{item.headline}</div>
                <div className="text-[10px] text-slate-500">{item.model} · {item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
