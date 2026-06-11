import IORedis from 'ioredis'

// Singleton Redis connection for BullMQ
// Falls back gracefully when Redis is not available

let redisConnection: IORedis | null = null
let redisAvailable = false

export async function isRedisAvailable(): Promise<boolean> {
  if (redisAvailable && redisConnection) return true
  
  try {
    const connection = getRedisConnection()
    await connection.ping()
    redisAvailable = true
    return true
  } catch {
    redisAvailable = false
    return false
  }
}

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          // Stop retrying after 3 attempts
          console.warn('[redis] Max retry attempts reached. Redis unavailable.')
          return null // Stop retrying
        }
        return Math.min(times * 200, 2000)
      },
    })
    
    redisConnection.on('error', (err) => {
      // Suppress connection errors — we handle unavailability gracefully
      if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        redisAvailable = false
      }
    })
    
    redisConnection.on('ready', () => {
      redisAvailable = true
      console.log('[redis] Connected successfully')
    })
  }
  
  return redisConnection
}

export function closeRedisConnection(): void {
  if (redisConnection) {
    redisConnection.disconnect()
    redisConnection = null
    redisAvailable = false
  }
}
