# Phase 4: Salesforce Org Connectivity and Developer Integration - Research

**Researched:** 2026-04-06
**Domain:** Salesforce OAuth, Metadata API, REST API design, brownfield AI ingestion
**Confidence:** HIGH

## Summary

Phase 4 connects the platform to live Salesforce orgs via OAuth 2.0, builds an org knowledge base from synced metadata, runs a 4-phase AI ingestion pipeline to classify and synthesize business processes, and exposes a versioned REST API for Claude Code consumption. The phase spans three distinct technical domains: (1) Salesforce API integration via jsforce for OAuth and metadata retrieval, (2) AI-powered brownfield analysis reusing the existing agent harness, and (3) a REST API layer with project-scoped API key authentication.

The existing codebase provides strong foundations: the Prisma schema already defines all org-related models (OrgComponent, OrgRelationship, DomainGrouping, BusinessProcess, etc.), Inngest events for org sync are pre-registered, the encryption module handles token storage, and the agent harness is ready for new task definitions. The primary new work is the jsforce integration layer, the OAuth flow, the ingestion pipeline AI prompts, and the REST API endpoints.

**Primary recommendation:** Use jsforce 3.x as the sole Salesforce API client. Implement OAuth as a standard Next.js API route pair (authorize redirect + callback handler). Build the REST API as Next.js Route Handlers under `/api/v1/` with a custom API key middleware. Reuse the agent harness for ingestion pipeline AI calls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dedicated "Org Connections" settings page under project settings. "Connect Salesforce Org" button launches OAuth flow. Status card shows connection health.
- **D-02:** Standard Salesforce OAuth 2.0 Web Server Flow (authorization code grant). In-app setup guide documents Connected App prerequisites.
- **D-03:** One org connection per project. No multi-org in V1.
- **D-04:** Tokens encrypted at rest using existing encryption.ts (HKDF-SHA256). Silent refresh via refresh token. On refresh failure, mark "Needs Reauthorization" and notify PM.
- **D-05:** Only SA or PM roles can connect/disconnect orgs. All team members can view.
- **D-06:** Sync core consulting-relevant metadata types: Custom Objects (+fields, validation rules, record types), Apex Classes, Apex Triggers, LWC, Flows, Permission Sets, Profiles, Custom Labels, Custom Settings/Custom Metadata Types. Skip low-value types in V1.
- **D-07:** Two sync modes: Full sync on initial connection + on-demand. Incremental via Inngest cron (daily default, configurable). Incremental uses listMetadata with lastModifiedDate filtering.
- **D-08:** Sync status on connection card: last sync timestamp, component count, sync-in-progress. Sync history log.
- **D-09:** Metadata stored as normalized OrgComponent + OrgRelationship records.
- **D-10:** Brownfield ingestion runs as background Inngest step function. Progress shown via dedicated "Org Analysis" page.
- **D-11:** Four-phase pipeline: Parse > Classify > Synthesize + Articulate. Phases 3+4 run as single AI call.
- **D-12:** AI outputs reviewed using accept/reject/edit card pattern (reusing Phase 2 D-09 pattern).
- **D-13:** Ingestion triggered manually by SA after metadata sync. Re-runnable.
- **D-14:** Review UX: Tabbed view -- "Domain Groupings" and "Business Processes" tabs. Bulk-confirm high-confidence, individually review low-confidence.
- **D-15:** Project-scoped API keys for authentication. Hashed (bcrypt) in DB. Shown once on creation. Scoped to single project.
- **D-16:** Endpoints under /api/v1/ namespace. Versioned from the start. RESTful resource-based design.
- **D-17:** Core endpoints: GET context-package, GET org/components, PATCH stories/:id/status, GET project/summary.
- **D-18:** Context package assembly reuses Phase 2 agent harness context assembly layer. Same token budget management.
- **D-19:** Claude Code skills make direct HTTP calls. No MCP server in V1.

