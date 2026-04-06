# Phase 5: Document Generation, QA, and Administration - Research

**Researched:** 2026-04-06
**Domain:** Document generation (Word/PPT/PDF), QA workflow (test execution + defects), PM dashboard with charts, Jira Cloud sync, project archival
**Confidence:** HIGH

## Summary

Phase 5 builds four major feature areas on top of well-established infrastructure from Phases 1-4: (1) AI-powered branded document generation using `docx`, `pptxgenjs`, and `@react-pdf/renderer` stored in S3/R2, (2) QA workflow with test case execution and defect lifecycle management, (3) PM dashboard with recharts-based data visualization and AI cost tracking, and (4) optional Jira Cloud sync plus project archival.

The good news: all Prisma schema models (GeneratedDocument, TestCase, TestExecution, Defect) and enums (DocumentType, DocumentFormat, DefectStatus, DefectSeverity, TestResult) are already deployed. The `Project.status` enum already includes `ARCHIVED`. The encryption utility for Jira API tokens exists. The agent harness, Inngest infrastructure, dashboard components, and UI patterns (table+kanban toggle, slide-over panels, pre-computed dashboard data) are all established from prior phases. This phase is primarily about building new routes, server actions, and Inngest functions that follow existing patterns.

**Primary recommendation:** Structure implementation in five streams: (1) document generation backend + UI, (2) QA workflow (test execution + defects), (3) PM dashboard with charts, (4) Jira sync, (5) project archival. Each stream follows established patterns from Phases 1-3 and adds new Inngest events/functions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Template gallery as primary hub -- dedicated "Documents" page in sidebar with branded template cards (Discovery Report, Requirements Doc, Sprint Summary, Executive Brief, etc.). PM picks template, configures scope/sections, previews, then generates.
- **D-02:** AI content population runs as Inngest step function using the existing agent harness (Phase 2). PM sees a progress indicator during generation. Output stored in S3/R2 with version tracking per DOC-03.
- **D-03:** Document preview before download -- rendered preview in-browser (PDF inline, Word/PPT as formatted preview). Download buttons for final format.
- **D-04:** Version history per document type per project -- table showing generation date, template used, who generated, file size. Re-generate creates a new version, doesn't overwrite.
- **D-05:** Branding templates enforce firm visual identity via configuration (logo, colors, fonts) stored at the firm level. Hardcoded in V1 per constraints (no firm admin UI). Per DOC-04.
- **D-06:** Test execution recorded at the story level -- each story shows a "QA" tab with test cases. QA marks Pass/Fail/Blocked with notes per test case. Reuses table pattern from Phase 2/3.
- **D-07:** Defect creation from failed test cases -- "Create Defect" action auto-links to the story and pre-populates context. Defects also creatable standalone from a dedicated "Defects" view.
- **D-08:** Defect lifecycle: Open > In Progress > Fixed > Verified > Closed. Table+kanban toggle (consistent with questions and sprint board patterns). Defect detail as slide-over panel (consistent with story creation from Phase 3 D-05).
- **D-09:** Defects linked to stories via join table. Story detail view shows linked defects count badge. Defect detail shows linked story.
- **D-10:** QA dashboard section showing test execution summary (pass/fail/blocked counts), open defect count by severity, defect aging.
- **D-11:** PM dashboard as a dedicated page extending the existing discovery dashboard pattern. Sections: project health (reuses Phase 2 health score), work progress (stories by status), sprint velocity, AI usage/cost summary, team activity.
- **D-12:** AI token usage displayed as charts -- cost over time (line chart), cost by feature area (bar chart), cumulative total. Data sourced from existing AgentExecution records.
- **D-13:** Dashboard data pre-computed via Inngest-triggered synthesis (consistent with Phase 2 D-25). Polling refresh via SWR `refreshInterval`.
- **D-14:** Aggregated project dimensions: stories by status, by assignee, by sprint; questions by status; knowledge coverage; defects by severity.
- **D-15:** Jira sync as optional project setting. PM enters Jira instance URL + API token (encrypted at rest per AUTH-05 pattern). One-directional push only.
- **D-16:** Push scope: stories and their status updates. Mapped fields: title, description, status, priority, story points. Sync runs as Inngest background job on story status change events.
- **D-17:** Sync status visible per story -- badge showing "Synced" / "Pending" / "Failed" with last sync timestamp. Bulk retry for failed syncs.
- **D-18:** Project archival via project settings. PM clicks "Archive Project" -- confirmation dialog, then project becomes read-only. All data retained. Visual indicator on archived projects.
- **D-19:** Reactivation via archived project's settings page.

