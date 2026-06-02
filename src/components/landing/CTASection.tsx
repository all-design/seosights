'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, CreditCard, Clock, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CTASection({ onStartFree }: { onStartFree?: () => void }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in your name and email.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to submit')
      }

      toast({
        title: 'You\'re in!',
        description: 'We\'ll send your free Citation Gap Audit shortly.',
      })
      setFormData({ name: '', email: '', website: '' })
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Dominate{' '}
            <span className="text-emerald-400">SEO</span>,{' '}
            <span className="text-cyan-400">AEO</span> &{' '}
            <span className="text-amber-400">GEO</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start your free trial today. No credit card required. Get your first audit in under 2 minutes.
          </p>
        </motion.div>

        {/* Quick Start Button */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-10 py-7 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={onStartFree}
          >
            <Zap className="mr-2 w-5 h-5" />
            Analyze My Site — Free
          </Button>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
            <p className="text-center text-sm text-muted-foreground mb-6">
              Or contact us for the <span className="text-amber-400 font-semibold">Managed Done-For-You</span> service:
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/80 text-sm">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80 text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-foreground/80 text-sm">
                  Website URL
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 placeholder:text-muted-foreground/50"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-base py-5 transition-all duration-300"
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Contact Us — Managed Service'}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4 text-emerald-400" />
            1 Month Free Trial
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            No Credit Card Required
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Cancel Anytime
          </div>
        </motion.div>
      </div>
    </section>
  )
}
