'use client'

import { create } from 'zustand'

export type QASection = 
  | 'overview' 
  | 'functional' 
  | 'ux' 
  | 'product' 
  | 'growth' 
  | 'copy' 
  | 'accessibility' 
  | 'performance' 
  | 'security' 
  | 'seo' 
  | 'observatory' 
  | 'board' 
  | 'perspectives'

interface QAStore {
  section: QASection
  sidebarOpen: boolean
  setSection: (section: QASection) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useQAStore = create<QAStore>((set) => ({
  section: 'overview',
  sidebarOpen: false,
  setSection: (section) => set({ section }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
