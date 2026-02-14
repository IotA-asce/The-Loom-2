# Component 5: Branch Generator

## Definition

The creative engine that generates compelling alternate timeline branches from selected anchor events. Takes an anchor event, understands the narrative context at that point, and creates coherent "what if" scenarios that explore how the story would unfold if something had happened differently.

A branch is a divergent narrative path that maintains consistency with established characters, world rules, and narrative style while exploring alternative outcomes.

---

## Boundaries

### In Scope
- Generation of alternate timeline branches from anchor events
- Multiple branch variations per anchor (2-5 branches)
- Narrative consistency checking (characters, world, style)
- Branch premise and outline generation
- Branch preview/summary before full generation
- Character state mapping at branch point
- World state snapshot for continuity
- Branch storage and management
- Comparison between branches and original timeline

### Out of Scope
- Full chapter writing (Component 6 handles this)
- Image/panel generation (future component)
- Timeline merging (may be future feature)
- Multi-branch convergence (may be future feature)

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| Component 4 | Selected anchor events | Branching points |
| Component 4 | Alternative outcomes | Starting variations |
| Component 3 | Character states at anchor | Maintain consistency |
| Component 3 | World state | Preserve setting/rules |
| Component 3 | Narrative style | Match tone and voice |
| Component 3 | Relationships | Character dynamics |
| User | Branch preferences | Guide generation direction |
| User | Branch count | How many alternatives to generate |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| Component 6 | Branch premises and outlines | Write continuation chapters |
| Database | Branch entities | Persistent storage |
| UI | Branch previews | User review and selection |
| UI | Comparison views | Compare branches side-by-side |

---

## Success Criteria

- [ ] Generates 2-5 distinct branches per anchor event
- [ ] Branches are internally consistent and plausible
- [ ] Characters act consistently with established traits
- [ ] World rules and setting are maintained
- [ ] Narrative style matches original
- [ ] Each branch has clear premise and trajectory
- [ ] Branches are meaningfully different (not trivial variations)
- [ ] Generation completes in under 60 seconds per branch set

---

## Branch Schema

```typescript
interface Branch {
  id: string;
  anchorEventId: string;
  storylineId: string;
  
  // Branch identity
  name: string;  // User-editable title
  description: string;  // Premise/summary
  premise: string;  // "What if..." statement
  
  // Source
  basedOn: {
    anchorEventId: string;
    alternativeOutcomeId: string;
    originalChoice: string;
    newChoice: string;
  };
  
  // State at branch point
  stateAtBranch: {
    characters: CharacterState[];
    world: WorldState;
    activeConflicts: Conflict[];
    unresolvedPlots: PlotThread[];
  };
  
  // Branch trajectory
  trajectory: {
    immediateConsequences: string[];
    shortTermOutcome: string;  // Next few chapters
    longTermDirection: string;  // Where story goes
    estimatedChapters: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
  
  // Narrative elements
  narrative: {
    themes: string[];
    tone: string;
    pacing: 'faster' | 'slower' | 'similar';
    keyScenes: string[];  // Major scenes that would occur
    characterArcs: CharacterArc[];
  };
  
  // Comparison to original
  comparison: {
    divergencePoint: string;
    similarityScore: number;  // 0-1, how different from original
    charactersAffected: string[];
    eventsChanged: string[];
  };
  
  // Metadata
  confidence: number;
  quality: number;
  generatedAt: Date;
  selectedForContinuation: boolean;
  
  // User interaction
  userRating?: number;
  notes?: string;
}

interface CharacterState {
  characterId: string;
  name: string;
  emotionalState: string;
  motivations: string[];
  knowledge: string[];  // What they know at this point
  relationships: Record<string, string>;  // characterId -> relationship state
  location: string;
  status: 'active' | 'injured' | 'captured' | 'away';
}

interface WorldState {
  setting: string;
  time: string;
  activeConflicts: Conflict[];
  powerDynamics: string;
  pendingThreats: string[];
  availableResources: string[];
}

interface CharacterArc {
  characterId: string;
  startingState: string;
  projectedDevelopment: string;
  keyMoments: string[];
}
```

---

## Dependencies

- **Core Infrastructure** (Component 1)
  - Database layer
  - LLM Provider
  - State management
  
- **Storyline Analyzer** (Component 3)
  - Character analysis
  - World/setting data
  - Narrative style profile
  - Relationship states

- **Anchor Event Detector** (Component 4)
  - Selected anchor events
  - Alternative outcomes
  - Context at anchor point

## Dependents

- **Story Continuation Engine** (Component 6)
  - Requires branch premises and outlines
  - Uses character/world state snapshots
  - Needs narrative style guidance
