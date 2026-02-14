# Component 4: Anchor Event Detector

## Definition

The intelligence layer that identifies pivotal "anchor events" within a storyline — moments where a character made a choice, an action had significant consequences, or circumstances created a turning point. These anchor events serve as branching points for alternate timeline generation.

An anchor event is defined as: *A story moment where if something had happened differently, the subsequent narrative would meaningfully change.*

---

## Boundaries

### In Scope
- Analysis of storyline timeline to identify candidate anchor events
- Evaluation of event significance for branching potential
- Classification of anchor event types (decision, accident, revelation, conflict)
- Extraction of "what could have been different" for each anchor
- Confidence scoring for anchor suitability
- Ranking/prioritization of anchor events
- User review and selection interface
- Storage of anchor events with narrative context

### Out of Scope
- Generating actual branch narratives (Component 5)
- Story continuation writing (Component 6)
- Analysis of new manga (Component 3 handles this)
- Image processing (Components 2-3 handle this)

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| Component 3 | Timeline events | Find candidates among significant events |
| Component 3 | Character states at each event | Understand decision context |
| Component 3 | Cause-and-effect graph | Identify pivotal causal nodes |
| Component 3 | Character relationships | Understand interpersonal dynamics |
| User | Selection criteria | Filter by type, significance, character |
| User | Manual addition | Add anchors the AI missed |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| Component 5 | Anchor events with context | Generate branches from anchors |
| Database | Anchor event entities | Persistent storage |
| UI | Anchor event list | User review and selection |
| UI | Branch preview hints | Show what might change |

---

## Success Criteria

- [ ] Identifies 5-15 meaningful anchor events per typical manga
- [ ] Anchor events cover diverse types (decisions, accidents, revelations)
- [ ] Each anchor has clear "what could change" description
- [ ] Confidence score indicates branch potential quality
- [ ] User can add/modify/remove anchor events
- [ ] Anchors properly reference source events in timeline
- [ ] Processing completes in under 30 seconds

---

## Anchor Event Schema

```typescript
interface AnchorEvent {
  id: string;
  storylineId: string;
  
  // Reference to source event
  sourceEventId: string;
  title: string;
  description: string;
  pageRange: { start: number; end: number };
  
  // Classification
  type: AnchorType;
  subtype: string;
  
  // What happened
  whatHappened: string;
  
  // What could have happened differently
  alternatives: AlternativeOutcome[];
  
  // Impact assessment
  impact: {
    narrativeWeight: number;      // 0-1: How much story changes
    affectedCharacters: string[]; // Character IDs impacted
    downstreamEvents: string[];   // Events that would change
    timelineBranches: number;     // Estimated branch complexity
  };
  
  // Branching potential
  branching: {
    potential: number;            // 0-1: Suitability for branching
    complexity: 'simple' | 'moderate' | 'complex';
    suggestedBranches: number;    // How many branches make sense
  };
  
  // Metadata
  confidence: number;
  detectedAt: Date;
  reviewedByUser: boolean;
  userModified: boolean;
  
  // User interaction
  userRating?: number;           // User rates anchor quality
  notes?: string;                // User notes
  isFavorite?: boolean;          // User favorites
}

type AnchorType = 
  | 'decision'      // Character made a choice
  | 'accident'      // Random/unpredictable event
  | 'revelation'    // Information discovered
  | 'conflict'      // Fight/confrontation outcome
  | 'meeting'       // Character encounter
  | 'missed_chance' // Opportunity not taken
  | 'external'      // Outside force intervenes
  | 'betrayal'      // Trust broken
  | 'sacrifice';    // Character gives something up

interface AlternativeOutcome {
  id: string;
  description: string;           // What could have happened
  trigger: string;               // What would trigger this
  probability: 'unlikely' | 'possible' | 'likely' | 'certain';
  narrativeAppeal: number;       // 0-1: How interesting this branch would be
  consequences: string[];        // Immediate expected consequences
}
```

---

## Dependencies

- **Core Infrastructure** (Component 1)
  - Database layer
  - LLM Provider
  - State management
  
- **Storyline Analyzer** (Component 3)
  - Timeline events
  - Character analysis
  - Causal graph
  - Relationship data

## Dependents

- **Branch Generator** (Component 5)
  - Requires anchor events as branching points
  - Uses anchor context for coherent branches
