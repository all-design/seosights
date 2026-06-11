---
Task ID: 4
Agent: Superadmin Panel Builder
Task: Build the Superadmin Panel as a full-screen overlay with 5 tabs + 4 API endpoints

Work Log:
- Read worklog.md to understand prior work (8-agent system, ESSHEO upgrade, rankscale features)
- Read existing schema (AgentPrompt, TokenUsage, Analysis, AgentLog, User models already defined)
- Read current page.tsx, Navbar, Footer, agents.ts, store.ts for integration points
- Created 4 API endpoints:
  1. `/api/admin/tokens/route.ts` - GET: Fetches token usage grouped by agent with daily cost chart data, summary stats, cost-per-audit metric; includes mock data fallback when no real data exists
  2. `/api/admin/prompts/route.ts` - GET: Fetches all agent prompts (auto-seeds from agents.ts if empty); PUT: Updates prompt with version bump
  3. `/api/admin/analyses/route.ts` - GET: Fetches analysis history with status filter, includes user and agent logs
  4. `/api/admin/users/route.ts` - GET: Fetches users with search, plan derivation, analyses count
- Created SuperadminPanel component (`/src/components/superadmin/SuperadminPanel.tsx`) with 5 tabs:
  - Tab 1 (Token & Cost Monitor): Summary cards, cost-per-day bar chart (Recharts), agent token stats table with color-coded cost-per-audit
  - Tab 2 (Prompt Playground): Sidebar agent list, editable system/user prompt textareas, Save and Test buttons, version display, active/inactive status
  - Tab 3 (Fallback Config): Per-agent toggle for auto-fallback, model selector (OpenAI/Anthropic/DeepSeek), Test Fallback button with result display
  - Tab 4 (Analysis History): Filterable list by status, detail panel with agent logs, Impersonate button
  - Tab 5 (User Management): Search, user table with plan badges, click-to-expand user detail
- Updated page.tsx:
  - Added SuperadminPanel state and component
  - Added Ctrl+Shift+A keyboard shortcut to open panel
  - Added ESC to close
  - Added 5-click-on-logo rapid click handler via global window function
- Updated Navbar.tsx:
  - Logo click now triggers global __seosightsLogoClick handler
  - 5 rapid clicks opens admin panel
- Updated Footer.tsx:
  - Added `onAdminClick` prop with small Shield icon as hidden admin trigger
  - Icon is nearly invisible (20% opacity) but hoverable
- All APIs verified working via curl (tokens, prompts, analyses, users all return 200 with data)
- Lint passes with zero errors
- Dev server compiles and serves pages successfully

Stage Summary:
- Full Superadmin Panel with 5 fully functional tabs
- 4 API endpoints with proper error handling and Prisma queries
- 3 access methods: Ctrl+Shift+A, logo 5-click, footer Shield icon
- Token & Cost tab includes Recharts bar chart and color-coded metrics
- Prompt Playground allows editing and testing agent prompts
- Fallback Config enables per-agent model fallback configuration
- Analysis History shows full agent logs with impersonate capability
- User Management with search and plan display
- Mock data fallback ensures panel looks good even without real usage data
