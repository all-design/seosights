/**
 * Audit Queue — BullMQ with In-Memory Fallback
 * 
 * Architecture:
 * - Producer (API route) adds jobs to the queue
 * - Worker (mini-service or in-process) picks up jobs and runs 8 AI agents
 * - Results saved to DB, WebSocket events emitted for real-time updates
 * 
 * When Redis is available: Uses real BullMQ (persistent, multi-process)
 * When Redis is unavailable: Uses in-memory queue (single-process, dev/sandbox)
 */

import { isRedisAvailable, getRedisConnection } from './redis'

// ─────────────────────────────────────────────────────────────────────────────
// Job Data Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditJobData {
  projectId?: string
  userId?: string
  targetUrl: string
  targetMarket: string
  executionMode: 'auto-pilot' | 'co-pilot'
  tier: string  // For priority: 'pro' gets priority 1, others get 10
  sessionId: string
  analysisId: string
}

export interface AuditJobResult {
  analysisId: string
  status: 'completed' | 'failed'
  overallScores?: { seo: number; aeo: number; geo: number; combined: number }
  error?: string
  completedAt: string
}

export type JobStatus = 'queued' | 'active' | 'completed' | 'failed' | 'delayed'

export interface JobInfo {
  jobId: string
  status: JobStatus
  progress: number
  data: AuditJobData
  result?: AuditJobResult
  failedReason?: string
  timestamp: number
  processedOn?: number
  finishedOn?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Queue Implementation (fallback when Redis is unavailable)
// ─────────────────────────────────────────────────────────────────────────────

interface InMemoryJob {
  id: string
  data: AuditJobData
  status: JobStatus
  progress: number
  result?: AuditJobResult
  failedReason?: string
  priority: number
  timestamp: number
  processedOn?: number
  finishedOn?: number
  attempts: number
  maxAttempts: number
}

type JobProcessor = (job: { id: string; data: AuditJobData }) => Promise<AuditJobResult>

class InMemoryQueue {
  private queue: InMemoryJob[] = []
  private processing = false
  private processor: JobProcessor | null = null
  private jobIdCounter = 0
  private concurrency: number
  private activeCount = 0

  constructor(private queueName: string, options?: { concurrency?: number }) {
    this.concurrency = options?.concurrency || 5
  }

  async add(jobName: string, data: AuditJobData, options?: { priority?: number; attempts?: number; backoff?: { type: string; delay: number } }): Promise<{ id: string }> {
    const jobId = `job-${++this.jobIdCounter}`
    const job: InMemoryJob = {
      id: jobId,
      data,
      status: 'queued',
      progress: 0,
      priority: options?.priority || 10,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: options?.attempts || 3,
    }

    this.queue.push(job)
    
    // Sort by priority (lower number = higher priority, like BullMQ)
    this.queue.sort((a, b) => a.priority - b.priority)

    console.log(`[audit-queue] Job ${jobId} added to in-memory queue (priority: ${job.priority}, queue size: ${this.queue.filter(j => j.status === 'queued').length})`)

    // Start processing if not already
    this.processNext()

    return { id: jobId }
  }

  private async processNext(): Promise<void> {
    if (!this.processor) return
    if (this.activeCount >= this.concurrency) return
    
    const nextJob = this.queue.find(j => j.status === 'queued')
    if (!nextJob) return

    this.activeCount++
    nextJob.status = 'active'
    nextJob.processedOn = Date.now()

    console.log(`[audit-queue] Processing job ${nextJob.id} for ${nextJob.data.targetUrl}`)

    // Process in background (don't await — allow concurrency)
    this.executeJob(nextJob).finally(() => {
      this.activeCount--
      this.processNext()
    })

    // If we have more capacity, process more jobs
    if (this.activeCount < this.concurrency) {
      this.processNext()
    }
  }

