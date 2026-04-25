# Design: PRD v3 Merge

**Date:** 2026-04-16
**Status:** Draft, awaiting user review

## Goal

Merge `docs/Requirements/PRD.md` (v2, 1,407 lines) and `docs/Requirements/PRD-ADDENDUM-v1-Intelligence-Layer.md` (717 lines) into a single, clean `docs/Requirements/PRD-v3.md`. The original PRD was written first, then extensively refactored in the addendum. The addendum is the authoritative source for the two areas it covers (AI Agent Harness, Org Metadata Intelligence Layer) and several cross-cutting concerns (pgvector, eval harness, model routing). The goal is one coherent, robust, production-grade PRD for the Salesforce Consulting SDLC App, not a two-doc package.

## Non-Goals

- Preserving the existing 27-section structure of PRD v2.
- Preserving external references from `REQUIREMENT_INDEX.md` or `Findings-HolesandQuestionableChoices.md` (user explicitly deferred these).
- Updating cross-doc links.
- Deleting or archiving PRD.md or the addendum (user chose to leave them in place).
- Changing any requirement, decision, entity, or rule on substance. This is a structural and editorial merge, not a product decision.

## Decisions (confirmed with user)

1. **Shape:** full restructure. Treat the result as PRD v3 and do not preserve the 27-section outline of v2.
2. **Rewriting latitude:** conservative on substance, editorial on voice. Every requirement and locked decision survives verbatim in meaning. Prose is freely rewritten for consistent voice and to eliminate redundancy.
3. **Output file:** new file `docs/Requirements/PRD-v3.md`. PRD.md and the addendum stay in place.
4. **Remove the section symbol (U+00A7) everywhere.** The source documents use it in many cross-references. In v3, it is gone. References use the word "Section" or restructure around the reference entirely.
5. **No changelog at the top of v3.** Clean slate. Git history plus the retained v2 and addendum files are the history.
6. **Version header:** "Version 3.0, April 16, 2026".
7. **Table of contents:** keep. The document will be approximately 1,500 lines.

## Target Outline

Six thematic parts, 28 sections. The bracketed notes identify the source content in v2 (original PRD) and the addendum.