### Claude's Discretion
- API rate limiting strategy and limits
- Exact metadata type list fine-tuning based on Salesforce API capabilities
- Sync job retry and error handling specifics
- Ingestion pipeline AI prompt engineering and token budgets
- API response pagination strategy
- Org analysis progress indicator design
- Loading states and error boundaries for org views

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORG-01 | User can connect a Salesforce org via OAuth | jsforce OAuth 2.0 Web Server Flow, Next.js API route callback pattern |
| ORG-02 | Periodic metadata sync (incremental + full refresh) stores normalized component data | jsforce listMetadata + describeMetadata APIs, Inngest cron pattern |
| ORG-03 | Org knowledge base tables: OrgComponent, OrgRelationship, DomainGrouping | Schema already exists in Prisma. No migration needed. |
| ORG-04 | Brownfield org ingestion pipeline: Parse > Classify > Synthesize > Articulate | Inngest step function pattern, agent harness task definitions |
| ORG-05 | AI maps org components to business processes with human confirmation (isConfirmed pattern) | Existing accept/reject/edit card UI pattern from Phase 2, BusinessProcess/BusinessProcessComponent models |
| ORG-06 | Domain groupings with AI suggestion and architect confirmation | DomainGrouping model with isAiSuggested/isConfirmed, same review card pattern |
| DEV-01 | REST API exposes context package assembly for Claude Code consumption | Next.js Route Handlers under /api/v1/, API key auth middleware |
| DEV-02 | Context packages include: story details, business processes, knowledge articles, decisions, sprint conflicts | Existing context assembly layer (src/lib/agent-harness/context/) |
| DEV-03 | REST API supports org metadata queries for Claude Code skills | /api/v1/org/components endpoint with type/domain filtering |
| DEV-04 | REST API supports story status updates from Claude Code | PATCH /api/v1/stories/:id/status with status machine validation |
| DEV-05 | Claude Code skills updated to consume the web app API | Skill files calling REST API endpoints with API key auth |
</phase_requirements>

## Standard Stack

### Core (Phase 4 Additions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsforce | 3.10.14 | Salesforce API client (OAuth, Metadata API, SOQL) | The standard Node.js Salesforce library. Supports OAuth 2.0, Metadata API (listMetadata, describeMetadata, readMetadata), Tooling API. TypeScript types included in v3. [VERIFIED: npm registry] |
| bcryptjs | 3.0.3 | API key hashing | Pure JS bcrypt implementation. No native compilation needed (important for Vercel serverless). Used to hash API keys before storage per D-15. [VERIFIED: npm registry] |

### Already Available (From Existing Stack)
| Library | Purpose | Phase 4 Usage |
|---------|---------|---------------|
| `src/lib/encryption.ts` | HKDF-SHA256 encryption | Encrypt/decrypt Salesforce OAuth tokens (D-04) |
| `src/lib/inngest/` | Background job infrastructure | Metadata sync cron, ingestion step functions |
| `src/lib/agent-harness/` | AI agent framework | Ingestion pipeline Classify/Synthesize+Articulate AI calls |
| `src/lib/safe-action.ts` | Server action middleware | Org connection CRUD, API key management |
| `src/lib/project-scope.ts` | Data isolation | All org data queries scoped to project |
| `@anthropic-ai/sdk` | Claude API | AI calls in ingestion pipeline |
| Prisma 7.x | ORM | All DB operations (schema already has org models) |
| Inngest 4.x | Background jobs | Sync cron, ingestion step function |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsforce | Raw Salesforce REST API calls | jsforce handles OAuth token refresh, metadata type parsing, SOQL query building. Manual implementation would re-invent these. |
| bcryptjs | bcrypt (native) | bcrypt 6.0 requires native compilation which can fail on Vercel serverless. bcryptjs is pure JS, no build issues. |
| Postgres rate limiting | @upstash/ratelimit + Redis | Tech spec Section 3.1.2 explicitly specifies Postgres-backed sliding window. No Redis dependency in V1. |

**Installation:**
```bash
npm install jsforce bcryptjs
npm install -D @types/bcryptjs
```

Note: jsforce 3.x ships with its own TypeScript types. No separate @types/jsforce needed. [VERIFIED: npm registry shows jsforce 3.10.14 includes types]

## Architecture Patterns

