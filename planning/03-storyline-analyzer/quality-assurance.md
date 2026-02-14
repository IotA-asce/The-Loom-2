# Storyline Analyzer: Quality Assurance

> Ensuring the analysis output is accurate, complete, and reliable.

---

## I. Validation Pipeline

### 1.1 Three-Stage Validation

```
Stage 1: Structural Validation
    ↓
Stage 2: Semantic Validation  
    ↓
Stage 3: Cross-Reference Validation
    ↓
Quality Score
```

### 1.2 Structural Validation

Check JSON structure matches schema:

```typescript
const AnalysisSchema = z.object({
  summary: z.string().min(50).max(5000),
  genre: z.array(z.string()).min(1),
  timeline: z.array(TimelineEventSchema).min(1),
  characters: z.array(CharacterSchema).min(1),
  confidence: z.number().min(0).max(1)
});

function validateStructure(data: unknown): ValidationResult {
  const result = AnalysisSchema.safeParse(data);
  return {
    valid: result.success,
    errors: result.success ? [] : result.error.errors
  };
}
```

**Checks:**
- Required fields present
- Types correct
- String lengths reasonable
- Arrays non-empty
- Numbers in valid ranges

### 1.3 Semantic Validation

Check content makes sense:

```typescript
function validateSemantic(analysis: StorylineAnalysis): ValidationResult {
  const issues: string[] = [];
  
  // Timeline checks
  if (hasTimelineGaps(analysis.timeline)) {
    issues.push('Timeline has unexplained gaps');
  }
  
  if (hasImpossibleSequences(analysis.timeline)) {
    issues.push('Timeline has impossible sequences');
  }
  
  // Character checks
  if (hasDuplicateCharacters(analysis.characters)) {
    issues.push('Possible duplicate characters detected');
  }
  
  if (hasOrphanedCharacters(analysis)) {
    issues.push('Characters with no events');
  }
  
  // Page reference checks
  if (hasInvalidPageReferences(analysis)) {
    issues.push('Events reference pages beyond manga length');
  }
  
  // Cross-reference checks
  if (hasDanglingReferences(analysis)) {
    issues.push('Events reference non-existent characters');
  }
  
  return {
    valid: issues.length === 0,
    severity: issues.length > 2 ? 'critical' : 'warning',
    issues
  };
}
```

### 1.4 Cross-Reference Validation

Verify internal consistency:

```typescript
function validateCrossReferences(analysis: StorylineAnalysis): ValidationResult {
  const issues: string[] = [];
  
  // Check all character references in events exist
  for (const event of analysis.timeline) {
    for (const charRef of event.charactersInvolved) {
      if (!analysis.characters.find(c => c.id === charRef)) {
        issues.push(`Event references unknown character: ${charRef}`);
      }
    }
  }
  
  // Check character relationships reference existing characters
  for (const char of analysis.characters) {
    for (const rel of char.relationships) {
      if (!analysis.characters.find(c => c.id === rel.characterId)) {
        issues.push(`${char.name} has relationship with unknown character`);
      }
    }
  }
  
  // Check setting references
  for (const event of analysis.timeline) {
    if (event.location) {
      if (!analysis.settings.find(s => s.id === event.location)) {
        issues.push(`Event references unknown setting: ${event.location}`);
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
```

---

## II. Quality Metrics

### 2.1 Accuracy Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Event Precision | Correct events / Total events | > 85% |
| Event Recall | Found events / True events | > 80% |
| Character Precision | Correct chars / Total chars | > 90% |
| Character Recall | Found chars / True chars | > 85% |
| Timeline Order | Correct ordering | > 95% |

### 2.2 Completeness Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Summary Coverage | Main plot points in summary | 100% |
| Character Coverage | Major chars identified | > 90% |
| Event Coverage | Significant events captured | > 85% |
| Relationship Coverage | Key relationships mapped | > 80% |

### 2.3 Confidence Calibration

```typescript
function calculateCalibrationScore(analysis: StorylineAnalysis): number {
  // Compare confidence scores to actual accuracy
  // Well-calibrated: confidence ≈ accuracy
  
  const confidenceBuckets: Record<string, { predicted: number; actual: number }> = {
    '0.0-0.2': { predicted: 0.1, actual: 0 },
    '0.2-0.4': { predicted: 0.3, actual: 0 },
    '0.4-0.6': { predicted: 0.5, actual: 0 },
    '0.6-0.8': { predicted: 0.7, actual: 0 },
    '0.8-1.0': { predicted: 0.9, actual: 0 }
  };
  
  // Fill buckets with validation results
  // Calculate expected calibration error (ECE)
  
  return ece; // Lower is better
}
```

**Calibration Targets:**
- ECE < 0.1 (well-calibrated)
- No systematic overconfidence
- Uncertainty reflected in scores

---

## III. Automated Testing

### 3.1 Test Suite Structure

