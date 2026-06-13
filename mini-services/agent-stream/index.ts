import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

interface AgentStartData {
  sessionId: string
  agentId: string
  agentName: string
  action: string
}

interface AgentProgressData {
  sessionId: string
  agentId: string
  progress: number
  message: string
}

interface AgentCompleteData {
  sessionId: string
  agentId: string
  result: string
  tokensUsed?: number
  costUsd?: number
}

interface AgentErrorData {
  sessionId: string
  agentId: string
  error: string
}

interface AnalysisStartData {
  sessionId: string
  url: string
  market: string
}

interface AnalysisCompleteData {
  sessionId: string
}

interface AnalysisErrorData {
  sessionId: string
  error: string
}

type EventData =
  | AgentStartData
  | AgentProgressData
  | AgentCompleteData
  | AgentErrorData
  | AnalysisStartData
  | AnalysisCompleteData
  | AnalysisErrorData

interface StoredEvent {
  event: string
  data: EventData
  timestamp: number
}

interface EmitRequest {
  sessionId: string
  event: string
  data: EventData
}

// ════════════════════════════════════════════════════════════════
// In-memory event store — last 100 events per session
// ════════════════════════════════════════════════════════════════

const MAX_EVENTS_PER_SESSION = 100
const eventStore = new Map<string, StoredEvent[]>()

function storeEvent(sessionId: string, event: string, data: EventData): void {
  if (!eventStore.has(sessionId)) {
    eventStore.set(sessionId, [])
  }
  const events = eventStore.get(sessionId)!
  events.push({ event, data, timestamp: Date.now() })
  // Trim to max size
  if (events.length > MAX_EVENTS_PER_SESSION) {
    eventStore.set(sessionId, events.slice(-MAX_EVENTS_PER_SESSION))
  }
}

function getEvents(sessionId: string): StoredEvent[] {
  return eventStore.get(sessionId) || []
}

// Clean up sessions older than 2 hours (run every 5 minutes)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, events] of eventStore.entries()) {
    if (events.length === 0) {
      eventStore.delete(sessionId)
      continue
    }
    const lastEventTime = events[events.length - 1].timestamp
    if (now - lastEventTime > SESSION_TTL_MS) {
      console.log(`[agent-stream] Cleaning up expired session: ${sessionId}`)
      eventStore.delete(sessionId)
    }
  }
}, 5 * 60 * 1000)

// ════════════════════════════════════════════════════════════════
// Valid event types
// ════════════════════════════════════════════════════════════════

const VALID_EVENTS = new Set([
  'agent:start',
  'agent:progress',
  'agent:complete',
  'agent:error',
  'analysis:start',
  'analysis:complete',
  'analysis:error',
])

// ════════════════════════════════════════════════════════════════
// REST request handler — handles /emit, /health, /sessions
// This runs BEFORE socket.io's handler because it's the primary
// request listener on the HTTP server.
// ════════════════════════════════════════════════════════════════

// We'll set this after creating the io instance
let ioInstance: Server

