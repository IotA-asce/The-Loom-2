# Storyline Analyzer: Deep Dive

> This is the cognitive heart of The Loom 2. The quality of anchor detection, branch generation, and story continuation all depend on the accuracy and richness of the analysis produced here.

---

## I. Analysis Philosophy

### 1.1 Narrative Understanding vs. OCR

**What we DON'T do:**
- Extract verbatim text from speech bubbles
- Translate Japanese text directly
- Perform character recognition on every panel

**What we DO:**
- Understand the narrative flow across panels
- Identify character actions, emotions, and motivations
- Track plot progression and story beats
- Recognize visual storytelling elements
- Build a semantic understanding of the story

**Why this matters:**
Manga is visual storytelling. The same story can be told with different text. We need to understand WHAT is happening, not just what is being said.

---

## II. LLM Prompt Architecture

### 2.1 Multi-Stage Analysis

Rather than one massive prompt, we use a staged approach:

```
Stage 1: Visual Overview
Input: First 5-10 pages
Output: Genre, tone, art style, apparent protagonist
Purpose: Calibrate analysis expectations

Stage 2: Character Discovery  
Input: Representative pages throughout
Output: Character list with initial descriptions
Purpose: Build character roster for context

Stage 3: Timeline Extraction
Input: Sequential batches
Output: Events with narrative flow
Purpose: Build chronological story

Stage 4: Relationship Mapping
Input: Key interaction scenes
Output: Character relationship web
Purpose: Understand dynamics

Stage 5: Theme Synthesis
Input: Analysis from stages 1-4
Output: Themes, motifs, narrative arc
Purpose: Higher-level understanding
```

### 2.2 Dynamic Prompt Building

```typescript
interface AnalysisStage {
  name: string;
  pageRange: { start: number; end: number };
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: z.ZodSchema;
  temperature: number;
  maxTokens: number;
}

const STAGES: AnalysisStage[] = [
  {
    name: 'visual_overview',
    pageRange: { start: 0, end: 10 },
    systemPrompt: VISUAL_OVERVIEW_SYSTEM_PROMPT,
    userPromptTemplate: VISUAL_OVERVIEW_TEMPLATE,
    outputSchema: VisualOverviewSchema,
    temperature: 0.3,
    maxTokens: 2000
  },
  // ... more stages
];
```

### 2.3 Example: Visual Overview Prompt

```markdown
## System Prompt

You are a manga narrative analyst with expertise in visual storytelling. 
Your task is to analyze the provided manga pages and provide a high-level 
overview focusing on narrative elements rather than text transcription.

Focus on:
- Genre indicators (fantasy, sci-fi, romance, action, etc.)
- Art style and tone (dark, lighthearted, gritty, whimsical)
- Visual storytelling techniques
- Character archetypes visible
- Setting/world hints
- Pacing and panel composition

Do NOT:
- Transcribe Japanese text
- Describe individual panel layouts unless narratively significant
- Make assumptions beyond what is visually evident

## User Prompt Template

Analyze these {{pageCount}} pages from the beginning of a manga.

Provide your analysis in this exact JSON format:

{
  "genre": ["primary_genre", "secondary_genre"],
  "tone": "single_word_description",
  "toneDescription": "brief explanation of tone",
  "artStyle": "brief description",
  "apparentProtagonist": {
    "description": "physical appearance and first impression",
    "roleIndicator": "why this seems to be the protagonist"
  },
  "setting": {
    "type": "contemporary|fantasy|sci_fi|historical|unknown",
    "description": "what the setting appears to be"
  },
  "initialHook": "what draws the reader in",
  "visualStorytelling": ["technique1", "technique2"],
  "confidence": 0.0-1.0
}

Be specific but concise. If uncertain, use lower confidence scores.
```

### 2.4 Example: Timeline Extraction Prompt

