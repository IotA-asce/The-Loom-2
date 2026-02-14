# Anchor Event Detector: Implementation Tasks

## Phase 1: Candidate Filtering

### T1.1: Create Event Significance Filter
**Effort:** 1 hour
- Filter events by significance level (MODERATE+)
- Implement significance threshold config
- Unit tests for filtering logic

### T1.2: Create Character Involvement Filter
**Effort:** 1 hour
- Check for major character participation
- Filter out events with only minor characters
- Handle character role changes

### T1.3: Create Causal Impact Analyzer
**Effort:** 1.5 hours
- Analyze causal graph for event reach
- Count downstream affected events
- Calculate causal centrality

### T1.4: Create Candidate Pool Builder
**Effort:** 1 hour
- Combine all filters
- Apply diversity constraints
- Return ranked candidate list

---

## Phase 2: LLM Analysis

### T2.1: Create Anchor Analysis Prompt
**Effort:** 2 hours
- Design prompt for anchor detection
- Include few-shot examples
- Define output schema

### T2.2: Implement LLM Analysis Service
**Effort:** 2 hours
- Batch process candidates
- Handle rate limiting
- Parse structured output

### T2.3: Create Alternative Generator
**Effort:** 1.5 hours
- Generate 2-4 alternatives per anchor
- Ensure alternatives are distinct
- Validate plausibility

### T2.4: Implement Anchor Type Classifier
**Effort:** 1 hour
- Classify anchors into 9 types
- Confidence per classification
- Handle edge cases

---

## Phase 3: Scoring and Ranking

### T3.1: Create Scoring Algorithm
**Effort:** 1.5 hours
- Implement 5-dimension scoring
- Calculate composite branching potential
- Normalize scores

### T3.2: Create Impact Assessment Service
**Effort:** 1.5 hours
- Calculate narrative weight
- Identify affected characters
- Count downstream events

### T3.3: Implement Ranking Engine
**Effort:** 1 hour
- Rank by branching potential
- Apply diversity filters
- Ensure type distribution

### T3.4: Create Complexity Estimator
**Effort:** 1 hour
- Estimate branch complexity (simple/moderate/complex)
- Based on character count and scope
- Validation logic

---

## Phase 4: Data Storage

### T4.1: Extend Database Schema
**Effort:** 45 minutes
- Add AnchorEvent table
- Add AlternativeOutcome table
- Add relationships to Storyline

### T4.2: Create Anchor Repository
**Effort:** 1 hour
- CRUD operations for anchors
- Filter and query methods
- User modification tracking

### T4.3: Implement Caching
**Effort:** 45 minutes
- Cache detection results
- Invalidate on storyline update
- Performance optimization

---

## Phase 5: UI Components

### T5.1: Create AnchorCard Component
**Effort:** 2 hours
- Card with confidence badge
- Expandable details
- Select toggle
- Apple aesthetic styling

### T5.2: Create AnchorList Component
**Effort:** 1.5 hours
- Scrollable list of cards
- Sort and filter controls
- Selection counter
- Empty states

### T5.3: Create AnchorDetailModal Component
**Effort:** 2 hours
- Full anchor details
- Alternative outcomes display
- Impact visualization
- Action buttons

### T5.4: Create ManualAnchorForm Component
**Effort:** 2 hours
- Event selection dropdown
- Page range picker
- Alternative input fields
- Validation

### T5.5: Create FilterModal Component
**Effort:** 1.5 hours
- Sort options
- Type filters
- Confidence range
- Impact filters

### T5.6: Create DetectionProgress Component
**Effort:** 1 hour
- Progress indicator
- Status messages
- Cancel button

---

## Phase 6: Integration

### T6.1: Create AnchorDetectionPage
**Effort:** 1.5 hours
- Page layout
- State management
- Error handling

### T6.2: Wire Up Detection Flow
**Effort:** 2 hours
- Connect UI to services
- Handle progress updates
- Display results

### T6.3: Implement Export to Component 5
**Effort:** 1.5 hours
- Prepare export data
- Navigation to Branch Generator
- State passing

---

## Phase 7: Testing

### T7.1: Unit Tests
**Effort:** 2 hours
- Test filtering logic
- Test scoring algorithm
- Test type classification

### T7.2: Integration Tests
**Effort:** 1.5 hours
- Test full detection flow
- Test with different storylines
- Test edge cases

### T7.3: Manual Testing
**Effort:** 1 hour
- Test with real manga
- Validate anchor quality
- Check UI responsiveness

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Candidate Filtering | 4 | ~4.5 hours |
| 2. LLM Analysis | 4 | ~6.5 hours |
| 3. Scoring & Ranking | 4 | ~4.5 hours |
| 4. Data Storage | 3 | ~2.5 hours |
| 5. UI Components | 6 | ~10 hours |
| 6. Integration | 3 | ~5 hours |
| 7. Testing | 3 | ~4.5 hours |
| **Total** | **27** | **~37.5 hours** |

---

## Definition of Done

- [ ] Detects 5-15 meaningful anchors per storyline
- [ ] Diverse anchor types represented
- [ ] Each anchor has 2-4 alternatives
- [ ] Confidence scores accurate
- [ ] User can add manual anchors
- [ ] Export to Component 5 works
- [ ] UI matches Apple aesthetic
- [ ] All tests pass

---

## Dependencies

Requires Component 1 (Core Infrastructure):
- Database layer
- LLM Provider
- State management

Requires Component 3 (Storyline Analyzer):
- Timeline events
- Character analysis
- Causal graph

---

## Next Component

After completing Anchor Event Detector, proceed to:
**Component 5: Branch Generator**
