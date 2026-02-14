# The Loom 2 — Planning & Development Bible

> *"Plans are worthless, but planning is everything."* — Dwight D. Eisenhower

This document governs all planning and development activities for this project. All collaborators must adhere to these principles.

---

## I. Philosophy

### 1.1 Planning-First Development
No code is written until planning is complete. Planning happens at multiple levels of abstraction, iteratively refined until the implementer is satisfied that the scope is clear, bounded, and actionable.

### 1.2 Hierarchical Decomposition
Complexity is managed through layered decomposition:
```
Vision → Components → Workflows → Features → Implementation Tasks
```
Each layer is planned and approved before descending to the next.

### 1.3 Sequential Development
Components are developed one at a time, in a logical order. Parallel development is avoided unless explicitly justified. This ensures focus and maintainable momentum.

---

## II. The Planning Directory Structure

```
planning/
├── BIBLE.md              # This document — universal rules
├── 00-vision.md          # High-level project vision and goals
├── 01-components.md      # List of major components (sequenced)
├── 02-[component]/       # One directory per component
│   ├── overview.md       # Component definition and boundaries
│   ├── workflows.md      # User/system workflows
│   ├── features.md       # Feature specifications
│   ├── ui-specs.md       # UI/UX specifications
│   └── tasks.md          # Implementation task breakdown
├── 03-architecture.md    # System architecture (cross-cutting)
├── 04-tech-stack.md      # Technology choices and rationale
└── 05-milestones.md      # Development milestones and timeline
```

---

## III. Universal Aesthetic Rule

### 3.1 Apple.com Aesthetic Standard
All user interfaces MUST adhere to the visual language of [apple.com](https://apple.com):

| Principle | Application |
|-----------|-------------|
| **Whitespace** | Generous, breathable layouts. Content breathes. |
| **Typography** | Clean, hierarchical type. System fonts or geometric sans-serifs. |
| **Color** | Restrained palette. Purposeful accent colors. No visual noise. |
| **Motion** | Subtle, purposeful animations. Ease-in-out curves. |
| **Imagery** | Full-bleed, high-quality. Edge-to-edge when appropriate. |
| **Simplicity** | One primary action per screen. Progressive disclosure. |
| **Depth** | Layered interfaces with subtle shadows and glassmorphism where appropriate. |

### 3.2 Design References
- [Apple Design Resources](https://developer.apple.com/design/resources/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## IV. The Planning Protocol

### Phase 1: Vision Capture
1. Stakeholder describes the project concept
2. Architect captures vision, goals, and constraints
3. Output: `00-vision.md`

### Phase 2: Component Decomposition
1. Architect breaks vision into 4-8 major components
2. Components are sequenced logically (dependencies first)
3. Each component has a one-paragraph description
4. Output: `01-components.md`

### Phase 3: Component Deep-Dive (Iterative)
For each selected component:
1. **Overview**: Define boundaries, inputs, outputs, success criteria
2. **Workflows**: Map user journeys and system flows
3. **Features**: List and describe each feature
4. **UI Specs**: Wireframes, layouts, interactions (apple.com aesthetic)
5. **Tasks**: Break into implementation-sized tasks

### Phase 4: Architecture & Stack
1. Define system architecture spanning all components
2. Choose and justify technology stack
3. Output: `03-architecture.md`, `04-tech-stack.md`

### Phase 5: Milestone Planning
1. Map components to milestones
2. Define deliverables and acceptance criteria per milestone
3. Output: `05-milestones.md`

---

## V. Decision Records

Every significant decision must be documented in `planning/decisions/`:

```
planning/decisions/
├── 0001-use-supabase-for-auth.md
├── 0002-choose-tailwind-over-css-modules.md
└── ...
```

Format ( inspired by [ADR](https://adr.github.io/) ):
```markdown
# Decision: [Title]

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
What is the issue that we're seeing?

## Decision
What is the change that we're proposing or have agreed to?

## Consequences
What becomes easier or more difficult to do?
```

---

## VI. Definition of Done

A component is "planned" when:
- [ ] Overview is written and approved
- [ ] Workflows are mapped
- [ ] Features are specified
- [ ] UI specs adhere to the Apple aesthetic
- [ ] Tasks are small enough for single-session implementation
- [ ] No open questions remain

A component is "developed" when:
- [ ] All tasks are complete
- [ ] Code follows project conventions
- [ ] Tests pass (if testing is part of stack)
- [ ] UI matches specs
- [ ] Documentation is updated

---

## VII. Communication Patterns

### 7.1 When the Stakeholder Says:
> "I want to build a project that does X..."

**Response**: Capture vision, ask clarifying questions, then produce `00-vision.md` and `01-components.md`.

### 7.2 When the Stakeholder Says:
> "Let's dive deeper into [Component Y]..."

**Response**: Create `02-[component]/` directory and populate `overview.md`, `workflows.md`, `features.md`.

### 7.3 When the Stakeholder Says:
> "Tell me more about [Feature Z]..."

**Response**: Expand `features.md` with detailed specification, edge cases, and UI specs.

---

## VIII. Amendments

This bible is a living document. Changes require:
1. Proposal of change
2. Impact assessment
3. Approval
4. Documentation update

---

*Last Updated: 2026-02-13*
*Version: 1.0*
