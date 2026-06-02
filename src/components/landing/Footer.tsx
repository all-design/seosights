'use client'

import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <footer className="mt-auto">
      <Separator className="bg-white/10" />
      <div className="bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="seosight" className="h-6 w-auto" />
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} seosight. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5">
                Built with <span className="text-emerald-400 font-medium">seosight</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