```markdown
## System Prompt

You are analyzing manga pages to extract narrative events.

For each significant story beat, identify:
- What happens (action, dialogue, revelation)
- Who is involved
- Where it happens  
- Why it matters to the story
- How it connects to previous events

Significance levels:
- MINOR: Background, setup, character moment
- MODERATE: Advances plot, develops character
- MAJOR: Turning point, major revelation
- CLIMAX: Peak dramatic moment

## User Prompt Template

Analyze these pages {{startPage}} to {{endPage}}.

Characters established so far: {{characterContext}}
Previous events summary: {{previousEvents}}

Extract events in this JSON format:

{
  "events": [
    {
      "sequence": number,
      "title": "brief event name",
      "description": "detailed what happened",
      "charactersInvolved": ["char1", "char2"],
      "location": "where",
      "significance": "MINOR|MODERATE|MAJOR|CLIMAX",
      "type": "ACTION|DIALOGUE|REVELATION|CONFLICT|RESOLUTION",
      "pageStart": number,
      "pageEnd": number,
      "confidence": 0.0-1.0,
      "uncertain": "note any uncertainties"
    }
  ],
  "newCharacters": [
    {
      "name": "name or descriptive ID",
      "description": "appearance and role",
      "firstAppearance": page_number
    }
  ],
  "continuityNotes": "how this connects to previous"
}
```

---

## III. Confidence Scoring Methodology

### 3.1 Factors Affecting Confidence

| Factor | Weight | Description |
|--------|--------|-------------|
| Visual Clarity | 0.25 | How clear the artwork is |
| Text Density | 0.20 | Amount of text vs. visual storytelling |
| Familiar Tropes | 0.15 | How well story follows known patterns |
| Consistency | 0.20 | Internal consistency of analysis |
| Cross-Page Context | 0.20 | How well events connect |

### 3.2 Confidence Calculation

```typescript
function calculateConfidence(analysis: AnalysisResult): number {
  const factors = {
    visualClarity: assessVisualClarity(analysis.rawImages),
    textDensity: assessTextDensity(analysis.pageMetrics),
    tropeFamiliarity: assessTropeMatch(analysis.genre, analysis.events),
    consistency: checkInternalConsistency(analysis),
    contextCoherence: assessCrossPageCoherence(analysis.timeline)
  };
  
  // Weighted average
  const confidence = 
    factors.visualClarity * 0.25 +
    factors.textDensity * 0.20 +
    factors.tropeFamiliarity * 0.15 +
    factors.consistency * 0.20 +
    factors.contextCoherence * 0.20;
  
  return Math.min(1.0, Math.max(0.0, confidence));
}
```

### 3.3 Confidence Thresholds

| Score | Interpretation | Action |
|-------|----------------|--------|
| 0.9-1.0 | Excellent | Proceed confidently |
| 0.7-0.89 | Good | Minor review suggested |
| 0.5-0.69 | Fair | User review recommended |
| < 0.5 | Poor | Re-analysis or manual input needed |

---

## IV. Handling Manga Diversity

### 4.1 Genre-Specific Analysis

Different genres require different analytical focus:

| Genre | Focus Areas | Special Handling |
|-------|-------------|------------------|
| Shonen Action | Power progression, rivalries, training arcs | Track power levels, technique names |
| Romance | Relationship development, emotional beats | Ship dynamics, love triangle tracking |
| Mystery | Clues, revelations, suspect pool | Maintain mystery state, track clues |
| Slice of Life | Character growth, daily life events | Focus on character arcs over plot |
| Horror | Atmosphere, dread, scares | Tone analysis, fear escalation |
| Isekai | World rules, progression systems | System understanding, power scaling |

### 4.2 Art Style Considerations

| Style | Challenge | Solution |
|-------|-----------|----------|
| Highly Stylized | Character recognition | Focus on distinctive features |
| Minimalist | Sparse visual info | Weight text bubbles more |
| Dense/Detailed | Information overload | Batch more carefully |
| Abstract/Surreal | Non-literal imagery | Flag high uncertainty |

---

## V. Quality Assurance Mechanisms

### 5.1 Self-Consistency Checks