```
test/
├── fixtures/
│   ├── shonen_action_50p/     # Ground truth labeled
│   ├── mystery_100p/
│   ├── romance_30p/
│   └── slice_of_life_80p/
├── unit/
│   ├── prompt-builder.test.ts
│   ├── batch-processor.test.ts
│   └── validator.test.ts
├── integration/
│   ├── full-analysis.test.ts
│   ├── error-recovery.test.ts
│   └── performance.test.ts
└── benchmarks/
    ├── accuracy.test.ts
    └── speed.test.ts
```

### 3.2 Ground Truth Format

```typescript
interface GroundTruth {
  mangaId: string;
  pages: number;
  genre: string;
  summary: string;
  characters: GroundTruthCharacter[];
  events: GroundTruthEvent[];
  createdBy: string; // Human annotator
  confidence: 'high' | 'medium' | 'low';
}

interface GroundTruthCharacter {
  name: string;
  role: string;
  firstAppearance: number;
  keyTraits: string[];
}

interface GroundTruthEvent {
  title: string;
  pageRange: [number, number];
  characters: string[];
  significance: 'minor' | 'moderate' | 'major' | 'climax';
}
```

### 3.3 Evaluation Script

```typescript
async function evaluateAnalysis(
  analysis: StorylineAnalysis,
  groundTruth: GroundTruth
): Promise<EvaluationResult> {
  return {
    summary: {
      bleuScore: calculateBleu(analysis.summary, groundTruth.summary),
      rougeScore: calculateRouge(analysis.summary, groundTruth.summary)
    },
    characters: {
      precision: characterPrecision(analysis, groundTruth),
      recall: characterRecall(analysis, groundTruth),
      f1: characterF1(analysis, groundTruth)
    },
    events: {
      precision: eventPrecision(analysis, groundTruth),
      recall: eventRecall(analysis, groundTruth),
      f1: eventF1(analysis, groundTruth),
      orderingAccuracy: checkEventOrder(analysis, groundTruth)
    },
    overall: {
      accuracy: calculateOverallAccuracy(analysis, groundTruth),
      confidence: analysis.confidence,
      calibrated: isCalibrated(analysis.confidence, accuracy)
    }
  };
}
```

---

## IV. Human Evaluation

### 4.1 Evaluation Interface

```
+--------------------------------------------------+
|  Analysis Quality Review                           |
+--------------------------------------------------+
|                                                  |
|  Summary Accuracy:     [⭐⭐⭐⭐☆]                |
|  Character Coverage:   [⭐⭐⭐⭐⭐]                |
|  Event Coverage:       [⭐⭐⭐☆☆]                |
|  Timeline Accuracy:    [⭐⭐⭐⭐☆]                |
|                                                  |
|  Specific Issues:                                  |
|  [ ] Missing character: ________________         |
|  [ ] Wrong event order: ________________         |
|  [ ] Incorrect summary: ________________         |
|  [ ] Other: ___________________________          |
|                                                  |
|  [Submit Evaluation]                               |
|                                                  |
+--------------------------------------------------+
```

### 4.2 Evaluation Metrics

Track over time:
- Human accuracy rating
- Time to review
- Common error types
- Confidence vs. rating correlation

---

## V. Continuous Improvement

### 5.1 Feedback Loop

```
Analysis Produced
    ↓
User Review (optional)
    ↓
Feedback Stored
    ↓
Weekly Analysis
    ↓
Prompt Improvements
    ↓
Retest on Benchmarks
    ↓
Deploy Improvements
```

### 5.2 Prompt A/B Testing

```typescript
interface PromptExperiment {
  id: string;
  controlPrompt: string;
  treatmentPrompt: string;
  testManga: string[];
  metrics: string[]; // ['accuracy', 'completeness', 'speed']
  sampleSize: number;
  significanceThreshold: number;
}

async function runExperiment(exp: PromptExperiment): Promise<ExperimentResult> {
  const controlResults = await Promise.all(
    exp.testManga.map(m => analyzeWithPrompt(m, exp.controlPrompt))
  );
  
  const treatmentResults = await Promise.all(
    exp.testManga.map(m => analyzeWithPrompt(m, exp.treatmentPrompt))
  );
  
  return {
    controlMetrics: calculateMetrics(controlResults),
    treatmentMetrics: calculateMetrics(treatmentResults),
    significant: checkSignificance(controlResults, treatmentResults),
    recommendation: 'keep' | 'adopt' | 'iterate'
  };
}
```

### 5.3 Regression Testing

Before any change:
1. Run full test suite
2. Compare to baseline
3. No significant degradation allowed
4. Document any trade-offs

---

## VI. Quality Checklist

### Pre-Release

- [ ] All test manga pass structural validation
- [ ] Accuracy metrics above targets
- [ ] No critical semantic issues
- [ ] Performance within bounds (< 10 min for 100 pages)
- [ ] Error handling tested
- [ ] Edge cases documented

### Per-Analysis

- [ ] JSON is valid
- [ ] Page references in range
- [ ] Characters have events
- [ ] Timeline is ordered
- [ ] Confidence > 0.5 or flagged for review
- [ ] Cross-references valid

---

*Quality assurance ensures Component 3 delivers reliable, actionable analysis for downstream components.*
