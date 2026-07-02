'use client'

import type { QASection } from '@/lib/qa-store'

// ── Page Component Imports ──────────────────────────────────────────────

import { OverviewPage } from '@/components/qa/OverviewPage'
import { FunctionalQAPage } from '@/components/qa/FunctionalQAPage'
import { UXReviewerPage } from '@/components/qa/UXReviewerPage'
import { ProductReviewerPage } from '@/components/qa/ProductReviewerPage'
import { GrowthReviewerPage } from '@/components/qa/GrowthReviewerPage'
import { CopyReviewerPage } from '@/components/qa/CopyReviewerPage'
import { AccessibilityPage } from '@/components/qa/AccessibilityPage'
import { PerformancePage } from '@/components/qa/PerformancePage'
import { SecurityPage } from '@/components/qa/SecurityPage'
import { SEOPage } from '@/components/qa/SEOPage'
import { ObservatoryPage } from '@/components/qa/ObservatoryPage'
import { BoardReportPage } from '@/components/qa/BoardReportPage'
import { PerspectivesPage } from '@/components/qa/PerspectivesPage'

// ── Section Render Function ───────────────────────────────────────────

export function renderQASection(section: QASection) {
  switch (section) {
    case 'overview':
      return <OverviewPage />
    case 'functional':
      return <FunctionalQAPage />
    case 'ux':
      return <UXReviewerPage />
    case 'product':
      return <ProductReviewerPage />
    case 'growth':
      return <GrowthReviewerPage />
    case 'copy':
      return <CopyReviewerPage />
    case 'accessibility':
      return <AccessibilityPage />
    case 'performance':
      return <PerformancePage />
    case 'security':
      return <SecurityPage />
    case 'seo':
      return <SEOPage />
    case 'observatory':
      return <ObservatoryPage />
    case 'board':
      return <BoardReportPage />
    case 'perspectives':
      return <PerspectivesPage />
    default:
      return <OverviewPage />
  }
}