### Claude's Discretion
- Document template HTML/layout specifics and S3 key structure for storage
- Chart library for PM dashboard (recharts or similar)
- Jira REST API field mapping details and error handling strategy
- Loading skeletons and empty states for all new views
- Test case data model details (inline on story vs separate entity)
- Exact branding configuration structure

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | PM can generate branded documents (Word, PowerPoint, PDF) from project context | `docx` 9.6.1, `pptxgenjs` 4.0.1, `@react-pdf/renderer` 4.3.3 -- all verified. Template gallery UI. Inngest step function for generation. |
| DOC-02 | Documents are populated by AI using project knowledge base content | Agent harness task definition for document content generation. Context assembly from project knowledge base. |
| DOC-03 | Generated documents are stored in S3/R2 with version tracking | `@aws-sdk/client-s3` already available. GeneratedDocument model exists with s3Key. Version tracking via multiple records per documentType. |
| DOC-04 | Branding templates enforce firm visual identity | Hardcoded branding config in V1 (logo, colors, fonts). Applied during document rendering. |
| QA-01 | QA can record test execution results (Pass/Fail/Blocked) with notes per test case | TestCase + TestExecution models already in schema. Story QA tab with result recording UI. |
| QA-02 | QA can create and manage defects linked to stories | Defect model in schema with storyId FK. "Create Defect" from failed test case or standalone. |
| QA-03 | Defect lifecycle: Open > In Progress > Fixed > Verified > Closed | DefectStatus enum already deployed. Status machine pattern from Phase 3 stories. |
| ADMIN-01 | Optional one-directional push sync to client Jira instance | Jira Cloud REST API v3. `jira.js` 5.3.1 or direct fetch. Inngest background job on story status change. |
| ADMIN-02 | PM dashboard with aggregated views across project dimensions | Recharts 3.8.1 (already installed). shadcn Charts component. Pre-computed dashboard data via Inngest. |
| ADMIN-03 | Usage and cost tracking for AI token consumption per project | Data from existing SessionLog/AgentExecution records. Aggregation in dashboard synthesis Inngest function. |
| PROJ-04 | PM can archive a completed project (read-only state, data retained) | Project.status ARCHIVED enum exists. Middleware/guard pattern for read-only enforcement. |
| PROJ-05 | PM can reactivate an archived project for follow-on engagements | Status flip ARCHIVED -> ACTIVE with role check. |
</phase_requirements>

## Standard Stack

### Core (Phase 5 specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| docx | 9.6.1 | Word document generation | Declarative API for .docx creation. Paragraphs, tables, images, headers/footers. No Word installation needed. [VERIFIED: npm registry] |
| pptxgenjs | 4.0.1 | PowerPoint generation | Programmatic .pptx creation. Slides, charts, images, master layouts. [VERIFIED: npm registry] |
| @react-pdf/renderer | 4.3.3 | PDF generation | React-based PDF rendering. Component model matches Next.js patterns. [VERIFIED: npm registry] |
| recharts | 3.8.1 | Chart rendering | Already installed. Wrapped by shadcn Charts component. Line, bar, stacked bar charts. [VERIFIED: package.json] |
| @aws-sdk/client-s3 | 3.1025.0 | S3/R2 file storage | Already available in project. S3-compatible API works with Cloudflare R2. [VERIFIED: npm registry] |

### Supporting (Jira integration)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jira.js | 5.3.1 | Jira Cloud REST API client | TypeScript-native, covers v2/v3 APIs, handles auth. Preferable to raw fetch for type safety and error handling. [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jira.js | Direct fetch to Jira REST API | jira.js provides typed responses and handles pagination. Raw fetch is simpler but requires manual type definitions. Either works -- jira.js saves boilerplate. |
| docx | docxtemplater | docxtemplater uses template files with placeholders. docx builds from scratch programmatically. For AI-generated content, building from scratch is more flexible. |
| recharts | chart.js / visx | recharts is already installed and integrated with shadcn Charts. No reason to switch. |

### Chart library recommendation: Recharts

Recharts 3.8.1 is already installed in `package.json`. shadcn/ui provides a `Chart` component wrapper (`src/components/ui/chart.tsx` -- already generated) that uses existing `--chart-1` through `--chart-5` CSS variables. This is the correct choice. [VERIFIED: package.json shows `"recharts": "^3.8.0"`]

**Installation (Phase 5 additions only):**
```bash
npm install docx@9.6.1 pptxgenjs@4.0.1 @react-pdf/renderer@4.3.3 jira.js@5.3.1
```

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)

