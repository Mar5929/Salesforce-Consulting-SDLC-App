---
phase: 04-salesforce-org-connectivity-and-developer-integration
verified: 2026-04-07T00:30:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Trigger Salesforce OAuth flow from org settings page at /projects/[id]/settings/org"
    expected: "Page loads with OrgConnectionCard showing Disconnected status. 'Connect Salesforce Org' button redirects to Salesforce login. On return, callback stores tokens and displays Connected status with green badge."
    why_human: "OAuth redirect flow and real token exchange requires live Salesforce Connected App credentials and browser interaction."
  - test: "Trigger a metadata sync and verify the Syncing status badge appears"
    expected: "After clicking 'Sync Metadata', the connection card should briefly show 'Syncing' status (with animated pulse badge). Currently isSyncing is hardcoded false — verify whether this omission is acceptable or needs a fix."
    why_human: "Syncing state detection requires a live Inngest job running and real-time status polling, which cannot be verified programmatically. The isSyncing=false hardcode is a known stub from Plan 02."
  - test: "Run brownfield ingestion by clicking 'Analyze Org' at /projects/[id]/org/analysis"
    expected: "Pipeline stepper advances through Parse > Classify > Synthesize > Complete phases with animated indicators. Domain Groupings and Business Processes tabs populate with AI-generated review cards showing confidence badges. Confirm/Edit/Reject buttons update state and cards refresh."
    why_human: "Requires a live org with synced components and Claude API call to verify AI output and card interactivity."
  - test: "Generate and use an API key from /projects/[id]/settings/developer-api"
    expected: "Clicking 'Generate API Key' opens dialog, entering a name and submitting shows the raw key in monospace with copy-to-clipboard. Key appears in the active keys table. Calling GET /api/v1/project/summary with the key returns project data."
    why_human: "API key creation and live endpoint consumption require a running application. The raw key display is a one-time show that cannot be replayed programmatically."
---

# Phase 4: Salesforce Org Connectivity and Developer Integration — Verification Report

