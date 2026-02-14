# Anchor Event Detector: Workflows

## 1. Automatic Anchor Detection

```
+--------------------------------------------------+
|  Storyline Analysis Complete                     |
|  (Timeline + Characters + Causal Graph)          |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  Phase 1: Filter Candidate Events                |
|  - Events with significance >= MODERATE          |
|  - Events involving major characters             |
|  - Events with multiple causes/effects           |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  Phase 2: LLM Analysis of Candidates             |
|  For each candidate:                             |
|  - Could this have gone differently?             |
|  - What are plausible alternatives?              |
|  - How much would the story change?              |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  Phase 3: Score and Rank                         |
|  - Calculate branching potential                 |
|  - Rank by narrative impact                      |
|  - Filter by confidence threshold                |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  Phase 4: Present to User                        |
|  - List of detected anchors                      |
|  - Confidence scores                             |
|  - Preview of alternatives                       |
+--------------------------------------------------+
```

**Steps:**
1. Filter timeline events to significant candidates
2. Send candidates to LLM for anchor potential analysis
3. Score and rank based on branching potential
4. Present to user for review

---

## 2. Candidate Event Filtering

```
Timeline Events (from Component 3)
    ↓
Filter 1: Significance >= MODERATE
    ↓
Filter 2: Major character involvement
    ↓
Filter 3: Multiple causal connections
    ↓
Filter 4: Not a resolution/ending event
    ↓
Candidate Pool (typically 20-40 events)
```

**Filter Criteria:**
| Filter | Purpose | Rejects |
|--------|---------|---------|
| Significance | Must be meaningful | Minor background events |
| Characters | Need character agency | Setting-only events |
| Causal | Must affect future | Dead-end events |
| Resolution | Can't branch endings | Final conclusions |

---

## 3. LLM Anchor Analysis

```
Candidate Event
    ↓
Build Context Package:
  - Event details
  - Character states before/after
  - Causal connections
  - Story context (what led here, what follows)
    ↓
Send to LLM with Anchor Analysis Prompt
    ↓
Receive Structured Analysis:
  - Is this an anchor? (yes/no/confident)
  - Anchor type
  - What could change
  - Alternative outcomes
  - Impact assessment
    ↓
Parse and Validate
    ↓
Store as AnchorEvent (if valid)
```

**Prompt Focus Areas:**
1. Could this event have happened differently?
2. What choices were made that could change?
3. What external factors could vary?
4. How would changes affect the story?
5. Is this a compelling branching point?

---

## 4. Anchor Scoring Algorithm

```
Raw Anchor Data
    ↓
Calculate Scores:
  
  Branching Potential = 
    significanceWeight × 0.3 +
    causalImpact × 0.25 +
    characterAgency × 0.2 +
    alternativePlausibility × 0.15 +
    narrativeAppeal × 0.1
  
  Complexity Rating:
    - Simple: 1-2 characters affected, local impact
    - Moderate: 3-5 characters, medium scope
    - Complex: 6+ characters, story-wide impact
    ↓
Rank by Branching Potential
    ↓
Select Top N (default: 10)
    ↓
Apply Diversity Filter
  - Ensure mix of anchor types
  - Spread across timeline
  - Different characters represented
```

---

## 5. User Review and Selection

```
+--------------------------------------------------+
|  Detected Anchor Events (8 found)                |
+--------------------------------------------------+
|                                                  |
|  [Sort: Confidence] [Filter: All Types]          |
|                                                  |
|  ⭐ 1. The Decision at the Crossroads            |
|     Type: Decision | Confidence: 95%             |
|     Kira chose to save the village...            |
|     Could have: Fled, Negotiated, Fought         |
|     Impact: High (affects 4 characters)          |
|     [Select for Branching] [View Details]        |
|                                                  |
|  2. The Stranger's Warning                       |
|     Type: Revelation | Confidence: 88%           |
|     Rook revealed his true identity...           |
|     Could have: Stayed silent, Lied, Ran         |
|     Impact: Very High (story pivot)              |
|     [Select for Branching] [View Details]        |
|                                                  |
|  [+ Add Manual Anchor]                           |
|                                                  |
|  Selected: 2 anchors                             |
|  [Generate Branches →]                           |
|                                                  |
+--------------------------------------------------+
```

**User Actions:**
- View anchor details
- Select/deselect for branching
- Add manual anchor (if AI missed one)
- Edit anchor description
- Remove anchor
- Rate anchor quality
- Add personal notes

---

## 6. Manual Anchor Creation

```
User clicks "+ Add Manual Anchor"
    ↓
+--------------------------------------------------+
|  Create Manual Anchor                            |
+--------------------------------------------------+
|                                                  |
|  Select Event: [Dropdown of timeline events]     |
|                                                  |
|  Or Select Page Range:                           |
|  [========|==========>====]                     |
|  Page 45-50                                      |
|                                                  |
|  Title: [____________________]                   |
|                                                  |
|  What Happened:                                  |
|  [Multi-line text area]                          |
|                                                  |
|  What Could Change:                              |
|  [Multi-line text area]                          |
|                                                  |
|  Type: [Decision ▼]                              |
|                                                  |
|  [Cancel] [Save Anchor]                          |
|                                                  |
+--------------------------------------------------+
```

---

## 7. Anchor Detail View

```
+--------------------------------------------------+
|  The Decision at the Crossroads          [Edit]  |
+--------------------------------------------------+
|                                                  |
|  SOURCE EVENT                                    |
|  Chapter 3, Pages 45-52                          |
|  "Kira chose to save the village instead of      |
|   pursuing the Empire spy..."                    |
|                                                  |
|  ANCHOR TYPE: Decision                           |
|  CONFIDENCE: 95%                                 |
|  BRANCHING POTENTIAL: High (0.87)                |
|                                                  |
|  WHAT COULD CHANGE                               |
|  +------------------------------------------+   |
|  | Alternative 1: Kira pursues the spy      |   |
|  | The village is destroyed, but Kira       |   |
|  | captures vital intelligence...           |   |
|  +------------------------------------------+   |
|  +------------------------------------------+   |
|  | Alternative 2: Kira negotiates           |   |
|  | She tries to save both, leading to       |   |
|  | a tense standoff...                      |   |
|  +------------------------------------------+   |
|                                                  |
|  IMPACT ANALYSIS                                 |
|  Characters Affected: Kira, Village Chief,       |
|                       Spy, Empire Forces         |
|  Downstream Events: 8 events would change        |
|  Estimated Branch Complexity: Moderate           |
|                                                  |
|  [Select for Branching]  [Not Interested]        |
|                                                  |
+--------------------------------------------------+
```

---

## 8. Export to Branch Generator

```
User selects anchors and clicks "Generate Branches"
    ↓
Validate selections
    ↓
Prepare Branch Generation Context:
  - Anchor events with alternatives
  - Character states at anchor point
  - World state context
  - Narrative style from analysis
    ↓
Navigate to Component 5 (Branch Generator)
    ↓
Pre-populate with selected anchors
```
