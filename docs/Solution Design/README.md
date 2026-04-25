# Solution Design

Durable home for design and architecture content that informs code but doesn't
belong in `docs/Requirements/MVP Requirements/PRODUCT_SPEC.md` (which stays
functional-only by rule).

## Contents

- `ui/design-tokens.md` — colors, type scale, spacing, radii, shadows ported
  from `visuals/claude-design-exports/.../project/styles.css`.
- `ui/components.md` — primitives reference (props, variants, states).
- `ui/navigation-map.md` — top-level tabs, subnav per tab, every route under
  `web/app/(app)/`.
- `ui/data-model.md` — frontend mock entities derived from `data.js`. **This
  is the frontend mock model, not the eventual backend schema.**
- `ui/handoff-notes.md` — verbatim directives from the Claude Design
  handoff README.
- `ui-build-v1-bugs.md` — bug list from the Wave 3 visual QA pass (created
  after Wave 3 runs).

## What goes here

- UI design tokens, primitives, navigation map
- Frontend data model
- Architecture diagrams (when added)
- Build sequence / Wave plans
- Visual QA bug lists

## What does NOT go here

- Functional requirements — those stay in `docs/Requirements/MVP Requirements/`.
- API contracts — those will live alongside the eventual backend code.
- User-facing copy — those live in the source files.
