# Component 6: Story Continuation Engine

## Definition

The narrative generation system that writes new chapters continuing stories from branch points. Takes a selected branch's premise, character states, and world context to generate coherent, serialized chapters that maintain narrative consistency while exploring the alternate timeline.

This component transforms branch concepts into actual readable story content, chapter by chapter.

---

## Boundaries

### In Scope
- Chapter-by-chapter story generation
- Character voice and dialogue consistency
- Scene and pacing management
- Narrative arc progression
- Integration with branch state
- User review and editing of generated chapters
- Chapter continuity and callbacks
- Multi-chapter arc planning

### Out of Scope
- Image/panel generation (future component)
- Audio/voice generation
- Automatic story conclusion (user decides when to end)
- Real-time collaborative writing
- Translation to other languages

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| Component 5 | Selected branch | Story premise and trajectory |
| Component 5 | Character states | Starting point for character voices |
| Component 5 | World state | Setting and rules for story |
| Component 3 | Narrative style | Match original manga's tone |
| Component 3 | Character voices | Dialogue style and speech patterns |
| User | Chapter prompts | Guide specific chapter content |
| User | Length preferences | Short vs. long chapters |
| User | Style adjustments | Darker, lighter, faster, etc. |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| Database | Generated chapters | Persistent story content |
| UI | Chapter text | Reading experience |
| UI | Chapter outline | Preview before generation |
| Component 6 (self) | Previous chapters | Context for next chapter |
| User | Export formats | Read outside app |

---

## Success Criteria

- [ ] Generates coherent, readable chapters (2000-5000 words)
- [ ] Characters speak consistently with established voices
- [ ] Maintains narrative style of original manga
- [ ] Progresses story logically from previous chapter
- [ ] Each chapter has satisfying arc while advancing larger story
- [ ] Generation completes in under 60 seconds per chapter
- [ ] User can edit and regenerate chapters
- [ ] Multi-chapter continuity maintained

---

## Chapter Schema

```typescript
interface GeneratedChapter {
  id: string;
  branchId: string;
  sequence: number;  // Chapter number in branch
  
  // Content
  title: string;
  content: string;  // Full chapter text
  summary: string;  // Brief summary
  
  // Structure
  scenes: Scene[];
  wordCount: number;
  estimatedReadTime: number;  // minutes
  
  // Narrative elements
  characters: string[];  // Character IDs present
  locations: string[];  // Settings used
  plotPoints: string[];  // Key story beats
  
  // Generation metadata
  generatedAt: Date;
  generationPrompt: string;
  modelUsed: string;
  
  // Quality metrics
  coherence: number;  // 0-1
  styleMatch: number;  // 0-1
  userRating?: number;  // User rating
  
  // User interaction
  userEdited: boolean;
  userEditNotes?: string;
  regenerationCount: number;
  
  // Status
  status: 'draft' | 'published' | 'archived';
}

interface Scene {
  id: string;
  sequence: number;
  
  // Content
  content: string;
  summary: string;
  
  // Elements
  characters: string[];
  location: string;
  time: string;
  
  // Narrative purpose
  purpose: 'setup' | 'rising-action' | 'climax' | 'falling-action' | 'resolution';
  emotionalBeat: string;
}

interface ChapterOutline {
  chapterNumber: number;
  title: string;
  summary: string;
  
  // Planned structure
  scenes: {
    sequence: number;
    purpose: string;
    characters: string[];
    location: string;
    keyEvent: string;
  }[];
  
  // Story progression
  setup: string;
  conflict: string;
  resolution: string;
  
  // Hooks for next chapter
  cliffhanger?: string;
  unresolved: string[];
}
```

---

## Dependencies

- **Core Infrastructure** (Component 1)
  - Database layer
  - LLM Provider
  - State management
  
- **Storyline Analyzer** (Component 3)
  - Narrative style profile
  - Character voice patterns
  - World/setting details

- **Branch Generator** (Component 5)
  - Selected branch premise
  - Character state snapshots
  - World state at branch point
  - Story trajectory

## Dependents

- None (end of backend pipeline)
- UI (for reading and editing)
