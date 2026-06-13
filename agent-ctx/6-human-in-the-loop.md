---
Task ID: 6
Agent: Human-in-the-Loop System Builder
Task: Implement Auto-Pilot / Co-Pilot system with approval workflow

Work Log:
- Read worklog.md and all relevant existing files (store.ts, analyze route, AnalysisDashboard, URLInputModal, AnalyzingView, Prisma schema)
- Updated Zustand Store (`src/lib/store.ts`):
  - Added `AnalysisMode` type ('auto-pilot' | 'co-pilot')
  - Added `Approval` interface with id, analysisId, agentId, agentName, actionType, actionDescription, actionData, status, createdAt
  - Added `mode`, `pendingApprovals`, `currentAnalysisId` state fields
  - Added `setMode`, `setPendingApprovals`, `addPendingApproval`, `removePendingApproval`, `updatePendingApproval`, `setCurrentAnalysisId` actions
  - Updated `startAnalysis` to accept optional `mode` parameter
  - Updated `reset` to clear mode, pendingApprovals, and currentAnalysisId
- Updated Analyze API (`src/app/api/analyze/route.ts`):
  - Added `import { db } from '@/lib/db'`
  - Accept `mode` parameter from request body (defaults to 'auto-pilot')
  - Create Analysis record in database at the start of each analysis
  - In co-pilot mode: extract actionable items from agent results and create Approval entries
    - deepStrategy.technicalImplementations → schema-update, robots-update, meta-tag-change, content-modification
    - creative.onPageOptimizations → meta-tag-change
    - creative.answerBlocks → content-publish
    - structure.schemaRecommendations (status=active) → schema-update
  - Update Analysis record status on completion and failure
  - Include `_meta: { analysisId, mode }` in the complete event payload
- Created Approval API Endpoints:
  - `/api/approvals/route.ts`: GET (fetch approvals by analysisId + status), POST (bulk approve/reject)
  - `/api/approvals/[id]/route.ts`: PUT (approve/reject individual approval)
- Created PendingApprovalsPanel (`src/components/dashboard/PendingApprovalsPanel.tsx`):
  - Slide-in panel from the right with backdrop blur
  - Color-coded action type badges (meta-tag-change=amber, content-publish=emerald, robots-update=cyan, schema-update=purple, content-modification=rose)
  - Agent emoji + name display per approval card
  - Expandable JSON preview for proposed changes
  - Approve/Reject buttons per card with animations (slide out on action)
  - Approve All bulk action button
  - Empty state with "All Clear!" message
  - Fetches approvals from API on open with 5-second polling
- Updated AnalysisDashboard (`src/components/landing/AnalysisDashboard.tsx`):
  - Added Auto-Pilot / Co-Pilot toggle in header bar
  - Added pending approvals bell button (amber, shows count) in co-pilot mode
  - Added PendingApprovalsPanel integration
  - Added floating Co-Pilot mode banner (bottom-right) with pending count
  - Added useEffect to extract _meta (analysisId, mode) from analysis data
  - Added useEffect to fetch approvals from API in co-pilot mode with polling
  - Added ShieldCheck, PenTool, User icons to imports
- Updated URLInputModal (`src/components/landing/URLInputModal.tsx`):
  - Added mode selector with two visual cards (Auto-Pilot / Co-Pilot)
  - Auto-Pilot: Bot icon, emerald theme, "Agents execute automatically"
  - Co-Pilot: User icon, amber theme, "Agents need your approval"
  - Submit button text changes based on mode
  - Passes mode through to startAnalysis
- Updated AnalyzingView (`src/components/landing/AnalyzingView.tsx`):
  - Added `mode` from useAppStore
  - Passes mode in the fetch body to /api/analyze
- Ran `bun run db:push` — schema already in sync
- Ran `bun run lint` — zero errors
- Dev server compiles and serves pages successfully

Stage Summary:
- Complete Human-in-the-Loop (Auto-Pilot / Co-Pilot) system implemented
- Auto-Pilot mode: works exactly as before (no changes to existing behavior)
- Co-Pilot mode: creates Approval entries for agent actions, displays in slide-in panel
- Approval API endpoints: GET, POST (bulk), PUT (individual)
- Mode toggle in dashboard header and URL input modal
- Floating Co-Pilot banner with pending count
- Color-coded action type badges and expandable JSON preview
- Animated approve/reject interactions
- Zero lint errors, dev server running cleanly
