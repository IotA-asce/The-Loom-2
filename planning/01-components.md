# Project Components

## Component List

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 1 | **Core Infrastructure** | Project setup, state management, LLM abstraction layer | 🟡 In Progress |
| 2 | **Manga Ingestion Engine** | Upload, parse, store manga (CBZ, PDF, images) + auto chapter segmentation | 🟡 In Progress |
| 3 | **Storyline Analyzer** | LLM-powered narrative extraction and timeline construction | 🟡 Deep Dive Complete |
| 4 | **Anchor Event Detector** | Identify pivotal moments with narrative significance | 🟡 In Progress |
| 5 | **Branch Generator** | Generate alternate timeline branches from anchor events | 🟡 In Progress |
| 6 | **Story Continuation Engine** | Chapter-by-chapter story generation for branches | 🟡 In Progress |
| 7 | **React UI Application** | Apple-aesthetic interface for entire workflow | 🟡 In Progress |

## Development Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

[1] Core Infrastructure
         │
         ▼
[2] Manga Ingestion Engine ─────┐
         │                       │
         ▼                       │
[3] Storyline Analyzer ◄────────┤
         │                       │
         ▼                       │
[4] Anchor Event Detector       │
         │                       │
         ▼                       │
[5] Branch Generator            │
         │                       │
         ▼                       │
[6] Story Continuation Engine   │
         │                       │
         ▼                       │
[7] React UI Application ───────┘

```

### Sequence Rationale

1. **Core Infrastructure** must come first — establishes patterns, state management, and LLM abstraction used by all downstream components
2. **Manga Ingestion** before analysis — need data to analyze
3. **Storyline Analyzer** before detection — need timeline to find anchor events
4. **Anchor Event Detector** before branching — need events to branch from
5. **Branch Generator** before continuation — need branches to continue
6. **Story Continuation** before UI — backend services must exist to be wired up
7. **React UI** last — integrates all services with Apple aesthetic

---

## Component Selection

**Which component would you like to dive deeper into?**

Reply with the component number (1-7) or name, and I'll expand it into:
- Detailed overview with boundaries and I/O
- User/system workflows
- Feature specifications
- UI/UX specifications (Apple aesthetic)
- Implementation task breakdown

## Implementation Goals

All components have been broken down into actionable tasks in:
📁 **`/goals/GOALS.md`** — 352 tasks across all 7 components

Supporting documents:
- `COMPONENT_CHECKLIST.md` — Verification of complete coverage
- `GAPS_ANALYSIS.md` — Missing items and recommendations
- `README.md` — Guide to using the goals directory

---

Alternatively, suggest re-ordering if the sequence doesn't match your priorities.