```
src/
├── actions/
│   ├── documents.ts         # Document generation, download, list server actions
│   ├── defects.ts            # CRUD + status transitions for defects
│   ├── test-executions.ts    # Record/update test execution results
│   ├── jira-sync.ts          # Jira configuration, manual sync triggers
│   └── project-archive.ts   # Archive/reactivate project actions
├── app/(dashboard)/projects/[projectId]/
│   ├── documents/
│   │   ├── page.tsx          # Template gallery + version history
│   │   └── [documentId]/
│   │       └── page.tsx      # Document preview + download
│   ├── defects/
│   │   └── page.tsx          # Defects list (table + kanban toggle)
│   ├── pm-dashboard/
│   │   └── page.tsx          # PM dashboard with charts
│   ├── settings/
│   │   ├── jira/
│   │   │   └── page.tsx      # Jira sync configuration (or section in existing settings page)
│   │   └── page.tsx          # Add archive/reactivate section
│   └── work/[epicId]/
│       └── [storyId]/
│           └── page.tsx      # Existing story detail -- add QA/Defects tabs
├── components/
│   ├── documents/
│   │   ├── template-gallery.tsx      # Template cards grid
│   │   ├── generation-dialog.tsx     # Section/scope/format configuration
│   │   ├── generation-progress.tsx   # Progress indicator during generation
│   │   ├── document-preview.tsx      # In-browser preview panel
│   │   └── version-history-table.tsx # Generated documents table
│   ├── defects/
│   │   ├── defect-table.tsx         # Table view
│   │   ├── defect-kanban.tsx        # Kanban view
│   │   ├── defect-create-sheet.tsx  # Slide-over creation panel
│   │   └── defect-filters.tsx       # Status/severity/assignee/story filters
│   ├── qa/
│   │   ├── test-execution-table.tsx # Test results table in story QA tab
│   │   └── record-result-form.tsx   # Inline form for recording results
│   ├── pm-dashboard/
│   │   ├── stat-cards.tsx           # Health, stories progress, AI cost
│   │   ├── work-progress-chart.tsx  # Stories by status bar chart
│   │   ├── ai-usage-charts.tsx      # Cost over time + cost by area
│   │   ├── qa-summary.tsx           # Pass/fail/blocked + defects by severity
│   │   ├── sprint-velocity-chart.tsx
│   │   └── team-activity.tsx        # Recent actions list
│   └── jira/
│       ├── jira-config-form.tsx     # URL, token, project key inputs
│       ├── sync-history-table.tsx   # Per-story sync status
│       └── sync-status-badge.tsx    # Synced/Pending/Failed badge
├── lib/
│   ├── documents/
│   │   ├── templates/               # Template definitions
│   │   │   ├── discovery-report.ts  # Section definitions, context requirements
│   │   │   ├── requirements-doc.ts
│   │   │   ├── sprint-summary.ts
│   │   │   └── executive-brief.ts
│   │   ├── renderers/
│   │   │   ├── docx-renderer.ts     # docx library rendering
│   │   │   ├── pptx-renderer.ts     # pptxgenjs rendering
│   │   │   └── pdf-renderer.tsx     # @react-pdf/renderer
│   │   ├── branding.ts              # Hardcoded firm branding config (logo, colors, fonts)
│   │   └── s3-storage.ts            # S3 upload/download/presigned URL utilities
│   ├── defects/
│   │   ├── status-machine.ts        # Defect status transition rules
│   │   └── display-id.ts            # DEF-XXX sequential ID generation
│   ├── jira/
│   │   ├── client.ts                # Jira API client initialization
│   │   ├── field-mapping.ts         # App fields -> Jira fields mapping
│   │   └── sync.ts                  # Sync logic (create/update issues)
│   └── inngest/
│       ├── events.ts                # Add new Phase 5 events
│       └── functions/
│           ├── document-generation.ts   # Multi-step doc generation
│           ├── jira-sync.ts             # Story push to Jira
│           ├── pm-dashboard-synthesis.ts # Dashboard data aggregation
│           └── project-archival.ts      # Archive cleanup steps
└── lib/agent-harness/tasks/
    └── document-content.ts   # AI task for populating document sections
```

### Pattern 1: Document Generation as Inngest Step Function

**What:** Multi-step Inngest function that assembles context, generates AI content per section, renders to target format, uploads to S3, and creates the GeneratedDocument record.
**When to use:** Every document generation request.
**Example:**
```typescript
// Source: existing pattern in src/lib/inngest/functions/transcript-processing.ts
export const generateDocument = inngest.createFunction(
  { id: "document-generation", retries: 2 },
  { event: EVENTS.DOCUMENT_GENERATION_REQUESTED },
  async ({ event, step }) => {
    const { projectId, templateId, sections, format, memberId } = event.data

    // Step 1: Assemble project context for selected sections
    const context = await step.run("assemble-context", async () => {
      return assembleDocumentContext(projectId, templateId, sections)
    })

    // Step 2: Generate AI content for each section
    const content = await step.run("generate-content", async () => {
      return executeDocumentTask(projectId, context, sections)
    })

    // Step 3: Render to target format
    const buffer = await step.run("render-document", async () => {
      return renderDocument(format, content, branding)
    })

    // Step 4: Upload to S3
    const s3Key = await step.run("upload-to-s3", async () => {
      return uploadDocument(projectId, templateId, format, buffer)
    })

    // Step 5: Create DB record
    await step.run("create-record", async () => {
      return prisma.generatedDocument.create({
        data: { projectId, title: content.title, documentType: templateId,
                format, s3Key, templateUsed: templateId, generatedById: memberId }
      })
    })

    // Step 6: Send notification
    await step.sendEvent("notify", {
      name: EVENTS.NOTIFICATION_SEND,
      data: { type: "DOCUMENT_GENERATED", projectId, /* ... */ }
    })
  }
)
```

### Pattern 2: Defect Status Machine (mirrors Story status machine)

**What:** State machine for defect lifecycle transitions with role-based guards.
**When to use:** Every defect status change.
**Example:**
```typescript
// Source: existing pattern in src/lib/story-status-machine.ts
const DEFECT_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["OPEN", "FIXED"],
  FIXED: ["VERIFIED", "ASSIGNED"],  // Can reopen if fix is bad
  VERIFIED: ["CLOSED", "ASSIGNED"], // QA can reject
  CLOSED: [],                       // Terminal state
}

// Role guards: only QA can transition to VERIFIED
const ROLE_GUARDS: Partial<Record<DefectStatus, ProjectRole[]>> = {
  VERIFIED: ["QA"],
}
```

