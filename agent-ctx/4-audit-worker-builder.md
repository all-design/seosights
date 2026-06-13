# Task 4 - Audit Worker Builder

## Task: Create the Audit Worker as a mini-service on port 3004

## Work Log:
- Read worklog.md and all key source files (analyze/route.ts, audit-queue.ts, agents.ts, agent-protocol.ts, token-tracker.ts, plan-limits.ts, shared-context.ts, agent-fallback.ts, redis.ts, db.ts, prisma schema, agent-stream service)
- Created /mini-services/audit-worker/package.json with bullmq and ioredis dependencies
- Ran `bun install` to install dependencies
- Created /mini-services/audit-worker/index.ts with full worker logic (~1475 lines):
  - Imports from parent project using Bun's TypeScript resolver (db, agents, token-tracker, agent-fallback, shared-context, agent-protocol, plan-limits, audit-queue)
  - Utility functions extracted from /api/analyze/route.ts: retryWithBackoff, withTimeout, repairAndParseJSON, extractHtmlStructure, deepMerge
  - Core agent execution: runAgent (with fallback-aware LLM calls, token tracking, AgentLog creation), runSubAgentWithProtocol (with protocol validation and retry)
  - ensureRequiredSections function for comprehensive fallback data
  - processAuditJob main function implementing the full Producer-Worker flow:
    - Updates Analysis record to 'running'
    - Emits 'analysis:start' WebSocket event
    - Phase 1: Data Gathering (page_reader, web_search ×3) with shared context cache
    - Phase 2: Hub-and-Spoke Agent Protocol (MD first → Batch 1 → Batch 2 → MD Synthesis)
    - Phase 3: Merge results, ensure required sections, save to DB
    - Kill-Switch checks before each batch (monthly cost cap)
    - Error handling with Analysis status update to 'failed' and 'analysis:error' WS event
  - HTTP server on port 3004 with 4 endpoints:
    - GET /health — Health check with status, uptime, registration state
    - POST /start — Register with in-memory queue via registerAuditProcessor
    - POST /process-job — Direct job processing with AuditJobData validation
    - GET /stats — Worker statistics (jobs processed, failed, active, tokens, cost)
  - Auto-registration on startup (2s delay for module readiness)
  - WebSocket event emission via HTTP POST to agent-stream service on port 3003
  - Worker statistics tracking (jobsProcessed, jobsFailed, jobsActive, totalTokensUsed, totalCostUsd)
  - Process keepalive with 60s heartbeat interval
  - Graceful shutdown with SIGTERM/SIGINT handlers
  - Signal and exception debug logging
- Fixed bug in /src/lib/audit-queue.ts: Changed `{ ...queueInstance, isBullMQ }` to `Object.assign(queueInstance, { isBullMQ })` because spread operator loses class prototype methods (setProcessor was undefined)
- Verified all 4 HTTP endpoints work correctly:
  - GET /health → {"status":"ok","service":"audit-worker","port":3004,"uptime":6,"registered":true}
  - GET /stats → {"jobsProcessed":0,"jobsFailed":0,"jobsActive":0,...}
  - POST /start → {"status":"registered","message":"Worker registered with in-memory queue"}
  - POST /process-job → Accepts AuditJobData, validates required fields
- Ran `bun run lint` — zero errors
- Dev server compiles and runs successfully
- Note: Background processes in the sandbox environment are killed after ~40s, so the worker needs to be started by the init-fullstack script or a process manager for persistent operation

## Stage Summary:
- Complete Audit Worker mini-service on port 3004
- Full 8-agent analysis pipeline extracted from /api/analyze into background worker
- 4 HTTP endpoints: /health, /start, /process-job, /stats
- Auto-registers with in-memory queue on startup
- Kill-Switch integration (monthly cost cap checks before each agent batch)
- WebSocket event emission for real-time progress updates
- Fixed audit-queue.ts spread operator bug (prototype methods lost)
- Zero lint errors, all endpoints verified working
