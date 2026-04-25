# Frontend Data Model

> **Frontend mock model only.** This is what `web/lib/data.ts` exposes;
> it is **not** the eventual backend schema. Do not propagate any of these
> shapes into a real database design without re-evaluation.

Source files:
- `visuals/.../project/data.js` — original mock data
- `web/lib/types.ts` — typed interfaces
- `web/lib/data.ts` — typed export

## Top-level shape (`AppData`)

| Key | Type | Notes |
|---|---|---|
| `firm` | `Firm` | `{ name }` |
| `project` | `Project` | active project metadata |
| `currentUser` | `CurrentUser` | who's signed in (mock) |
| `team` | `TeamMember[]` | 6 members |
| `stages` | `Stage[]` | 8 lifecycle stages, fixed |
| `tabs` | `TabDef[]` | 10 top-level tabs |
| `projects` | `ProjectListItem[]` | project switcher list |
| `phases` | `Phase[]` | 4 phases (P1–P4) |
| `epics` | `Epic[]` | 7 epics |
| `workItems` | `WorkItem[]` | 12 items |
| `statuses` | `StatusDef[]` | 7 status definitions |
| `sprint` | `Sprint` | current + history |
| `questions` | `Question[]` | 6 questions, 3 states |
| `decisions` | `Decision[]` | 3 decisions |
| `risks` | `Risk[]` | 3 risks |
| `adminTasks` | `AdminTask[]` | 5 tasks |
| `reproposal` | `Reproposal` | pending Phase 3 → CPQ change |
| `components` | `SfComponent[]` | 8 sample SF components |
| `domains` | `Domain[]` | 2 domains |
| `transcriptReview` | `TranscriptReview` | 7 extracted items |
| `notifications` | `number` | bell badge count |
| `currentFocus` | `string` | AI-synthesized narrative |
| `currentFocusTs` | `string` | "generated 4 minutes ago" |
| `recommendedFocus` | `RecommendedFocus[]` | 4-rank focus list |

## Key relationships

```
Project
 └── Phase (P1..P4)
      └── Epic (LM-LC, LM-LA, OPP-MG, ...)
           └── WorkItem (WI-LM-LC-01, ...)
                ├── status: WIStatus
                ├── assignee: TeamMember.id | null
                ├── blocked: Question.id?       (creates blocking edge)
                └── affectedByReprop: bool      (highlighted when reprop pending)
```

## Enum values (verbatim from data.js)

| Enum | Values |
|---|---|
| `Health` | green / yellow / red |
| `Stage` | Initialization, Discovery, Roadmap & Design, Build, Testing, Deployment, Hypercare, Archive |
| `WIStatus` | draft, ready, sprint, progress, review, qa, done, blocked |
| `QuestionState` | open, answered, parked |
| `OwnerType` | client, team |
| `RiskSeverity` | Low, Medium, High |
| `RiskStatus` | Open, Monitoring, Closed |
| `AdminTaskStatus` | Open, In Progress, Done |
| `ReproposalChangeType` | removed, added, renamed, reparented |
| `Confidence` | hi, md, lo |
| `TranscriptItemKind` | question, decision, requirement, risk, scope, annotation, action |

## Role rules (Home widgets)

`currentUser.role` drives which Home widgets surface as "primary":
- **Solution Architect** (Sarah): re-proposal banner, readiness, decisions
- **Developer** (David): sprint commitment, blocked items
- **Project Manager** (Jamie): risks, admin tasks, sprint health
- **Business Analyst** (Priya): open questions she owns
- **QA Engineer** (Marcus): items in QA, test coverage
- **Firm Administrator** (Michael): firm-level overview

Encoded in `home.jsx` — port behavior unchanged.