**Note on schema mismatch:** The CONTEXT.md D-08 says lifecycle is "Open > In Progress > Fixed > Verified > Closed" but the Prisma schema has `OPEN, ASSIGNED, FIXED, VERIFIED, CLOSED`. The schema uses `ASSIGNED` instead of `IN_PROGRESS`. The planner should use the schema values (ASSIGNED) as source of truth since schema is already deployed, and map the UI label "In Progress" to the `ASSIGNED` enum value. [VERIFIED: prisma/schema.prisma]

### Pattern 3: Archive Guard Middleware

**What:** Project-level middleware that prevents mutations on archived projects.
**When to use:** Every server action that mutates project data.
**Example:**
```typescript
// Add to safe-action.ts middleware chain or as a reusable guard
async function assertProjectNotArchived(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { status: true },
  })
  if (project.status === "ARCHIVED") {
    throw new Error("This project is archived. Reactivate to make changes.")
  }
}
```

### Pattern 4: S3 Key Structure for Documents

**What:** Consistent S3 key naming for document storage.
**Example:**
```typescript
// Recommended S3 key structure
const s3Key = `projects/${projectId}/documents/${documentType}/${format}/${documentId}.${extension}`
// Example: projects/clx.../documents/BRD/DOCX/clx...docx
```

### Pattern 5: Dashboard Data Pre-computation (existing pattern)

**What:** Inngest function aggregates dashboard data into a cached JSON field on the Project model.
**When to use:** Triggered by state change events. PM dashboard reads from cache, not live queries.
**Source:** Existing pattern in `src/lib/inngest/functions/dashboard-synthesis.ts` and `Project.cachedBriefingContent`.

### Anti-Patterns to Avoid
- **Live-querying all dashboard data:** Pre-compute aggregations via Inngest, store in JSON cache field. Do NOT run expensive aggregate queries on every page load.
- **Storing document content in database:** Documents go to S3/R2. Only metadata (title, s3Key, format) in Postgres.
- **Building custom Jira API wrapper:** Use `jira.js` or at minimum follow established Inngest function patterns with proper retry/error handling.
- **Blocking on document generation:** Generation is async via Inngest. UI polls for completion. Do NOT generate documents synchronously in a server action.
- **Skipping archive guards:** Every mutation action must check `project.status !== ARCHIVED`. Use middleware, not per-action checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word document creation | Custom XML manipulation | `docx` 9.6.1 | Office Open XML is extremely complex. The library handles formatting, styles, sections, headers/footers. |
| PowerPoint creation | Template file manipulation | `pptxgenjs` 4.0.1 | Slide layouts, master slides, charts, and images handled by the library. |
| PDF generation | HTML-to-PDF conversion | `@react-pdf/renderer` 4.3.3 | React component model for PDF. No headless browser needed. |
| Jira API integration | Raw fetch with manual auth | `jira.js` 5.3.1 | Handles auth, pagination, typed responses, error handling. |
| Chart rendering | Custom SVG/Canvas charts | Recharts 3.8.1 + shadcn Charts | Already installed. CSS variable integration with design system. |
| S3 operations | Custom HTTP requests | `@aws-sdk/client-s3` | Already in project. Handles auth, retries, multipart uploads. |
| Defect status machine | Ad-hoc if/else chains | Transition map pattern | Same pattern used for Story status in Phase 3. Tested, predictable. |

**Key insight:** Document generation libraries handle format-specific complexity (XML namespaces, binary formats, font embedding) that would take weeks to hand-roll. The Jira API has quirks (transition IDs for status changes, field schemas) that `jira.js` abstracts.

## Common Pitfalls

### Pitfall 1: Jira Status Transitions Require Transition IDs
**What goes wrong:** Attempting to update a Jira issue status by setting the status field directly. Jira requires calling the `/transitions` endpoint with a transition ID, not a status name.
**Why it happens:** Most REST APIs let you update fields directly. Jira's workflow engine requires transitions.
**How to avoid:** First GET available transitions for the issue, find the transition ID matching the target status, then POST to `/transitions`.
**Warning signs:** 400 errors when trying to update status field directly.

### Pitfall 2: Document Generation Memory Pressure
**What goes wrong:** Large documents with many sections exhaust serverless function memory.
**Why it happens:** Assembling full project context + AI responses + rendering all in one function invocation.
**How to avoid:** Use Inngest step functions with checkpoints between steps. Each step runs in a fresh invocation. Keep rendered document buffer under 50MB.
**Warning signs:** Function timeout or OOM errors during generation.

### Pitfall 3: S3 Presigned URL Expiry
**What goes wrong:** Download links stop working after presigned URL expires.
**Why it happens:** Presigned URLs have a TTL (default varies by SDK configuration).
**How to avoid:** Generate presigned URLs on demand when user clicks download, with a short TTL (e.g., 5 minutes). Don't store presigned URLs in the database -- store the s3Key and generate URLs fresh.
**Warning signs:** 403 Forbidden errors on download after some time.

### Pitfall 4: Archive Guard Gaps
**What goes wrong:** Some mutations bypass the archive check, allowing changes to archived projects.
**Why it happens:** Archive guard is applied inconsistently across server actions.
**How to avoid:** Add archive check as middleware in the `safe-action.ts` chain, applied to all project-scoped mutations. Individual actions don't need to remember to check.
**Warning signs:** Archived projects showing new data modifications.

