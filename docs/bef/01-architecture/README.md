# Architecture Documentation

This project uses a consolidated architecture document rather than the four separate BEF files.

## File Map

| BEF Standard File | Where It Lives |
|---|---|
| DATA_MODEL.md | `TECHNICAL_SPEC.md`, Section 2: Database Schema (including §2.2A addendum entities: pipeline observability, per-entity embeddings, org knowledge layers) |
| SYSTEM_ARCHITECTURE.md | `TECHNICAL_SPEC.md`, Section 3: Pipelines + Freeform Agent; Section 4: Context Window Budget; Section 5: Dashboard Architecture; Section 10: Model Router; Section 11: Eval Harness |
| INTEGRATION_MAP.md | `TECHNICAL_SPEC.md`, Section 6: Brownfield Org Ingestion (five-layer model); Section 7: Background Job Infrastructure (including pipeline runners and Managed Agents jobs); Section 8: Search Infrastructure (hybrid retrieval primitive) |
| TECH_STACK.md | `CLAUDE.md`, Technology Stack section (with full version table and compatibility matrix) |

New sections introduced by PRD Addendum v1:

- **Section 3** is now structured around four deterministic pipelines plus one freeform agent (supersedes the pre-addendum three-layer generic harness).
- **Section 10: Model Router** specifies intent-based model selection (extract / synthesize / generate_structured / reason_deeply / embed) at `src/lib/ai/model-router.ts`.
- **Section 11: Eval Harness** specifies the `/evals/` layout, `pnpm eval [pipeline]` runner, and CI gate on PRs touching `src/ai/`, `src/pipelines/`, `prompts/`, or `evals/`.

The pre-addendum version of `TECHNICAL_SPEC.md` is available via git history prior to the 2026-04-13 rewrite.

## Why Consolidated

The project's architecture was documented before BEF adoption. TECHNICAL_SPEC.md covers data model, system architecture, and integrations comprehensively. Splitting it would be busy work with no execution benefit. CLAUDE.md's tech stack section includes version numbers, rationale, alternatives considered, and a compatibility matrix: more thorough than a standalone TECH_STACK.md would be.

## Source of Truth

- **Schema and data model:** `TECHNICAL_SPEC.md`
- **AI harness architecture:** `TECHNICAL_SPEC.md`
- **Tech stack versions:** `CLAUDE.md`
- **Business requirements:** `../00-prd/PRD.md`
