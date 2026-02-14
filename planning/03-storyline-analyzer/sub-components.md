# Storyline Analyzer: Sub-Component Breakdown

> Component 3 decomposed into 8 focused, implementable sub-components. Each will be interrogated separately to gather detailed requirements.

---

## Sub-Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STORYLINE ANALYZER (Component 3)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐ │
│  │   3.1 Image      │────▶│   3.2 Prompt     │────▶│   3.3 LLM       │ │
│  │   Preprocessor   │     │   Engine         │     │   Orchestrator  │ │
│  └──────────────────┘     └──────────────────┘     └─────────────────┘ │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐ │
│  │   3.4 Response   │────▶│   3.5 Character  │────▶│   3.6 Timeline  │ │
│  │   Parser         │     │   Analyzer       │     │   Constructor   │ │
│  └──────────────────┘     └──────────────────┘     └─────────────────┘ │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌──────────────────┐     ┌──────────────────┐                         │
│  │   3.7 Quality    │────▶│   3.8 Analysis   │                         │
│  │   Assessor       │     │   Merger         │                         │
│  └──────────────────┘     └──────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Component 3.1: Image Preprocessor

**Purpose:** Prepare manga page images for LLM analysis

**Responsibilities:**
- Image quality assessment (resolution, artifacts)
- Format optimization (WebP conversion, resizing)
- Batch grouping (optimal sizes per LLM provider)
- Duplicate/spread detection
- Preprocessing for specific analysis types

**Key Questions:**
1. What minimum resolution is acceptable for analysis?
2. Should we offer AI upscaling for low-quality scans?
3. How should double-page spreads be handled?
4. What image format works best with Gemini vs OpenAI?

---

## Sub-Component 3.2: Prompt Engine

**Purpose:** Generate and manage multi-stage analysis prompts

**Responsibilities:**
- Dynamic prompt building per stage
- Context injection (previous results)
- Few-shot example selection
- Prompt versioning and A/B testing
- Provider-specific prompt adaptation

**Key Questions:**
1. Should prompts be static or dynamically generated based on genre detection?
2. How much previous context should each stage receive?
3. Should we maintain different prompt sets for different genres?
4. How do we handle prompt versioning and updates?

---

## Sub-Component 3.3: LLM Orchestrator

**Purpose:** Manage all LLM API interactions

**Responsibilities:**
- API call execution with retries
- Rate limiting and backoff
- Provider switching (Gemini → OpenAI fallback)
- Token usage tracking
- Timeout and cancellation handling
- Streaming response handling (if supported)

**Key Questions:**
1. What is the maximum acceptable analysis time per chapter?
2. Should we support parallel batch processing or strictly sequential?
3. When should we switch to fallback provider vs retry?
4. Should we support local LLM models (Ollama, etc.)?

---

## Sub-Component 3.4: Response Parser

**Purpose:** Extract structured data from LLM responses

**Responsibilities:**
- JSON extraction from various formats
- Schema validation (Zod)
- Error detection and recovery
- Partial result handling
- Response caching for debugging

**Key Questions:**
1. How strict should JSON validation be? (reject vs fix)
2. Should we attempt automatic JSON repair or ask LLM to fix?
3. How do we handle partial/incomplete responses?
4. Should raw responses be stored for debugging?

---

## Sub-Component 3.5: Character Analyzer

**Purpose:** Extract, deduplicate, and characterize entities

**Responsibilities:**
- Character identification across batches
- Name/alias resolution
- Physical and personality trait extraction
- Relationship mapping
- Role classification (protagonist, antagonist, etc.)

**Key Questions:**
1. How do we handle unnamed characters? (descriptive IDs?)
2. Should character confidence be per-character or overall?
3. How do we resolve "Girl with red hair" vs "Akari" (same person)?
4. What level of relationship detail? (ally/enemy vs specific dynamics)

---

## Sub-Component 3.6: Timeline Constructor

**Purpose:** Build chronological narrative from events

**Responsibilities:**
- Event extraction and classification
- Chronological ordering (handling flashbacks)
- Significance scoring
- Cause-and-effect linking
- Timeline gap detection

**Key Questions:**
1. Should we track both reading order AND chronological order?
2. How do we detect and handle flashbacks/time jumps?
3. What constitutes a "significant" event vs background?
4. How granular should events be? (per panel? per scene?)

---

## Sub-Component 3.7: Quality Assessor

**Purpose:** Validate analysis quality and flag issues

**Responsibilities:**
- Self-consistency checks
- Confidence scoring
- Issue detection (impossible timelines, duplicates)
- User intervention triggers
- Quality metrics calculation

**Key Questions:**
1. What confidence threshold triggers user review?
2. Should we auto-retry low-confidence analyses?
3. What issues should block downstream components vs just warn?
4. How do we measure and calibrate confidence scores?

---

## Sub-Component 3.8: Analysis Merger

**Purpose:** Combine multi-batch results into coherent whole

**Responsibilities:**
- Merge character lists across batches
- Integrate timeline segments
- Resolve batch boundary overlaps
- Deduplicate events
- Final confidence aggregation

**Key Questions:**
1. How do we handle character appearance in multiple batches?
2. Should overlapping batch regions be analyzed twice or deduplicated?
3. How do we resolve contradictions between batch analyses?
4. What is the final output format for downstream components?

---

## Interrogation Sequence

We will discuss each sub-component in order, gathering:
- Specific requirements and preferences
- Technical constraints
- Priority/focus areas
- Acceptance criteria

Ready to begin with **Sub-Component 3.1: Image Preprocessor**?
