# Task 7: Seed AgentPrompt Table

## Summary
Created `prisma/seed.ts` to populate the AgentPrompt table with 8 agent prompt records, each derived from the agent definitions in `src/lib/agents.ts`.

## What was done
1. Read `src/lib/agents.ts` to extract all 8 agent definitions (system prompts + buildUserPrompt functions)
2. Read `prisma/schema.prisma` to understand the AgentPrompt model structure
3. Created `prisma/seed.ts` with:
   - Import of `db` from `../src/lib/db`
   - 8 agent records, each with:
     - `agentId`: from agent.id (e.g., "master-director")
     - `agentName`: from agent.name (e.g., "Master Director")
     - `systemPrompt`: from agent.systemPrompt (verbatim)
     - `userPromptTemplate`: Converted from `buildUserPrompt` function by replacing:
       - `ctx.url` → `{{url}}`
       - `ctx.domain` → `{{domain}}`
       - `ctx.siteName` → `{{siteName}}`
       - `ctx.siteContent` → `{{siteContent}}`
       - `ctx.htmlStructure` → `{{htmlStructure}}`
       - `ctx.competitorInfo` → `{{competitorInfo}}`
       - `ctx.aiInfo` → `{{aiInfo}}`
       - `ctx.localInfo` → `{{localInfo}}`
       - `ctx.targetMarket` → `{{targetMarket}}`
       - `ctx.targetMarket !== 'Global'` → `{{targetMarketNotGlobal}}` (computed boolean)
     - Removed `.slice()` and `|| 'None'` operations (handled at runtime)
     - `model`: "default"
     - `fallbackModel`: "gpt-4o-mini"
     - `isActive`: true
     - `version`: 1
   - Upsert pattern (create on first run, update on subsequent runs)
4. Confirmed `db:seed` script already existed in package.json
5. Ran `bun run db:seed` successfully
6. Verified all 8 records exist in the database

## Files Created/Modified
- **Created**: `prisma/seed.ts`
- **Existing** (no changes needed): `package.json` (already had `db:seed` script)

## Verification
```
Total AgentPrompt records: 8
- master-director (Master Director)
- keyword-researcher (Keyword Researcher)
- competitor-analyst (Competitor Analyst)
- content-architect (Content Architect)
- on-page-auditor (On-Page Auditor)
- link-strategist (Link Strategist)
- tech-schema-auditor (Tech & Schema Auditor)
- backlink-prospector (Backlink Prospector)
```
