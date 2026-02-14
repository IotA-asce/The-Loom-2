# Decision: Auto Chapter Segmentation

## Status
Accepted

## Context
During Component 3 interrogation, the need for automatic chapter segmentation became apparent. Users may upload entire manga as folders of loose scanned images, and manually organizing these into chapters would be tedious.

## Decision
Implement automatic chapter segmentation in Component 2 (Manga Ingestion Engine) with the following characteristics:

### Detection Methods
1. **Cover Page Detection** - Primary method
   - Visual analysis for title placement
   - Panel density check (covers have fewer panels)
   - Art style distinctiveness
   - Chapter number patterns

2. **Bonus Artwork Filtering** - Secondary method
   - Detect omake/bonus pages
   - Filter advertisements and previews
   - Identify character illustrations

3. **Page Number OCR** - Optional method
   - Read page numbers if present
   - Detect discontinuities
   - Confidence-based weighting

### User Experience
- Automatic detection runs on folder upload
- User review interface with confidence indicators
- Ability to adjust boundaries, merge/split chapters
- Import as separate entries or grouped chapters

### Target Accuracy
- 80%+ correct chapter detection for standard manga
- User review for low-confidence boundaries (< 50%)

## Consequences

**Positive:**
- Significantly improves UX for folder uploads
- Reduces manual organization effort
- Enables proper chapter-based analysis

**Negative:**
- Adds ~9 hours to Component 2 implementation
- Requires image analysis capabilities (may use LLM or CV)
- Complex UI for review/adjustment

## Implementation Notes
- Added as Feature F9 in Component 2
- New Phase 6 in tasks (5 tasks, ~9 hours)
- UI specs added for segmentation review screen
