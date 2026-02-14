# Storyline Analyzer: Edge Cases & Mitigations

> Comprehensive guide to handling problematic manga and analysis failures.

---

## I. Image Quality Issues

### 1.1 Low Resolution Scans

**Problem:** Images too small for character/feature recognition

**Detection:**
```typescript
function assessImageQuality(image: ImageData): QualityReport {
  return {
    resolution: image.width * image.height,
    isReadable: image.width >= 600 && image.height >= 800,
    issues: []
  };
}
```

**Mitigation:**
- Flag low confidence (< 0.4)
- Offer upscaling via AI (Real-ESRGAN via WASM)
- Prompt user to confirm character identities
- Reduce batch size for more focused analysis

### 1.2 Scan Artifacts

**Types:**
- Moiré patterns (scanning printed manga)
- Page curvature (book gutter shadow)
- Color bleeding
- Noise/compression artifacts

**Detection:**
```typescript
function detectArtifacts(image: ImageData): ArtifactReport {
  return {
    hasMoiré: detectMoiréPattern(image),
    hasCurvature: detectGutterShadow(image),
    compressionLevel: estimateCompression(image),
    severity: 'minor' | 'moderate' | 'severe'
  };
}
```

**Mitigation:**
- Preprocess: denoise filters
- Flag affected pages
- Increase confidence uncertainty
- Request better scans if severe

### 1.3 Double-Page Spreads

**Problem:** Two-page spreads scanned as separate images or merged

**Detection:**
- Aspect ratio analysis (width > height * 1.5)
- Content continuity check
- Page number gaps

**Handling:**
```typescript
async function handleSpreads(images: ImageData[]): Promise<Page[]> {
  const pages: Page[] = [];
  
  for (let i = 0; i < images.length; i++) {
    if (isDoublePageSpread(images[i])) {
      // Option 1: Analyze as single unit
      pages.push({
        type: 'spread',
        image: images[i],
        pageNumbers: [i + 1, i + 2]
      });
    } else {
      pages.push({
        type: 'single',
        image: images[i],
        pageNumber: i + 1
      });
    }
  }
  
  return pages;
}
```

---

## II. Narrative Complexity

### 2.1 Non-Linear Storytelling

**Types:**
- Flashbacks (visual cues: black borders, rounded panels)
- Flashforwards (prophecy, preview)
- Parallel timelines (simultaneous events)
- Time loops/repeats

**Detection Strategy:**
```typescript
interface TimelineAnalysis {
  apparentOrder: Event[];      // As presented
  chronologicalOrder: Event[]; // Actual timeline
  timeJumps: TimeJump[];
}

function detectNonLinear(events: Event[]): TimelineAnalysis {
  const timeJumps: TimeJump[] = [];
  
  // Look for visual cues in descriptions
  for (const event of events) {
    if (event.description.includes('flashback') || 
        event.description.includes('years ago') ||
        event.description.includes('remembered')) {
      timeJumps.push({
        event: event.id,
        type: 'flashback',
        apparentPosition: event.sequence,
        actualPosition: 'earlier'
      });
    }
  }
  
  return {
    apparentOrder: events,
    chronologicalOrder: reorderChronologically(events, timeJumps),
    timeJumps
  };
}
```

**Handling:**
- Track both apparent and chronological order
- Note time jumps in analysis
- Flag for user review if complex

### 2.2 Unreliable Narrator

**Problem:** What characters say/don't match reality

**Signs:**
- Character says one thing, visuals show another
- Internal monologue contradicts dialogue
- Visual metaphors vs. literal events

**Handling:**
- Distinguish "character believes" from "actually happened"
- Track perceptions vs. reality
- Flag unreliable elements

### 2.3 Multiple Protagonists

**Problem:** Ensemble cast with no clear single protagonist

**Types:**
- True ensemble (multiple equal POVs)
- Rotating protagonist (different arcs)
- Decoy protagonist (introduced, then switches)

**Handling:**
```typescript
function identifyProtagonists(analysis: StorylineAnalysis): Character[] {
  const candidates = analysis.characters.filter(c => 
    c.narrativeRole.primaryRole === 'protagonist' ||
    c.appearances.length > (analysis.pageCount * 0.3)
  );
  
  if (candidates.length === 1) {
    return candidates; // Clear protagonist
  }
  
  if (candidates.length > 3) {
    // Likely ensemble
    return candidates.map(c => ({
      ...c,
      narrativeRole: { ...c.narrativeRole, isEnsemble: true }
    }));
  }
  
  // Multiple, analyze focus distribution
  return rankByProtagonistIndicators(candidates, analysis);
}
```

---

## III. Cultural & Language Barriers

### 3.1 Untranslated Sound Effects (SFX)

**Problem:** Japanese sound effects carry narrative information

**Examples:**
- ドキドキ (doki doki) = heartbeat, nervousness
- ゴゴゴ (gogo) = menacing atmosphere
- キラキラ (kira kira) = sparkles, beauty, special

**Handling:**
- Include common SFX in prompts
- Note when SFX seems narratively significant
- Don't rely on SFX for critical plot points

### 3.2 Cultural References

**Types:**
- Japanese holidays/festivals
- School system references
- Social hierarchy (senpai/kohai)
- Mythology/history references

**Handling:**
- Note references in analysis
- Don't assume Western cultural context
- Flag for potential user explanation

### 3.3 Honorifics & Speech Patterns

**Information carried:**
- Relationship status (san, kun, chan, sama)
- Formality level
- Character personality (rough speech, polite, etc.)

