'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, BarChart3, Globe, BookOpen } from 'lucide-react'

export interface ObservatoryResearchCardProps {
  title: string
  type: 'research' | 'benchmark' | 'industry_update' | 'monthly_report'
  date: string
  readingTime: number
  excerpt: string
  slug: string
}

const typeConfig: Record<ObservatoryResearchCardProps['type'], {
  label: string
  icon: typeof FileText
  badgeClass: string
}> = {
  research: {
    label: 'Research',
    icon: FileText,
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  },
  benchmark: {
    label: 'Benchmark',
    icon: BarChart3,
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  },
  industry_update: {
    label: 'Industry',
    icon: Globe,
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  },
  monthly_report: {
    label: 'Monthly Report',
    icon: BookOpen,
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  },
}

export default function ObservatoryResearchCard({
  title,
  type,
  date,
  readingTime,
  excerpt,
  slug,
}: ObservatoryResearchCardProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900/60 border-gray-800/60 hover:border-emerald-500/30 transition-colors duration-300 backdrop-blur-sm py-0 gap-0 overflow-hidden">
        {/* Top colored accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
        <CardContent className="p-5 flex flex-col gap-3">
          {/* Type badge + reading time */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
            >
              <Icon className="size-3" />
              {config.label}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="size-3" />
              {readingTime} min
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">
            {title}
          </h4>

          {/* Excerpt */}
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
            {excerpt}
          </p>

          {/* Footer: date + link */}
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-800/60">
            <span className="text-[11px] text-gray-500">{date}</span>
            <a
              href={`/research/${slug}`}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Read more →
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
