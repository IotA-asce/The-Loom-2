# Storyline Analyzer: Features

## F1: LLM Analysis Engine

**Description:** Core service for analyzing manga pages with LLM.

**Capabilities:**
- Multimodal image analysis (pages as input)
- Structured JSON output
- Batch processing for large manga
- Retry logic with exponential backoff
- Provider fallback on failure

**Prompt Strategy:**
```
System: You are an expert manga analyst specializing in narrative structure
       and storytelling. Analyze the provided manga pages and extract detailed
       storyline information.

Task: Extract the following in valid JSON format:
- summary: A 2-3 paragraph synopsis of the story
- timeline: Array of events with sequence, description, characters, significance
- characters: Array with name, description, role, traits
- settings: Array of locations/time periods
- confidence: Overall confidence score 0-1

Requirements:
- Be specific and detailed
- Identify character relationships
- Note significant plot points
- Flag any uncertain information
```

**Requirements:**
- Support Gemini (primary) and OpenAI (fallback)
- Configurable batch size per provider
- Token usage tracking
- Response time metrics

**Acceptance Criteria:**
- Successfully analyzes 50 pages in under 30 seconds
- Returns valid JSON structure
- Handles errors gracefully with retries
- Tracks and reports token usage

---

## F2: Batch Processing

**Description:** Divide large manga into manageable chunks for LLM processing.

**Batch Configuration:**
| Provider | Optimal Batch | Max Images | Overlap |
|----------|---------------|------------|---------|
| Gemini 1.5 Pro | 50-100 pages | 3000 | 5 pages |
| GPT-4V | 10-20 pages | 100 | 3 pages |
| Claude 3 | Text only | N/A | N/A |

**Overlap Strategy:**
- Last N pages of batch = First N pages of next batch
- Prevents missing cross-batch events
- Used for context continuity

**Requirements:**
- Calculate optimal batch count
- Create overlapping batches
- Process sequentially
- Merge results intelligently

**Acceptance Criteria:**
- 200-page manga split into appropriate batches
- Overlaps maintained correctly
- Sequential processing without conflicts
- Merged timeline is continuous

---

## F3: Storyline Extraction

**Description:** Extract narrative elements from LLM analysis.

**Extracted Elements:**
- **Summary:** Coherent synopsis of the story
- **Timeline:** Chronological event sequence
- **Characters:** Named characters with roles and traits
- **Settings:** Locations and time periods
- **Themes:** Central thematic elements
- **Genre:** Detected genre classifications

**Quality Indicators:**
- Confidence score per element
- Flag uncertain identifications
- Note contradictory information

**Requirements:**
- Structured schema validation
- Handle missing information gracefully
- Support partial analysis (incomplete manga)
- Allow user corrections

**Acceptance Criteria:**
- Summary captures main plot points
- Timeline ordered chronologically
- Characters have consistent identifiers
- Confidence scores accurate

---

## F4: Character Identification

**Description:** Identify and track characters across the storyline.

**Character Attributes:**
- Name (primary identifier)
- Aliases/nicknames
- Physical description
- Personality traits
- Role (protagonist, antagonist, supporting)
- Relationships to other characters
- First appearance page

**Deduplication:**
- Same character mentioned multiple times
- Merge aliases under primary name
- Resolve naming variations

**Requirements:**
- Consistent character IDs across analysis
- Relationship mapping
- Track character development
- Handle unnamed characters (descriptive IDs)

**Acceptance Criteria:**
- Same character not duplicated
- Aliases linked correctly
- Relationships accurately mapped
- All significant characters identified

---

## F5: Timeline Construction

**Description:** Build chronological timeline of story events.

**Event Attributes:**
- Sequence number (chronological order)
- Page range in manga
- Event title (brief)
- Description (detailed)
- Characters involved
- Location
- Significance level
- Event type

**Timeline Features:**
- Sort by chronological order
- Filter by character
- Filter by significance
- Search events

**Requirements:**
- Events ordered correctly
- Page references accurate
- Overlapping events handled
- Gaps noted (if any)

**Acceptance Criteria:**
- Timeline reflects story chronology
- Page numbers accurate
- All major plot points included
- Significance levels appropriate

---

## F6: Analysis Caching

**Description:** Cache analysis results to avoid re-processing.

**Cache Key:**
- Manga ID + Page count + LLM provider + Schema version

**Cache Behavior:**
- Check cache before new analysis
- Invalidate on manga update
- User can force re-analysis
- Cache stored in IndexedDB

**Requirements:**
- Fast cache lookup
- Cache invalidation rules
- Storage size management
- Export/Import with cache

**Acceptance Criteria:**
- Repeated analysis uses cache
- Cache invalidated appropriately
- No stale results served
- Cache doesn't grow unbounded

---

## F7: Progress Tracking

**Description:** Real-time progress during analysis.

**Progress Information:**
- Overall percentage complete
- Current batch / total batches
- Characters discovered count
- Events found count
- Estimated time remaining
- Current stage (processing, merging, saving)

**Update Frequency:**
- Batch start/end
- Every 10% within batch
- On character/event discovery

**Requirements:**
- Non-blocking UI updates
- Cancelable operation
- Accurate time estimates
- Detailed or simple view

**Acceptance Criteria:**
- Progress bar updates smoothly
- Cancel stops processing cleanly
- Time estimates reasonably accurate
- Info helpful to user

---

## F8: Error Handling & Recovery

**Description:** Robust error handling for analysis failures.

**Error Types:**
| Type | Cause | Recovery |
|------|-------|----------|
| Rate Limit | API throttling | Exponential backoff |
| Timeout | LLM slow response | Reduce batch size |
| Invalid JSON | LLM output malformed | Retry with fix prompt |
| Context Limit | Batch too large | Reduce batch size |
| Auth Error | Invalid API key | Prompt for new key |
| Network | Connection issue | Auto-retry |

**Recovery Actions:**
- Automatic retry with backoff
- Batch size reduction
- Provider fallback
- User notification with options

**Requirements:**
- Graceful degradation
- Retry with different strategy
- Preserve partial results
- Clear error messages

**Acceptance Criteria:**
- Transient errors auto-recover
- Partial results saved on failure
- User informed of unrecoverable errors
- Retry options available