Before finalizing analysis, verify:

1. **Character Consistency**
   - Same character described similarly across batches
   - No duplicates with slightly different names
   - Relationships are reciprocal (if A knows B, B knows A)

2. **Timeline Consistency**
   - Events in logical order
   - No impossible sequences (character in two places)
   - Page ranges don't overlap incorrectly

3. **Narrative Coherence**
   - Cause-and-effect chains make sense
   - Motivations align with actions
   - Plot threads resolve or continue logically

### 5.2 Cross-Validation

```typescript
async function crossValidate(analysis: StorylineAnalysis): Promise<ValidationResult> {
  const checks = await Promise.all([
    validateCharacterConsistency(analysis),
    validateTimelineOrdering(analysis),
    validateNarrativeCoherence(analysis),
    validatePageReferences(analysis)
  ]);
  
  const issues = checks.flatMap(c => c.issues);
  const confidenceAdjustment = issues.length * 0.05; // -5% per issue
  
  return {
    valid: issues.length === 0,
    issues,
    adjustedConfidence: Math.max(0, analysis.confidence - confidenceAdjustment)
  };
}
```

### 5.3 Human-in-the-Loop Points

User intervention triggered when:
- Confidence < 0.5
- Validation finds critical issues
- Duplicate character names detected
- Timeline has impossible sequences
- User requests review

---

## VI. Edge Cases & Failure Modes

### 6.1 Common Challenges

| Challenge | Cause | Mitigation |
|-----------|-------|------------|
| Unreadable Art | Low quality scans | Flag low confidence, offer manual input |
| Complex Panel Layout | Non-standard reading order | Note in analysis, flag for review |
| Heavy Text | Visual novel style | Reduce batch size, focus on dialogue |
| Silent Panels | No text, pure visual | Increase visual attention weight |
| Flashbacks/Non-linear | Time jumps | Track timeline vs. reading order |
| Cultural References | Specific Japanese context | Note references, may need explanation |
| Multi-thread Plot | Parallel storylines | Track each thread separately |

### 6.2 Recovery Strategies

```typescript
const RECOVERY_STRATEGIES: Record<ErrorType, RecoveryAction> = {
  LOW_CONFIDENCE: {
    action: 'reanalyze_with_prompt_adjustment',
    adjustment: 'More specific instructions for unclear elements'
  },
  INCONSISTENT_CHARACTERS: {
    action: 'deduplication_pass',
    adjustment: 'Use fuzzy matching on character descriptions'
  },
  TIMELINE_GAP: {
    action: 'targeted_reanalysis',
    adjustment: 'Focus on gap pages specifically'
  },
  TOO_MANY_CHARACTERS: {
    action: 'character_consolidation',
    adjustment: 'Merge minor characters, focus on main cast'
  }
};
```

---

## VII. Performance Optimization

### 7.1 Pre-analysis Optimization

| Technique | Impact |
|-----------|--------|
| Image Downsampling | 50% faster uploads to LLM |
| Format Conversion | WebP reduces size 30% |
| Duplicate Detection | Skip already-analyzed spreads |
| Smart Batching | Optimal tokens per request |

### 7.2 Caching Strategy

```typescript
interface AnalysisCache {
  // Key: hash of manga + pages + schema_version
  key: string;
  
  // What we cache
  analysis: StorylineAnalysis;
  rawResponses: LLMResponse[]; // For debugging
  
  // Metadata
  createdAt: Date;
  llmVersion: string;
  schemaVersion: string;
  
  // Invalidation
  isStale: boolean;
  staleReason?: string;
}

// Cache invalidation rules
const INVALIDATION_RULES = [
  { condition: 'schema_version_changed', action: 'invalidate_all' },
  { condition: 'manga_updated', action: 'invalidate_affected_pages' },
  { condition: 'llm_version_major_change', action: 'mark_stale' },
  { condition: 'cache_age > 90_days', action: 'mark_stale' }
];
```

### 7.3 Progressive Analysis

For large manga (200+ pages):