### Recommended Project Structure (Phase 4 Additions)
```
src/
├── app/
│   ├── (app)/[projectId]/
│   │   ├── settings/
│   │   │   ├── org/                    # Org connection settings page (D-01)
│   │   │   │   └── page.tsx
│   │   │   └── developer-api/          # API key management page (D-15)
│   │   │       └── page.tsx
│   │   └── org/
│   │       ├── page.tsx                # Org overview (component list)
│   │       └── analysis/
│   │           └── page.tsx            # Org analysis (brownfield review) (D-10, D-14)
│   └── api/
│       ├── auth/
│       │   └── salesforce/
│       │       ├── authorize/route.ts  # OAuth redirect to Salesforce
│       │       └── callback/route.ts   # OAuth callback handler
│       └── v1/
│           ├── context-package/route.ts    # GET context package (D-17)
│           ├── org/
│           │   └── components/route.ts     # GET org components (D-17)
│           ├── stories/
│           │   └── [storyId]/
│           │       └── status/route.ts     # PATCH story status (D-17)
│           └── project/
│               └── summary/route.ts        # GET project summary (D-17)
├── lib/
│   ├── salesforce/
│   │   ├── client.ts               # jsforce connection factory (token refresh)
│   │   ├── oauth.ts                # OAuth URL generation, token exchange
│   │   ├── metadata-sync.ts        # Metadata fetching + parsing into OrgComponent
│   │   └── types.ts                # Salesforce-specific types
│   ├── api-keys/
│   │   ├── middleware.ts           # API key validation middleware for /api/v1/
│   │   ├── generate.ts            # Key generation + bcrypt hashing
│   │   └── rate-limit.ts          # Postgres-backed sliding window rate limiter
│   ├── agent-harness/
│   │   ├── tasks/
│   │   │   ├── org-classify.ts     # Ingestion Phase 2: domain classification
│   │   │   └── org-synthesize.ts   # Ingestion Phase 3+4: synthesize + articulate
│   │   └── context/
│   │       ├── org-components.ts   # Context loader: org components for stories
│   │       └── business-processes.ts # Context loader: business processes
│   └── inngest/
│       └── functions/
│           ├── metadata-sync.ts    # Incremental sync cron function
│           ├── org-ingestion.ts    # Full ingestion step function
│           └── knowledge-refresh.ts # Full knowledge refresh (Phases 3-4)
├── actions/
│   ├── org-connection.ts           # Server actions: connect, disconnect, sync
│   ├── org-analysis.ts             # Server actions: trigger ingestion, confirm/reject
│   └── api-keys.ts                 # Server actions: generate, revoke API keys
└── components/
    └── org/
        ├── org-connection-card.tsx  # Connection status card
        ├── sync-history-table.tsx   # Sync run history
        ├── pipeline-stepper.tsx     # Ingestion phase progress indicator
        ├── domain-review-card.tsx   # Domain grouping review card
        ├── process-review-card.tsx  # Business process review card
        ├── component-table.tsx      # Org component data table
        └── api-key-card.tsx         # API key display + management
```

### Pattern 1: OAuth 2.0 Web Server Flow
**What:** Standard authorization code grant flow via Next.js API routes
**When to use:** Connecting to a Salesforce org (ORG-01)
**Example:**
```typescript
// src/app/api/auth/salesforce/authorize/route.ts
// Redirects user to Salesforce login page
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  // Validate user has SA/PM role on this project

  const authUrl = new URL("https://login.salesforce.com/services/oauth2/authorize")
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", process.env.SF_CONNECTED_APP_CLIENT_ID!)
  authUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`)
  authUrl.searchParams.set("state", projectId!) // Encode projectId in state param

  redirect(authUrl.toString())
}
```
[ASSUMED: Salesforce login.salesforce.com authorize URL format -- standard OAuth 2.0 pattern]

### Pattern 2: jsforce Connection with Token Refresh
**What:** Create a jsforce Connection instance with stored tokens, handle transparent refresh
**When to use:** Any Salesforce API call (metadata sync, etc.)
**Example:**
```typescript
// src/lib/salesforce/client.ts
import jsforce from "jsforce"
import { decrypt, encrypt } from "@/lib/encryption"
import { prisma } from "@/lib/db"

