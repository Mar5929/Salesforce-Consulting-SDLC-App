---
status: partial
phase: 05-document-generation-qa-and-administration
source: [05-VERIFICATION.md]
started: 2026-04-06T21:15:00Z
updated: 2026-04-06T21:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end document generation
expected: Multi-step Inngest pipeline (content generation → render → S3 upload → DB record) completes successfully with live S3 credentials, DATABASE_URL, and Claude API key
result: [pending]

### 2. QA workflow
expected: Record test execution (Pass/Fail/Blocked) and create a defect from a failed test; verify DEF-N display ID and Defects page listing
result: [pending]

### 3. Jira sync
expected: Configure Jira credentials in Settings, change a story status, confirm SyncStatusBadge shows SYNCED with Jira issue key
result: [pending]

### 4. Project archive/reactivate
expected: assertProjectNotArchived blocks mutations on archived projects, and reactivation restores editability
result: [pending]

### 5. Schema push in deployment
expected: npx prisma db push creates JiraConfig/JiraSyncRecord tables; Jira sync actions work at runtime
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