### Pitfall 5: DefectStatus Enum Mismatch with UI Copy
**What goes wrong:** UI shows "In Progress" but the Prisma enum is `ASSIGNED`. Confusion in status filtering and transitions.
**Why it happens:** CONTEXT.md D-08 says "In Progress" but schema says "ASSIGNED".
**How to avoid:** Create a label map: `{ ASSIGNED: "In Progress" }`. Use enum values in code, labels in UI. The schema is source of truth.
**Warning signs:** Filters not matching, status badge showing wrong label.

### Pitfall 6: @react-pdf/renderer Server Component Incompatibility
**What goes wrong:** `@react-pdf/renderer` uses React components but cannot run in RSC context on the server for rendering.
**Why it happens:** The library uses React's reconciler in a specific way that may conflict with Next.js server component rendering.
**How to avoid:** Run PDF rendering inside Inngest functions or API routes, not in server components. The PDF is rendered to a buffer server-side, uploaded to S3, then served as a download.
**Warning signs:** "Cannot use Client Component" errors or missing React context.

## Code Examples

### Document Generation: docx Renderer

```typescript
// Source: docx library docs (https://docx.js.org/)
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Header, Footer, AlignmentType } from "docx"
import type { BrandingConfig } from "./branding"

export async function renderDocx(
  content: { title: string; sections: Array<{ heading: string; body: string }> },
  branding: BrandingConfig
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        heading1: { run: { font: branding.fontFamily, size: 28, color: branding.headingColor } },
        document: { run: { font: branding.fontFamily, size: 24 } },
      },
    },
    sections: [{
      headers: {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun(branding.firmName)], alignment: AlignmentType.RIGHT })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({ children: [new TextRun("Confidential")], alignment: AlignmentType.CENTER })],
        }),
      },
      children: [
        new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),
        ...content.sections.flatMap(section => [
          new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: section.body }),
        ]),
      ],
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
```

### Document Generation: pptxgenjs Renderer

```typescript
// Source: pptxgenjs docs (https://gitbrent.github.io/PptxGenJS/)
import PptxGenJS from "pptxgenjs"
import type { BrandingConfig } from "./branding"

export async function renderPptx(
  content: { title: string; sections: Array<{ heading: string; body: string }> },
  branding: BrandingConfig
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.author = branding.firmName
  pptx.layout = "LAYOUT_WIDE"

  // Title slide
  const titleSlide = pptx.addSlide()
  titleSlide.addText(content.title, {
    x: 1, y: 2, w: "80%", fontSize: 36,
    fontFace: branding.fontFamily, color: branding.headingColor,
  })
  titleSlide.addText(branding.firmName, {
    x: 1, y: 4, w: "80%", fontSize: 18, color: branding.accentColor,
  })

  // Content slides
  for (const section of content.sections) {
    const slide = pptx.addSlide()
    slide.addText(section.heading, {
      x: 0.5, y: 0.5, w: "90%", fontSize: 24,
      fontFace: branding.fontFamily, color: branding.headingColor, bold: true,
    })
    slide.addText(section.body, {
      x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 14,
      fontFace: branding.fontFamily, valign: "top",
    })
  }

  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer
  return Buffer.from(arrayBuffer)
}
```

### S3 Upload and Presigned URL

```typescript
// Source: @aws-sdk/client-s3 docs [ASSUMED: pattern based on training]
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT, // For R2 compatibility
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

export async function uploadDocument(
  projectId: string, documentType: string, format: string, buffer: Buffer
): Promise<string> {
  const key = `projects/${projectId}/documents/${documentType}/${format}/${Date.now()}.${format.toLowerCase()}`
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: getContentType(format),
  }))
  return key
}

export async function getDownloadUrl(s3Key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: s3Key,
  }), { expiresIn: 300 }) // 5 minutes
}
```

### Jira Sync via jira.js

```typescript
// Source: jira.js docs (https://mrrefactoring.github.io/jira.js/) [ASSUMED: API pattern]
import { Version3Client } from "jira.js"

export function createJiraClient(instanceUrl: string, email: string, apiToken: string) {
  return new Version3Client({
    host: instanceUrl,
    authentication: {
      basic: { email, apiToken },
    },
  })
}

export async function pushStoryToJira(
  client: Version3Client,
  projectKey: string,
  story: { title: string; description: string; storyPoints: number | null; status: string },
  existingJiraKey?: string
) {
  if (existingJiraKey) {
    // Update existing issue
    await client.issues.editIssue({
      issueIdOrKey: existingJiraKey,
      fields: {
        summary: story.title,
        description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: story.description }] }] },
        // story_points via custom field -- varies by Jira config
      },
    })

    // Transition status if needed
    const transitions = await client.issues.getTransitions({ issueIdOrKey: existingJiraKey })
    const targetTransition = transitions.transitions?.find(t => t.name === mapStatusToJira(story.status))
    if (targetTransition?.id) {
      await client.issues.doTransition({
        issueIdOrKey: existingJiraKey,
        transition: { id: targetTransition.id },
      })
    }
  } else {
    // Create new issue
    const result = await client.issues.createIssue({
      fields: {
        project: { key: projectKey },
        summary: story.title,
        issuetype: { name: "Story" },
        description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: story.description }] }] },
      },
    })
    return result.key // e.g., "PROJ-42"
  }
}
```