```
Part I. Product
  1. Executive Summary                    [v2 Sec. 1]
  2. Problem Statement                    [v2 Sec. 2]
  3. Vision, Scope, and Non-Goals         [v2 Sec. 3 + v2 Sec. 24 merged]
  4. Target Users and Personas            [v2 Sec. 4]

Part II. Architecture
  5. System Architecture                  [v2 Sec. 5.1 + high-level tech
                                           stack summary from v2 Sec. 25,
                                           folded in as a subsection]
  6. Data Model                           [v2 Sec. 5.2 + addendum Sec. 7]
  7. API Design                           [v2 Sec. 5.3]
  8. AI Intelligence Layer                [NEW. Replaces v2 Sec. 6 entirely.
                                           Contents: the four pipelines
                                           (Transcript Processing, Answer
                                           Logging, Story Generation,
                                           Briefing/Status), the freeform
                                           agent ("project brain chat"), the
                                           hybrid retrieval primitive,
                                           model routing, the eval harness,
                                           and Managed Agents scope.
                                           Source: addendum Sec. 5, plus
                                           addendum Sec. 4.8 Managed Agents
                                           and Sec. 5.6 evals.]
  9. Org Metadata Intelligence Layer      [NEW. Replaces v2 Sec. 13.4.
                                           Contents: the five-layer model
                                           (component graph, semantic
                                           embeddings, business domains,
                                           business context annotations,
                                           query and retrieval interface),
                                           freshness and change propagation
                                           rules, edge cases and non-goals.
                                           Source: addendum Sec. 4.]

Part III. Product Workflows
 10. Project Lifecycle                    [v2 Sec. 7]
 11. Discovery Workflow                   [v2 Sec. 8]
 12. Question System                      [v2 Sec. 9]
 13. Epics, Features, and User Stories    [v2 Sec. 10]
 14. Sprint Intelligence                  [v2 Sec. 11]
 15. Developer Execution and the AI
     Architect                            [v2 Sec. 12. Context package API
                                           now described using the pipeline
                                           from addendum Sec. 4.6.]
 16. QA Workflow                          [v2 Sec. 18]
 17. Document Generation and Branding     [v2 Sec. 16]
 18. Dashboards and Reporting             [v2 Sec. 17]

Part IV. Salesforce Integration
 19. Org Connectivity and Sync            [v2 Sec. 13.1, 13.2, 13.3, 13.5,
                                           and 13.6. Everything from v2
                                           Sec. 13 except the old Sec. 13.4
                                           KB structure, which is now
                                           Section 9.]
 20. Sandbox Strategy                     [v2 Sec. 14]
 21. Salesforce Development Guardrails    [v2 Sec. 15]

Part V. Operations and Governance
 22. Multi-User Concurrency and RBAC      [v2 Sec. 19]
 23. Client Jira Sync (Optional)          [v2 Sec. 20]
 24. Project Archival                     [v2 Sec. 21]
 25. Security, Compliance, and Data
     Handling                             [v2 Sec. 22, plus addendum
                                           Sec. 3.2 embeddings-provider
                                           exception, added inline.]
 26. Consultant Licensing and Cost
     Management                           [v2 Sec. 23]

Part VI. Delivery
 27. Build Sequence                       [v2 Sec. 26 + addendum Sec. 6.
                                           Tech stack amendments from
                                           addendum Sec. 3 (pgvector,
                                           embedding provider, background
                                           job runner) surface in Section 5
                                           System Architecture.]
 28. Open Questions                       [v2 Sec. 27 + addendum Sec. 8,
                                           filtered to remove items
                                           resolved by the merged content.]
```

## Content Mapping Rules

These rules govern what gets pulled from each source into each v3 section. They are the merge contract.

### What survives verbatim in meaning

- Every requirement, entity, field definition, enum, stage description, model assignment, sync rule, edge case, and locked decision from both source documents.
- The addendum's data model additions in Sec. 7 become concrete entities in Section 6.
- The addendum's five-layer model (Sec. 4, including Sec. 4.7 freshness rules, Sec. 4.8 Managed Agents scope, and Sec. 4.9 non-goals) becomes Section 9.
- The addendum's four pipelines (Sec. 5.2.1 through 5.2.4), freeform agent (Sec. 5.3), hybrid retrieval primitive (Sec. 5.4), model routing policy (Sec. 5.5), and eval harness (Sec. 5.6) become Section 8.
- v2's Sec. 15 six Salesforce development guardrails stay identical in Section 21.
- v2's Sec. 22.3 AI provider data handling is restated in Section 25, with the addendum's embeddings-provider exception added inline, not as a patch.

### What dissolves entirely

- Addendum Sec. 0 (Purpose). Scaffolding.
- Addendum Sec. 1 (Cross-Reference table). Scaffolding.
- Addendum Sec. 2 (Newly Locked Decisions summary). Each locked decision becomes a requirement in the appropriate v3 section. No summary list.
- Addendum Sec. 9 (Refactoring Guidance for WIP). Not relevant. Implementation has been reset per project memory.
- Addendum Sec. 10 (What This Addendum Does Not Change). Scaffolding.
- All "supersedes, amends, unchanged externally" meta-language. Requirements read as requirements, not as deltas.
- v2 Sec. 6 (AI Agent Harness) in its current generic-harness form. Replaced wholesale by Section 8's pipeline-first architecture.
- v2 Sec. 13.4 (Org Knowledge Base Structure) in its current form. Replaced wholesale by Section 9's five-layer model.
- Any redundancy where v2 and the addendum said the same thing in different voices. Example: the context package API described at a high level in v2 Sec. 12.2 and in detail in addendum Sec. 4.6. Kept once, in the more detailed form.