**Phase Goal:** The platform connects to live Salesforce orgs, builds an org knowledge base from metadata, and exposes a REST API that Claude Code consumes for context-aware development
**Verified:** 2026-04-07T00:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can connect a Salesforce org via OAuth and the system performs incremental metadata sync on a schedule | ✓ VERIFIED | OAuth authorize/callback routes wired to `buildAuthorizationUrl`/`exchangeCodeForTokens`. Callback fires `ORG_SYNC_REQUESTED` Inngest event. `metadataSyncFunction` registered with per-project concurrency and cron support. |
| 2 | Brownfield ingestion pipeline processes org metadata through Parse > Classify > Synthesize > Articulate, with AI-suggested domain groupings confirmed by the architect | ✓ VERIFIED | `orgIngestionFunction` is a 4-step Inngest function. `orgClassifyTask` and `orgSynthesizeTask` produce `isAiSuggested=true / isConfirmed=false` records. All confirm/reject/edit server actions present in `org-analysis.ts`. |
| 3 | Claude Code can call the REST API to retrieve context packages (story details, business processes, knowledge articles, decisions, sprint conflicts) and update story status | ✓ VERIFIED | All four `/api/v1/` endpoints exist and are wired through `withApiAuth`. Context package assembles all 5 data types from real DB queries. Story status PATCH fires `STORY_STATUS_CHANGED` event. |
| 4 | Org components are mapped to business processes with the isConfirmed pattern for human oversight | ✓ VERIFIED | `BusinessProcess` and `BusinessProcessComponent` records created with `isAiSuggested=true, isConfirmed=false`. Architect confirm/reject/edit actions gated to SA/PM roles. Bulk-confirm action present. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | ApiKey, ApiRequestLog, OrgSyncRun models | ✓ VERIFIED | All 3 models with correct indexes. OrgComponent, OrgRelationship, DomainGrouping also present. |
| `src/lib/salesforce/types.ts` | SUPPORTED_METADATA_TYPES, SfConnectionStatus | ✓ VERIFIED | 10 metadata types configured; SfConnectionStatus type exported. |
| `src/lib/salesforce/oauth.ts` | buildAuthorizationUrl, exchangeCodeForTokens | ✓ VERIFIED | Both functions exported; manual URL construction handles `state` param for CSRF. |
| `src/lib/salesforce/client.ts` | getSalesforceConnection with refresh handler | ✓ VERIFIED | `conn.on("refresh")` re-encrypts and persists new token. |
| `src/lib/api-keys/generate.ts` | generateApiKey with sfai_ prefix | ✓ VERIFIED | `sfai_${projectId.slice(0,8)}_${32 hex chars}` format. bcrypt cost 12. |
| `src/lib/api-keys/middleware.ts` | validateApiKey with x-api-key header | ✓ VERIFIED | keyPrefix index lookup + bcrypt compare. Generic 401 for failures. |
| `src/lib/api-keys/rate-limit.ts` | checkRateLimit Postgres sliding window | ✓ VERIFIED | Counts ApiRequestLog entries within window. No Redis dependency. |
| `src/app/api/auth/salesforce/authorize/route.ts` | GET with role check | ✓ VERIFIED | Auth + SA/PM role check via SOLUTION_ARCHITECT/PM enum values. |
| `src/app/api/auth/salesforce/callback/route.ts` | GET with token exchange and sync trigger | ✓ VERIFIED | `exchangeCodeForTokens` called; `ORG_SYNC_REQUESTED` event fired. |
| `src/actions/org-connection.ts` | disconnectOrg, requestSync, getOrgConnectionStatus | ✓ VERIFIED | All 3 exported with SA/PM role gating. |
| `src/components/org/org-connection-card.tsx` | Connection status card | ✓ VERIFIED | 4 states with correct badge colors (#22C55E, #F59E0B). Connect/Disconnect/Sync buttons present. |
| `src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx` | Org settings page | ✓ VERIFIED | Renders OrgConnectionCard with canManage, handles oauth_failed and connected params. |
| `src/lib/salesforce/metadata-sync.ts` | syncMetadata, syncMetadataType | ✓ VERIFIED | 5-minute buffer for incremental sync; soft-delete (isActive=false) for full sync. |
| `src/lib/inngest/functions/metadata-sync.ts` | Inngest function with concurrency | ✓ VERIFIED | Per-project concurrency limit of 1; registered in serve handler. |
| `src/components/org/sync-history-table.tsx` | SyncHistoryTable | ✓ VERIFIED | Date formatting (yyyy-MM-dd HH:mm), colored status badges, error tooltip. |
| `src/components/org/component-table.tsx` | ComponentTable with type filter | ✓ VERIFIED | componentType filter, URL-based pagination. |
| `src/app/(dashboard)/projects/[projectId]/org/page.tsx` | Org overview page | ✓ VERIFIED | Queries OrgComponent + OrgSyncRun from DB; renders both tables. |
| `src/lib/agent-harness/tasks/org-classify.ts` | orgClassifyTask | ✓ VERIFIED | TaskDefinition with system prompt, token budget {input:15000, output:4000}, output schema. |
| `src/lib/agent-harness/tasks/org-synthesize.ts` | orgSynthesizeTask | ✓ VERIFIED | TaskDefinition for business process synthesis per domain. |
| `src/lib/inngest/functions/org-ingestion.ts` | orgIngestionFunction 4-step | ✓ VERIFIED | 4 steps: parse/classify/synthesize/finalize. `executeTask` called. isAiSuggested=true, isConfirmed=false. |
| `src/actions/org-analysis.ts` | 9 ingestion/review actions | ✓ VERIFIED | triggerIngestion, getIngestionStatus, confirmDomainGrouping, rejectDomainGrouping, editDomainGrouping, confirmBusinessProcess, rejectBusinessProcess, editBusinessProcess, bulkConfirmHighConfidence — all exported. |
| `src/app/api/v1/context-package/route.ts` | GET context package | ✓ VERIFIED | Assembles story, orgComponents, businessProcesses, knowledgeArticles, decisions, sprintConflicts from real DB queries. |
| `src/app/api/v1/org/components/route.ts` | GET org components with filter | ✓ VERIFIED | type and domain filter params, paginated results. |
| `src/app/api/v1/stories/[storyId]/status/route.ts` | PATCH story status | ✓ VERIFIED | State machine validation; fires STORY_STATUS_CHANGED event. |
| `src/app/api/v1/project/summary/route.ts` | GET project summary | ✓ VERIFIED | Returns 6 aggregate counts from real DB queries. |
| `src/lib/agent-harness/context/org-components.ts` | loadOrgComponentContext | ✓ VERIFIED | Exported; queries via StoryComponent join. |
| `src/lib/agent-harness/context/business-processes.ts` | loadBusinessProcessContext | ✓ VERIFIED | Exported; queries via BusinessProcessComponent join. |
| `src/actions/api-keys.ts` | generateApiKeyAction, revokeApiKeyAction, listApiKeys | ✓ VERIFIED | All 3 exported with SA/PM role gating. |
| `src/components/org/api-key-card.tsx` | One-time key display | ✓ VERIFIED | Monospace (SF Mono), clipboard write, "Copy this key now" warning text. |
| `src/app/(dashboard)/projects/[projectId]/settings/developer-api/page.tsx` | Developer settings page | ✓ VERIFIED | "Developer API" title, "Generate API Key" action, /api/v1/ endpoint docs. |
| `src/components/org/pipeline-stepper.tsx` | PipelineStepper 4-phase | ✓ VERIFIED | Parse/Classify/Synthesize/Complete phases. animate-pulse on active phase. |
| `src/components/org/domain-review-card.tsx` | DomainReviewCard with confirm/reject | ✓ VERIFIED | Confidence badges (#22C55E, #F59E0B), Confirm/Reject actions via useAction. |
| `src/components/org/process-review-card.tsx` | ProcessReviewCard with roles | ✓ VERIFIED | Component mapping table with role column. Confirm/Edit/Reject present. |
| `src/app/(dashboard)/projects/[projectId]/org/analysis/page.tsx` | Org analysis page | ✓ VERIFIED | Server component fetches domainGroupings + businessProcesses. Analysis client handles interactivity. |
| `docs/claude-code-skills/context-package.md` | Context package skill | ✓ VERIFIED | GET /api/v1/context-package, SFAI_API_KEY, x-api-key header. |
| `docs/claude-code-skills/org-query.md` | Org query skill | ✓ VERIFIED | GET /api/v1/org/components, type=OBJECT filter example. |
| `docs/claude-code-skills/story-status.md` | Story status skill | ✓ VERIFIED | PATCH /api/v1/stories/{id}/status, IN_PROGRESS transition documented. |
| `docs/claude-code-skills/project-init.md` | Project init skill | ✓ VERIFIED | GET /api/v1/project/summary, session initialization guidance. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/lib/salesforce/client.ts` | `src/lib/encryption.ts` | decrypt/encrypt for token handling | ✓ WIRED | `import { decrypt, encrypt } from "@/lib/encryption"` + used for token operations |
| `src/lib/api-keys/middleware.ts` | `prisma.apiKey` | keyPrefix lookup + bcrypt compare | ✓ WIRED | `where: { keyPrefix, isActive: true }` + `bcrypt.compare(apiKey, candidate.keyHash)` |
| `src/app/api/auth/salesforce/callback/route.ts` | `src/lib/salesforce/oauth.ts` | exchangeCodeForTokens | ✓ WIRED | `import { exchangeCodeForTokens }` + called on line 56 |
| `src/app/api/auth/salesforce/callback/route.ts` | `inngest.send` | ORG_SYNC_REQUESTED event | ✓ WIRED | `name: EVENTS.ORG_SYNC_REQUESTED` in send call |
| `src/lib/inngest/functions/metadata-sync.ts` | `src/lib/salesforce/client.ts` | getSalesforceConnection | ✓ WIRED | `import { syncMetadata }` which internally calls `getSalesforceConnection` |
| `src/lib/inngest/functions/metadata-sync.ts` | `src/lib/salesforce/metadata-sync.ts` | syncMetadata | ✓ WIRED | Direct import + called in step.run |
| `src/lib/inngest/functions/org-ingestion.ts` | `src/lib/agent-harness/engine.ts` | executeTask | ✓ WIRED | `import { executeTask }` + called for classify and synthesize steps |
| `src/lib/inngest/functions/org-ingestion.ts` | `src/lib/agent-harness/tasks/org-classify.ts` | orgClassifyTask | ✓ WIRED | `import { orgClassifyTask }` + passed to executeTask |
| `all /api/v1/ routes` | `src/lib/api-keys/middleware.ts` | validateApiKey | ✓ WIRED | All 4 routes use `withApiAuth` from api-handler.ts which calls validateApiKey |
| `src/app/api/v1/_lib/api-handler.ts` | `src/lib/api-keys/rate-limit.ts` | checkRateLimit | ✓ WIRED | `import { checkRateLimit }` + called in withApiAuth |
| `src/app/(dashboard)/projects/[projectId]/org/analysis/page.tsx` | `src/actions/org-analysis.ts` | triggerIngestion + confirm/reject | ✓ WIRED | analysis-client.tsx imports and calls triggerIngestion, confirmDomainGrouping, confirmBusinessProcess |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `org/analysis/page.tsx` | domainGroupings, businessProcesses | `prisma.domainGrouping.findMany()`, `prisma.businessProcess.findMany()` | DB queries with include relations | ✓ FLOWING |
| `org/page.tsx` | components, syncRuns | `prisma.orgComponent.findMany()`, `prisma.orgSyncRun.findMany()` | DB queries with pagination | ✓ FLOWING |
| `context-package/route.ts` | story, businessProcesses, knowledgeArticles, decisions, sprintConflicts | 5 parallel prisma queries | All from real DB lookups | ✓ FLOWING |
| `org-connection-card.tsx` | isSyncing | Hardcoded `false` in settings page | No live sync detection | ⚠️ STATIC — Syncing badge state never shown; noted as known stub in Plan 02 SUMMARY |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| All 13 plan commits present in git | `git log --oneline` match | All 13 commit hashes verified (0262fde through 992925a) | ✓ PASS |
| Schema models deployed | `grep "model ApiKey" prisma/schema.prisma` | Found at line 940 | ✓ PASS |
| Skill docs count | `ls docs/claude-code-skills/ \| wc -l` | 4 files | ✓ PASS |
| Inngest functions registered | `grep "metadataSyncFunction\|orgIngestionFunction" src/app/api/inngest/route.ts` | Both registered in serve handler | ✓ PASS |
| OAuth flow (live browser) | Navigate to /projects/[id]/settings/org | Cannot test without credentials | ? SKIP — routes to human |
| Metadata sync (live Inngest) | Trigger sync, observe status badge | Cannot test without Neon + Inngest | ? SKIP — routes to human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ORG-01 | Plan 02 | User can connect a Salesforce org via OAuth | ✓ SATISFIED | authorize + callback routes, role-gated, triggers sync |
| ORG-02 | Plan 03 | Periodic metadata sync (incremental + full refresh) | ✓ SATISFIED | `metadataSyncFunction` with FULL/INCREMENTAL modes, 5-min buffer |
| ORG-03 | Plans 01, 03 | Org knowledge base tables: OrgComponent, OrgRelationship, DomainGrouping | ✓ SATISFIED | All 3 tables in schema; OrgComponent upserted during sync |
| ORG-04 | Plan 04 | Brownfield ingestion: Parse > Classify > Synthesize > Articulate (4-phase) | ✓ SATISFIED | `orgIngestionFunction` with 4 `step.run` steps |
| ORG-05 | Plans 04, 06 | AI maps org components to business processes with human confirmation | ✓ SATISFIED | isAiSuggested=true/isConfirmed=false; confirm/reject actions in UI |
| ORG-06 | Plans 04, 06 | Domain groupings with AI suggestion and architect confirmation | ✓ SATISFIED | DomainGrouping records with review cards in analysis UI |
| DEV-01 | Plan 05 | REST API exposes context package assembly for Claude Code | ✓ SATISFIED | GET /api/v1/context-package with API key auth |
| DEV-02 | Plan 05 | Context packages include story, processes, articles, decisions, conflicts | ✓ SATISFIED | All 5 data types assembled from real DB queries |
| DEV-03 | Plan 05 | REST API supports org metadata queries | ✓ SATISFIED | GET /api/v1/org/components with type + domain filters |
| DEV-04 | Plan 05 | REST API supports story status updates | ✓ SATISFIED | PATCH /api/v1/stories/:id/status with state machine validation |
| DEV-05 | Plan 07 | Claude Code skills updated to consume the web app API | ✓ SATISFIED | 4 skill docs with endpoint URLs, auth, curl examples, response shapes |

**All 11 required Phase 4 requirements satisfied.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(dashboard)/projects/[projectId]/settings/org/page.tsx` | 78 | `isSyncing={false}` hardcoded | ⚠️ Warning | "Syncing" connection badge state never shown during active sync. Functional gap: users have no visual indicator while sync runs. Known stub documented in Plan 02 SUMMARY. |

No blocker anti-patterns found. The `return null` in `metadata-sync.ts` line 42 is a valid helper function return for unrecognized field types, not a stub.

### Human Verification Required

#### 1. Salesforce OAuth End-to-End Flow

**Test:** Navigate to `/projects/[id]/settings/org`. Click "Connect Salesforce Org". Complete Salesforce login. Observe callback behavior.
**Expected:** Redirected to Salesforce login. On completion, redirected back to `/settings/org?connected=true`. Page shows green "Connected" badge with instance URL and component count. Inngest dashboard shows a metadata sync job queued.
**Why human:** OAuth redirect requires live Salesforce Connected App credentials, browser cookie handling, and real token exchange. Cannot be simulated programmatically.

#### 2. Syncing Status Badge (Known Stub Assessment)

**Test:** Manually trigger a metadata sync from the org settings page. Observe the connection card status during the sync job.
**Expected:** If isSyncing is to be surfaced, the card should show "Syncing" with animated pulse badge during sync. Currently hardcoded false — assess whether this is acceptable.
**Why human:** isSyncing detection requires either polling an OrgSyncRun record for RUNNING status or a server-sent event. Cannot verify live behavior programmatically. Decide if this stub needs a fix before Phase 4 is marked complete.

#### 3. Brownfield Ingestion Pipeline with Real Org

**Test:** With a synced org, navigate to `/projects/[id]/org/analysis`. Click "Analyze Org". Observe pipeline stepper progression and AI-generated review cards.
**Expected:** Pipeline stepper animates through Parse/Classify/Synthesize/Complete. Domain Groupings tab shows review cards with confidence badges (green/amber/outline). Business Processes tab shows component mapping tables. Confirm/Edit/Reject buttons function correctly. Bulk-confirm works.
**Why human:** Requires Claude API call, live Inngest job execution, and real org data. Card interactivity requires browser rendering.

#### 4. API Key Generation and Live Endpoint Consumption

**Test:** Navigate to `/projects/[id]/settings/developer-api`. Click "Generate API Key", enter a name, submit. Copy the displayed key. Use it to call `GET /api/v1/project/summary` with `x-api-key: <key>`.
**Expected:** Key displayed once in monospace with copy-to-clipboard. Key appears in active keys table with prefix and creation date. API call returns project summary JSON with correct counts. Second call to `/api/v1/context-package?storyId=X` returns assembled context.
**Why human:** Raw key shown once requires browser interaction. Live API calls require running app with real API key validation and DB queries.

---

### Gaps Summary

No code gaps found. All 4 roadmap success criteria are verified at all 4 levels (exists, substantive, wired, data-flowing). The only identified issue is the `isSyncing=false` hardcode which is a UI completeness gap, not a blocking functional gap. This was explicitly documented as a known stub in Plan 02 SUMMARY and does not affect the ability to connect orgs, sync metadata, run ingestion, or consume the REST API.

Phase 4 goal is substantively achieved. Human verification is required to confirm OAuth flow, AI pipeline, and REST API function correctly with live external services.

---

_Verified: 2026-04-07T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
