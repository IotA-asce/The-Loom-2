# Storyline Analyzer: Implementation Tasks

## Phase 1: Core Analysis Service

### T1.1: Create Analysis Service
**Effort:** 2 hours
- Create StorylineAnalysisService class
- Integrate with LLM Provider from Component 1
- Implement basic analyze method
- Add error handling

### T1.2: Define Analysis Schema Types
**Effort:** 1 hour
- Create TypeScript interfaces for analysis output
- Define TimelineEvent, Character, Setting types
- Add Zod schema for runtime validation
- Export all types

### T1.3: Create LLM Prompt Builder
**Effort:** 1.5 hours
- Build system prompt
- Build task prompt with JSON schema
- Add few-shot examples
- Support different analysis depths

### T1.4: Implement JSON Response Parser
**Effort:** 1 hour
- Parse LLM response as JSON
- Validate against Zod schema
- Handle malformed JSON with retry
- Extract structured data

---

## Phase 2: Batch Processing

### T2.1: Create Batch Calculator
**Effort:** 45 minutes
- Calculate optimal batch size per provider
- Consider context window limits
- Account for image sizes
- Return batch configuration

### T2.2: Implement Batch Processor
**Effort:** 2 hours
- Create batches with overlap
- Process batches sequentially
- Merge results from each batch
- Handle partial failures

### T2.3: Create Result Merger
**Effort:** 1.5 hours
- Merge timeline events from batches
- Deduplicate characters across batches
- Reorder timeline chronologically
- Resolve overlapping events

---

## Phase 3: Data Processing

### T3.1: Implement Character Processor
**Effort:** 1.5 hours
- Extract characters from analysis
- Assign consistent IDs
- Merge aliases and duplicates
- Build relationship graph

### T3.2: Implement Timeline Processor
**Effort:** 1.5 hours
- Extract events from analysis
- Sort by sequence/page
- Assign significance levels
- Build chronological order

### T3.3: Create Analysis Validator
**Effort:** 1 hour
- Validate analysis completeness
- Check for required fields
- Flag low confidence items
- Generate warnings

---

## Phase 4: Storage & Caching

### T4.1: Extend Database Schema
**Effort:** 30 minutes
- Add Storyline table
- Add TimelineEvent table
- Add Character table
- Add Setting table

### T4.2: Create Analysis Repository
**Effort:** 1 hour
- Save analysis to database
- Load analysis by manga ID
- Update analysis status
- Delete with cascade

### T4.3: Implement Analysis Cache
**Effort:** 1 hour
- Calculate cache key
- Check cache before analysis
- Store completed analysis
- Invalidate on manga change

---

## Phase 5: Progress Tracking

### T5.1: Create Progress Tracker
**Effort:** 1 hour
- Track batch progress
- Calculate percentage
- Estimate time remaining
- Update UI callbacks

### T5.2: Create Analysis State Machine
**Effort:** 1 hour
- Define states: pending, analyzing, completed, failed
- State transitions
- Error state handling
- Cancellation support

### T5.3: Implement Cancelable Analysis
**Effort:** 45 minutes
- AbortController integration
- Check cancellation between batches
- Clean up on cancel
- Partial result handling

---

## Phase 6: UI Components

### T6.1: Create AnalysisButton Component
**Effort:** 45 minutes
- Show analyze/re-analyze state
- Handle click action
- Loading state
- Cached state indicator

### T6.2: Create AnalysisProgress Component
**Effort:** 1.5 hours
- Circular progress indicator
- Linear progress bar
- Stats display
- Cancel button

### T6.3: Create StorylineSummary Component
**Effort:** 1 hour
- Display summary text
- Expand/collapse long text
- Genre and theme tags
- Confidence indicator

### T6.4: Create CharacterGrid Component
**Effort:** 1.5 hours
- Horizontal scrolling grid
- Character cards
- Role badges
- Tap to detail

### T6.5: Create CharacterDetailModal Component
**Effort:** 1 hour
- Portrait placeholder
- Name and role
- Description
- Traits badges
- Relationships list

### T6.6: Create TimelineList Component
**Effort:** 1.5 hours
- Vertical list of events
- Expandable event cards
- Significance indicators
- Filter controls

### T6.7: Create TimelineEventCard Component
**Effort:** 1 hour
- Event number
- Title and description
- Page range
- Characters involved
- Expand/collapse

### T6.8: Create AnalysisError Component
**Effort:** 45 minutes
- Error icon
- Error message
- Retry button
- Settings button

---

## Phase 7: Integration

### T7.1: Create Analysis Page
**Effort:** 1.5 hours
- Layout for analysis flow
- State management
- Progress integration
- Result display

### T7.2: Wire Up Analysis Flow
**Effort:** 1.5 hours
- Connect UI to service
- Handle progress updates
- Handle completion
- Handle errors

### T7.3: Add Navigation to Anchor Events
**Effort:** 30 minutes
- Button to navigate to Component 4
- Pass storyline ID
- Prepare anchor event view

---

## Phase 8: Testing

### T8.1: Unit Tests
**Effort:** 2 hours
- Test batch calculator
- Test result merger
- Test character processor
- Test timeline processor

### T8.2: Integration Tests
**Effort:** 2 hours
- Test full analysis flow
- Test with different manga sizes
- Test error recovery
- Test cancellation

### T8.3: Manual Testing
**Effort:** 1 hour
- Test with real manga samples
- Verify LLM output quality
- Check UI responsiveness
- Validate data accuracy

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Core Service | 4 | ~5.5 hours |
| 2. Batch Processing | 3 | ~4 hours |
| 3. Data Processing | 3 | ~4 hours |
| 4. Storage | 3 | ~2.5 hours |
| 5. Progress | 3 | ~2.5 hours |
| 6. UI Components | 8 | ~8 hours |
| 7. Integration | 3 | ~3.5 hours |
| 8. Testing | 3 | ~5 hours |
| **Total** | **30** | **~35 hours** |

---

## Definition of Done

- [ ] Analysis service works with Gemini and OpenAI
- [ ] Batch processing handles large manga
- [ ] Progress tracking accurate
- [ ] Character and timeline extraction working
- [ ] Caching prevents re-analysis
- [ ] UI matches Apple aesthetic specs
- [ ] Error handling robust
- [ ] All tests pass

---

## Dependencies

Requires Component 1 (Core Infrastructure):
- LLM Provider abstraction
- Database layer
- State management
- Error handling

Requires Component 2 (Manga Ingestion):
- Manga entity
- Page images

---

## Next Component

After completing Storyline Analyzer, proceed to:
**Component 4: Anchor Event Detector**
