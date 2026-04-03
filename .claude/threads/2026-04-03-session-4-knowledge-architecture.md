# Session 4: Knowledge Architecture Gap Analysis

**Date:** 2026-04-03
**Status:** In progress (paused mid-interview)
**Context:** Before starting Phase 1 construction, we paused to poke holes in the PRD, specifically around the knowledge base architecture.

---

## What We Set Out To Do

Continue refining the PRD before building. The user identified that the knowledge base / knowledge graph architecture was underspecified: specifically, how the AI stores and builds understanding of an org's technical components married to business context (e.g., multiple technical components together = "Account Onboarding Process").

---

## Gap Identified: No Business Process Entity

The PRD has three concepts that touch "business meaning of technical components":
1. **DomainGrouping** (flat labels: Sales, Finance, Marketing)
2. **BusinessContextAnnotation** (free-text notes on individual components)
3. **StoryComponent** join table (which stories touch which components)

**Missing:** There is no entity representing a **business process** composed of multiple technical components working together. "Account Onboarding" might involve an Account trigger, a Flow, a custom object, three fields, and a permission set all working in concert. The only way to express this today is human annotations on individual components, one at a time.

**Decision:** Add a first-class `BusinessProcess` entity. User confirmed this direction.

---

## Core Architecture Discussion: How Does the AI Retain Understanding?

The user asked: what's the right architecture for the AI to progressively build and retain knowledge about an org? Is it a knowledge graph? Something else?

### Options Explored

**Option 1: Knowledge Graph (Neo4j or similar)**
- Nodes for components, processes, concepts. Typed edges connecting them.
- Pros: powerful traversals, explicit relationship modeling.
- Cons: new infrastructure, complexity, query debugging harder, build time for solo developer.
- Assessment: Solves a scale problem (millions of nodes) that this product doesn't have in V1. Overkill.

**Option 2: Enhanced Relational + Embeddings (pgvector)**
- Stay in Postgres. Add richer relationship tables + vector embeddings for semantic search.
- Pros: simple stack, Prisma-compatible, incremental.
- Cons: AI re-discovers relationships every session. Embeddings find similar things, not connected things.
- Assessment: Not sufficient on its own. Doesn't solve the "AI forgets what it learned" problem.

**Option 3: AI-Curated Knowledge Layer (Knowledge Articles)**
- The AI writes structured summaries of what it's learned. These persist as database entities and become first-class context for future sessions.
- Pros: uses Claude's synthesis strength, token-efficient (pre-computed summaries vs. raw rows), no new infrastructure.
- Cons: AI cost per interaction, staleness risk, quality depends on AI.
- Assessment: Solves the right problem (AI retention) but the user pushed back that relationship structure also matters for queryability.

### Agreed Architecture: Two-Layer Design

**Layer 1: Structured Relationships (queryable, in Postgres)**

New entities to add to the spec:
- **BusinessProcess**: name, description, domain, status. Represents a logical business capability ("Account Onboarding", "Renewal Pipeline").
- **BusinessProcessComponent**: join table linking BusinessProcess to OrgComponent, with a `role` field describing the component's function in the process.
- **BusinessProcessDependency**: process-to-process relationships.

Purpose: queryable structure for dashboards, sprint intelligence, impact analysis. "This story modifies a component that participates in 3 business processes" is a SQL JOIN.

**Layer 2: AI-Curated Knowledge Articles (synthesized understanding, in Postgres)**

New entity:
- **KnowledgeArticle**: AI-maintained, versioned, natural-language synthesis of understanding about a topic.

Purpose: the AI's persistent memory. Instead of re-deriving understanding from raw rows every session, the AI reads its own previous synthesis and builds on it.

**Layer 1 is the skeleton (structure). Layer 2 is the muscle and memory (understanding).**

---

## Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Business process representation | First-class `BusinessProcess` entity | Current spec has no way to group components into logical business capabilities |
| Knowledge storage technology | Postgres (not graph DB) | V1 scale doesn't need graph traversals; bottleneck is AI context, not query performance |
| Two-layer knowledge architecture | Structured relationships + AI-curated articles | Need both queryable structure AND persistent AI understanding |
| AI write approval model | AI commits directly, humans can correct | Faster knowledge accumulation; mirrors existing DomainGrouping pattern with `isConfirmed` flag |
| Knowledge Article scoping | Flexible topic-based with `articleType` field | Articles need to cover business processes, integrations, cross-cutting concerns, stakeholder context, not just processes |

### Article Types Discussed
- `BUSINESS_PROCESS`: about a specific business process and its components
- `INTEGRATION`: about how systems connect (e.g., Pardot integration)
- `ARCHITECTURE_DECISION`: cross-cutting technical architecture
- `DOMAIN_OVERVIEW`: broad domain area synthesis
- `CROSS_CUTTING_CONCERN`: things like sharing model, data migration strategy
- `STAKEHOLDER_CONTEXT`: institutional knowledge about client teams/constraints

### Article Entity Linking
Articles reference multiple entities (BusinessProcesses, OrgComponents, Epics, Questions, Decisions) via a join table. This is how the system finds relevant articles for a given context: "give me all articles that reference any component this story touches."

---

## Still Open (Where We Left Off)

1. **When does the AI update Knowledge Articles?** Three options were presented but not decided:
   - End of every agent loop (inline): highest freshness, highest token cost
   - Background task on state changes: lower cost, slight staleness
   - Hybrid: quick inline flag + periodic deep refresh

2. **Knowledge Article entity design:** Full field spec not yet written. Need: id, projectId, articleType, title, content, scope references, version, confidence level, staleness flag, AI-authored vs human-edited tracking.

3. **BusinessProcess entity design:** Full field spec not yet written. Need: id, projectId, name, description, domain, status, isAiSuggested, isConfirmed, plus join tables.

4. **How articles feed into context packages:** The context assembly layer (Layer 3 of agent harness) needs new query functions to load relevant articles. Design not specified yet.

5. **Brownfield org ingestion changes:** The AI's org analysis output should now produce both BusinessProcess entities (Layer 1) and KnowledgeArticle entities (Layer 2), not just OrgComponent rows and DomainGroupings.

6. **Other PRD gaps not yet explored:** We only covered the knowledge architecture gap. The user originally wanted a broader review of team member workflows, other missing pieces, etc. That hasn't happened yet.

---

## How To Continue Next Session

1. Resolve the open items above (article update triggers, full entity specs).
2. Continue the broader PRD gap analysis beyond knowledge architecture.
3. Once satisfied, update the PRD and tech spec with the new entities and architecture.
4. Then proceed to Phase 1 construction.
