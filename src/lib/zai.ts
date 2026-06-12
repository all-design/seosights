/**
 * z-ai-web-dev-sdk Initialization Utility
 *
 * In development: reads from /etc/.z-ai-config (sandbox default)
 * In production (Vercel): creates ZAI instance directly from Z_AI_CONFIG env var
 *   (bypasses file-based config since Vercel filesystem is read-only)
 */
import path from 'path'

let zaiInstance: unknown = null

export async function getZAI() {
  if (zaiInstance) return zaiInstance

  const ZAI = (await import('z-ai-web-dev-sdk')).default

  // In production (Vercel/etc), use env var directly — no file system writes needed
  const envConfig = process.env.Z_AI_CONFIG
  if (envConfig) {
    try {
      const config = JSON.parse(envConfig)
      if (config.baseUrl && config.apiKey) {
        zaiInstance = new ZAI(config)
        console.log('[zai] Initialized from Z_AI_CONFIG env var (no file write)')
        return zaiInstance
      }
    } catch (e) {
      console.error('[zai] Failed to parse Z_AI_CONFIG env var:', e instanceof Error ? e.message : 'Unknown')
    }
  }

  // Fallback: use SDK's built-in file-based config loading (works in local dev)
  try {
    zaiInstance = await ZAI.create()
    console.log('[zai] Initialized from .z-ai-config file')
    return zaiInstance
  } catch (e) {
    console.error('[zai] Failed to initialize:', e instanceof Error ? e.message : 'Unknown')
    throw new Error('ZAI SDK initialization failed. Set Z_AI_CONFIG env var or provide .z-ai-config file.')
  }
}
