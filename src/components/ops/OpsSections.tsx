'use client'

import { useOpsStore } from '@/lib/ops-store'
import { OverviewPage } from './sections/OverviewPage'
import { AGEPage } from './sections/AGEPage'
import { QAEnginePage } from './sections/QAEnginePage'
import { ClientZeroPage } from './sections/ClientZeroPage'
import { ObservatoryPage } from './sections/ObservatoryPage'
import { TimelinePage } from './sections/TimelinePage'
import { WorkersPage } from './sections/WorkersPage'
import { SchedulePage } from './sections/SchedulePage'
import { AutonomyPage } from './sections/AutonomyPage'

const SECTION_MAP: Record<string, React.ComponentType> = {
  overview: OverviewPage,
  age: AGEPage,
  qa: QAEnginePage,
  'client-zero': ClientZeroPage,
  observatory: ObservatoryPage,
  timeline: TimelinePage,
  workers: WorkersPage,
  schedule: SchedulePage,
  autonomy: AutonomyPage,
}

export function OpsSections() {
  const { section } = useOpsStore()
  const Component = SECTION_MAP[section] || OverviewPage

  return <Component />
}
