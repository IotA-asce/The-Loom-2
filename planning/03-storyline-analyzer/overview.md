# Component 3: Storyline Analyzer

## Definition

The cognitive engine that transforms visual manga pages into structured narrative understanding. Uses LLM (primarily Gemini) to analyze manga images, extract storyline elements, build a chronological timeline of events, and identify character relationships. This is the core AI component that enables the application to "read" and understand manga.

---

## Boundaries

### In Scope
- LLM-powered analysis of manga pages
- Storyline extraction (plot, events, settings)
- Character identification and tracking
- Timeline construction from narrative events
- Confidence scoring for analysis quality
- Analysis state management (pending, in-progress, complete, failed)
- Incremental analysis (batch processing of pages)
- Analysis caching to avoid re-processing
- Structured JSON output from LLM

### Out of Scope
- Anchor event identification (Component 4)
- Branch generation (Component 5)
- Story continuation writing (Component 6)
- OCR text extraction (may be separate feature)
- Image generation (future component)
- Multi-language support (assumes English or Japanese with translation)

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| Component 2 | Manga entity with pages | Source material to analyze |
| Component 2 | Page images (blobs/URLs) | Visual input for LLM |
| Component 1 | LLM Provider | Analysis engine |
| User | Analysis trigger | Start analysis command |
| User | Analysis preferences | Detail level, focus areas |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| Database | Storyline entity | Persistent analysis results |
| Component 4 | Timeline events | For anchor event detection |
| UI | Analysis progress | User feedback |
| UI | Storyline summary | User review |

---

## Success Criteria

- [ ] LLM successfully processes manga pages and extracts narrative
- [ ] Storyline summary is coherent and accurate
- [ ] Timeline is chronologically ordered
- [ ] Characters are identified with traits and roles
- [ ] Analysis completes within reasonable time (30-60s per chapter)
- [ ] Progress shown during analysis
- [ ] Failed analysis shows clear error and retry option
- [ ] Results cached to avoid re-analysis

---

## Dependencies

- **Core Infrastructure** (Component 1)
  - LLM Provider abstraction
  - Database layer
  - State management
  - Error handling
  
- **Manga Ingestion Engine** (Component 2)
  - Manga entity with pages
  - Page images ready for analysis

## Dependents

- **Anchor Event Detector** (Component 4)
  - Requires storyline timeline as input
  - Uses narrative context for event significance

---

## Analysis Output Schema

```typescript
interface StorylineAnalysis {
  id: string;
  mangaId: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  
  // High-level summary
  summary: string;                    // 2-3 paragraph synopsis
  genre: string[];                    // Detected genres
  themes: string[];                   // Central themes
  tone: string;                       // Overall tone/atmosphere
  
  // Timeline of events
  timeline: TimelineEvent[];
  
  // Characters
  characters: Character[];
  
  // Settings
  settings: Setting[];
  
  // Metadata
  confidence: number;                 // 0-1 overall confidence
  analyzedAt: Date;
  pageCount: number;
  
  // Raw LLM response (for debugging)
  rawAnalysis?: string;
}

interface TimelineEvent {
  id: string;
  sequence: number;                   // Order in story
  chapter?: number;                   // Physical chapter if known
  pageRange: { start: number; end: number };
  title: string;                      // Brief event title
  description: string;                // Detailed description
  characters: string[];               // Character IDs involved
  location?: string;                  // Setting ID
  significance: 'minor' | 'moderate' | 'major' | 'climax';
  type: 'action' | 'dialogue' | 'revelation' | 'conflict' | 'resolution';
}

interface Character {
  id: string;
  name: string;
  aliases?: string[];
  description: string;                // Physical + personality
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  relationships: CharacterRelationship[];
  firstAppearance: number;            // Page number
}

interface CharacterRelationship {
  characterId: string;
  type: 'ally' | 'enemy' | 'family' | 'love' | 'mentor' | 'rival' | 'neutral';
  description?: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  type: 'location' | 'time_period' | 'world';
}
```
