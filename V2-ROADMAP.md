# V2 Roadmap: Post-MVP Enhancements

**Document Version:** 1.0
**Date:** April 3, 2026
**Status:** Living document. Updated as V1 decisions create known V2 items.

This document captures every feature, improvement, and scaling investment explicitly deferred from V1. Items are organized by category, with source references back to where the deferral was documented.

---

## 1. Infrastructure and Scaling

### 1.1 Background Job Infrastructure Upgrade

**V1 approach:** Inngest on Vercel serverless functions.
**V2 trigger:** Any of these indicators:
- Job failure rate exceeds 5% on any job type
- Metadata sync duration regularly exceeds 3 minutes
- More than 10 concurrent projects triggering events in the same minute
- Users report lag > 30 seconds between action and dashboard/notification update
- Inngest monthly event volume approaching tier limits

**V2 work:**

| V1 Constraint | V2 Solution |
|---|---|
| Vercel function timeout (5-10 min) | Dedicated worker service (Railway/Fly.io with BullMQ + Redis) for long-running jobs. Inngest can still trigger via webhook. |
| Inngest free tier concurrency caps | Inngest paid tier, or migrate to self-hosted Inngest or BullMQ |
| No job prioritization | Priority queues: P0 (user-initiated), P1 (event-driven), P2 (scheduled batch) |
| Single-region execution | Co-locate worker service with database region |
| No dead letter queue | DLQ with alerting: failed jobs after max retries go to review queue with admin notification |
| No job chaining / DAG execution | Evaluate Temporal or custom orchestration for complex multi-step workflows |
| Per-entity embedding generation floods queue on bulk ops | Batch embedding API calls: collect entities, embed in batches of 50-100, write in one transaction |
| No rate limiting on concurrent AI API calls from jobs | Semaphore/concurrency limit on AI-calling jobs |
| Monitoring is Inngest dashboard only | Integrate with Datadog or Sentry for job failure alerts and latency tracking |
| No tenant isolation for jobs | Per-project concurrency limits and fair scheduling; separate queues per project or priority class |

**Source:** Session 5 thread, Background Job Infrastructure section.

---

### 1.2 Real-Time Collaborative Editing

**V1 approach:** Optimistic concurrency control. Second user to save sees a diff and can merge or overwrite.
**V2 trigger:** Team reports friction from simultaneous editing of the same entity.
**V2 work:** Implement operational transforms or CRDTs for real-time collaborative editing on stories, questions, and other frequently co-edited entities.
**Source:** PRD Section 27.7, Tech Spec Section 25.2.

---

### 1.3 Real-Time Update Mechanism

**V1 approach:** "WebSocket or polling" (not yet decided).
**V2 trigger:** Multi-user dashboard staleness causes confusion.
**V2 work:** Implement WebSocket or Server-Sent Events for live dashboard updates, entity change notifications, and concurrent editing awareness. Define exactly which data subscribes to real-time channels vs. polling.
**Source:** PRD Section 25.1, gap analysis item #12.

---

### 1.4 Event-Driven Org Sync (Webhooks)

**V1 approach:** Scheduled metadata sync every 4 hours + manual trigger.
**V2 trigger:** Teams report stale context packages due to gap between developer deploy and next sync.
**V2 work:** Implement Salesforce Platform Events or outbound webhooks to trigger sync on metadata deploy. Alternatively, add a "sync now" button in Claude Code post-deploy skill.
**Source:** PRD Section 27.3.

---

## 2. AI and Knowledge System

### 2.1 Embedding-Enhanced Duplicate Detection

