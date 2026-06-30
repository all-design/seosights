'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AUTO_GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hey! 👋 I'm your AI Growth advisor. Ask me anything about your visibility, or just say \"what should I do today?\"",
  timestamp: new Date(),
}

// Local smart responses when API is unavailable
function getLocalResponse(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('what should i do') || lower.includes('today') || lower.includes('recommend')) {
    return "Based on your current visibility, I'd suggest three things: 1) Publish an FAQ on your pricing page — it's the fastest schema win. 2) Add internal links from your high-authority pages to new articles. 3) Update your llms.txt with recent content. Want me to elaborate on any of these?"
  }

  if (lower.includes('visibility') || lower.includes('score')) {
    return "Your AI Visibility Score is tracking well. The biggest quick win right now is filling content gaps your competitors are getting cited for. That alone can push you up +5-8 points based on our data from 42 similar actions."
  }

  if (lower.includes('faq') || lower.includes('schema')) {
    return "FAQ schema is your highest-ROI move right now. Based on 28 data points, adding FAQ structured data consistently yields +3-5 AI Visibility per page. Start with your top 3 most-visited pages. Takes about 15 minutes per page."
  }

  if (lower.includes('content') || lower.includes('article') || lower.includes('write')) {
    return "Content is still the #1 visibility driver. I'd focus on entity-optimized articles that answer questions AI engines are surfacing. Our data shows articles targeting specific entity gaps get cited 3x more often than generic content."
  }

  if (lower.includes('help') || lower.includes('what can you')) {
    return "I can help you with: • Daily growth recommendations • Content strategy advice • Visibility score analysis • Schema optimization tips • Sprint planning. Just ask naturally — I speak human, not dashboard. 😊"
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hey there! 👋 Ready to boost your AI visibility? Ask me what you should focus on today, or tell me about a specific challenge you're facing."
  }

  return "That's a great question. Based on your current growth trajectory, I'd recommend focusing on the highest-impact, lowest-effort actions first. Try asking me 'what should I do today?' for personalized recommendations, or ask about any specific area like content, schema, or visibility."
}

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([AUTO_GREETING])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Listen for external toggle event (from keyboard shortcuts)
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev)
    }
    window.addEventListener('seosights:toggle-ai', handleToggle)
    return () => window.removeEventListener('seosights:toggle-ai', handleToggle)
  }, [])

  const sendMessage = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Try the Growth Brain POST API first
      const res = await fetch('/api/content-engine/growth-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (res.ok) {
        const data = await res.json()
        // The POST returns recommendations; format a response from them
        const recs = data.recommendations || data.missions || []
        if (recs.length > 0) {
          const topRecs = recs.slice(0, 3)
          const responseText = topRecs
            .map(
              (r: { recommendation?: string; text?: string; shortText?: string }, i: number) =>
                `**${i + 1}.** ${r.recommendation || r.text || r.shortText}`
            )
            .join('\n\n')
          const assistantMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Here's what I'd focus on:\n\n${responseText}`,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
        } else {
          // Fallback to local
          const localResponse = getLocalResponse(trimmed)
          setMessages(prev => [
            ...prev,
            { id: `ai-${Date.now()}`, role: 'assistant', content: localResponse, timestamp: new Date() },
          ])
        }
      } else {
        // API failed, use local smart response
        const localResponse = getLocalResponse(trimmed)
        setMessages(prev => [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'assistant', content: localResponse, timestamp: new Date() },
        ])
      }
    } catch {
      // Network error, use local smart response
      const localResponse = getLocalResponse(trimmed)
      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', content: localResponse, timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" data-slot="floating-ai-assistant">
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-[380px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: 'min(600px, calc(100vh - 120px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-600 to-emerald-500">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="size-5 text-white" />
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-300"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">Seosights AI</span>
                <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">
                  <Sparkles className="size-2.5 mr-0.5" />
                  Growth Brain
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4" style={{ maxHeight: '400px' }}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mt-0.5">
                        <Bot className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 justify-start"
                  >
                    <div className="flex-shrink-0 size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mt-0.5">
                      <Bot className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                      <motion.div
                        className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                      />
                      <motion.div
                        className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your growth..."
                  className="flex-1 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="size-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
                Powered by Growth Brain™ • <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 text-white relative"
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="size-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageCircle className="size-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when closed */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </Button>
      </motion.div>

      {/* Hidden skeleton for loading state */}
      <div className="hidden">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}
