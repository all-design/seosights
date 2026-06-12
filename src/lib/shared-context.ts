/**
 * Shared Context Cache — Redis-backed with In-Memory Fallback
 *
 * Shared Context Cache: Master Director scans once, other agents read from cache.
 * Avoids duplicate scraping and token waste for the same URL within the TTL window.
 *
 * The Master Director (Phase 1 data gathering) saves all collected data here.
 * Subsequent analysis requests for the same URL+market combo can skip the
 * data gathering phase entirely and reuse the cached data, saving:
 *   - API calls to page_reader, web_search, etc.
 *   - Rate-limit backoff delays
 *   - Overall analysis latency
 *
 * Architecture:
 *   - Redis is the primary cache (shared across processes/instances)
 *   - In-memory Map is the fallback (when Redis is unavailable)
 *   - All Redis operations are wrapped in try/catch — failures never break the system
 *   - Backward compatibility: the old SharedContextCache + sharedContextCache
 *     singleton remain available for the SSE analyze route
 */

import { getRedisConnection, isRedisAvailable } from './redis'
import {
  ScrapedSharedContext,
  getAgentSpecificContext,
  AGENT_CONTEXT_FOCUS,
} from './scraper'

// ─────────────────────────────────────────────────────────────────────────────
// Redis Key Patterns
// ─────────────────────────────────────────────────────────────────────────────

/** Key prefix for all shared context entries */
const KEY_PREFIX = 'seosights:shared_context'

/** TTL for Redis entries (1 hour in seconds) */
const REDIS_TTL_SECONDS = 3600

/**
 * Build a Redis key for project-based lookups.
 * Pattern: seosights:shared_context:{projectId}
 */
function projectKey(projectId: string): string {
  return `${KEY_PREFIX}:${projectId}`
}

/**
 * Build a Redis key for URL-based lookups.
 * Pattern: seosights:shared_context:{domain}:{market}
 */