### Recharts Chart with shadcn Wrapper

```typescript
// Source: shadcn Charts docs [ASSUMED: based on shadcn/ui patterns]
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

const chartConfig = {
  draft: { label: "Draft", color: "hsl(var(--chart-1))" },
  ready: { label: "Ready", color: "hsl(var(--chart-2))" },
  inProgress: { label: "In Progress", color: "hsl(var(--chart-3))" },
  done: { label: "Done", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function StoriesByStatusChart({ data }: { data: Array<{ status: string; count: number }> }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px]">
      <BarChart data={data}>
        <XAxis dataKey="status" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-draft)" />
      </BarChart>
    </ChartContainer>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| docxtemplater (template-based) | docx (programmatic) | Ongoing | For AI-generated content, programmatic creation is more flexible than template placeholders |
| Jira REST API v2 | Jira REST API v3 + ADF | v3 is current | v3 uses Atlassian Document Format (ADF) for rich text fields instead of wiki markup |
| recharts 2.x | recharts 3.x | 2025 | Breaking API changes in chart components. shadcn Charts wraps 3.x. |

**Deprecated/outdated:**
- Jira REST API v2 description format (wiki markup): v3 uses ADF (Atlassian Document Format) -- a JSON-based rich text format. Use ADF when setting description fields.

## Schema Readiness Assessment

All Phase 5 models and enums are already deployed in the Prisma schema. No migration needed for the core data model.

| Model | Status | Notes |
|-------|--------|-------|
| GeneratedDocument | Deployed | Has projectId, title, documentType, format, s3Key, templateUsed, generatedById, sessionLogId |
| TestCase | Deployed | Has storyId, title, steps, expectedResult, testType, source, sortOrder |
| TestExecution | Deployed | Has testCaseId, executedById, result, notes, defectId, environment |
| Defect | Deployed | Has projectId, storyId, testCaseId, displayId, severity, status, assigneeId, duplicateOfId |
| Project.status | Deployed | ACTIVE / ARCHIVED enum |

**Schema additions needed:**

| Addition | Purpose | Rationale |
|----------|---------|-----------|
| JiraSyncConfig fields on Project | Store Jira instance URL, encrypted API token, project key, email, sync enabled flag | No dedicated model in tech spec. Add as fields on Project (consistent with SF org credentials pattern). |
| JiraSyncRecord model | Track per-story sync status, Jira issue key, last sync timestamp, error message | Needed for sync history table (D-17). Not in original schema. |
| Document version number | Track version per document type | GeneratedDocument doesn't have a version field. Version is implicit from count of documents with same documentType per project. May want explicit field for clarity. |
| PM dashboard cache fields | Store pre-computed PM dashboard data | Extend `Project.cachedBriefingContent` JSON or add separate `cachedPmDashboard` JSON field. |

[VERIFIED: prisma/schema.prisma]

## Inngest Events (Phase 5 additions)

New events to add to `src/lib/inngest/events.ts`:

```typescript
// Document events (Phase 5)
DOCUMENT_GENERATION_REQUESTED: "document/generation-requested",
DOCUMENT_GENERATION_COMPLETED: "document/generation-completed",

// QA events (Phase 5)
TEST_EXECUTION_RECORDED: "qa/test-execution-recorded",
DEFECT_CREATED: "qa/defect-created",
DEFECT_STATUS_CHANGED: "qa/defect-status-changed",

// Jira events (Phase 5)
JIRA_SYNC_REQUESTED: "jira/sync-requested",
JIRA_SYNC_COMPLETED: "jira/sync-completed",
JIRA_SYNC_FAILED: "jira/sync-failed",

// Admin events (Phase 5)
PROJECT_ARCHIVED: "project/archived",
PROJECT_REACTIVATED: "project/reactivated",
PM_DASHBOARD_REFRESH: "dashboard/pm-refresh",
```

## New Routes (Phase 5)

| Route | Purpose | Pattern |
|-------|---------|---------|
| `/projects/[projectId]/documents` | Template gallery + version history | Server component with data fetch |
| `/projects/[projectId]/documents/[documentId]` | Document preview + download | Server component + client download handler |
| `/projects/[projectId]/defects` | Defects list (table + kanban) | Client component with SWR (matches questions/stories pattern) |
| `/projects/[projectId]/pm-dashboard` | PM dashboard with charts | Server component + client chart components |
| `/projects/[projectId]/settings/jira` | Jira sync configuration | Server action form (or section in existing settings page) |

**Sidebar additions:** Documents (FileOutput icon), Defects (Bug icon, with open count badge), PM Dashboard (BarChart3 icon). [VERIFIED: 05-UI-SPEC.md]

## Branding Configuration Structure

Hardcoded in V1. Recommended structure:

```typescript
// src/lib/documents/branding.ts
export interface BrandingConfig {
  firmName: string
  logoPath: string        // Path to logo file in public/ or S3
  colors: {
    primary: string       // Heading color
    accent: string        // Accent/highlight color
    background: string    // Page/slide background
  }
  fontFamily: string      // e.g., "Calibri" for Word, "Arial" for PPT
  footer: {
    confidentialityNotice: string
    showPageNumbers: boolean
  }
  coverPage: {
    showLogo: boolean
    showDate: boolean
    showAuthor: boolean
  }
}

