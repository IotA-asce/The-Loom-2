# Storyline Analyzer: Workflows

## 1. Analysis Initiation

```
+--------------------------------------------------+
|                                                  |
|  User selects manga and clicks "Analyze"         |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  Check for cached analysis                       |
|                                                  |
+---------------+----------------------------------+
                |
        +-------+-------+
        |               |
        v               v
+---------------+  +---------------+
| Cache Hit     |  | Cache Miss    |
| Load cached   |  | Start new     |
| analysis      |  | analysis      |
+-------+-------+  +-------+-------+
        |                  |
        v                  v
+----------------------------------+
|                                  |
|  Display storyline summary       |
|                                  |
+----------------------------------+
```

**Steps:**
1. User selects manga from library
2. Clicks "Analyze" button
3. Check if analysis exists and is fresh
4. If cached: load and display
5. If not cached: start new analysis

---

## 2. Page Batch Analysis

```
+--------------------------------------------------+
|                                                  |
|  Start Analysis                                  |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  Divide pages into batches                       |
|  (optimal for LLM context window)                |
|                                                  |
+---------------+----------------------------------+
                |
                v
+--------------------------------------------------+
|                                                  |
|  For each batch:                                 |
|  1. Send to LLM with prompt                      |
|  2. Extract structured data                      |
|  3. Merge into overall analysis                  |
|  4. Update progress                              |
|                                                  |
+---------------+----------------------------------+
                |
                v
+--------------------------------------------------+
|                                                  |
|  Consolidate all batches                         |
|  - Merge overlapping events                      |
|  - Resolve character references                  |
|  - Order timeline chronologically                |
|                                                  |
+---------------+----------------------------------+
                |
                v
+--------------------------------------------------+
|                                                  |
|  Save to database                                |
|  Mark as complete                                |
|                                                  |
+--------------------------------------------------+
```

**Batching Strategy:**
- Gemini: ~50-100 pages per batch (multimodal capacity)
- Overlap: Last 5 pages of batch N = First 5 pages of batch N+1
- Context preservation across batches

**Steps:**
1. Calculate optimal batch size based on LLM
2. Create overlapping batches
3. Process batches sequentially
4. Extract JSON from each response
5. Merge results intelligently
6. Save final analysis

---

## 3. LLM Prompt Flow

```
+--------------------------------------------------+
|                                                  |
|  Build Prompt                                    |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  System Prompt                                   |
|  "You are a manga analysis expert..."            |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  Context Prompt                                  |
|  Previous batch summary (if applicable)          |
|  Character list so far                           |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  Task Prompt                                     |
|  "Analyze these pages and extract..."            |
|  JSON schema definition                          |
|                                                  |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|                                                  |
|  Images                                          |
|  [Page 1] [Page 2] [Page 3] ...                  |
|                                                  |
+---------------+----------------------------------+
                |
                v
+--------------------------------------------------+
|                                                  |
|  LLM Response                                    |
|  Parse JSON output                               |
|  Validate against schema                         |
|                                                  |
+---------------+----------------------------------+
                |
                v
+--------------------------------------------------+
|                                                  |
|  Retry on failure (up to 3 times)                |
|                                                  |
+--------------------------------------------------+
```

**Prompt Engineering:**
- System role: Manga analyst with narrative expertise
- Few-shot examples for consistent output
- Structured JSON schema in prompt
- Request confidence scores for uncertain elements

---

## 4. Progress Tracking

```
+--------------------------------------------------+
|                                                  |
|  Analysis Progress                               |
|                                                  |
|  [=======================>        ] 75%         |
|                                                  |
|  Processing batch 3 of 4...                      |
|                                                  |
|  Detected characters:                            |
|  - Protagonist A                                 |
|  - Supporting B                                  |
|  - Antagonist C                                  |
|                                                  |
|  Events found: 12                                |
|                                                  |
|              [Cancel]                            |
|                                                  |
+--------------------------------------------------+
```

**Progress Updates:**
- Overall percentage based on batch progress
- Current batch number / total batches
- Characters discovered so far
- Event count
- Estimated time remaining

---

## 5. Error Recovery

```
+--------------------------------------------------+
|                                                  |
|  Analysis Error                                  |
|                                                  |
|  Failed to analyze batch 2                       |
|                                                  |
|  Error: Rate limit exceeded                      |
|                                                  |
|  [Retry Batch]  [Retry All]  [Cancel]            |
|                                                  |
+--------------------------------------------------+
```

**Error Types & Handling:**
| Error | Handling |
|-------|----------|
| Rate Limit | Exponential backoff retry |
| Invalid JSON | Retry with "fix JSON" prompt |
| LLM Timeout | Retry with smaller batch |
| Context Limit | Reduce batch size, retry |
| API Error | Switch to fallback provider |
| Network | Auto-retry with backoff |

---

## 6. Analysis Review

```
+--------------------------------------------------+
|  Storyline Analysis                     [Edit]   |
+--------------------------------------------------+
|                                                  |
|  SUMMARY                                         |
|  ----------------------------------------------  |
|  A young warrior discovers a hidden power...     |
|                                                  |
|                                                  |
|  CHARACTERS                    [View All 5]      |
|  ----------------------------------------------  |
|  +--------+  +--------+  +--------+             |
|  |        |  |        |  |        |             |
|  |  MC    |  | Ally   |  | Villain|             |
|  |        |  |        |  |        |             |
|  +--------+  +--------+  +--------+             |
|  Protagonist  Supporting  Antagonist            |
|                                                  |
|                                                  |
|  TIMELINE                      [View All 15]     |
|  ----------------------------------------------  |
|  Event 1: The Awakening                          |
|  [================>]                             |
|  Event 2: First Battle                           |
|  [  ===============>]                             |
|  Event 3: Betrayal Revealed                      |
|  [    =============>]                             |
|                                                  |
|                                                  |
|  [Find Anchor Events ->]                         |
|                                                  |
+--------------------------------------------------+
```

**Review Features:**
- Editable summary (user corrections)
- Character cards with details
- Timeline visualization
- Jump to anchor event detection

---

## 7. Incremental Analysis (Large Manga)

```
+--------------------------------------------------+
|                                                  |
|  Large Manga Detected (200+ pages)               |
|                                                  |
|  Options:                                        |
|                                                  |
|  [Analyze First Chapter]                         |
|  Analyze initial 50 pages to get started         |
|                                                  |
|  [Analyze Full]                                  |
|  Process entire manga (may take 10+ minutes)     |
|                                                  |
|  [Custom Range]                                  |
|  Analyze specific page range                     |
|                                                  |
+--------------------------------------------------+
```

**Large Manga Handling:**
- Detect page count > threshold
- Offer partial analysis option
- Allow custom page range
- Can resume/extend analysis later