function domainMarketKey(domain: string, market: string): string {
  const normalizedDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .toLowerCase()
  const normalizedMarket = market.toLowerCase().trim()
  return `${KEY_PREFIX}:${normalizedDomain}:${normalizedMarket}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Interface & Class — Backward Compatibility
// ─────────────────────────────────────────────────────────────────────────────

export interface SharedAnalysisContext {
  url: string
  domain: string
  siteData: { title: string; html: string; text: string }
  robotsTxt: string
  llmsTxtExists: boolean
  blockedBots: { bot: string; blocked: boolean; detail: string }[]
  allowedBots: { bot: string; blocked: boolean; detail: string }[]
  searchResults: Array<{
    name?: string
    url?: string
    snippet?: string
    host_name?: string
  }>
  aiSearchResults: Array<{
    name?: string
    url?: string
    snippet?: string
    host_name?: string
  }>
  localSearchResults: Array<{
    name?: string
    url?: string
    snippet?: string
    host_name?: string
  }>
  htmlStructure: string
  createdAt: number // timestamp (Date.now())
}

class SharedContextCache {
  private cache: Map<string, SharedAnalysisContext> = new Map()
  private ttl: number = 30 * 60 * 1000 // 30 minutes

  /**
   * Build a cache key from URL + market combo.
   * Normalizes the URL by stripping protocol and trailing slash.
   */
  private buildKey(url: string, market: string): string {
    const normalized = url
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase()
    const normalizedMarket = market.toLowerCase().trim()
    return `${normalized}:${normalizedMarket}`
  }

  /**
   * Get a cached analysis context. Returns null if not found or expired.
   */
  get(url: string, market: string): SharedAnalysisContext | null {
    const key = this.buildKey(url, market)
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.createdAt > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry
  }

  /**
   * Save analysis context to the cache.
   * Also triggers auto-cleanup of expired entries.
   */
  set(url: string, market: string, data: SharedAnalysisContext): void {
    const key = this.buildKey(url, market)
    this.cache.set(key, data)

    // Auto-cleanup expired entries on each set() call
    this.cleanup()
  }

  /**
   * Check if a fresh (non-expired) cache entry exists for the given URL+market.
   */
  has(url: string, market: string): boolean {
    return this.get(url, market) !== null
  }

  /**
   * Remove a specific cache entry.
   */
  clear(url: string, market: string): void {
    const key = this.buildKey(url, market)
    this.cache.delete(key)
  }

  /**
   * Remove all cache entries.
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Auto-cleanup expired entries.
   * Called automatically on each set() call.
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics for monitoring/debugging.
   */
  getStats(): {
    size: number
    entries: Array<{ key: string; url: string; market: string; age: number }>
  } {
    const entries: Array<{
      key: string
      url: string
      market: string
      age: number
    }> = []
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        url: entry.url,
        market: entry.domain,
        age: Math.round((now - entry.createdAt) / 1000), // age in seconds
      })
    }
    return { size: this.cache.size, entries }
  }
}

/**
 * Singleton instance — shared across all requests in the same server process.
 * Kept for backward compatibility with the SSE analyze route.
 */
export const sharedContextCache = new SharedContextCache()

// ─────────────────────────────────────────────────────────────────────────────
// RedisSharedContextCache — Redis-primary with in-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

class RedisSharedContextCache {
  /** In-memory fallback when Redis is unavailable */
  private memoryFallback: Map<string, ScrapedSharedContext> = new Map()

  /** Track Redis availability state (cached to avoid excessive pings) */
  private _redisAvailable: boolean = false
  private _lastRedisCheck: number = 0
  private _redisCheckInterval: number = 30_000 // recheck every 30s

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Check if Redis is currently available (with caching to avoid spamming ping).
   */
  private async checkRedisAvailable(): Promise<boolean> {
    const now = Date.now()
    if (now - this._lastRedisCheck < this._redisCheckInterval && this._redisAvailable) {
      return true
    }
    try {
      this._redisAvailable = await isRedisAvailable()
      this._lastRedisCheck = now
    } catch {
      this._redisAvailable = false
    }
    return this._redisAvailable
  }

  /**
   * Build the Redis key for a given projectId.
   * Uses pattern: seosights:shared_context:{projectId}
   */
  private buildProjectKey(projectId: string): string {
    return projectKey(projectId)
  }

  /**
   * Build the Redis key for a domain+market pair.
   * Uses pattern: seosights:shared_context:{domain}:{market}
   */
  private buildDomainMarketKey(domain: string, market: string): string {
    return domainMarketKey(domain, market)
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Store scraped context in Redis (primary) and in-memory fallback.
   *
   * - Writes to Redis with EX 3600 (1-hour TTL)
   * - Also writes to the in-memory Map so fallback reads are fast
   * - If Redis is unavailable, only writes to memory
   */
  async setScrapedContext(
    projectId: string,
    data: ScrapedSharedContext
  ): Promise<void> {
    // Always write to in-memory fallback
    this.memoryFallback.set(projectId, data)

    // Also index by domain:market if data has domain info
    if (data.meta_data.domain) {
      // Extract market from the data or default to 'global' — this enables
      // domain:market lookups alongside project-based ones
      const domainKey = this.buildDomainMarketKey(
        data.meta_data.domain,
        (data as Record<string, unknown>).market as string || 'global'
      )
      this.memoryFallback.set(domainKey, data)
    }

    // Try Redis
    try {
      const redisAvailable = await this.checkRedisAvailable()
      if (redisAvailable) {
        const redis = getRedisConnection()
        const serialized = JSON.stringify(data)

        // Write with project key
        await redis.set(
          this.buildProjectKey(projectId),
          serialized,
          'EX',
          REDIS_TTL_SECONDS
        )

        // Also index by domain:market for URL-based lookups
        if (data.meta_data.domain) {
          const domainKey = this.buildDomainMarketKey(
            data.meta_data.domain,
            (data as Record<string, unknown>).market as string || 'global'
          )
          await redis.set(domainKey, serialized, 'EX', REDIS_TTL_SECONDS)
        }
      }
    } catch (error) {
      console.warn(
        '[RedisSharedContextCache] Redis write failed, using in-memory fallback:',
        error instanceof Error ? error.message : String(error)
      )
      this._redisAvailable = false
    }
  }

  /**
   * Retrieve scraped context by projectId.
   *
   * - Reads from Redis first
   * - Falls back to in-memory if Redis misses or is unavailable
   * - Returns null if not found anywhere
   */
  async getScrapedContext(
    projectId: string
  ): Promise<ScrapedSharedContext | null> {
    // Try Redis first
    try {
      const redisAvailable = await this.checkRedisAvailable()
      if (redisAvailable) {
        const redis = getRedisConnection()
        const raw = await redis.get(this.buildProjectKey(projectId))
        if (raw) {
          const parsed = JSON.parse(raw) as ScrapedSharedContext
          // Sync to in-memory for faster subsequent reads
          this.memoryFallback.set(projectId, parsed)
          return parsed
        }
      }
    } catch (error) {
      console.warn(
        '[RedisSharedContextCache] Redis read failed, falling back to in-memory:',
        error instanceof Error ? error.message : String(error)
      )
      this._redisAvailable = false
    }

    // Fall back to in-memory
    const memEntry = this.memoryFallback.get(projectId)
    if (memEntry) {
      // Check TTL (1 hour) for in-memory entries
      if (Date.now() - memEntry.scraped_at > REDIS_TTL_SECONDS * 1000) {
        this.memoryFallback.delete(projectId)
        return null
      }
      return memEntry
    }

    return null
  }

  /**
   * Retrieve agent-specific context for a given project and agent.
   *
   * Reads the full context and returns only the subset that the agent
   * needs, as defined by AGENT_CONTEXT_FOCUS.
   */
  async getAgentContext(
    projectId: string,
    agentId: string
  ): Promise<Record<string, unknown> | null> {
    const fullContext = await this.getScrapedContext(projectId)
    if (!fullContext) return null

    return getAgentSpecificContext(fullContext, agentId)
  }

  /**
   * Check if a cached context exists for the given projectId.
   */
  async has(projectId: string): Promise<boolean> {
    const context = await this.getScrapedContext(projectId)
    return context !== null
  }

  /**
   * Remove a cached context from both Redis and in-memory fallback.
   */
  async delete(projectId: string): Promise<void> {
    // Remove from in-memory
    this.memoryFallback.delete(projectId)

    // Remove from Redis
    try {
      const redisAvailable = await this.checkRedisAvailable()
      if (redisAvailable) {
        const redis = getRedisConnection()
        await redis.del(this.buildProjectKey(projectId))

        // Also try to remove the domain:market index if we have the data
        // (We don't have the data anymore since we just deleted it from memory,
        //  so we rely on Redis TTL for cleanup of domain:market keys)
      }
    } catch (error) {
      console.warn(
        '[RedisSharedContextCache] Redis delete failed:',
        error instanceof Error ? error.message : String(error)
      )
      this._redisAvailable = false
    }
  }

  /**
   * Get cache statistics for monitoring/debugging.
   */
  getStats(): { size: number; redisAvailable: boolean } {
    return {
      size: this.memoryFallback.size,
      redisAvailable: this._redisAvailable,
    }
  }
}

/**
 * Singleton instance of the Redis-backed shared context cache.
 * Use this for new code that needs project-based or agent-specific context.
 */
export const redisSharedContext = new RedisSharedContextCache()
