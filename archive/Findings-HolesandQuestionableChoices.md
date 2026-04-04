Findings: Holes and Questionable Choices
I'm grouping by severity. These are issues that will cause real problems during build or at runtime, not cosmetic nits.

Critical (will block or break things)
1. No audit trail for WHO changed story status

VersionHistory captures previousState as a JSON blob and modifiedById, but the RBAC model now has split status transition permissions (management vs. execution). There's no way to enforce or audit "only QA/Dev can do execution transitions" at the data level. The VersionHistory JSON snapshot doesn't distinguish which field changed. When a PM disputes "who moved this to Done?", you'd have to diff two JSON blobs.

Should you add a dedicated StatusTransition table (entityType, entityId, fromStatus, toStatus, transitionedById, timestamp) instead of relying on VersionHistory JSON diffing?

2. Conversation model has no way to resume context with Claude

The ChatMessage table stores messages, but there's no field for the Claude API conversation_id or the message array needed to continue a multi-turn conversation. The general chat is described as persistent and shared across team members, with "each message triggers an independent harness call." That means every message in general chat starts a fresh Claude API call with no conversational memory unless the context loader explicitly reconstructs it from ChatMessage rows.

For task sessions, the agent loop handles multi-turn within a single invocation. But if a user closes the browser mid-session and comes back, there's no mechanism to resume. The status field has ACTIVE/COMPLETE/FAILED but no way to reconstruct the Claude API state.

Is the intent that general chat has no conversational continuity (every message is standalone with injected context)? If so, that's a design choice worth making explicit. If not, you need a strategy for message window assembly.

3. Notification type enum is out of sync with the PRD notification table

The tech spec Notification entity has 10 enum values. The PRD (Section 17.8) now has 14 notification events after Session 7 additions (Story moved to QA, New decision recorded, Risk created/changed, Story reassigned). The tech spec enum is missing:

STORY_MOVED_TO_QA
DECISION_RECORDED
RISK_CHANGED
STORY_REASSIGNED
This will cause a schema mismatch on build.

High (architectural issues that will cause pain)
4. No displayId auto-generation strategy documented in the tech spec

Multiple entities use auto-generated display IDs: Questions (Q-FM-003), Stories (STORY-FM-001), Decisions (D-FM-001), Requirements (REQ-001), Risks (RISK-001), Defects (DEF-001). The PRD describes the format, but neither document specifies the counter mechanism:

Is it a per-project sequence in Postgres?
An application-level counter?
A max()+1 query?
This matters for concurrent creation. If two BAs process transcripts simultaneously and both create questions for the same epic, you'll get ID collisions with a naive max()+1. You need either Postgres sequences (one per project per entity type, which doesn't scale well) or an atomic counter pattern.

5. SF OAuth tokens stored directly in the Project table

sfOrgAccessToken, sfOrgRefreshToken are columns on the Project entity marked "encrypted." But Prisma doesn't have built-in column-level encryption. You'll need either:

Application-level encrypt/decrypt on every read/write (error-prone, easy to leak in logs)
A separate credentials table with Postgres-level encryption (pgcrypto)
A secrets manager (AWS Secrets Manager, Vault)
Storing OAuth tokens in the same table as project metadata also means every findUnique on Project pulls encrypted token data into memory unless you explicitly select fields. With Prisma, this is manageable but worth noting as a footgun.

6. VersionHistory stores full entity snapshots as JSON

For a 6-month project with active editing, this table will grow fast. Every edit to a story (which has 15+ fields) creates a full JSON snapshot. With 200+ stories getting edited multiple times across sprints, you're looking at significant storage and query overhead.

An event-sourcing-lite approach (store only the changed fields as a diff, not the full state) would be much cheaper. Or: just document that this is accepted overhead for V1 and consider compaction later.

7. No rate limiting or concurrency control on agent harness invocations

PRD Section 23.3 mentions rate limits (per-consultant daily, per-project monthly), but the tech spec has no implementation detail. If two BAs both hit "Process Transcript" at the same time for the same project, both agent loops run concurrently, both writing to the same project's questions/decisions/requirements. The duplicate detection within a single loop won't catch duplicates created by the other concurrent loop.

Do you need a per-project semaphore for write-heavy task types (transcript processing, story generation), or is eventual dedup acceptable?

Medium (gaps that should be resolved before or during build)
8. No projectId on StoryComponent for efficient project-wide queries

Sprint intelligence needs to query "all StoryComponents for stories in this sprint." That requires joining StoryComponent -> Story -> Sprint. Adding a denormalized projectId on StoryComponent would simplify and speed up conflict detection queries. Same pattern already exists on most other entities.

9. Feature-scoped question IDs have an ambiguity

The format Q-{EPIC}-{FEATURE}-{NUMBER} (e.g., Q-DM-LRT-001) assumes feature prefixes are unique within an epic. But the Feature entity has no prefix field. How is LRT derived? If it's auto-generated from the feature name, two features named "Lightning Reports Tab" and "Lead Routing Trigger" could both generate LRT. The tech spec doesn't define a Feature.prefix field or a uniqueness constraint.

10. Defect has no displayId generation scheme

Questions, Stories, Decisions, Requirements, and Risks all have documented ID formats. Defect just says "DEF-001" but doesn't specify whether it's project-scoped, story-scoped, or global. Should probably be DEF-{NUMBER} project-scoped, consistent with other entities.

11. The Context Package API has no versioning or caching strategy

GET /api/projects/:projectId/context-package/:storyId assembles a context package by running 7 parallel DB queries + semantic search. If a developer calls this multiple times (e.g., restarts their Claude Code session), every call re-runs all queries. A short-lived cache (5 min TTL, invalidated on story/sprint changes) would reduce load significantly.

12. Attachment entity uses polymorphic entityType/entityId with no index strategy

Same pattern as KnowledgeArticleReference. Querying "all attachments for Story X" requires WHERE entityType = 'Story' AND entityId = :id. This needs a composite index on (entityType, entityId) or it'll table-scan as attachment counts grow. Neither document mentions indexes on polymorphic columns.

13. No Defect-to-Defect linking (duplicate/related)

QA often finds the same bug from multiple test cases. There's no way to mark a defect as a duplicate of another, or to link related defects. The status enum has CLOSED which SA/PM can use for duplicates, but there's no duplicateOfId field to actually link them.

Not Bugs, But Worth a Decision
14. General chat message volume over 6 months. You acknowledged this in Session 7 (item #17). Just flagging: if the context loader for general chat loads recent messages as context, you'll need a windowing strategy (last N messages, or last N days). Neither doc specifies the window.

15. Jira sync via MCP is underspecified. Section 20.5 says "implemented via MCP using existing Jira MCP servers or a custom-built thin adapter." MCP is a local protocol designed for Claude Code/IDE integrations, not for server-to-server sync from a Next.js backend. You'd actually want a standard REST integration with the Jira Cloud API, running as an Inngest job. The MCP mention seems like a wrong architectural choice for this use case.

Want me to pick any of these up and fix them in the documents, or do you want to discuss them first?