**V1 approach:** Simple text similarity (substring + Levenshtein distance) for question deduplication.
**V2 trigger:** False positives or missed duplicates become a user complaint.
**V2 work:** Use pgvector embeddings for semantic similarity on questions, decisions, and requirements. Compare embedding cosine similarity instead of string matching.
**Source:** Tech Spec Section 6, line 1169; Tech Spec Section 6.4 (design decision #4).

---

### 2.2 AI Provider Abstraction Layer

**V1 approach:** Claude API integration in a cleanly separated module. No abstraction.
**V2 trigger:** Firm needs to support a second AI provider (cost, capability, or client requirement).
**V2 work:** Build a provider-agnostic abstraction layer over the agent harness. Abstract prompt format, tool calling conventions, and response parsing. Maintain Claude as primary with a secondary provider option.
**Source:** PRD Section 3.3, PRD Section 27.4.

---

### 2.3 AI Output Quality Benchmarking

**V1 approach:** No formal measurement.
**V2 trigger:** Firm wants to quantify ROI or compare AI-generated vs. manual artifact quality.
**V2 work:** Define baseline metrics for story quality, transcript extraction accuracy, briefing usefulness. Implement A/B or before/after measurement framework.
**Source:** PRD Section 27.8.

---

## 3. User Experience

### 3.1 Firm Administrator UI

**V1 approach:** Firm-level settings (guardrails, branding, templates, naming conventions) configured in codebase and database directly.
**V2 trigger:** Additional administrators need to manage these settings without code changes.
**V2 work:** Build admin interface for: Salesforce development guardrails, branding asset management, document template management, naming convention rules, typographic rules, rate limit configuration.
**Source:** PRD Section 4.6, PRD Section 27.5.

---

### 3.2 Project Home Page

**V1 approach:** Users land on the briefing dashboard.
**V2 trigger:** Post-V1, based on user feedback on navigation.
**V2 work:** A dedicated landing page per project: key metrics, recent activity feed, quick actions, team status.
**Source:** PRD Section 27.14.

---

### 3.3 Mobile / Responsive Access

**V1 approach:** Desktop/laptop only.
**V2 trigger:** Consultants request dashboard or story access from mobile devices.
**V2 work:** Responsive design for dashboards, story management, and notification views. Define which workflows are mobile-appropriate vs. desktop-only.
**Source:** PRD Section 27.10.

---

### 3.4 Data Export

**V1 approach:** No export capability.
**V2 trigger:** Firm needs to share project data with a client at engagement end, or migrate to another tool.
**V2 work:** Define export formats (JSON, CSV, PDF bundle). Build per-project export covering: stories, questions, decisions, requirements, org knowledge, generated documents. Consider client-safe export (scrubbed of internal notes).
**Source:** Gap analysis item #10.

---

### 3.5 Activity Feed / Change History UI

**V1 approach:** SessionLog and VersionHistory entities exist in the schema but no dedicated UI.
**V2 trigger:** Users ask "who changed this?" or "what did the AI do during that session?"
**V2 work:** Per-entity activity timeline (who changed what, when). Per-project recent activity feed. Session replay view (what the AI extracted during transcript processing, with ability to review and correct).
**Source:** Gap analysis item #7.

---

### 3.6 Developer Context Package Web View

**V1 approach:** Context packages served via REST API for Claude Code consumption only.
**V2 trigger:** Developers want to read their context package in the browser, or work without Claude Code temporarily.
**V2 work:** Render context packages as readable web pages: story details, business context, org components, related decisions, overlapping stories. Read-only view within the web application.
**Source:** Gap analysis item #8.

---

### 3.7 Email and Push Notifications

**V1 approach:** In-app notifications only. Notification bell with unread count.
**V2 trigger:** Users miss critical notifications (unblocked work, sprint conflicts) because they're not in the app.
**V2 work:** Email notifications (opt-in per user, per notification type), push notifications (if mobile access added), notification preferences UI, daily digest mode as alternative to per-event delivery.
**Source:** Session 5 thread, Notification System section.

---

## 4. Integrations

### 4.1 Playwright Test Integration

**V1 approach:** Manual test result recording by QAs.
**V2 trigger:** Team runs enough Playwright tests that manual logging becomes a bottleneck.
**V2 work:** Ingest Playwright JSON test reports. Auto-map test results to TestCase entities. Auto-update Pass/Fail status. Link failures to defects.
**Source:** PRD Section 18.3, PRD Section 27.6.

---

### 4.2 Git Repository Management

**V1 approach:** Web application has no Git involvement. Teams manage repos independently.
**V2 trigger:** Repo setup (creation, branch protection, CODEOWNERS) becomes a bottleneck in project onboarding.
**V2 work:** GitHub API integration for: repo creation from template, branch protection rules, CODEOWNERS configuration, PR template setup. Optional, per-project.
**Source:** PRD Section 27.12.

---

### 4.3 Bidirectional Jira Sync

**V1 approach:** Optional one-directional push from app to client Jira.
**V2 trigger:** Clients modify stories in Jira and expect changes to reflect back.
**V2 work:** Bidirectional sync with conflict resolution. Define which fields sync in which direction. Handle the split-brain problem (likely: app is source of truth for scope fields, Jira is source of truth for client-added comments/labels).
**Source:** PRD Section 20 (V1 explicitly avoids this).

---

## 5. Process and Compliance

### 5.1 Sprint Carryover History

**V1 approach:** Simple FK from Story to Sprint. No history of sprint reassignment.
**V2 trigger:** PM needs velocity accuracy or wants to track carryover patterns.
**V2 work:** Track sprint assignment history on stories: original sprint, actual completion sprint, carryover count. Feed into velocity calculations and sprint planning AI.
**Source:** PRD Section 7.3 (Sprint entity, "known simplification").

---

### 5.2 Salesforce Credential Rotation

**V1 approach:** Credentials stored encrypted, no rotation workflow.
**V2 trigger:** Long-running engagements where credentials expire.
**V2 work:** Credential expiry detection, refresh workflow, notification to solution architect when credentials are approaching expiry. Support for refresh token rotation.
**Source:** PRD Section 27.11.

---

### 5.3 Framework Updates to Active Projects

**V1 approach:** No propagation mechanism for firm-level rule changes.
**V2 trigger:** Firm updates guardrails or templates and needs active projects to pick them up.
**V2 work:** Options to evaluate: automatic propagation (risky mid-sprint), manual pull by project lead, or update at next milestone. Likely: notification to project lead + opt-in update with diff preview.
**Source:** PRD Section 27.13.

---

### 5.4 Regulatory and Contractual Review

**V1 approach:** Not addressed.
**V2 trigger:** Before broad client engagement rollout.
**V2 work:** Legal review of data handling posture. Per-client AI usage disclosure templates. Contractual clause library for AI tool usage. Audit report generation for client compliance reviews.
**Source:** PRD Section 27.9.

---

### 5.5 QA Role Expansion

**V1 approach:** RBAC restricts QA from chat, questions, and transcript processing.
**V2 trigger:** QAs report they need to feed testing discoveries back into the knowledge base.
**V2 work:** Expand QA permissions to include: chat with AI (scoped to QA context), raise questions, and log discoveries from testing. Review whether QA should have a dedicated "testing discovery" conversation type.
**Source:** Gap analysis item #6.

---

## 6. File and Content Management

### 6.1 File Upload Constraints

**V1 approach:** No defined limits on uploaded transcripts, attachments, or branding assets.
**V2 trigger:** Before production rollout with multiple users uploading content.
**V2 work:** Define and enforce: max file sizes per type (transcripts, attachments, branding assets), allowed file types (whitelist), virus/malware scanning (ClamAV or cloud service), upload rate limits per user.
**Source:** Gap analysis item #11.

---

### 6.2 Large Transcript Handling

**V1 approach:** Not specified for transcripts exceeding typical size (5-10K words).
**V2 trigger:** User pastes a 2-hour meeting transcript (20K+ words).
**V2 work:** Options: chunked processing (split transcript, process each chunk, merge results with deduplication), summarize-then-extract (AI summarizes first, then extracts from summary), or reject with size guidance. Chunked processing is most thorough but most expensive.
**Source:** Gap analysis item #9.

---

## Appendix: Source Cross-Reference

| Source Document | Items Contributed |
|---|---|
| PRD Section 27 (Open Questions) | 2.2, 2.3, 3.1, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 1.2, 1.4, 3.2 |
| Tech Spec Section 6 (Remaining Items) | 2.1 |
| Session 5 Thread (Gap Analysis) | 1.3, 3.4, 3.5, 3.6, 5.5, 6.1, 6.2 |
| Session 5 Thread (Background Jobs) | 1.1 |
| PRD Section 18.3 | 4.1 |
| PRD Section 20 | 4.3 |
| PRD Sprint entity | 5.1 |