1. **Quick Analysis** (first pass)
   - Sample every 10th page
   - 2-minute turnaround
   - Rough timeline only
   
2. **Standard Analysis** (default)
   - All pages, normal batches
   - 5-10 minute turnaround
   - Full analysis
   
3. **Deep Analysis** (optional)
   - Multiple passes over key sections
   - 20+ minute turnaround
   - Maximum detail

---

## VIII. Integration with Downstream Components

### 8.1 Output for Anchor Event Detection

The analysis must provide:

```typescript
interface AnalysisForAnchorDetection {
  // All events with significance >= MODERATE
  candidateEvents: TimelineEvent[];
  
  // Character decision points
  characterDecisions: {
    characterId: string;
    eventId: string;
    decision: string;
    alternatives: string[]; // What they could have done
    consequence: string; // What happened because of choice
  }[];
  
  // Critical plot branches
  plotBranches: {
    eventId: string;
    branchPoint: string;
    outcomes: string[];
  }[];
  
  // Confidence metadata
  confidenceByEvent: Record<string, number>;
}
```

### 8.2 Output for Branch Generation

```typescript
interface AnalysisForBranchGeneration {
  // Full context around anchor event
  preAnchorContext: string;
  postAnchorConsequences: string;
  
  // Character states at anchor point
  characterStates: {
    characterId: string;
    emotionalState: string;
    motivations: string[];
    capabilities: string[];
    relationships: Record<string, string>;
  }[];
  
  // World state at anchor point
  worldState: {
    setting: string;
    activeConflicts: string[];
    unresolvedPlots: string[];
    powerDynamics: string;
  };
  
  // Author style indicators
  narrativeStyle: {
    pacing: 'fast' | 'moderate' | 'slow';
    tone: string;
    commonTropes: string[];
    plotStructure: string;
  };
}
```

---

## IX. Testing Strategy

### 9.1 Test Manga Corpus

Maintain a diverse test set:

| Manga | Genre | Pages | Why Included |
|-------|-------|-------|--------------|
| Test Sample 1 | Shonen Action | 50 | Clear power progression |
| Test Sample 2 | Mystery | 100 | Complex plot threads |
| Test Sample 3 | Romance | 30 | Subtle emotional beats |
| Test Sample 4 | Horror | 80 | Atmosphere heavy |
| Test Sample 5 | Isekai | 200 | World building density |

### 9.2 Evaluation Criteria

For each test run, measure:

1. **Accuracy**: Events match ground truth
2. **Completeness**: No major events missed
3. **Precision**: No false events created
4. **Character Accuracy**: Names and roles correct
5. **Timeline Order**: Chronology correct
6. **Confidence Calibration**: Confidence matches accuracy

---

## X. Monitoring & Observability

### 10.1 Key Metrics

```typescript
interface AnalysisMetrics {
  // Performance
  durationMs: number;
  tokensUsed: number;
  pagesPerSecond: number;
  
  // Quality
  confidenceScore: number;
  validationIssues: number;
  retryCount: number;
  
  // Usage
  analysisType: 'quick' | 'standard' | 'deep';
  llmProvider: string;
  cacheHit: boolean;
}
```

### 10.2 Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Avg confidence | < 0.7 | < 0.5 |
| Error rate | > 5% | > 15% |
| Avg duration | > 10 min | > 20 min |
| Retry rate | > 10% | > 25% |

---

## XI. Future Enhancements

### 11.1 Short Term (MVP+)

- [ ] Character recognition across page batches
- [ ] Relationship graph visualization
- [ ] Theme extraction and tagging
- [ ] Multiple language support (Japanese → English context)

### 11.2 Long Term

- [ ] Fine-tuned manga analysis model
- [ ] Panel-by-panel breakdown
- [ ] Emotional arc tracking
- [ ] Predictive analysis (where story might go)
- [ ] Cross-manga comparison (similar stories)

---

*This deep dive ensures Component 3 is built with the depth and quality required to support the entire application.*
