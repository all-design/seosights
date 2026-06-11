/**
 * Shared Context Cache — In-Memory with TTL
 *
 * Shared Context Cache: Master Director scans once, other agents read from cache.
 * Avoids duplicate scraping and token waste for the same URL within 30 minutes.
 *
 * The Master Director (Phase 1 data gathering) saves all collected data here.
 * Subsequent analysis requests for the same URL+market combo can skip the
 * data gathering phase entirely and reuse the cached data, saving:
 *   - API calls to page_reader, web_search, etc.
 *   - Rate-limit backoff delays
 *   - Overall analysis latency
 *
 * This is an in-memory cache (no Redis needed for now).
 * The cache persists across requests within the same server process.
 * Auto-cleanup runs on each set() call to evict expired entries.
 */

export interface SharedAnalysisContext {
  url: string
  domain: string
  siteData: { title: string; html: string; text: string }
  robotsTxt: string
  llmsTxtExists: boolean
  blockedBots: { bot: string; blocked: boolean; detail: string }[]
  allowedBots: { bot: string; blocked: boolean; detail: string }[]
  searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
  aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
  localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
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
  getStats(): { size: number; entries: Array<{ key: string; url: string; market: string; age: number }> } {
    const entries: Array<{ key: string; url: string; market: string; age: number }> = []
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
 */
export const sharedContextCache = new SharedContextCache()
