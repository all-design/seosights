'use client'

import { create } from 'zustand'

export type OSMode = 'executive' | 'builder' | 'developer'
export type OSSection = 'today' | 'growth' | 'learning' | 'content' | 'insights' | 'execute' | 'memory' | 'experiments'

interface OSStore {
  mode: OSMode
  section: OSSection
  sidebarOpen: boolean
  setMode: (mode: OSMode) => void
  setSection: (section: OSSection) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useOSStore = create<OSStore>((set) => ({
  mode: (typeof window !== 'undefined' && localStorage.getItem('os-mode')) as OSMode || 'builder',
  section: 'today',
  sidebarOpen: false,
  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('os-mode', mode)
    }
    set({ mode })
  },
  setSection: (section) => set({ section, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
