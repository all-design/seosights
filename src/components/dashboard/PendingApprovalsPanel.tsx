'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, Approval } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Bot,
  FileText,
  Code2,
  Shield,
  Globe,
  PenTool,
  Loader2,
  Bell,
} from 'lucide-react'

// Map action types to colors and icons
const ACTION_TYPE_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; label: string }> = {
  'meta-tag-change': { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: PenTool, label: 'Meta Tag Change' },
  'content-publish': { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: FileText, label: 'Content Publish' },
  'robots-update': { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', icon: Globe, label: 'Robots.txt Update' },
  'schema-update': { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: Code2, label: 'Schema Update' },
  'content-modification': { color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', icon: Shield, label: 'Content Modification' },
}

// Agent emoji map
const AGENT_EMOJI_MAP: Record<string, string> = {
  'master-director': '🎯',
  'keyword-researcher': '🔑',
  'competitor-analyst': '🕵️',
  'content-architect': '🏗️',
  'on-page-auditor': '🔍',
  'link-strategist': '🔗',
  'tech-schema-auditor': '⚙️',
  'backlink-prospector': '🤝',
}

interface PendingApprovalsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function PendingApprovalsPanel({ isOpen, onClose }: PendingApprovalsPanelProps) {
  const { pendingApprovals, currentAnalysisId, updatePendingApproval, setPendingApprovals } = useAppStore()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [animatingOut, setAnimatingOut] = useState<Map<string, 'approved' | 'rejected'>>(new Map())

  // Fetch approvals from the API when the panel opens
  const fetchApprovals = useCallback(async () => {
    if (!currentAnalysisId) return
    try {
      const response = await fetch(`/api/approvals?analysisId=${currentAnalysisId}&status=pending`)
      if (response.ok) {
        const data = await response.json()
        if (data.approvals && Array.isArray(data.approvals)) {
          setPendingApprovals(data.approvals.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            analysisId: a.analysisId as string,
            agentId: a.agentId as string,
            agentName: a.agentName as string,
            actionType: a.actionType as Approval['actionType'],
            actionDescription: a.actionDescription as string,
            actionData: a.actionData as string,
            status: a.status as Approval['status'],
            createdAt: a.createdAt as string,
          })))
        }
      }
    } catch (err) {
      console.warn('[PendingApprovalsPanel] Failed to fetch approvals:', err)
    }
  }, [currentAnalysisId, setPendingApprovals])

  useEffect(() => {
    if (isOpen && currentAnalysisId) {
      fetchApprovals()
    }
  }, [isOpen, currentAnalysisId, fetchApprovals])

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingAction(id)
    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Animate out
        setAnimatingOut((prev) => new Map(prev).set(id, action === 'approve' ? 'approved' : 'rejected'))
        // Update local state after animation
        setTimeout(() => {
          updatePendingApproval(id, action === 'approve' ? 'approved' : 'rejected')
          setAnimatingOut((prev) => {
            const next = new Map(prev)
            next.delete(id)
            return next
          })
        }, 500)
      }
    } catch (err) {
      console.error('[PendingApprovalsPanel] Action failed:', err)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleApproveAll = async () => {
    const pendingIds = pendingApprovals.filter(a => a.status === 'pending').map(a => a.id)
    if (pendingIds.length === 0) return

    setLoadingAction('all')
    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalIds: pendingIds, action: 'approve' }),
      })
      // Animate all out
      for (const id of pendingIds) {
        setAnimatingOut((prev) => new Map(prev).set(id, 'approved'))
      }
      setTimeout(() => {
        for (const id of pendingIds) {
          updatePendingApproval(id, 'approved')
        }
        setAnimatingOut(new Map())
      }, 500)
    } catch (err) {
      console.error('[PendingApprovalsPanel] Approve all failed:', err)
    } finally {
      setLoadingAction(null)
    }
  }

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length

  // Format JSON for display
  const formatActionData = (data: string) => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-card/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Pending Approvals</h3>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount} action{pendingCount !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 1 && (
                  <Button
                    size="sm"
                    onClick={handleApproveAll}
                    disabled={loadingAction === 'all'}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs h-8"
                  >
                    {loadingAction === 'all' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    Approve All
                  </Button>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Approval List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {pendingApprovals.filter(a => a.status === 'pending' || animatingOut.has(a.id)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold mb-1">All Clear!</p>
                  <p className="text-xs text-muted-foreground">No pending approvals. Agents are waiting for new tasks.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {pendingApprovals
                    .filter(a => a.status === 'pending' || animatingOut.has(a.id))
                    .map((approval) => {
                      const config = ACTION_TYPE_CONFIG[approval.actionType] || ACTION_TYPE_CONFIG['content-modification']
                      const TypeIcon = config.icon
                      const agentEmoji = AGENT_EMOJI_MAP[approval.agentId] || '🤖'
                      const isExpanded = expandedItems.has(approval.id)
                      const animState = animatingOut.get(approval.id)
                      const isLoading = loadingAction === approval.id

                      return (
                        <motion.div
                          key={approval.id}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{
                            opacity: animState ? 0 : 1,
                            x: animState === 'approved' ? 50 : animState === 'rejected' ? -50 : 0,
                            scale: animState ? 0.95 : 1,
                          }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                          <Card className={`${config.bgColor} border ${config.borderColor} overflow-hidden`}>
                            <div className="p-4">
                              {/* Top row: Agent + Action type badge */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{agentEmoji}</span>
                                  <span className="text-xs font-semibold text-foreground">{approval.agentName}</span>
                                </div>
                                <Badge variant="outline" className={`${config.color} ${config.borderColor} text-[10px] font-bold`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-foreground mb-3 leading-relaxed">
                                {approval.actionDescription}
                              </p>

                              {/* Expandable JSON preview */}
                              <button
                                onClick={() => toggleExpand(approval.id)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isExpanded ? 'Hide details' : 'View proposed change'}
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <pre className="text-[11px] bg-black/40 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto mb-3 font-mono text-muted-foreground" style={{ scrollbarWidth: 'thin' }}>
                                      {formatActionData(approval.actionData)}
                                    </pre>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(approval.id, 'approve')}
                                  disabled={isLoading || !!animState}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs h-9 font-semibold"
                                >
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(approval.id, 'reject')}
                                  disabled={isLoading || !!animState}
                                  variant="outline"
                                  className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs h-9 font-semibold"
                                >
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer with mode info */}
            <div className="px-5 py-3 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Co-Pilot Mode — agents wait for your approval before executing</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
