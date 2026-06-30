'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Clock, Crown, ArrowRight, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function CTASection({ onStartFree }: { onStartFree?: () => void }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState('')

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      toast({
        title: 'Enter your website URL',
        description: 'We need a URL to scan your AI visibility.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'URL Scan', email: '', website: url }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit')
      }

      toast({
        title: 'Scanning your site!',
        description: 'We\'ll analyze your AI visibility across major models.',
      })
      setUrl('')
      // Also trigger the main URL input modal
      if (onStartFree) {
        onStartFree()
      }
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      className="py-24 relative"
      ref={ref}
      id="cta"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/10 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[150px]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Will AI recommend{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">your business</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find out in 20 seconds. No signup required.
          </p>
        </motion.div>

        {/* Large CTA Button */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-lg px-10 py-7 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={onStartFree}
          >
            <Search className="mr-2 w-5 h-5" />
            Check Your AI Visibility
          </Button>
        </motion.div>

        {/* Inline URL Scan Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <form onSubmit={handleScan} className="flex gap-2 max-w-lg mx-auto">
            <Input
              type="url"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 placeholder:text-muted-foreground/50 h-12 text-base"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0 px-6"
              disabled={isLoading}
            >
              {isLoading ? 'Scanning...' : 'Scan Now'}
            </Button>
          </form>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            No credit card required
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4 text-emerald-400" />
            14-day free trial
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Crown className="w-4 h-4 text-emerald-400" />
            Cancel anytime
          </div>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href="/book-demo">
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 text-muted-foreground hover:text-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5 font-semibold px-8 transition-all duration-300"
            >
              Book a Live AI Visibility Review
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
