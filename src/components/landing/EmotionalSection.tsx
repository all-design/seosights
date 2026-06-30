'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Animated divider arrow between timeline states                    */
/* ------------------------------------------------------------------ */
function DividerArrow({ delay }: { delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div ref={ref} className="flex justify-center py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        className="flex flex-col items-center gap-1"
      >
        <motion.div
          animate={isInView ? { y: [0, 6, 0] } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + 0.5,
          }}
        >
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
        <div className="w-px h-8 bg-gradient-to-b from-slate-600/60 to-transparent" />
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Individual timeline state block                                    */
/* ------------------------------------------------------------------ */
interface TimelineStateProps {
  label: string
  text: string
  colorClass: string
  labelColorClass: string
  textSize: string
  glowClass?: string
  delay: number
}

function TimelineState({
  label,
  text,
  colorClass,
  labelColorClass,
  textSize,
  glowClass,
  delay,
}: TimelineStateProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="text-center">
      {/* Label — "Yesterday", "Today", "Tomorrow" */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`text-xs sm:text-sm uppercase tracking-[0.25em] font-semibold mb-3 sm:mb-4 ${labelColorClass}`}
      >
        {label}
      </motion.p>

      {/* Statement text */}
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={
          isInView
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : {}
        }
        transition={{
          duration: 0.9,
          delay: delay + 0.15,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={`${textSize} font-bold tracking-tight leading-tight ${colorClass} ${glowClass ?? ''}`}
      >
        {text}
      </motion.h2>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main EmotionalSection                                              */
/* ------------------------------------------------------------------ */
export default function EmotionalSection() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-slate-950 overflow-hidden"
      aria-label="The story of AI visibility"
    >
      {/* Subtle background glow behind the "Today" state */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 50%, transparent 75%)',
        }}
      />

      {/* Faint top/bottom gradient edges for depth */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32">
        {/* ---- Yesterday ---- */}
        <TimelineState
          label="Yesterday"
          text="AI didn't know your brand."
          colorClass="text-slate-500"
          labelColorClass="text-slate-600"
          textSize="text-2xl sm:text-3xl md:text-4xl"
          delay={0}
        />

        <DividerArrow delay={0.3} />

        {/* ---- Today (breakthrough) ---- */}
        <TimelineState
          label="Today"
          text="ChatGPT recommends you."
          colorClass="text-emerald-400"
          labelColorClass="text-emerald-500/70"
          textSize="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
          glowClass="drop-shadow-[0_0_30px_rgba(16,185,129,0.35)]"
          delay={0.1}
        />

        {/* Extra breathing room around the breakthrough line */}
        <div className="h-4 sm:h-6" />

        <DividerArrow delay={0.3} />

        {/* ---- Tomorrow ---- */}
        <TimelineState
          label="Tomorrow"
          text="Claude, Gemini and Perplexity do the same."
          colorClass="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent"
          labelColorClass="text-purple-500/60"
          textSize="text-2xl sm:text-3xl md:text-4xl"
          delay={0.1}
        />
      </div>
    </section>
  )
}
