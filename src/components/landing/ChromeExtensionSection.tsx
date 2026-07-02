'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Chrome,
  Eye,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Globe,
  Sparkles,
  BarChart3,
} from 'lucide-react'

export default function ChromeExtensionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 relative" ref={ref} id="chrome-extension">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/5 to-background" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-cyan-500/50 text-cyan-400 bg-cyan-500/10 backdrop-blur-sm mb-6"
            >
              <Chrome className="w-3.5 h-3.5" />
              Coming Soon — Chrome Extension
            </Badge>

            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              AI Visibility{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Right in Your Browser
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8">
              Open any site. Instantly see their AI Visibility, Entity Score, Crawl Status, Schema, and AI Recommendation Potential.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">AI Visibility Score</h4>
                  <p className="text-xs text-muted-foreground">See any site&apos;s AI Visibility Score instantly without leaving the page</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Crawl & Schema Status</h4>
                  <p className="text-xs text-muted-foreground">Check if AI bots can access the site and find schema issues</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">AI Recommendation Potential</h4>
                  <p className="text-xs text-muted-foreground">See how many AI Visibility points they could gain</p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-cyan-900/20"
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Join the Waitlist
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          {/* Right: Mock Browser */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 p-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span>competitor-site.com</span>
                </div>
                <div className="w-6 h-6 rounded bg-cyan-500/30 flex items-center justify-center">
                  <Eye className="w-3 h-3 text-cyan-400" />
                </div>
              </div>

              {/* Extension Popup */}
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-bold text-foreground">Seosights</span>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">Free</Badge>
                </div>

                {/* AI Visibility Score */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cyan-400">AI Visibility</span>
                    <span className="text-lg font-bold text-cyan-400">67/100</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground mb-1">Entity Score</div>
                    <div className="text-sm font-bold text-amber-400">54/100</div>
                    <Progress value={54} className="h-1 mt-1" />
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground mb-1">Crawl Status</div>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">All bots allowed</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground mb-1">Schema</div>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">2 issues found</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground mb-1">Potential</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-cyan-400">+23 pts</span>
                    </div>
                  </div>
                </div>

                {/* Engine Breakdown */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-muted-foreground mb-2">Per-Engine Visibility</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">ChatGPT</div>
                      <div className="text-xs font-bold text-emerald-400">72</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">Claude</div>
                      <div className="text-xs font-bold text-amber-400">58</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">Gemini</div>
                      <div className="text-xs font-bold text-violet-400">65</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">Perplexity</div>
                      <div className="text-xs font-bold text-cyan-400">71</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
