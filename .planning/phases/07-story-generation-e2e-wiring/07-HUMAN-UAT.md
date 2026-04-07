---
status: partial
phase: 07-story-generation-e2e-wiring
source: [07-VERIFICATION.md]
started: 2026-04-07T08:20:00Z
updated: 2026-04-07T08:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-End Story Generation Flow
Click "Generate Stories" on an epic detail page. Verify:
- Redirect URL contains `?epicId=...` search params
- Chat page loads with STORY_SESSION conversation type
- Sending a message triggers AI to call `create_story_draft` tool
- StoryDraftCards render inline in the chat message list with accept/reject UI

expected: epicId in URL, AI tool call responses, inline story draft cards with accept/reject UI
result: [pending]

### 2. StoryDraftCards Accept/Reject Interaction
Accept a draft card from the story generation flow:
- Card updates to accepted state
- Story is created in the database

expected: Story created in database, card updates to accepted state
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