### What gets restructured but not rewritten

- v2 Sec. 5 is split: Sec. 5.1 becomes Section 5, Sec. 5.2 becomes Section 6, Sec. 5.3 becomes Section 7.
- v2 Sec. 13 is split: Sec. 13.4 content becomes Section 9, everything else becomes Section 19.
- v2 Sec. 24 (What This Product Is Not) merges into Section 3, Vision, Scope, and Non-Goals.
- v2 Sec. 25 (Technology Stack) is folded into Section 5, System Architecture, as a subsection, not its own top-level section. Rationale: the list is short and belongs with system architecture.

### Voice harmonization

- Addendum voice is more prescriptive ("non-negotiable", "explicitly rejected", "no exceptions"). v2 voice is more descriptive. Target voice: prescriptive where a decision has been locked, descriptive where behavior is being specified.
- Short, direct sentences. Active voice. Tables over prose where the data is tabular. Numbers over vague estimates. No hedging.
- Phrases on the user's forbidden-phrase list are removed throughout. No em dashes. No "leverage", "utilize", "delve into", "it's worth noting", and the full list in `~/.claude/rules/writing-style.md`.
- No section symbol anywhere in the output document.

## Deliverables

1. `docs/Requirements/PRD-v3.md`. The merged document. Target length around 1,500 lines. Structure: 6 parts, 28 sections, table of contents at top.
2. Git commit containing the design spec and, in a later commit after the implementation plan is approved and executed, the merged PRD.

## Acceptance Criteria

The merged PRD v3 passes when all of the following hold:

1. Every entity, enum, field, stage, rule, and locked decision from the addendum is present in the corresponding v3 section.
2. Every requirement from v2 is present in a v3 section, except those wholly replaced by addendum content (v2 Sec. 6 and v2 Sec. 13.4).
3. No occurrence of the section symbol (U+00A7) anywhere in the document.
4. No occurrence of phrases on the user's forbidden-phrase list as defined in `~/.claude/rules/writing-style.md`.
5. No occurrences of "supersedes", "amends", "unchanged externally", or similar bridging meta-language.
6. The 28 sections appear in the order listed above, grouped under the six parts.
7. A working table of contents at the top of the document.
8. Version header reads "Version 3.0, April 16, 2026".
9. Spot check: 10 randomly chosen locked decisions from the addendum Sec. 2 summary can each be located as a requirement somewhere in v3.
10. Spot check: 10 randomly chosen requirements from v2 (excluding v2 Sec. 6 and v2 Sec. 13.4) can each be located in v3.

## Risks

1. **Content loss.** Collapsing 2,124 lines into around 1,500 means redundancy is being removed. An aggressive merge could drop a subtle requirement. Mitigation: the acceptance criteria above require spot checks against both source documents, and the merge rules enumerate what survives verbatim and what dissolves.
2. **Voice drift.** Harmonizing two voices can accidentally shift tone from spec to narrative. Mitigation: target voice is defined above. The prescriptive-for-decisions and descriptive-for-behavior rule is the guardrail.
3. **Large sections.** Sections 8 and 9 absorb most of the addendum and will be long. Risk that they become unwieldy. Mitigation: both use clear subsection hierarchy (four pipelines as four subsections; five layers as five subsections), matching how the addendum already structured them.
4. **Interleaving within sections.** Section 6 (Data Model) pulls entities from v2 Sec. 5.2 and addendum Sec. 7. The merged list must be coherent, not concatenated. Mitigation: entities are grouped by domain (project entities, knowledge-base entities, AI and retrieval infrastructure, eval infrastructure), not by source document.

## Out of Scope for This Spec

- Updating `REQUIREMENT_INDEX.md` or `Findings-HolesandQuestionableChoices.md`.
- Deleting or archiving PRD.md or the addendum.
- Updating any other project file that references the PRD.
- Changes to `PROJECT_STATE.md`.
- The implementation plan itself. That is produced next by the writing-plans skill.
