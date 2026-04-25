# Story Status Update

Update a story's execution status as you progress through development. The web app validates that the status transition is legal and notifies the PM when the status changes.

## Prerequisites

Set the following environment variables:

```bash
export SFAI_API_KEY="sfai_..."    # Generated from project Settings > Developer API
export SFAI_BASE_URL="https://your-app.vercel.app"  # Your deployment URL
```

## Endpoint

```
PATCH /api/v1/stories/{STORY_ID}/status
```

**Rate limit:** 30 requests per minute

## Usage

```bash
# Start working on a story
curl -s -X PATCH \
  -H "x-api-key: $SFAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}' \
  "$SFAI_BASE_URL/api/v1/stories/STORY_ID/status"

# Submit story for review
curl -s -X PATCH \
  -H "x-api-key: $SFAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_REVIEW"}' \
  "$SFAI_BASE_URL/api/v1/stories/STORY_ID/status"
```

Replace `STORY_ID` with the story's unique ID.

## Request Body

```json
{
  "status": "IN_PROGRESS"
}
```

### Valid Status Values

`DRAFT`, `READY`, `SPRINT_PLANNED`, `IN_PROGRESS`, `IN_REVIEW`, `QA`, `DONE`

### Developer Transitions

As a developer working through Claude Code, these are the typical transitions you will make:

| From | To | When |
|------|----|------|
| `SPRINT_PLANNED` | `IN_PROGRESS` | Starting work on the story |
| `IN_PROGRESS` | `IN_REVIEW` | Submitting work for review |

Other transitions (e.g., `IN_REVIEW` to `QA`, `QA` to `DONE`) are managed by the PM or QA team through the web app.

## Response Shape

```json
{
  "id": "string",
  "status": "IN_PROGRESS",
  "updatedAt": "2026-04-06T12:00:00.000Z"
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `id` | The story's unique ID |
| `status` | The new status after transition |
| `updatedAt` | Timestamp of the status change |

## Side Effects

When a status is updated successfully:

- The web app sends an Inngest event (`STORY_STATUS_CHANGED`)
- The PM is notified of the status change
- The sprint board updates in real time

## When to Use

- **When starting work on a story:** Set status to `IN_PROGRESS` so the PM and team can see the story is being actively worked on
- **When submitting for review:** Set status to `IN_REVIEW` so the reviewer knows work is ready for inspection

Always update status before and after your development work to keep the sprint board accurate.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid JSON body, invalid status value, or illegal status transition | Check the request body and verify the transition is valid from the current status |
| 401 | Invalid or missing API key | Check `SFAI_API_KEY` is set and valid |
| 404 | Story not found (or not in this project) | Verify the story ID belongs to the API key's project |
| 429 | Rate limited | Wait and retry (limit: 30 req/min) |

### Transition Error Response

When an invalid transition is attempted, the error response includes the valid transitions:

```json
{
  "error": "Invalid status transition from DRAFT to IN_PROGRESS",
  "currentStatus": "DRAFT",
  "validTransitions": ["READY"]
}
```