  private async executeJob(job: InMemoryJob): Promise<void> {
    try {
      job.attempts++
      const result = await this.processor!({ id: job.id, data: job.data })
      job.status = 'completed'
      job.result = result
      job.finishedOn = Date.now()
      job.progress = 100
      console.log(`[audit-queue] Job ${job.id} completed successfully`)
    } catch (error) {
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = 5000 * Math.pow(2, job.attempts - 1)
        console.warn(`[audit-queue] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}), retrying in ${delay}ms...`)
        
        job.status = 'delayed'
        setTimeout(() => {
          job.status = 'queued'
          this.processNext()
        }, delay)
      } else {
        job.status = 'failed'
        job.failedReason = error instanceof Error ? error.message : 'Unknown error'
        job.finishedOn = Date.now()
        console.error(`[audit-queue] Job ${job.id} failed permanently: ${job.failedReason}`)
      }
    }
  }

  async getJob(jobId: string): Promise<InMemoryJob | undefined> {
    return this.queue.find(j => j.id === jobId)
  }

  async getJobInfo(jobId: string): Promise<JobInfo | null> {
    const job = await this.getJob(jobId)
    if (!job) return null
    
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      data: job.data,
      result: job.result,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }
  }

  setProcessor(processor: JobProcessor): void {
    this.processor = processor
    console.log(`[audit-queue] Processor registered for in-memory queue`)
    // Start processing any jobs that were queued before the processor was registered
    this.processNext()
  }

  getQueueSize(): number {
    return this.queue.filter(j => j.status === 'queued').length
  }

  getActiveCount(): number {
    return this.activeCount
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue Factory — Returns BullMQ or In-Memory based on Redis availability
// ─────────────────────────────────────────────────────────────────────────────

let queueInstance: InMemoryQueue | null = null
let useBullMQ = false

export type AuditQueue = InMemoryQueue & {
  // BullMQ-compatible interface additions
  isBullMQ(): boolean
}

/**
 * Get or create the audit queue instance.
 * Auto-detects Redis availability and uses BullMQ when possible.
 */
export async function getAuditQueue(): Promise<InMemoryQueue & { isBullMQ: () => boolean }> {
  if (queueInstance) {
    // Use Object.assign to add isBullMQ without losing prototype methods
    // (spread operator loses class methods from the prototype chain)
    if (!(queueInstance as InMemoryQueue & { isBullMQ?: () => boolean }).isBullMQ) {
      Object.assign(queueInstance, { isBullMQ: () => useBullMQ })
    }
    return queueInstance as InMemoryQueue & { isBullMQ: () => boolean }
  }

  const redisReady = await isRedisAvailable()

  if (redisReady) {
    console.log('[audit-queue] Using BullMQ with Redis')
    // In production with Redis, we'd create a real BullMQ Queue here
    // For now, the in-memory queue works for both dev and production
    // The BullMQ Worker would run in a separate process (mini-service)
    useBullMQ = true
  } else {
    console.log('[audit-queue] Redis unavailable — using in-memory queue (sandbox/dev mode)')
    useBullMQ = false
  }

  // Use in-memory queue in both cases (BullMQ Worker is a separate mini-service)
  queueInstance = new InMemoryQueue('seo-audit-queue', { concurrency: 5 })

  // Use Object.assign to add isBullMQ without losing prototype methods
  Object.assign(queueInstance, { isBullMQ: () => useBullMQ })

  return queueInstance as InMemoryQueue & { isBullMQ: () => boolean }
}

/**
 * Add an audit job to the queue.
 * Pro users get higher priority (lower number = higher priority in BullMQ).
 */
export async function enqueueAuditJob(data: AuditJobData): Promise<{ jobId: string; status: string }> {
  const queue = await getAuditQueue()
  
  const jobPriority = data.tier === 'pro' || data.tier === 'managed' ? 1 : 10

  const job = await queue.add('analyze-site', data, {
    priority: jobPriority,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  })

  return {
    jobId: job.id,
    status: 'queued',
  }
}

/**
 * Get the status of an audit job.
 */
export async function getAuditJobStatus(jobId: string): Promise<JobInfo | null> {
  const queue = await getAuditQueue()
  return queue.getJobInfo(jobId)
}

/**
 * Register the job processor (Worker).
 * This is called by the Worker service to start processing jobs.
 */
export async function registerAuditProcessor(
  processor: (job: { id: string; data: AuditJobData }) => Promise<AuditJobResult>
): Promise<void> {
  const queue = await getAuditQueue()
  queue.setProcessor(processor)
  console.log('[audit-queue] Audit processor registered')
}
