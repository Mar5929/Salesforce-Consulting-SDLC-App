# §7.3 Admin Tasks

> **Parent:** `PRODUCT_SPEC.md` §7.
> **Status:** In Progress (2026-04-17). This draft captures decisions from the §7 review session. Open items at the bottom flag what still needs review.

Admin Tasks are project-level to-dos that do not belong to any phase or epic. They capture the real, recurring operational work that sits around a consulting engagement but is not part of delivering scope.

## Examples

- "Set up Jane Smith's sandbox user"
- "Schedule Discovery workshop #3 with the client"
- "Grant Tom access to Gong"
- "Send UAT kickoff email"
- "Confirm go-live date with the client"

## Separate entity, not a work-item subtype

Admin Tasks are a separate entity type, not a subtype of Work Item. The decision rationale:

- They share nothing of substance with user stories (no persona, no acceptance criteria, no story points, no test cases, no impacted components).
- They do not enter sprints and do not count against sprint capacity.
- Their lifecycle is simpler: they are either open or done (plus canceled, per the CRUD-minus-delete guardrail in §19).
- They are not subject to the same Ready-validation gate that work items are.

## Differences from work items at a glance

| | Work Item | Admin Task |
|---|---|---|
| Parent | Epic or Feature (within a Phase) | Project |
| Persona | Required for user story type | Not used |
| Acceptance criteria | Required | Not used |
| Story points | Required for Ready | Not used |
| Test cases | Required for Ready | Not used |
| Impacted Salesforce components | Required for Ready | Not used |
| Lifecycle states | Full (Draft → Ready → Sprint Planned → In Progress → In Review → QA → Done) | Simple (Open → Done, plus Canceled) |
| Sprint eligibility | Yes | No |
| Counted against sprint capacity | Yes (story points) | No |
| CRUD-minus-delete (§19) | Yes, via Cancel/Supersede | Yes, via Cancel |

## Minimum fields

- **Title** (required)
- **Owner** (required): a team member
- **Due date** (optional but strongly recommended)
- **Status**: Open, In Progress, Done, Canceled
- **Description** (optional): free text

## Where they appear

- **Work tab Home** surfaces upcoming admin tasks due within a configurable window (default: next 7 days), plus anything overdue.
- **Admin Tasks sub-section** is the dedicated list view with filters (owner, status, due date, date range).
- **Dashboards** (§12) roll up open vs. closed admin task counts.
- They do not appear inside the Work Items hierarchy, Board, or Timeline views. Those lenses are for delivery scope only.

## Creation

Admin tasks can be created by any team member:

- Directly from the Admin Tasks sub-section ("New admin task").
- From a chat session ("remind me to grant Tom access to Gong" creates a proposed admin task for review).
- Via AI extraction during transcript processing (per §5.2) when content suggests operational work ("Jane still needs access to the sandbox").

## Open items

- **Additional fields** beyond the minimum: priority (low/med/high)? category (access, scheduling, logistics, other)? recurring pattern (weekly, monthly)?
- **Client Jira sync.** Whether admin tasks can be pushed to a client Jira via §20, or are application-only.
- **Reminders.** Whether the application surfaces reminders for upcoming admin tasks (in-app notification, email digest, neither).
- **Assignment to non-team members.** Can an admin task be assigned to someone outside the project team (e.g., a firm admin)? Proposed: yes, any firm user.
