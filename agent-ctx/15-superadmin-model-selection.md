# Task 15 - Superadmin Panel Model Selection Enhancement

## Summary
Enhanced the Superadmin Panel with model selection dropdowns, improved fallback configuration, and model cost reference card.

## Changes Made

### 1. New Types & Constants (SuperadminPanel.tsx)
- Added `FallbackHistoryItem` interface for fallback history display
- Added `PRIMARY_MODEL_OPTIONS` constant: "default", "gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "deepseek-v3"
- Added `FALLBACK_MODEL_OPTIONS` constant: Same as primary + "none" option
- Added `MODEL_COST_REFERENCE` constant with pricing data for each model
- Added `ArrowRight` and `TestTube` lucide icon imports

### 2. Tab 2 - Prompt Playground Enhancements
- Added `editModel` and `editFallbackModel` state variables
- Added Primary Model dropdown (selects from PRIMARY_MODEL_OPTIONS)
- Added Fallback Model dropdown (selects from FALLBACK_MODEL_OPTIONS including "none")
- Both dropdowns save changes to the AgentPrompt record via PUT /api/admin/prompts immediately
- `handleModelChange()` and `handleFallbackModelChange()` functions for auto-saving model changes
- Save button now includes model and fallbackModel in the payload
- Fallback chain visualization shows: `model → fallbackModel` or `(no fallback)`

### 3. Tab 3 - Fallback Configuration Overhaul
- Replaced card-per-agent layout with a unified table layout showing: Agent | Primary Model | Fallback Model | Auto-Fallback Toggle | Status | Test Button
- Each row has Select dropdowns for both primary and fallback model selection
- Added `status` field per agent: 'active' (🟢), 'degraded' (🟡), 'down' (🔴)
- Added "Test All Fallbacks" button that sequentially tests each agent's fallback chain
- `handleTestAllFallbacks()` runs tests sequentially with visual status updates
- Added `handleUpdateAgent()` function that updates both model and fallbackModel fields
- Test results display inline in the table cell

### 4. Model Cost Reference Card
- Added below the fallback configuration table
- Shows pricing table: Model | Input/1K | Output/1K | Speed
- Speed badges with color coding (Fast = emerald, Medium = amber)
- Uses the MODEL_COST_REFERENCE constant

### 5. Fallback History Section
- Added below the Model Cost Reference Card
- Fetches from new `/api/admin/fallback-history` endpoint
- Shows recent failed agent logs with: agent name, model, timestamp, action, error
- ScrollArea with max-h-64 for overflow
- Refresh button to reload history
- Empty state message when no events exist

### 6. New API Route
- Created `/home/z/my-project/src/app/api/admin/fallback-history/route.ts`
- GET endpoint that queries AgentLog records where status='failed'
- Returns ordered by startedAt desc, limited to configurable count (default 20)
- Returns: id, agentId, agentName, action, status, model, error, startedAt

## Files Modified
- `/home/z/my-project/src/components/superadmin/SuperadminPanel.tsx` - Main component changes
- `/home/z/my-project/src/app/api/admin/fallback-history/route.ts` - New API route

## Backward Compatibility
- The PUT /api/admin/prompts route already supported `model` and `fallbackModel` fields
- All existing Superadmin Panel tabs (Token & Cost, Analysis History, Users) remain unchanged
- The AgentPrompt Prisma schema already had `model` and `fallbackModel` fields
