# Project Session Initialization

Fetch the project summary at the start of a Claude Code session to understand the project context, team size, and current state. This gives you the high-level picture before diving into specific stories.

## Prerequisites

Set the following environment variables:

```bash
export SFAI_API_KEY="sfai_..."    # Generated from project Settings > Developer API
export SFAI_BASE_URL="https://your-app.vercel.app"  # Your deployment URL
```

## Endpoint

```
GET /api/v1/project/summary
```

**Rate limit:** 60 requests per minute

## Usage

```bash
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/project/summary"
```

No additional parameters are needed. The API key determines which project's summary is returned.

## Response Shape

```json
{
  "id": "string",
  "name": "string",
  "client": "string | null",
  "engagementType": "IMPLEMENTATION | OPTIMIZATION | MIGRATION | INTEGRATION | ADVISORY",
  "currentPhase": "DISCOVERY | DESIGN | BUILD | TEST | DEPLOY | HYPERCARE",
  "status": "PLANNING | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED",
  "startDate": "2026-01-15T00:00:00.000Z",
  "targetEndDate": "2026-06-30T00:00:00.000Z",
  "memberCount": 5,
  "epicCount": 8,
  "storyCount": 42,
  "openQuestionCount": 7,
  "orgComponentCount": 156
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `id` | Unique project ID |
| `name` | Project name |
| `client` | Client company name |
| `engagementType` | Type of Salesforce engagement |
| `currentPhase` | Current project delivery phase |
| `status` | Overall project status |
| `startDate` | Project start date |
| `targetEndDate` | Target completion date |
| `memberCount` | Number of active team members |
| `epicCount` | Total number of epics |
| `storyCount` | Total number of user stories |
| `openQuestionCount` | Number of unresolved discovery questions |
| `orgComponentCount` | Number of active Salesforce org components tracked |

## When to Use

At the start of every Claude Code session. The project summary tells you:

- **What project you are working on** (name, client, engagement type)
- **Where the project is** (current phase, status, timeline)
- **How big it is** (epics, stories, team size)
- **What is unresolved** (open questions that may affect your work)
- **How much org metadata is tracked** (components available for querying)

Use this to orient yourself before fetching context for a specific story.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Invalid or missing API key | Check `SFAI_API_KEY` is set and valid |
| 404 | Project not found | The API key may be associated with a deleted project |
| 429 | Rate limited | Wait and retry (limit: 60 req/min) |
