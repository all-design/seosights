'use client'

import { create } from 'zustand'

export type OpsSection =
  | 'overview'
  | 'age'
  | 'qa'
  | 'client-zero'
  | 'observatory'
  | 'timeline'
  | 'workers'
  | 'schedule'
  | 'autonomy'

interface OpsStore {
  section: OpsSection
  sidebarOpen: boolean
  setSection: (section: OpsSection) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useOpsStore = create<OpsStore>((set) => ({
  section: 'overview',
  sidebarOpen: false,
  setSection: (section) => set({ section, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
