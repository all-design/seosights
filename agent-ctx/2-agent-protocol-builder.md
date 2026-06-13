# Task 2 — Agent Protocol Builder

## Task: Implement Hub-and-Spoke JSON-strict agent communication protocol

### Work Completed:
1. Created `/src/lib/agent-protocol.ts` — the core protocol file with:
   - `AgentResponse` interface (agent_name, status, critical_findings, recommended_actions, data, token_usage)
   - `AgentAction` interface (action, priority, expected_impact, pillar, effort)
   - `ContextWindow` interface (target_url, target_domain, target_market, site_name, scan_data, sub_agent_results Map, merged_knowledge)
   - `validateAgentResponse()` — lenient validation that fills defaults for missing protocol fields
   - `buildSubAgentContext()` — builds context string from ContextWindow for a specific agent
   - `mergeSubAgentResult()` — merges validated result into ContextWindow
   - `createContextWindow()` — factory function

2. Updated `/src/lib/agents.ts`:
   - Added `responseSchema` and `contextRequirements` to AgentDefinition interface
   - All 7 sub-agents have these fields populated
   - Master Director prompt updated with Serbian protocol instructions (ZADATAK, PROTOKOL KOMUNIKACIJE, IZLAZNI FORMAT)
   - Exported `subAgents` and `masterDirectorAgent`

3. Refactored `/src/app/api/analyze/route.ts`:
   - Hub-and-spoke flow: MD first → Batch 1 sub-agents → Batch 2 sub-agents → MD synthesis
   - Each sub-agent validated via `validateAgentResponse()`, retried once if invalid
   - ContextWindow accumulates knowledge across agents
   - Per-agent retry saves tokens (no full restart needed)
   - Backward compatible: lenient fallback uses raw data if validation fails twice

### Key Design Decisions:
- Validation is lenient: missing protocol fields get defaults, non-protocol fields treated as data payload
- If validation fails twice, raw parsed data is still used (backward compatibility)
- ContextWindow uses a Map for sub_agent_results (efficient lookups by agent_name)
- Master Director runs twice: initial plan + final synthesis with full context
