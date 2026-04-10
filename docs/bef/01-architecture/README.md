# Architecture Documentation

This project uses a consolidated architecture document rather than the four separate BEF files.

## File Map

| BEF Standard File | Where It Lives |
|---|---|
| DATA_MODEL.md | `TECHNICAL_SPEC.md` — Section 2: Database Schema |
| SYSTEM_ARCHITECTURE.md | `TECHNICAL_SPEC.md` — Section 3: AI Agent Harness + Section 4: Context Window Budget + Section 5: Dashboard Architecture |
| INTEGRATION_MAP.md | `TECHNICAL_SPEC.md` — Section 6: Brownfield Org Ingestion + Section 7: Background Job Infrastructure |
| TECH_STACK.md | `CLAUDE.md` — Technology Stack section (with full version table and compatibility matrix) |

## Why Consolidated

The project's architecture was documented before BEF adoption. TECHNICAL_SPEC.md (2,590 lines) covers data model, system architecture, and integrations comprehensively. Splitting it would be busy work with no execution benefit. CLAUDE.md's tech stack section includes version numbers, rationale, alternatives considered, and a compatibility matrix — more thorough than a standalone TECH_STACK.md would be.

## Source of Truth

- **Schema and data model:** `TECHNICAL_SPEC.md`
- **AI harness architecture:** `TECHNICAL_SPEC.md`
- **Tech stack versions:** `CLAUDE.md`
- **Business requirements:** `../00-prd/PRD.md`