const restHandler = (req: IncomingMessage, res: ServerResponse) => {
  // ── POST /emit — Broadcast event to session room ────────────
  if (req.method === 'POST' && req.url === '/emit') {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const parsed: EmitRequest = JSON.parse(body)

        // Validate required fields
        if (!parsed.sessionId || typeof parsed.sessionId !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing or invalid sessionId' }))
          return
        }
        if (!parsed.event || typeof parsed.event !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing or invalid event' }))
          return
        }
        if (!VALID_EVENTS.has(parsed.event)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Invalid event type. Must be one of: ${Array.from(VALID_EVENTS).join(', ')}` }))
          return
        }
        if (!parsed.data || typeof parsed.data !== 'object') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing or invalid data' }))
          return
        }

        const { sessionId, event, data } = parsed

        // Store the event for replay
        storeEvent(sessionId, event, data)

        // Broadcast to the session room
        ioInstance.to(sessionId).emit(event, data)

        const roomSize = ioInstance.sockets.adapter.rooms.get(sessionId)?.size || 0
        console.log(`[agent-stream] Emitted ${event} to session ${sessionId} (${roomSize} clients)`)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          event,
          sessionId,
          recipients: roomSize,
        }))
      } catch (e) {
        console.error('[agent-stream] Failed to parse /emit request body:', e instanceof Error ? e.message : 'Unknown error')
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      }
    })
    return true // handled
  }

  // ── GET /health — Health check endpoint ─────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    const activeSessions = roomMembers.size
    const totalConnections = ioInstance.sockets.sockets.size
    const storedSessions = eventStore.size

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      service: 'agent-stream',
      port: PORT,
      activeSessions,
      totalConnections,
      storedSessions,
      uptime: process.uptime(),
    }))
    return true // handled
  }

  // ── GET /sessions/:sessionId — Debug endpoint ───────────────
  if (req.method === 'GET' && req.url?.startsWith('/sessions/')) {
    const sessionId = decodeURIComponent(req.url.slice('/sessions/'.length))
    const events = getEvents(sessionId)
    const roomSize = ioInstance.sockets.adapter.rooms.get(sessionId)?.size || 0

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      sessionId,
      eventCount: events.length,
      connectedClients: roomSize,
      events,
    }))
    return true // handled
  }

  // Not a REST route — let socket.io handle it
  return false
}

// ════════════════════════════════════════════════════════════════
// HTTP + Socket.IO Server
// ════════════════════════════════════════════════════════════════

const PORT = 3003

// Create HTTP server with combined handler:
// REST routes are handled first; socket.io handles everything else
const httpServer = createServer((req, res) => {
  const handled = restHandler(req, res)
  // If REST handler didn't handle it, socket.io will via its own listener
  // (socket.io adds a separate request listener for its transport path)
  if (!handled) {
    // For non-REST, non-socket.io paths, return 404
    if (!req.url?.startsWith('/socket.io')) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
    // If it starts with /socket.io, let socket.io's own listener handle it
  }
})

ioInstance = new Server(httpServer, {
  // Default path /socket.io/ is used — avoids conflict with REST endpoints
  // Caddy routes based on XTransformPort query param, not path
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

const io = ioInstance

// Track room membership for logging
const roomMembers = new Map<string, Set<string>>()

// ════════════════════════════════════════════════════════════════
// Socket.IO connection handling
// ════════════════════════════════════════════════════════════════

io.on('connection', (socket: Socket) => {
  console.log(`[agent-stream] Client connected: ${socket.id}`)

  // ── Join a session room ──────────────────────────────────────
  socket.on('join:session', (sessionId: string) => {
    if (!sessionId || typeof sessionId !== 'string') {
      socket.emit('error', { message: 'Invalid sessionId' })
      return
    }

    socket.join(sessionId)

    // Track room membership
    if (!roomMembers.has(sessionId)) {
      roomMembers.set(sessionId, new Set())
    }
    roomMembers.get(sessionId)!.add(socket.id)

    console.log(`[agent-stream] Client ${socket.id} joined session: ${sessionId} (room size: ${roomMembers.get(sessionId)!.size})`)

    // Send replay of stored events for this session (for late joiners)
    const storedEvents = getEvents(sessionId)
    if (storedEvents.length > 0) {
      socket.emit('session:replay', {
        sessionId,
        events: storedEvents,
        totalEvents: storedEvents.length,
      })
      console.log(`[agent-stream] Sent ${storedEvents.length} replay events to ${socket.id} for session ${sessionId}`)
    }

    // Confirm join
    socket.emit('session:joined', { sessionId, eventCount: storedEvents.length })
  })

  // ── Leave a session room ─────────────────────────────────────
  socket.on('leave:session', (sessionId: string) => {
    socket.leave(sessionId)

    const members = roomMembers.get(sessionId)
    if (members) {
      members.delete(socket.id)
      if (members.size === 0) {
        roomMembers.delete(sessionId)
      }
    }

    console.log(`[agent-stream] Client ${socket.id} left session: ${sessionId}`)
    socket.emit('session:left', { sessionId })
  })

  // ── Ping/health check ────────────────────────────────────────
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() })
  })

  // ── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    // Clean up room membership tracking
    for (const [sessionId, members] of roomMembers.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id)
        if (members.size === 0) {
          roomMembers.delete(sessionId)
        }
      }
    }
    console.log(`[agent-stream] Client disconnected: ${socket.id} (reason: ${reason})`)
  })

  socket.on('error', (error: Error) => {
    console.error(`[agent-stream] Socket error (${socket.id}):`, error.message)
  })
})

// ════════════════════════════════════════════════════════════════
// Start server
// ════════════════════════════════════════════════════════════════

httpServer.listen(PORT, () => {
  console.log(`[agent-stream] 🚀 WebSocket server running on port ${PORT}`)
  console.log(`[agent-stream] Socket.IO path: /socket.io/ (default)`)
  console.log(`[agent-stream] REST endpoints:`)
  console.log(`[agent-stream]   POST /emit     — Broadcast event to session room`)
  console.log(`[agent-stream]   GET  /health   — Health check`)
  console.log(`[agent-stream]   GET  /sessions/:id — View session events`)
  console.log(`[agent-stream] Frontend connection: io("/?XTransformPort=3003")`)
  console.log(`[agent-stream] Supported events: ${Array.from(VALID_EVENTS).join(', ')}`)
})

// Graceful shutdown
function shutdown() {
  console.log('[agent-stream] Shutting down...')
  io.disconnectSockets()
  httpServer.close(() => {
    console.log('[agent-stream] Server closed')
    process.exit(0)
  })
  // Force exit after 5s
  setTimeout(() => {
    console.error('[agent-stream] Forced shutdown after timeout')
    process.exit(1)
  }, 5000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
