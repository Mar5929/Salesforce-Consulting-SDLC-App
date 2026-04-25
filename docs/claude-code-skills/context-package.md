# Context Package Retrieval

Fetch full context for a story before starting development work. Includes story details, related org components, business processes, relevant knowledge articles, project decisions, and sprint conflict warnings.

## Prerequisites

Set the following environment variables:

```bash
export SFAI_API_KEY="sfai_..."    # Generated from project Settings > Developer API
export SFAI_BASE_URL="https://your-app.vercel.app"  # Your deployment URL
```

## Endpoint

```
GET /api/v1/context-package?storyId={STORY_ID}
```

**Rate limit:** 30 requests per minute

## Usage

```bash
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/context-package?storyId=STORY_ID"
```

Replace `STORY_ID` with the story's unique ID (e.g., `clxyz123abc`).

## Response Shape

```json
{
  "story": {
    "id": "string",
    "displayId": "string",
    "title": "string",
    "description": "string | null",
    "acceptanceCriteria": "string | null",
    "status": "DRAFT | READY | SPRINT_PLANNED | IN_PROGRESS | IN_REVIEW | QA | DONE",
    "priority": "LOW | MEDIUM | HIGH | CRITICAL",
    "storyPoints": "number | null",
    "epicId": "string",
    "featureId": "string | null",
    "storyComponents": [
      {
        "id": "string",
        "orgComponentId": "string | null",
        "componentName": "string",
        "impactType": "CREATE | MODIFY | READ | DELETE"
      }
    ]
  },
  "orgComponents": [
    {
      "id": "string",
      "apiName": "string",
      "componentType": "OBJECT | FIELD | APEX_CLASS | ...",
      "relationships": ["..."]
    }
  ],
  "businessProcesses": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null"
    }
  ],
  "knowledgeArticles": [
    {
      "id": "string",
      "title": "string",
      "summary": "string | null",
      "articleType": "string",
      "confidence": "number"
    }
  ],
  "decisions": [
    {
      "id": "string",
      "title": "string",
      "rationale": "string | null",
      "confidence": "number",
      "decisionDate": "ISO 8601 datetime"
    }
  ],
  "sprintConflicts": [
    {
      "id": "string",
      "displayId": "string",
      "title": "string",
      "status": "string",
      "storyComponents": [
        {
          "componentName": "string",
          "impactType": "CREATE | MODIFY | READ | DELETE"
        }
      ]
    }
  ]
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `story` | The target story with acceptance criteria and linked org components |
| `orgComponents` | Org metadata for components linked to this story (relationships, parent objects) |
| `businessProcesses` | Business processes related to the story's linked components |
| `knowledgeArticles` | Top 10 knowledge articles by usage, providing accumulated project intelligence |
| `decisions` | Project decisions scoped to the story's epic and feature (up to 20) |
| `sprintConflicts` | Other stories in the same sprint that touch the same org components |

## When to Use

Before starting work on any story. The context package provides the business context, related org components, and any sprint conflicts the developer should be aware of. Always fetch context first to understand:

- What the story requires (acceptance criteria)
- What org components already exist and their relationships
- What business processes are affected
- What decisions have been made about the epic/feature
- Whether other developers are working on the same components in this sprint

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Missing `storyId` query parameter | Include `?storyId=` in the URL |
| 401 | Invalid or missing API key | Check `SFAI_API_KEY` is set and valid |
| 404 | Story not found (or not in this project) | Verify the story ID belongs to the API key's project |
| 429 | Rate limited | Wait and retry (limit: 30 req/min) |
