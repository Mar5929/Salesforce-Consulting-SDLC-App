# Org Metadata Query

Query Salesforce org metadata to understand existing customizations when implementing stories. Filter by component type or domain grouping. Results are paginated.

## Prerequisites

Set the following environment variables:

```bash
export SFAI_API_KEY="sfai_..."    # Generated from project Settings > Developer API
export SFAI_BASE_URL="https://your-app.vercel.app"  # Your deployment URL
```

## Endpoint

```
GET /api/v1/org/components
```

**Rate limit:** 60 requests per minute

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | (all) | Filter by component type |
| `domain` | string | (all) | Filter by domain grouping ID |
| `page` | number | 1 | Page number (1-based) |
| `pageSize` | number | 50 | Results per page (max: 100) |

### Valid Component Types

`OBJECT`, `FIELD`, `APEX_CLASS`, `APEX_TRIGGER`, `LWC`, `FLOW`, `PERMISSION_SET`, `PROFILE`, `OTHER`

## Usage

```bash
# List all components (first page)
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/org/components"

# List all custom objects
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/org/components?type=OBJECT"

# List all Apex classes in a specific domain
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/org/components?type=APEX_CLASS&domain=DOMAIN_ID"

# Paginate through results
curl -s -H "x-api-key: $SFAI_API_KEY" \
  "$SFAI_BASE_URL/api/v1/org/components?page=2&pageSize=50"
```

## Response Shape

```json
{
  "data": [
    {
      "id": "string",
      "apiName": "string",
      "label": "string | null",
      "componentType": "OBJECT | FIELD | APEX_CLASS | APEX_TRIGGER | LWC | FLOW | PERMISSION_SET | PROFILE | OTHER",
      "domainGroupingId": "string | null",
      "componentStatus": "ACTIVE | DEPRECATED | UNKNOWN",
      "isActive": true,
      "parentComponent": {
        "apiName": "string",
        "componentType": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 142,
    "totalPages": 3
  }
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `data[].apiName` | Salesforce API name of the component (e.g., `Account`, `OpportunityTrigger`) |
| `data[].label` | Human-readable label |
| `data[].componentType` | Type classification of the metadata component |
| `data[].domainGroupingId` | Domain grouping this component belongs to (AI-classified) |
| `data[].componentStatus` | Whether the component is actively used |
| `data[].isActive` | Whether the component is active in the org |
| `data[].parentComponent` | Parent component reference (e.g., the object a field belongs to) |
| `pagination.page` | Current page number |
| `pagination.pageSize` | Number of results per page |
| `pagination.total` | Total number of matching components |
| `pagination.totalPages` | Total number of pages |

## When to Use

When you need to understand the existing Salesforce org structure:

- **Before creating new components:** Check if similar objects, classes, or flows already exist
- **When implementing a story:** Understand what automations are in place for the objects you are modifying
- **During code review:** Verify the current state of a component in the org
- **For domain exploration:** Browse all components in a domain grouping to understand functional areas

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Invalid or missing API key | Check `SFAI_API_KEY` is set and valid |
| 429 | Rate limited | Wait and retry (limit: 60 req/min) |
