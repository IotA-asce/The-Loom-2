# Anchor Event Detector: Features

## F1: Candidate Event Filtering

**Description:** Filter timeline events to identify potential anchor candidates.

**Filter Criteria:**
- Significance level (MODERATE, MAJOR, CLIMAX)
- Character involvement (at least one major character)
- Causal connections (must affect downstream events)
- Event type (exclude pure resolutions/endings)

**Scoring Weights:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Significance | 30% | Event importance in story |
| Causal Impact | 25% | How many downstream events affected |
| Character Agency | 20% | Did character choose/act |
| Alternative Plausibility | 15% | How likely alternatives are |
| Narrative Appeal | 10% | How interesting branches would be |

**Requirements:**
- Filter 100+ events down to 20-40 candidates
- Configurable threshold
- Fast processing (< 2 seconds)

**Acceptance Criteria:**
- Filters out clearly non-anchor events
- Keeps events with branching potential
- Processes timeline of 50 events in < 2s

---

## F2: LLM Anchor Analysis

**Description:** Use LLM to analyze candidates and identify true anchor events with alternatives.

**Analysis Output:**
- Is this an anchor event? (boolean + confidence)
- Anchor type classification
- What could have happened differently
- Plausible alternative outcomes
- Impact assessment
- Branching potential score

**Prompt Strategy:**
```
Analyze this story event for branching potential:

EVENT: {{eventDescription}}
CHARACTERS: {{characterStates}}
CONTEXT: {{storyContext}}
CAUSES: {{whatLedHere}}
EFFECTS: {{whatFollows}}

Questions:
1. Could this event have happened differently?
2. What specific choice/action could change?
3. What are 2-4 plausible alternative outcomes?
4. How would each alternative affect the story?
5. Rate this as a branching point (0-1).

Output structured JSON with alternatives and scores.
```

**Requirements:**
- Batch process candidates efficiently
- Structured JSON output
- Handle 20-40 candidates per storyline

**Acceptance Criteria:**
- Successfully analyzes candidates
- Returns valid structured data
- Identifies true anchors vs false positives

---

## F3: Anchor Scoring and Ranking

**Description:** Calculate branching potential scores and rank anchor events.

**Scoring Dimensions:**
1. **Branching Potential** (0-1): Overall suitability for branching
2. **Narrative Weight**: How much story would change
3. **Character Impact**: Number of characters affected
4. **Complexity**: Simple/Moderate/Complex branch generation
5. **Confidence**: AI confidence in anchor assessment

**Ranking Factors:**
- Primary: Branching potential score
- Secondary: Diversity of anchor types
- Tertiary: Distribution across timeline

**Requirements:**
- Calculate composite scores
- Rank anchors by potential
- Apply diversity filters

**Acceptance Criteria:**
- Scores reflect actual branching quality
- Top-ranked anchors are compelling
- Diverse types represented in top 10

---

## F4: Anchor Type Classification

**Description:** Classify anchor events by type for organization and filtering.

**Anchor Types:**
| Type | Description | Example |
|------|-------------|---------|
| **Decision** | Character makes a choice | "Kira chose to fight" |
| **Accident** | Random/unpredictable event | "Bridge collapsed" |
| **Revelation** | Information discovered | "Learns father's identity" |
| **Conflict** | Fight/confrontation | "Battle outcome" |
| **Meeting** | Character encounter | "Meets rival for first time" |
| **Missed Chance** | Opportunity not taken | "Didn't confess feelings" |
| **External** | Outside intervention | "Army arrives" |
| **Betrayal** | Trust broken | "Ally reveals spy status" |
| **Sacrifice** | Giving something up | "Gives up power to save friend" |

**Requirements:**
- Automatic type classification
- Confidence per classification
- User can override type

**Acceptance Criteria:**
- Types accurately reflect event nature
- Useful for filtering and organization

---

## F5: Alternative Outcome Generation

**Description:** Generate plausible "what could have happened" alternatives for each anchor.

**Alternative Structure:**
- Description of alternative outcome
- Trigger (what would cause this)
- Probability/likelihood
- Narrative appeal score
- Immediate consequences

**Requirements:**
- 2-4 alternatives per anchor
- Plausible within story logic
- Varied in type (not all similar)
- Clear differentiation

**Acceptance Criteria:**
- Alternatives are genuinely different
- Each is plausible given context
- Range from subtle to major changes

---

## F6: Impact Assessment

**Description:** Analyze how an anchor event affects the broader story.

**Impact Metrics:**
- **Narrative Weight**: 0-1 score of story change magnitude
- **Characters Affected**: List of impacted character IDs
- **Downstream Events**: Count and list of events that would change
- **Timeline Branches**: Estimated complexity of resulting timeline

**Requirements:**
- Use causal graph from Component 3
- Calculate reach of changes
- Estimate complexity

**Acceptance Criteria:**
- Impact scores align with actual story changes
- Useful for prioritizing anchors

---

## F7: User Review Interface

**Description:** Allow users to review, select, modify, and rate anchor events.

**Features:**
- List view with sort/filter
- Detail view with full context
- Select/deselect for branching
- Add manual anchors
- Edit anchor properties
- Rate anchor quality
- Add personal notes

**Requirements:**
- Intuitive Apple-aesthetic UI
- Responsive and fast
- Clear confidence indicators

**Acceptance Criteria:**
- User can easily review 10+ anchors
- Selection state clear
- Editing is straightforward

---

## F8: Manual Anchor Creation

**Description:** Allow users to manually add anchor events the AI missed.

**Input Methods:**
- Select from timeline events
- Select page range
- Manual description entry
- Type classification
- Alternative outcome specification

**Requirements:**
- Easy event/point selection
- Validation of required fields
- Same format as auto-detected anchors

**Acceptance Criteria:**
- User can add custom anchors
- Custom anchors work with Component 5
- No different treatment from auto-anchors

---

## F9: Export to Branch Generator

**Description:** Export selected anchors to Component 5 for branch generation.

**Export Data:**
- Selected anchor events (full details)
- Alternatives chosen for generation
- Story context at anchor point
- Character states
- World state

**Requirements:**
- Seamless handoff to Component 5
- Preserve all context
- Handle multiple selected anchors

**Acceptance Criteria:**
- Selected anchors appear in Component 5
- Context preserved correctly
- Ready for branch generation
