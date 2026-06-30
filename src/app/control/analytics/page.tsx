'use client'

import { BarChart3, TrendingUp, Users, Eye, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const kpis = [
  { label: 'Daily Active Users', value: '1,247', delta: '+12%', trend: 'up', icon: Users },
  { label: 'AI Visibility Avg', value: '73', delta: '+5', trend: 'up', icon: Eye },
  { label: 'MRR', value: '$14,800', delta: '+8%', trend: 'up', icon: DollarSign },
  { label: 'Churn Rate', value: '2.1%', delta: '-0.3%', trend: 'up', icon: TrendingUp },
]

const funnelData = [
  { step: 'Landing Page', count: 4520, rate: '100%' },
  { step: 'Sign Up', count: 890, rate: '19.7%' },
  { step: 'First Scan', count: 650, rate: '73%' },
  { step: 'Dashboard', count: 420, rate: '64.6%' },
  { step: 'Upgrade', count: 85, rate: '20.2%' },
]

const topPages = [
  { page: '/', views: 3420, bounce: '32%' },
  { page: '/observatory', views: 890, bounce: '28%' },
  { page: '/pricing', views: 650, bounce: '45%' },
  { page: '/engagement', views: 420, bounce: '22%' },
  { page: '/free-ai-seo-tools', views: 380, bounce: '51%' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide metrics and insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-slate-500 uppercase">{k.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{k.value}</span>
                <span className={`text-xs flex items-center gap-0.5 ${k.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {k.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.delta}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h2>
        <div className="space-y-2">
          {funnelData.map((f, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs text-slate-400 w-28 flex-shrink-0">{f.step}</span>
              <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500/40 rounded flex items-center px-2"
                  style={{ width: `${(f.count / funnelData[0].count) * 100}%` }}
                >
                  <span className="text-[10px] text-white font-medium">{f.count.toLocaleString()}</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 w-12 text-right">{f.rate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Top Pages</h2>
        <div className="space-y-2">
          {topPages.map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-2 rounded bg-slate-800/30">
              <span className="text-xs font-mono text-blue-400 w-40">{p.page}</span>
              <span className="text-xs text-white">{p.views.toLocaleString()} views</span>
              <span className="text-xs text-slate-500 ml-auto">{p.bounce} bounce</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
