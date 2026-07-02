'use client'

import { create } from 'zustand'

export type GrowthSection = 
  | 'dashboard' 
  | 'discovery' 
  | 'opportunities' 
  | 'queue' 
  | 'generation' 
  | 'review' 
  | 'execution' 
  | 'learning' 
  | 'governor' 
  | 'reports' 
  | 'settings'

interface GrowthStore {
  section: GrowthSection
  sidebarOpen: boolean
  setSection: (section: GrowthSection) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useGrowthStore = create<GrowthStore>((set) => ({
  section: 'dashboard',
  sidebarOpen: false,
  setSection: (section) => set({ section, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