**Handling:**
- Note speech pattern differences
- Infer relationships from honorifics
- Include in character analysis

---

## IV. Genre-Specific Challenges

### 4.1 Action/Fighting Manga

**Challenges:**
- Fast-paced panel transitions
- Multiple simultaneous actions
- Special moves with names
- Power level systems

**Handling:**
- Focus on key turning points, not every punch
- Track power progression separately
- Note named techniques as significant events

### 4.2 Mystery/Detective

**Challenges:**
- Clue scattering across many pages
- Red herrings
- Revelation timing critical
- Reader vs. character knowledge gaps

**Handling:**
- Track clues separately from events
- Note what's revealed when
- Distinguish character knowledge from reader knowledge

### 4.3 Romance

**Challenges:**
- Subtle emotional beats
- Internal monologue heavy
- Misunderstandings as plot points
- Slow relationship progression

**Handling:**
- Weight emotional moments heavily
- Track relationship progression metric
- Note significant glances/touches

### 4.4 Horror

**Challenges:**
- Atmosphere over events
- Unreliable reality
- Psychological elements
- Jump scares vs. slow burn

**Handling:**
- Analyze tone and atmosphere
- Track fear escalation
- Note reality breaks

---

## V. Technical Failures

### 5.1 LLM Hallucination

**Signs:**
- Characters/events not in images
- Impossible plot connections
- Confident but wrong statements

**Detection:**
```typescript
function detectHallucination(analysis: StorylineAnalysis): boolean {
  // Check for impossible page references
  const invalidPages = analysis.timeline.events.filter(
    e => e.pageRange.end > analysis.pageCount
  );
  
  // Check for character inconsistencies
  const characterInconsistencies = checkCharacterConsistency(analysis);
  
  // Check for impossible timeline
  const timelineIssues = checkTimelineChronology(analysis);
  
  return invalidPages.length > 0 || 
         characterInconsistencies.length > 0 ||
         timelineIssues.length > 0;
}
```

**Mitigation:**
- Validation pass after analysis
- Confidence score reduction
- Flag for user review
- Retry with different prompt

### 5.2 Timeout Failures

**Causes:**
- LLM API slow
- Very large batch
- Complex pages

**Recovery:**
```typescript
async function handleTimeout(
  batch: ImageData[],
  attempt: number
): Promise<AnalysisResult> {
  if (attempt === 1) {
    // Retry same batch
    return retryWithBackoff(batch);
  }
  
  if (attempt === 2) {
    // Split batch in half
    const half = Math.floor(batch.length / 2);
    const [result1, result2] = await Promise.all([
      analyzeBatch(batch.slice(0, half)),
      analyzeBatch(batch.slice(half))
    ]);
    return mergeResults(result1, result2);
  }
  
  // Final attempt: page by page
  return analyzePageByPage(batch);
}
```

### 5.3 Context Window Overflow

**Problem:** Too many images + text for LLM context

**Detection:**
```typescript
function estimateTokens(images: ImageData[], prompt: string): number {
  // Rough estimation
  const imageTokens = images.length * 1000; // ~1000 tokens per image
  const textTokens = prompt.length / 4; // ~4 chars per token
  return imageTokens + textTokens;
}
```

**Handling:**
- Reduce batch size
- Compress images
- Shorten prompts
- Remove less critical context

---

## VI. User Intervention Triggers

### 6.1 Automatic Review Flags

User is prompted when:
- Overall confidence < 0.5
- Timeline has impossible sequences
- Duplicate character names detected
- Analysis contradicts itself
- Very low confidence on key events (>3 events < 0.3)

### 6.2 Intervention UI

```typescript
interface InterventionRequest {
  type: 'character_clarification' | 'timeline_review' | 'missing_info';
  severity: 'blocking' | 'warning';
  description: string;
  suggestions: string[];
  affectedPages: number[];
}
```

**Example Interventions:**

| Issue | Intervention |
|-------|--------------|
| Two "Kira" characters | "Are these the same person or different characters?" |
| Timeline gap | "The story jumps from day 1 to day 5. Is this a time skip?" |
| Low confidence | "I am uncertain about these events. Please review." |

---

## VII. Recovery Workflows

### 7.1 Partial Failure Recovery

```
Analysis failed at batch 3 of 5

Options:
1. [Retry Failed Batch] - Attempt batch 3 again
2. [Skip & Continue] - Skip batch 3, continue with 4-5
3. [Reduce Batch Size] - Split remaining into smaller chunks
4. [Manual Input] - You describe what happens in these pages
5. [Cancel] - Stop analysis, save partial results
```

### 7.2 Quality Improvement Loop

```typescript
async function improveAnalysis(
  initialAnalysis: StorylineAnalysis
): Promise<StorylineAnalysis> {
  let analysis = initialAnalysis;
  
  // Self-validation
  const validation = await validateAnalysis(analysis);
  
  if (!validation.valid) {
    // Targeted reanalysis of problematic areas
    for (const issue of validation.issues) {
      const fix = await targetedReanalysis(analysis, issue);
      analysis = applyFix(analysis, fix);
    }
  }
  
  // Cross-validation with different prompt
  const crossCheck = await crossValidateAnalysis(analysis);
  
  if (crossCheck.confidence < 0.6) {
    // Flag for user review
    analysis.requiresReview = true;
  }
  
  return analysis;
}
```

---

*This document ensures robustness in the face of real-world manga diversity and quality issues.*
