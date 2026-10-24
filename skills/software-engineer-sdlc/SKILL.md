---
name: software-engineer-sdlc
description: Software engineering lifecycle skill that starts each programming job or task with a disciplined 8-stage pipeline (Analyse -> Understand -> Plan -> Design -> Build -> Test -> Debug -> Release). Use for all programming, coding, refactoring, and feature implementation tasks.
---

# Software Engineering SDLC Skill (Analyse → Understand → Plan → Design → Build → Test → Debug → Release)

This skill enforces a rigorous, professional Software Development Life Cycle (SDLC) for AI agents tackling any programming job or coding task.

Every engineering task must systematically progress through the 8 stages:
```
[1. Analyse] ➔ [2. Understand] ➔ [3. Plan] ➔ [4. Design] ➔ [5. Build] ➔ [6. Test] ➔ [7. Debug] ➔ [8. Release]
```

---

## The 8-Stage Execution Framework

### Stage 1: Analyse
**Objective:** Deconstruct the incoming task request, scope, and environment.
- **Inspect Inputs:** Read user specifications, issue descriptions, tickets, or user stories.
- **Inspect Environment:** Detect tech stack, language versions, build tools, package managers, and dependencies.
- **Identify Boundaries:** Define in-scope vs out-of-scope functional requirements.
- **Output:** A concise task breakdown and technical boundary assessment.

### Stage 2: Understand
**Objective:** Build deep conceptual understanding of the codebase and domain.
- **Context Discovery:** Read existing code, architectural rules, tests, and configuration files. Do not guess behavior.
- **Data Flow & Dependencies:** Map how data travels through the system and identify upstream/downstream dependencies.
- **Edge Cases & Failure Modes:** Identify potential race conditions, null/empty states, performance bottlenecks, and scale limits.
- **Output:** Documented architectural context, verified assumptions, and identified edge cases.

### Stage 3: Plan
**Objective:** Establish a deterministic implementation plan before touching code.
- **Milestones & Tasks:** Break the work into small, atomic, logically sequenced steps.
- **Test Strategy:** Decide what tests need to be added or modified (unit, integration, e2e).
- **Risk Mitigation:** Anticipate breaking changes, backward compatibility needs, and rollback strategies.
- **Output:** Actionable checklist of implementation steps.

### Stage 4: Design
**Objective:** Architect the solution, interfaces, and data models before building.
- **Module Architecture:** Define component boundaries, class structures, function signatures, and types.
- **Interface Contracts:** Specify API schemas, database migrations, and public interfaces.
- **Software Patterns:** Apply clean architecture, SOLID principles, and appropriate design patterns.
- **Security & Reliability:** Review inputs against validation rules, sanitization, and error-handling requirements.
- **Output:** Concrete design specification and interface definitions.

### Stage 5: Build
**Objective:** Implement the code following the design plan.
- **Idiomatic Code:** Write clean, readable, self-documenting code following project-established conventions.
- **Type Safety:** Ensure strong typing; avoid unvalidated `any` or blind type assertions.
- **Minimal Diffs:** Keep edits focused strictly on the scoped requirements without gratuitous refactoring.
- **Output:** Working, formatted, and lint-free implementation code.

### Stage 6: Test
**Objective:** Prove correctness and verify that requirements are met.
- **Execute Existing Tests:** Run the test suite to ensure no regressions were introduced.
- **Implement New Tests:** Write unit and integration tests covering happy paths, edge cases, and error boundaries.
- **Verify Coverage:** Ensure critical paths and modified logic are thoroughly verified.
- **Output:** Test execution results and pass confirmations.

### Stage 7: Debug
**Objective:** Systematically isolate and eliminate defects and unexpected behavior.
- **Root Cause Analysis:** When a test fails or bug arises, reproduce deterministically before patching.
- **Trace & Isolate:** Use log outputs, stack traces, and diffs to identify the exact failure point.
- **Fix & Validate:** Apply the minimal targeted fix and re-run all tests to confirm resolution without side effects.
- **Output:** Resolved issues with verified regression passes.

### Stage 8: Release
**Objective:** Prepare deliverable for review, integration, and deployment.
- **Diff & Quality Check:** Run final linters, type checks, and diff reviews (`git status`, `git diff`).
- **Documentation & Changelog:** Update relevant READMEs, API docs, inline docstrings, and release notes.
- **Deliverable Summary:** Provide the user with a concise summary of changes, verified behaviors, and next steps.
- **Output:** Clean, production-ready deliverable ready for merge or deployment.
