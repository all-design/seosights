# Task ID: 5 — WebSocket Agent-Stream Integration

## Agent: WebSocket Integration Agent

## Task
Integrate the WebSocket agent-stream service (port 3003) into the existing AnalyzingView component, and update the analyze API to emit real-time agent events.

## Work Log

### 1. Installed socket.io-client
- Ran `bun add socket.io-client` in the main project
- Package `socket.io-client@4.8.3` installed successfully

### 2. Updated Zustand Store (`src/lib/store.ts`)
- Added `sessionId: string` field to `AppState` interface (default: `''`)
- Added `setSessionId` action
- Updated `reset()` to clear sessionId
- Updated `startAnalysis()` to reset sessionId

### 3. Updated AnalyzingView (`src/components/landing/AnalyzingView.tsx`)
- Added `io` import from `socket.io-client`
- Added `AgentLogEntry` interface with: id, timestamp, agentId, agentName, agentIcon, action, status ('running'|'complete'|'error'), duration
- Added `AGENT_ICON_MAP` and `AGENT_COLOR_MAP` constants for visual consistency with agent identities
- Added WebSocket connection via `useEffect` that:
  - Connects to `io("/?XTransformPort=3003")` when `sessionId` is set
  - Emits `join:session` on connect
  - Listens for `agent:start`, `agent:progress`, `agent:complete`, `agent:error`, `analysis:start`, `analysis:complete`, `analysis:error`
  - Handles `session:replay` for late joiners (replays stored events)
  - Tracks agent start times for duration calculation
  - Disconnects on cleanup
- Added `handleSocketEvent` callback that updates `agentLogs` state:
  - `agent:start` → adds running entry
  - `agent:progress` → updates last running entry's action text
  - `agent:complete` → marks running entry as complete with duration
  - `agent:error` → marks running entry as error
  - `analysis:start` → adds system entry
- Added Live Agent Log Panel below the progress bar:
  - Dark semi-transparent background (terminal/console aesthetic)
  - Header: "Live Agent Stream" with Terminal icon + pulsing green dot + event count
  - Monospace font for all entries
  - Each entry shows: timestamp, agent icon, agent name (color-coded), "—", action, status indicator
  - Status: ✓ + duration (complete), pulsing dot + "Running" (running), ✗ error (error)
  - Max height 300px with scroll, auto-scrolls to latest
  - Framer Motion AnimatePresence for smooth entry animations
- Added `setSessionId` from store and wired it to the first SSE progress event
- Updated retry handler to clear agent logs and start times

### 4. Updated Analyze API (`src/app/api/analyze/route.ts`)
- Added `import { randomUUID } from 'crypto'`
- Added `emitWS()` helper function that POSTs to `http://localhost:3003/emit` (non-blocking, best-effort)
- Updated `sendProgress()` to accept optional `sessionId` parameter and include it in the SSE payload
- Generate `analysisSessionId = randomUUID()` at the start of each analysis
- Emit `analysis:start` via WebSocket at the beginning
- Include `sessionId` in the first SSE progress event (progress=5)
- For each agent in Batch 1 and Batch 2:
  - Emit `agent:start` when agent begins (with agentId, agentName, action from agent.role)
  - Emit `agent:progress` during agent execution
  - Emit `agent:complete` when agent succeeds (Object.keys(result.data).length > 0)
  - Emit `agent:error` when agent returns empty result
- Emit `analysis:complete` at the end
- Emit `analysis:error` on catch block errors

### 5. Started Agent-Stream Mini-Service
- Verified the mini-service at `mini-services/agent-stream/` has proper package.json and index.ts
- Installed dependencies (`bun install`)
- Started service with `nohup bun index.ts` — confirmed running on port 3003
- Tested `/health` endpoint — returns `{"status":"ok"}`
- Tested `/emit` endpoint — successfully stores and broadcasts events

### 6. Lint & Dev Server Verification
- Lint passes with zero errors (after removing unused eslint-disable directive)
- Dev server compiles and serves pages successfully
- Agent-stream service confirmed running on port 3003

## Architecture Summary

```
Frontend (AnalyzingView)
  ├── SSE Stream ← /api/analyze (progress percentage, step description, sessionId)
  └── WebSocket ← agent-stream:3003 (detailed agent logs)
        ├── Connect: io("/?XTransformPort=3003")
        ├── Join room: emit("join:session", sessionId)
        └── Listen: agent:start, agent:progress, agent:complete, agent:error

Backend (/api/analyze)
  ├── SSE: yield sendProgress() → progress bar
  └── WS: emitWS() → POST /emit to agent-stream:3003 → broadcasts to room

Agent-Stream Service (port 3003)
  ├── Socket.IO server with session rooms
  ├── REST /emit endpoint (POST) — called by analyze API
  ├── Event replay for late joiners
  └── In-memory event store (100 events/session, 2hr TTL)
```

## Key Design Decisions
1. **SSE remains primary progress driver** — WebSocket is supplementary for detailed agent logs
2. **WebSocket is best-effort** — emitWS() failures don't break analysis
3. **sessionId flows through SSE** — first SSE event includes it so frontend can join the WebSocket room
4. **Agent icons/colors are mapped client-side** — consistent with existing dashboard design
5. **Event replay** — late-joining clients get full history via session:replay
