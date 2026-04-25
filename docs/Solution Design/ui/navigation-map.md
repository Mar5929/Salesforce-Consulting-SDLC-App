# Navigation Map

Routes live under `web/app/(app)/`. Top-level tabs match `data.tabs`.

## Top-level tabs

| Tab | Route | Shortcut | Source |
|---|---|---|---|
| Home | `/home` | h | `home.jsx` |
| Discovery | `/discovery` | d | `tabs.jsx` |
| Questions | `/questions` (count: 4) | q | `tabs.jsx` |
| Work | `/work` (default → `/work/home`) | w | `work.jsx` |
| Knowledge | `/knowledge` | k | `tabs.jsx` |
| Org | `/org` | o | `tabs.jsx` |
| Chat | `/chat` | c | `chat.jsx` |
| Documents | `/documents` (placeholder) | m | — |
| Dashboards | `/dashboards` (default → `/dashboards/pm`) | b | `dashboards.jsx` |
| Settings | `/settings` (default → `/settings/project`) | s | `settings.jsx` |

## Work subnav

| Item | Route | Source |
|---|---|---|
| Home | `/work/home` | WorkHome |
| Admin Tasks | `/work/admin` | AdminTasks |
| Roadmap | `/work/roadmap` | Roadmap |
| Items | `/work/items` (default → `/work/items/tree`) | TreeLens / BoardLens / TimelineLens |
| Sprints | `/work/sprints` | Sprints |

### Items lens switcher

- `/work/items/tree`
- `/work/items/board`
- `/work/items/timeline`

## Dashboards subnav

| Item | Route |
|---|---|
| PM | `/dashboards/pm` |
| Sprint | `/dashboards/sprint` |
| Roadmap | `/dashboards/roadmap` |
| QA | `/dashboards/qa` |
| Usage | `/dashboards/usage` |
| Health | `/dashboards/health` |

## Settings subnav

Project group:
- `/settings/project`
- `/settings/team`
- `/settings/salesforce`
- `/settings/jira`
- `/settings/ai`
- `/settings/health`
- `/settings/notifications`
- `/settings/guardrails`

Firm group:
- `/settings/branding`
- `/settings/naming`
- `/settings/security`
- `/settings/billing`

## Drawers

Drawers overlay any route via React Context (`DrawerProvider`).
Triggers: clicking a work item, question card, reproposal banner, or
readiness bar.

| Drawer | Trigger | Width |
|---|---|---|
| WorkItemDrawer | Click work item row/card | 1080px |
| QuestionDrawer | Click question card | 640px |
| ReproposalDrawer | Click reproposal banner | 900px |
| ReadinessDrawer | Click readiness bar | 640px |
