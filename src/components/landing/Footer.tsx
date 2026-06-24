'use client'

import { Separator } from '@/components/ui/separator'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto">
      <Separator className="bg-white/10" />
      <div className="bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span className="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                  seosights
                </span>
                <span className="text-[7px] tracking-[0.15em] text-purple-400/60 uppercase leading-none mt-0.5">
                  Multiple pillars, one unified AI engine
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                © {year} seosights
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5">
                Built with <span className="text-purple-400 font-medium">seosights</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