export async function getSalesforceConnection(projectId: string): Promise<jsforce.Connection> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { sfOrgInstanceUrl: true, sfOrgAccessToken: true, sfOrgRefreshToken: true },
  })

  if (!project.sfOrgInstanceUrl || !project.sfOrgAccessToken) {
    throw new Error("Salesforce org not connected")
  }

  const accessToken = await decrypt(project.sfOrgAccessToken, projectId)
  const refreshToken = project.sfOrgRefreshToken
    ? await decrypt(project.sfOrgRefreshToken, projectId)
    : undefined

  const conn = new jsforce.Connection({
    instanceUrl: project.sfOrgInstanceUrl,
    accessToken,
    refreshToken,
    oauth2: {
      clientId: process.env.SF_CONNECTED_APP_CLIENT_ID!,
      clientSecret: process.env.SF_CONNECTED_APP_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`,
    },
  })

  // Handle token refresh events -- persist new tokens
  conn.on("refresh", async (newAccessToken: string) => {
    const encrypted = await encrypt(newAccessToken, projectId)
    await prisma.project.update({
      where: { id: projectId },
      data: { sfOrgAccessToken: encrypted },
    })
  })

  return conn
}
```
[ASSUMED: jsforce Connection constructor API and refresh event -- based on jsforce v3 documentation patterns]

### Pattern 3: Metadata Sync via jsforce
**What:** Fetch metadata types using jsforce Metadata API, parse into OrgComponent records
**When to use:** Incremental and full metadata sync (ORG-02)
**Example:**
```typescript
// Simplified metadata fetch for Custom Objects
async function syncCustomObjects(conn: jsforce.Connection, projectId: string) {
  // List all custom objects
  const objects = await conn.metadata.list([{ type: "CustomObject" }])

  for (const obj of objects) {
    // Describe each object for fields, validation rules, record types
    const described = await conn.sobject(obj.fullName).describe()

    // Upsert OrgComponent for the object
    await prisma.orgComponent.upsert({
      where: { projectId_apiName_componentType: { projectId, apiName: obj.fullName, componentType: "OBJECT" } },
      create: { projectId, apiName: obj.fullName, label: described.label, componentType: "OBJECT", lastSyncedAt: new Date() },
      update: { label: described.label, lastSyncedAt: new Date(), isActive: true },
    })

    // Upsert fields as child OrgComponents
    for (const field of described.fields) {
      const parentComponent = await prisma.orgComponent.findFirst({
        where: { projectId, apiName: obj.fullName, componentType: "OBJECT" },
      })
      await prisma.orgComponent.upsert({
        where: { projectId_apiName_componentType: { projectId, apiName: `${obj.fullName}.${field.name}`, componentType: "FIELD" } },
        create: {
          projectId, apiName: `${obj.fullName}.${field.name}`, label: field.label,
          componentType: "FIELD", parentComponentId: parentComponent?.id, lastSyncedAt: new Date(),
        },
        update: { label: field.label, lastSyncedAt: new Date(), isActive: true },
      })
    }
  }
}
```
[ASSUMED: jsforce metadata.list and sobject describe API -- based on jsforce documentation]

### Pattern 4: API Key Authentication Middleware
**What:** Custom middleware that validates API keys from x-api-key header for /api/v1/ routes
**When to use:** All REST API endpoints (DEV-01 through DEV-04)
**Example:**
```typescript
// src/lib/api-keys/middleware.ts
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function validateApiKey(request: Request): Promise<{
  projectId: string
  apiKeyId: string
} | NextResponse> {
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  // Extract project ID from key prefix (keys are formatted as proj_{projectId}_{random})
  // or look up all active keys and compare hashes
  const activeKeys = await prisma.apiKey.findMany({
    where: { isActive: true },
    select: { id: true, keyHash: true, projectId: true },
  })

  for (const key of activeKeys) {
    if (await compare(apiKey, key.keyHash)) {
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date(), useCount: { increment: 1 } },
      })
      return { projectId: key.projectId, apiKeyId: key.id }
    }
  }

  return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
}
```
[ASSUMED: ApiKey model structure -- needs to be added to Prisma schema. bcryptjs compare API is standard.]

### Pattern 5: Postgres-Backed Rate Limiting
**What:** Sliding window rate limiter using Postgres COUNT queries
**When to use:** All /api/v1/ endpoints per tech spec Section 3.1.2
**Example:**
```typescript
// src/lib/api-keys/rate-limit.ts
import { prisma } from "@/lib/db"

export async function checkRateLimit(
  apiKeyId: string,
  endpoint: string,
  limit: number,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - windowMs)

  const count = await prisma.apiRequestLog.count({
    where: { apiKeyId, endpoint, timestamp: { gte: windowStart } },
  })

  if (count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil(windowMs / 1000) }
  }

  // Log this request
  await prisma.apiRequestLog.create({
    data: { apiKeyId, endpoint, timestamp: new Date() },
  })

  return { allowed: true, remaining: limit - count - 1 }
}
```
[ASSUMED: ApiRequestLog model structure -- needs to be added to schema per tech spec Section 3.1.2]

### Anti-Patterns to Avoid
- **Storing Salesforce tokens in plaintext:** Always use encryption.ts for token storage. The existing HKDF-SHA256 per-project key derivation is the correct pattern (AUTH-05).
- **Fetching all metadata types in a single sync:** Salesforce API has governor limits. Process metadata types sequentially or in small batches with retry logic.
- **Running Phases 3-4 on every incremental sync:** This would be expensive. Incremental = Phases 1-2 only. Full knowledge refresh = Phases 3-4 only, targeting stale/unassigned items.
- **Caching context packages in memory:** Vercel serverless is stateless -- in-memory caches have near-zero hit rates. Build fresh every request (per tech spec decision).
- **Iterating bcrypt compare over all API keys:** Consider adding a key prefix/hint to narrow the search. A project-scoped prefix (first N chars unhashed) allows indexed lookup before bcrypt compare.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Salesforce API auth | Custom OAuth token management | jsforce Connection with refresh events | jsforce handles token refresh, session management, error handling automatically |
| Salesforce Metadata API | Raw HTTP calls to Salesforce REST API | jsforce metadata.list, describe, readMetadata | Handles pagination, type coercion, API versioning |
| Password/key hashing | Custom hash function | bcryptjs | Cryptographically secure, constant-time comparison, configurable work factor |
| Background job orchestration | Custom queue system | Inngest step functions (already in use) | Automatic retries, checkpoints, concurrency control |
| AI pipeline execution | Custom AI call management | Agent harness (already built) | Token tracking, cost logging, retry logic, context assembly |
| Data isolation | Custom query filtering | scopedPrisma() (already built) | Prevents cross-project data leakage automatically |

**Key insight:** Phase 4 has less new infrastructure to build than it appears. The Prisma schema is done. The Inngest patterns are established. The agent harness is built. The encryption module works. The main new work is: (1) jsforce integration, (2) OAuth flow plumbing, (3) REST API routes, (4) ingestion pipeline AI task definitions, and (5) UI pages.

## Common Pitfalls

### Pitfall 1: Salesforce API Governor Limits
**What goes wrong:** Metadata API calls hitting Salesforce concurrent request limits or daily API request limits, especially during full sync of large orgs.
**Why it happens:** A medium-to-large org can have 150+ objects, 2000+ fields. Describing each object individually creates many API calls.
**How to avoid:** Batch describe calls where possible. Use `conn.metadata.read()` with multiple fullNames. Add retry with exponential backoff on 429/503 responses. Track API usage per sync run.
**Warning signs:** Sync jobs timing out, intermittent failures on large orgs.

### Pitfall 2: OAuth Token Refresh Race Conditions
**What goes wrong:** Multiple concurrent sync operations or API calls attempt to refresh the token simultaneously, resulting in token invalidation.
**Why it happens:** Salesforce revokes the old refresh token when a new one is issued. If two processes refresh simultaneously, the second uses an already-revoked token.
**How to avoid:** Use Inngest concurrency control (limit: 1 per project for sync jobs). For the jsforce connection factory, implement a mutex or token refresh lock per project.
**Warning signs:** Intermittent "INVALID_SESSION_ID" errors, sync jobs failing after previously succeeding.

### Pitfall 3: API Key Lookup Performance
**What goes wrong:** bcrypt comparison is deliberately slow (~100ms per compare). If there are many API keys, iterating and comparing against each one creates unacceptable latency.
**Why it happens:** bcrypt is designed to be slow to prevent brute-force attacks. Linear scan + bcrypt = O(n * 100ms).
**How to avoid:** Store a fast-lookup key prefix alongside the hash. When generating a key, store the first 8 characters (unhashed) as a `keyPrefix` column with a DB index. On request, filter by prefix first, then bcrypt compare only against the 1-2 matching candidates.
**Warning signs:** API response times increasing as more keys are created.

### Pitfall 4: Incremental Sync lastModifiedDate Drift
**What goes wrong:** Components modified between sync runs are missed because the lastModifiedDate filtering has a timezone or precision mismatch.
**Why it happens:** Salesforce uses GMT/UTC internally but the app may store sfOrgLastSyncAt in a different timezone context. DateTime precision differences between Salesforce and Postgres.
**How to avoid:** Always use UTC for sfOrgLastSyncAt. Subtract a small buffer (e.g., 5 minutes) from the lastModifiedDate filter to catch edge cases. Log any components that appear as "new" in consecutive syncs.
**Warning signs:** Components showing up as "new" repeatedly, components missing from sync results.

### Pitfall 5: Large Ingestion Pipeline Token Budgets
**What goes wrong:** AI calls for Synthesize+Articulate phase exceed context window limits for large orgs (200+ objects).
**Why it happens:** Attempting to send all components to the AI in a single call.
**How to avoid:** Batch components by domain grouping. Process each domain group in a separate AI call (still within the same Inngest step function). The tech spec estimates 60-150K tokens for a large org -- far exceeding a single context window. Chunking by domain keeps each call to 5-15K tokens.
**Warning signs:** AI calls returning truncated results, high token costs, slow ingestion.

## Code Examples

### OAuth Callback Handler
```typescript
// src/app/api/auth/salesforce/callback/route.ts
import { NextResponse } from "next/server"
import jsforce from "jsforce"
import { encrypt } from "@/lib/encryption"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { EVENTS } from "@/lib/inngest/events"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const projectId = searchParams.get("state") // Passed via state param

  if (!code || !projectId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error?reason=oauth_failed`)
  }

  try {
    const oauth2 = new jsforce.OAuth2({
      clientId: process.env.SF_CONNECTED_APP_CLIENT_ID!,
      clientSecret: process.env.SF_CONNECTED_APP_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`,
    })

    const conn = new jsforce.Connection({ oauth2 })
    const userInfo = await conn.authorize(code)

    // Encrypt tokens before storing
    const encAccessToken = await encrypt(conn.accessToken!, projectId)
    const encRefreshToken = conn.refreshToken
      ? await encrypt(conn.refreshToken, projectId)
      : null

    await prisma.project.update({
      where: { id: projectId },
      data: {
        sfOrgInstanceUrl: conn.instanceUrl,
        sfOrgAccessToken: encAccessToken,
        sfOrgRefreshToken: encRefreshToken,
      },
    })

    // Trigger initial full sync
    await inngest.send({
      name: EVENTS.ORG_SYNC_REQUESTED,
      data: { projectId, syncType: "FULL" },
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/settings/org?connected=true`
    )
  } catch (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/settings/org?error=oauth_failed`
    )
  }
}
```
[ASSUMED: jsforce OAuth2 and Connection.authorize() API shape]

### Schema Additions Required (ApiKey + ApiRequestLog)
```prisma
// These models need to be added to schema.prisma
model ApiKey {
  id          String    @id @default(cuid())
  projectId   String
  memberId    String
  name        String
  keyPrefix   String    // First 8 chars of raw key, indexed for fast lookup
  keyHash     String    // bcrypt hash of full key
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  useCount    Int       @default(0)
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?

  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  member      ProjectMember @relation(fields: [memberId], references: [id])
  requestLogs ApiRequestLog[]

  @@index([keyPrefix])
  @@index([projectId, isActive])
}

model ApiRequestLog {
  id         String   @id @default(cuid())
  apiKeyId   String
  endpoint   String
  method     String
  statusCode Int?
  ipAddress  String?
  timestamp  DateTime @default(now())

  apiKey     ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, endpoint, timestamp])
}
```
[ASSUMED: Schema shape -- based on tech spec Section 3.1.2 requirements for rate limiting and request logging]

### Inngest Event Additions
```typescript
// Add to src/lib/inngest/events.ts
export const EVENTS = {
  // ... existing events ...

  // Org events (Phase 4) -- ORG_SYNC_REQUESTED and ORG_KNOWLEDGE_REFRESH already registered
  ORG_INGESTION_REQUESTED: "org/ingestion-requested",
  ORG_SYNC_COMPLETED: "org/sync-completed",
} as const
```
[VERIFIED: src/lib/inngest/events.ts already has ORG_SYNC_REQUESTED and ORG_KNOWLEDGE_REFRESH]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsforce 1.x (SOAP login) | jsforce 3.x (OAuth 2.0) | 2024 | SOAP login() retiring Summer '27. Must use OAuth flows. |
| Separate @types/jsforce | jsforce 3.x built-in types | jsforce 3.0+ | No separate type package needed |
| In-memory API rate limiting | Postgres-backed sliding window | V1 decision | Survives serverless cold starts. No Redis needed. |
| Context package caching | No caching (fresh assembly) | V1 decision | Vercel serverless is stateless. 200-500ms assembly is acceptable. |

**Deprecated/outdated:**
- jsforce SOAP login: Salesforce retiring SOAP login() in Summer '27. Phase 4 uses OAuth 2.0 Web Server Flow exclusively. [CITED: jsforce npm page notice]
- In-memory caching for serverless: Does not work on Vercel. Each invocation is stateless.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | jsforce 3.x Connection constructor accepts oauth2 config with clientId/clientSecret/redirectUri | Architecture Patterns | Would need different initialization pattern. LOW risk -- well-documented API. |
| A2 | jsforce conn.authorize(code) exchanges auth code for tokens | Code Examples | Would need manual token exchange via HTTP. LOW risk. |
| A3 | jsforce conn.on("refresh", callback) fires when token is auto-refreshed | Architecture Patterns | Would need manual token refresh logic. MEDIUM risk -- must verify in integration testing. |
| A4 | jsforce metadata.list([{type: "CustomObject"}]) returns array of metadata info | Architecture Patterns | Would need different API call pattern. LOW risk. |
| A5 | ApiKey and ApiRequestLog schema shape matches what the planner implements | Code Examples | Schema may need adjustments during implementation. LOW risk -- shape is flexible. |
| A6 | Key prefix approach (first 8 chars indexed) provides sufficient uniqueness for fast lookup | Common Pitfalls | If collision rate is high, may need longer prefix. LOW risk. |

## Open Questions

1. **Salesforce Connected App configuration**
   - What we know: OAuth requires a Salesforce Connected App with consumer key and secret. The app also needs callback URL and OAuth scopes.
   - What's unclear: Which OAuth scopes are needed (api, refresh_token, full). Whether the Connected App should be created per-customer or as a single "framework" app.
   - Recommendation: Create one Connected App for the framework with `api refresh_token` scopes. Document Connected App setup in an in-app guide (D-02). The consumer key and secret are env vars.

2. **Metadata type batching strategy**
   - What we know: Salesforce Metadata API supports listing and reading metadata by type. Some types (CustomObject) need individual describe calls for field details.
   - What's unclear: Optimal batch size for metadata retrieval to avoid hitting Salesforce governor limits while maintaining reasonable sync speed.
   - Recommendation: Start with sequential type-by-type processing with 50ms delay between calls. Optimize later if sync times are too long.

3. **API key format and prefix strategy**
   - What we know: Keys need to be project-scoped, hashed with bcrypt, shown once.
   - What's unclear: Exact key format (prefix conventions, length, character set).
   - Recommendation: Generate as `sfai_{projectId_short}_{32_random_chars}`. Store first 8 chars as indexed prefix. Total key ~50 chars.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Checked at project level | 20+ | -- |
| PostgreSQL (Neon) | Database | Configured | 16+ | -- |
| Inngest | Background jobs | Configured | 4.1.2 | -- |
| Salesforce org (sandbox) | Org connectivity | External -- user-provided | -- | Mock data for testing |
| SF Connected App | OAuth flow | External -- must be configured by SA | -- | Cannot proceed without |

**Missing dependencies with no fallback:**
- Salesforce Connected App must be configured before OAuth works. Document setup guide.

**Missing dependencies with fallback:**
- No Salesforce sandbox available for automated testing. Use mock jsforce responses in unit tests.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (already configured) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORG-01 | OAuth flow generates correct redirect URL and handles callback | unit | `npx vitest run tests/lib/salesforce/oauth.test.ts -t "oauth"` | Wave 0 |
| ORG-02 | Metadata sync parses components into OrgComponent records | unit | `npx vitest run tests/lib/salesforce/metadata-sync.test.ts` | Wave 0 |
| ORG-03 | Org models query correctly with project scoping | unit | `npx vitest run tests/lib/salesforce/org-queries.test.ts` | Wave 0 |
| ORG-04 | Ingestion pipeline steps execute in order | unit | `npx vitest run tests/lib/inngest/org-ingestion.test.ts` | Wave 0 |
| ORG-05 | isConfirmed pattern works for business process mappings | unit | `npx vitest run tests/actions/org-analysis.test.ts` | Wave 0 |
| ORG-06 | Domain grouping confirm/reject/edit actions work | unit | `npx vitest run tests/actions/org-analysis.test.ts` | Wave 0 |
| DEV-01 | Context package endpoint returns assembled context | unit | `npx vitest run tests/api/v1/context-package.test.ts` | Wave 0 |
| DEV-02 | Context package includes all required data types | unit | `npx vitest run tests/api/v1/context-package.test.ts` | Wave 0 |
| DEV-03 | Org components endpoint supports type/domain filtering | unit | `npx vitest run tests/api/v1/org-components.test.ts` | Wave 0 |
| DEV-04 | Story status PATCH validates status transitions | unit | `npx vitest run tests/api/v1/story-status.test.ts` | Wave 0 |
| DEV-05 | Claude Code skills integrate with API | manual | Manual testing with Claude Code | -- |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/salesforce/oauth.test.ts` -- covers ORG-01
- [ ] `tests/lib/salesforce/metadata-sync.test.ts` -- covers ORG-02, ORG-03
- [ ] `tests/lib/inngest/org-ingestion.test.ts` -- covers ORG-04
- [ ] `tests/actions/org-analysis.test.ts` -- covers ORG-05, ORG-06
- [ ] `tests/api/v1/context-package.test.ts` -- covers DEV-01, DEV-02
- [ ] `tests/api/v1/org-components.test.ts` -- covers DEV-03
- [ ] `tests/api/v1/story-status.test.ts` -- covers DEV-04
- [ ] `tests/lib/api-keys/middleware.test.ts` -- covers API key auth
- [ ] `tests/lib/api-keys/rate-limit.test.ts` -- covers rate limiting
- [ ] `tests/fixtures/salesforce-mocks.ts` -- mock jsforce responses

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | API key authentication for /api/v1/ endpoints; Clerk auth for web UI |
| V3 Session Management | Yes | Salesforce OAuth token lifecycle (refresh, revocation) |
| V4 Access Control | Yes | SA/PM role gate for org connect/disconnect (D-05); project-scoped API keys (D-15) |
| V5 Input Validation | Yes | Zod validation on all server actions and API inputs |
| V6 Cryptography | Yes | HKDF-SHA256 for SF token encryption (existing); bcrypt for API key hashing |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Salesforce token theft | Information Disclosure | Encrypt tokens at rest (HKDF-SHA256), never expose in API responses |
| API key brute-force | Tampering | bcrypt hashing, rate limiting per key, key prefix for fast rejection |
| Cross-project data access via API | Elevation of Privilege | API keys scoped to project, scopedPrisma() enforces isolation |
| CSRF on OAuth callback | Spoofing | State parameter validated on callback, CSRF token in state |
| Token refresh race condition | Denial of Service | Inngest concurrency limit: 1 per project for sync jobs |
| API key enumeration | Information Disclosure | Constant-time bcrypt comparison, generic error messages |

## Sources

### Primary (HIGH confidence)
- **Prisma schema** (`prisma/schema.prisma`) -- All org models already defined. Verified OrgComponent, OrgRelationship, DomainGrouping, BusinessProcess, BusinessProcessComponent, BusinessProcessDependency models and their fields.
- **Tech spec** (`SESSION-3-TECHNICAL-SPEC.md`) -- Sections 2.2, 3.1.2, 6.1, 6.2, 6.3, 7.2, 7.3, 7.4 provide detailed implementation specifications for schema, rate limiting, ingestion pipeline, and background jobs.
- **PRD** (`SF-Consulting-AI-Framework-PRD-v2.1.md`) -- Sections 12, 13 specify developer integration and Salesforce org connectivity requirements.
- **Existing code** -- `src/lib/encryption.ts`, `src/lib/inngest/`, `src/lib/agent-harness/`, `src/lib/safe-action.ts`, `src/lib/project-scope.ts` verified as available and reusable.
- **npm registry** -- jsforce 3.10.14 (published 2 months ago), bcryptjs 3.0.3. [VERIFIED: npm view]

### Secondary (MEDIUM confidence)
- [Salesforce OAuth 2.0 Web Server Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm) -- Official Salesforce documentation on OAuth flow
- [JSforce documentation](https://jsforce.github.io/document/) -- Official jsforce API reference
- [jsforce npm page](https://www.npmjs.com/package/jsforce) -- SOAP login retirement notice for Summer '27

### Tertiary (LOW confidence)
- jsforce v3 specific API patterns for metadata.list, Connection constructor with OAuth2 -- Based on training data and search results. Verify during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- jsforce is the undisputed standard Salesforce JS SDK. bcryptjs is standard for serverless hashing.
- Architecture: HIGH -- Building on well-established existing patterns (Inngest, agent harness, encryption).
- Pitfalls: MEDIUM -- Governor limits and token refresh race conditions are real but well-documented.

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days -- jsforce is stable, Salesforce APIs evolve slowly)
