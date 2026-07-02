'use client'

import type { GrowthSection } from '@/lib/growth-store'

// ── Page Component Imports ──────────────────────────────────────────────

import { DashboardPage } from '@/components/growth/DashboardPage'
import { DiscoveryPage } from '@/components/growth/DiscoveryPage'
import { OpportunitiesPage } from '@/components/growth/OpportunitiesPage'
import { QueuePage } from '@/components/growth/QueuePage'
import { GenerationPage } from '@/components/growth/GenerationPage'
import { ReviewPage } from '@/components/growth/ReviewPage'
import { ExecutionPage } from '@/components/growth/ExecutionPage'
import LearningPage from '@/components/growth/LearningPage'
import GovernorPage from '@/components/growth/GovernorPage'
import ReportsPage from '@/components/growth/ReportsPage'
import SettingsPage from '@/components/growth/SettingsPage'

// ── Section Render Function ───────────────────────────────────────────

export function renderGrowthSection(section: GrowthSection) {
  switch (section) {
    case 'dashboard':
      return <DashboardPage />
    case 'discovery':
      return <DiscoveryPage />
    case 'opportunities':
      return <OpportunitiesPage />
    case 'queue':
      return <QueuePage />
    case 'generation':
      return <GenerationPage />
    case 'review':
      return <ReviewPage />
    case 'execution':
      return <ExecutionPage />
    case 'learning':
      return <LearningPage />
    case 'governor':
      return <GovernorPage />
    case 'reports':
      return <ReportsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}