export const FIRM_BRANDING: BrandingConfig = {
  firmName: "Your Firm Name",
  logoPath: "/branding/logo.png",
  colors: { primary: "#1a1a1a", accent: "#2563EB", background: "#ffffff" },
  fontFamily: "Calibri",
  footer: { confidentialityNotice: "Confidential - Do Not Distribute", showPageNumbers: true },
  coverPage: { showLogo: true, showDate: true, showAuthor: true },
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@react-pdf/renderer` 4.3.3 works in Node.js / Inngest function context without browser dependencies | Standard Stack | If it requires a browser/DOM, would need to switch to `pdf-lib` or `pdfkit`. Test during implementation. |
| A2 | jira.js 5.3.1 supports Jira Cloud REST API v3 with ADF document format | Standard Stack | If not, would need to use raw fetch. Lower risk since jira.js explicitly claims v3 support. |
| A3 | S3 presigned URL pattern works with Cloudflare R2 | Code Examples | R2 is S3-compatible but some advanced features may differ. Verify presigned URL support. |
| A4 | `@aws-sdk/s3-request-presigner` is the correct package for presigned URLs with SDK v3 | Code Examples | If different package name, adjust import. Low risk. |
| A5 | Recharts 3.8.1 API is compatible with the shadcn Charts wrapper already in the project | Standard Stack | shadcn Charts component is already generated (`src/components/ui/chart.tsx`). Should be compatible but verify. |
| A6 | JiraSyncConfig can be added as fields on the Project model rather than a separate model | Schema Additions | Separate model would be cleaner if sync complexity grows, but fields on Project matches the SF org credentials pattern. |

## Open Questions

1. **Jira field mapping configuration storage**
   - What we know: Stories map to Jira issues with title, description, status, priority, story points.
   - What's unclear: Whether story points use Jira's built-in field or a custom field (varies by Jira instance). Whether priority mapping needs to be configurable.
   - Recommendation: Hardcode default mapping in V1. Story points map to standard `story_points` field. If client uses custom field, address as one-off config.

2. **Document generation progress tracking**
   - What we know: D-02 specifies progress indicator during generation. Inngest step functions run asynchronously.
   - What's unclear: How to communicate step progress from Inngest to the UI in real-time.
   - Recommendation: Use Inngest step metadata or a lightweight status record in the DB that the UI polls via SWR. Alternatively, use Inngest's `getStepStatus` API if available, or poll a `DocumentGenerationJob` status record.

3. **Archive process completeness**
   - What we know: PRD 21.1 lists 7 steps including "generates final project summary document" and "revokes SF org credentials" and "disconnects Jira sync".
   - What's unclear: Whether the archive step function should auto-generate a final summary document or if that's a manual PM action before archiving.
   - Recommendation: Make archive a multi-step process: PM generates final docs manually, then clicks Archive. Archive action sets status to ARCHIVED, disconnects Jira, clears SF org tokens. No auto-generated final doc in V1.

4. **Document preview rendering**
   - What we know: D-03 specifies in-browser preview. PDF inline, Word/PPT as formatted preview.
   - What's unclear: How to render Word/PPT preview in browser without a conversion service.
   - Recommendation: For Word/PPT, generate an HTML preview alongside the binary format during the Inngest step function. Store the HTML preview as a separate S3 object. PDF rendered inline via browser's native PDF viewer (`<iframe>` or `<object>`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Yes | (runtime) | -- |
| S3/R2 bucket | Document storage | Needs config | -- | Local filesystem for dev |
| Jira Cloud instance | Jira sync testing | Optional (feature is optional) | -- | Mock in tests |
| Inngest | Background jobs | Yes (existing) | 4.1.2 | -- |

**Missing dependencies with no fallback:**
- S3/R2 bucket configuration (env vars) needed for document storage. Already required by project architecture but may not be set up yet.

**Missing dependencies with fallback:**
- Jira Cloud instance for testing -- mock the jira.js client in unit tests. Integration testing deferred.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | Document renderers produce valid buffers for DOCX/PPTX/PDF | unit | `npx vitest run tests/lib/documents/ -x` | No -- Wave 0 |
| DOC-02 | Document content task assembles context and generates content | unit | `npx vitest run tests/lib/agent-harness/document-content.test.ts -x` | No -- Wave 0 |
| DOC-03 | S3 upload/download utilities work correctly | unit | `npx vitest run tests/lib/documents/s3-storage.test.ts -x` | No -- Wave 0 |
| DOC-04 | Branding config applied to rendered documents | unit | Covered by DOC-01 tests | No -- Wave 0 |
| QA-01 | Test execution CRUD actions with result validation | unit | `npx vitest run tests/actions/test-executions.test.ts -x` | No -- Wave 0 |
| QA-02 | Defect CRUD actions with story linking | unit | `npx vitest run tests/actions/defects.test.ts -x` | No -- Wave 0 |
| QA-03 | Defect status machine transitions and role guards | unit | `npx vitest run tests/lib/defects/status-machine.test.ts -x` | No -- Wave 0 |
| ADMIN-01 | Jira sync creates/updates issues correctly | unit | `npx vitest run tests/lib/jira/sync.test.ts -x` | No -- Wave 0 |
| ADMIN-02 | PM dashboard synthesis aggregates data correctly | unit | `npx vitest run tests/lib/pm-dashboard-synthesis.test.ts -x` | No -- Wave 0 |
| ADMIN-03 | AI usage aggregation from SessionLog records | unit | Covered by ADMIN-02 tests | No -- Wave 0 |
| PROJ-04 | Archive action sets project to ARCHIVED, archive guard blocks mutations | unit | `npx vitest run tests/actions/project-archive.test.ts -x` | No -- Wave 0 |
| PROJ-05 | Reactivate action restores ACTIVE status | unit | Covered by PROJ-04 tests | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/documents/docx-renderer.test.ts` -- covers DOC-01 (Word)
- [ ] `tests/lib/documents/pptx-renderer.test.ts` -- covers DOC-01 (PPT)
- [ ] `tests/lib/documents/pdf-renderer.test.ts` -- covers DOC-01 (PDF)
- [ ] `tests/lib/documents/s3-storage.test.ts` -- covers DOC-03
- [ ] `tests/actions/test-executions.test.ts` -- covers QA-01
- [ ] `tests/actions/defects.test.ts` -- covers QA-02
- [ ] `tests/lib/defects/status-machine.test.ts` -- covers QA-03
- [ ] `tests/lib/jira/sync.test.ts` -- covers ADMIN-01
- [ ] `tests/lib/pm-dashboard-synthesis.test.ts` -- covers ADMIN-02, ADMIN-03
- [ ] `tests/actions/project-archive.test.ts` -- covers PROJ-04, PROJ-05
- [ ] `tests/helpers/mock-s3.ts` -- shared S3 mock utilities
- [ ] `tests/helpers/mock-jira.ts` -- shared Jira client mock

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (Jira creds) | Clerk auth for user sessions. Jira API tokens encrypted at rest via `src/lib/encryption.ts` (AES-256-GCM with HKDF-SHA256). |
| V3 Session Management | No (handled by Clerk) | Existing Clerk session management. |
| V4 Access Control | Yes | PM-only archive/reactivate. QA-only Verified transition. Project-scoped queries via `scopedPrisma()`. Archive guard on all mutations. |
| V5 Input Validation | Yes | Zod schemas for all server actions (via next-safe-action). Validate Jira URL format, document generation params. |
| V6 Cryptography | Yes (Jira tokens) | Reuse existing `encrypt()`/`decrypt()` from `src/lib/encryption.ts` for Jira API tokens. Same HKDF-SHA256 + AES-256-GCM pattern as SF org tokens. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Jira API token exposure | Information Disclosure | Encrypt at rest, never log plaintext, never return to client. Server-side only. |
| S3 key enumeration | Information Disclosure | Presigned URLs with short TTL. No public bucket access. Project-scoped S3 key paths. |
| Archive bypass | Tampering | Middleware-level archive guard on ALL project-scoped mutations, not per-action. |
| Cross-project document access | Elevation of Privilege | `scopedPrisma()` ensures documents are project-scoped. S3 keys include projectId. |
| Defect status manipulation | Tampering | Role-based guards on status transitions (QA-only for VERIFIED). |

## Sources

### Primary (HIGH confidence)
- npm registry -- verified versions: docx 9.6.1, pptxgenjs 4.0.1, @react-pdf/renderer 4.3.3, recharts 3.8.1, jira.js 5.3.1, @aws-sdk/client-s3 3.1025.0
- `prisma/schema.prisma` -- verified all Phase 5 models and enums are deployed
- `src/lib/inngest/events.ts` -- verified existing event structure
- `src/lib/encryption.ts` -- verified encryption pattern for credential storage
- `src/lib/safe-action.ts` -- verified server action middleware pattern
- `src/lib/project-scope.ts` -- verified project scoping pattern
- `package.json` -- verified recharts already installed
- `05-CONTEXT.md` -- all locked decisions
- `05-UI-SPEC.md` -- full UI design contract
- `SESSION-3-TECHNICAL-SPEC.md` -- schema specifications
- `SF-Consulting-AI-Framework-PRD-v2.1.md` -- PRD Sections 16 (Document Generation), 17 (Dashboards), 18 (QA), 20 (Jira Sync), 21 (Archival)

### Secondary (MEDIUM confidence)
- [docx npm page](https://www.npmjs.com/package/docx) -- API patterns
- [Jira Cloud REST API v3 docs](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) -- API endpoints and ADF format
- [jira.js library](https://mrrefactoring.github.io/jira.js/) -- TypeScript client for Jira

### Tertiary (LOW confidence)
- @react-pdf/renderer server-side rendering compatibility -- needs verification during implementation (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm registry, most already in project
- Architecture: HIGH -- follows established patterns from Phases 1-3 extensively
- Pitfalls: HIGH -- based on well-known issues with Jira API, S3 presigned URLs, and async generation patterns
- Schema: HIGH -- all models verified as already deployed in Prisma schema

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days -- stable domain, locked libraries)
