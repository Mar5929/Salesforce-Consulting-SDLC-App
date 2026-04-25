# UI Primitives

Source of truth: `visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/components.jsx`.
Implementation: `web/components/primitives/`.

## Avatar

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | string | required | Used to derive initials if `initials` absent |
| `initials` | string | from `name` | 2-letter code |
| `colorKey` | AvatarKey | required | Maps to `--color-a-*` tokens |
| `size` | "xs" \| "sm" \| "md" | "md" | xs=18px, sm=22px, md=28px |

## Chip

Variants: `gray`, `slate`, `blue`, `indigo`, `violet`, `pink`, `rose`, `red`,
`orange`, `amber`, `yellow`, `lime`, `green`, `teal`, `sky`, `cyan`, `outline`.
Size: 11px, padding 2px 7px, radius 4px.

## StatusChip

Maps `WIStatus` → tone:
- `draft` → gray; `ready` → blue; `sprint` → violet; `progress` → amber;
- `review` → orange; `qa` → pink; `done` → green; `blocked` → red.

Also supports question states (`open`/`answered`/`parked`).

## Readiness

Bar (60×6px) + percentage. Color thresholds:
- ≥80 green, ≥60 yellow, <60 red.

## Icon

26 named SVGs ported verbatim from `components.jsx`. No external icon library.

Names: `home`, `discovery`, `questions`, `work`, `knowledge`, `org`, `chat`,
`documents`, `dashboard`, `settings`, `chevron-right`, `chevron-down`,
`search`, `bell`, `user`, `plus`, `more`, `check`, `x`, `arrow-right`,
`filter`, `info`, `warning`, `sparkle`, `link`, `menu`.

## Drawer

Right-slide. Widths: `sm` (640px), `md` (900px), `lg` (1080px). Backdrop
opacity 0.35. Closes on Esc + backdrop click. `box-shadow: -10px 0 30px
rgba(15,23,42,0.08)`.

Slots: `head`, `body` (scroll), `foot` (sticky bottom).

## Card variants

- `.card` — generic surface, 8px radius, 1px border `#e2e8f0`, padding
  14×16.
- `.kpi` — KPI tile, label uppercase 10.5px, value 22px.
- `.ai-card` — gradient bg `#fafaff → #f5f3ff`, violet border, 10px radius.
- `.q-card` — question card.

## Button variants

| Variant | bg | text | border |
|---|---|---|---|
| default | white | #334155 | #e2e8f0 |
| `primary` | `--color-indigo` | white | matches bg |
| `ghost` | transparent | #334155 | transparent |
| `danger` | white | #b91c1c | #fca5a5 |
| `amber` | `--color-yellow-dot` | white | matches bg |

Modifier: `sm` (3px×9px padding, 11.5px font).

## Table

Header: sticky top, `#f8fafc` bg, uppercase 11px, 0.04em tracking,
`#64748b` color. Rows: 9×10 padding, hover `#f8fafc`, selected `#eef2ff`.
Mono `id` cells. `muted` cells `#94a3b8`.

## Drawers (feature-level)

- `WorkItemDrawer` (1080px, see `wi-*` styles in `styles.css`)
- `QuestionDrawer` (640px)
- `ReproposalDrawer` (900px)
- `ReadinessDrawer` (640px)
