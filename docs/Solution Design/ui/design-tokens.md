# UI Design Tokens

Source of truth: `visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/styles.css`
(1361 lines). All values below are ported verbatim into
`web/app/globals.css` under the Tailwind v4 `@theme` directive.

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | Inter, -apple-system, "Segoe UI", sans-serif | body |
| `--font-mono` | JetBrains Mono, ui-monospace, monospace | IDs, codes |
| `--text-2xs` | 9.5px | tiny tags |
| `--text-xs` | 10.5px | labels, badges |
| `--text-sm` | 11.5px | meta |
| `--text-base` | 12.5px | body |
| `--text-md` | 13px | strong body |
| `--text-md2` | 13.5px | prose |
| `--text-lg` | 18px | section heads |
| `--text-xl` | 22px | KPI values, drawer titles |

Letter spacing on uppercase labels: 0.04em–0.06em. Line height in prose:
1.45–1.65. Tracking on titles: -0.01em to -0.02em.

## Color — surface / structure

| Token | Hex | Usage |
|---|---|---|
| `--color-canvas` | #f8fafc | body bg |
| `--color-surface` | #ffffff | cards |
| `--color-rail` | #0f172a | sidebar bg |
| `--color-rail-border` | #1e293b | sidebar borders |
| `--color-rail-text` | #cbd5e1 | sidebar text |
| `--color-rail-text-active` | #f1f5f9 | sidebar active text |
| `--color-rail-active` | #1e293b | sidebar active bg |
| `--color-border` | #e2e8f0 | card borders |
| `--color-border-hover` | #cbd5e1 | card hover border |
| `--color-row-hover` | #f8fafc | table row hover |
| `--color-stripe` | #f1f5f9 | toolbar bg / pills |
| `--color-ink` | #0f172a | primary text |
| `--color-ink-2` | #334155 | secondary text |
| `--color-ink-3` | #475569 | muted text |
| `--color-muted` | #64748b | meta text |
| `--color-muted-2` | #94a3b8 | placeholder |

## Color — brand / accent

| Token | Hex | Usage |
|---|---|---|
| `--color-indigo` | #4f46e5 | primary CTA, active tab, sparkline |
| `--color-indigo-2` | #4338ca | primary CTA hover |
| `--color-indigo-bg` | #eef2ff | active count pill, indigo soft bg |
| `--color-indigo-bg-2` | #e0e7ff | violet-tint chip bg |
| `--color-indigo-text` | #3730a3 | violet-tint chip text |
| `--color-violet-bg` | #ede9fe | sprint pill bg |
| `--color-violet-text-2` | #6d28d9 | AI head text |
| `--color-violet-border` | #ddd6fe | AI card border |
| `--color-violet-grad-start` | #fafaff | AI card grad start |
| `--color-violet-grad-end` | #f5f3ff | AI card grad end |
| `--color-logo-grad-start` | #6366f1 | logo gradient |
| `--color-logo-grad-end` | #a855f7 | logo gradient |

## Color — semantic / health

| Token | Hex | Usage |
|---|---|---|
| `--color-green-bg` | #dcfce7 | green chip bg |
| `--color-green-text` | #166534 | green chip text |
| `--color-green-dot` | #16a34a | green dot |
| `--color-yellow-bg` | #fef3c7 | yellow chip bg |
| `--color-yellow-text` | #78350f | yellow chip text |
| `--color-yellow-dot` | #f59e0b | yellow dot |
| `--color-red-bg` | #fee2e2 | red chip bg |
| `--color-red-text` | #b91c1c | red chip text |
| `--color-red-dot` | #ef4444 | red dot, notification badge |
| `--color-amber-grad-1` | #fffbeb | reproposal banner grad start |
| `--color-amber-grad-2` | #fef3c7 | reproposal banner grad end |
| `--color-amber-border` | #fcd34d | reproposal border |

Plus blue/sky/cyan/teal/pink/rose/orange/lime chip variants — see
`globals.css`.

## Color — avatar palette

| Token | Hex | Person |
|---|---|---|
| `--color-a-sarah` | #db2777 | Sarah Chen |
| `--color-a-david` | #0ea5e9 | David Kim |
| `--color-a-jamie` | #16a34a | Jamie Rodriguez |
| `--color-a-priya` | #9333ea | Priya Patel |
| `--color-a-marcus` | #ea580c | Marcus Thompson |
| `--color-a-michael` | #475569 | Michael Rihm |
| `--color-a-client` | #334155 | Client placeholder |

## Layout widths

| Token | Value | Usage |
|---|---|---|
| `--spacing-rail` | 240px | left sidebar |
| `--spacing-topbar` | 44px | top bar height |
| `--spacing-drawer-sm` | 640px | default drawer width |
| `--spacing-drawer-md` | 900px | wide drawer (Question, Reproposal) |
| `--spacing-drawer-lg` | 1080px | extra-wide drawer (WorkItem) |

## Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 3px | kbd, tiny pill |
| `--radius-sm` | 4px | chip, small button |
| `--radius-md` | 5px | seg-btn |
| `--radius-lg` | 6px | button, search, kanban card |
| `--radius-card` | 8px | card, drawer foot section |
| `--radius-xl` | 10px | AI card |
| `--radius-2xl` | 12px | tweaks panel |
| `--radius-pill` | 20px | health pill, viewing-as |

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | 0 1px 2px rgba(15,23,42,0.03) | kanban card |
| `--shadow-card-hover` | 0 1px 3px rgba(15,23,42,0.04) | graph node |
| `--shadow-menu` | 0 8px 20px rgba(15,23,42,0.12) | dropdown menu |
| `--shadow-modal` | 0 10px 30px rgba(15,23,42,0.12) | tweaks panel |
| `--shadow-drawer` | -10px 0 30px rgba(15,23,42,0.08) | right drawer |
| `--shadow-tab` | 0 1px 2px rgba(0,0,0,0.05) | seg-btn active |
| `--shadow-segbtn` | 0 1px 2px rgba(0,0,0,0.06) | sub-nav active |

## Spacing scale (px)

6, 8, 10, 12, 14, 16, 18, 20, 22 — matches Tailwind's default 1.5/2/2.5/3/3.5/4/4.5/5/5.5 (×4) scale.
