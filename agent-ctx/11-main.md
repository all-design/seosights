# Task 11: AI Visibility Alerts System

## Agent: main

## Summary
Created the AI Visibility Alerts system for the seosights project, including API routes, a slide-in panel component, and dashboard integration.

## Files Modified/Created

### 1. `/home/z/my-project/src/app/api/alerts/route.ts` (Pre-existing)
- Already had GET, POST, PUT handlers implemented
- GET: Fetches alerts with optional filters (domain, userId, isRead, severity), includes unread count
- POST: Creates a new alert with domain, alertType, severity, message, and optional data
- PUT: Marks alerts as read by accepting an array of alertIds

### 2. `/home/z/my-project/src/app/api/alerts/check/route.ts` (Pre-existing)
- Already had the visibility check endpoint implemented
- Uses z-ai-web-dev-sdk for web search and page reading
- Checks AI citations, robots.txt bot access, llms.txt presence, and score changes
- Creates alerts when changes are detected

### 3. `/home/z/my-project/src/components/dashboard/AlertsPanel.tsx` (Created)
- Slide-in panel component with Framer Motion animations
- Features:
  - Severity icons (🔴🟡🔵) and type badges with color-coded styling
  - Filter tabs: All / Critical / Warning / Info with counts
  - Mark as read / Mark all as read functionality
  - "Check Visibility" button triggering `/api/alerts/check`
  - Auto-refresh every 60 seconds
  - Relative time display for alert timestamps
  - Animated list with staggered entrance
  - Unread indicator with ping animation
  - Domain display and monitoring footer

### 4. `/home/z/my-project/src/components/landing/AnalysisDashboard.tsx` (Updated)
- Added import for AlertsPanel component
- Added state: `showAlertsPanel`, `alertUnreadCount`
- Added `alertDomain` computed variable for extracting hostname from URL
- Added `useEffect` to fetch unread alert count every 30 seconds
- Added cyan-colored bell icon button in header (next to mode toggle) with:
  - Alert count badge when unread > 0
  - Ping animation for new alerts
- Added AlertsPanel component rendering with domain prop

## Design Decisions
- Used cyan color scheme for visibility alerts (vs amber for co-pilot approvals) to visually distinguish the two notification systems
- Alerts bell is always visible (not mode-dependent), unlike the approvals bell which only shows in co-pilot mode
- Domain is extracted from the analysis URL for alert filtering
- Auto-refresh at 60s for the panel, 30s for the header badge count
