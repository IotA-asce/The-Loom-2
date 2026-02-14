# Decision: Primary LLM Selection

## Status
Accepted

## Context
The application requires an LLM capable of:
- Processing manga images (scanned pages) — multimodal capability required
- Understanding complex narrative structures across multiple chapters
- Generating coherent, context-aware story continuations
- Operating within reasonable cost/performance bounds

## Decision
**Gemini** will be the primary LLM.

**Rationale:**
- Native multimodal (vision + text) — essential for manga page analysis
- Large context window (up to 1M+ tokens) — can process entire story arcs
- Competitive pricing for image analysis
- Well-documented API with structured output support

**Secondary options to support:**
- GPT-4V / GPT-4o (OpenAI) — alternative multimodal
- Claude 3 (Anthropic) — strong narrative understanding
- Local models (Llava, etc.) — for privacy-conscious users

## Consequences

**Positive:**
- Single API for both image analysis and text generation
- Can process multiple pages in single request
- Structured JSON output for anchor events

**Negative:**
- API key management complexity for multiple providers
- Rate limits may require queue system
- Cost scales with image resolution/page count

## Implementation Notes

Create abstraction layer: `LLMProvider` interface with implementations:
- `GeminiProvider`
- `OpenAIProvider`
- `AnthropicProvider`

UI allows API key configuration per provider.
