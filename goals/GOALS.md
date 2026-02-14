# The Loom 2 — Comprehensive Development Goals

> Complete checklist for building The Loom 2, organized by component and sub-component.

---

## Legend

- [ ] Not Started
- [~] In Progress
- [x] Complete

---

## Component 1: Core Infrastructure

### 1.1 Project Setup
- [x] Initialize Vite + React + TypeScript project
- [x] Configure path aliases (@/ for src)
- [x] Enable strict TypeScript mode
- [x] Setup ESLint + Prettier configuration
- [x] Configure lint-staged and husky pre-commit hooks
- [x] Install core dependencies (Zustand, React Query, Dexie)
- [x] Verify dev server starts in < 2s
- [x] Verify production build succeeds

### 1.2 State Management
- [x] Create Zustand store structure
- [x] Implement PreferencesStore (theme, default LLM, language)
- [x] Implement ConfigStore (providers, activeProviderId)
- [x] Implement UIStore (sidebar state, modal state)
- [ ] Add Zustand persistence middleware
- [ ] Add Redux DevTools compatibility
- [ ] Configure React Query client
- [ ] Setup QueryClientProvider in app root
- [ ] Implement encrypted storage for API keys (crypto-js)

### 1.3 LLM Provider Abstraction
- [ ] Define LLMProvider interface
- [ ] Implement GeminiProvider (primary)
- [ ] Implement OpenAIProvider (fallback)
- [ ] Implement AnthropicProvider (optional)
- [ ] Create LLM Provider Factory
- [ ] Implement API key validation
- [ ] Add token usage tracking
- [ ] Implement retry logic with exponential backoff
- [ ] Add automatic fallback on failure

### 1.4 Database Layer
- [ ] Setup Dexie.js database
- [ ] Define Manga table schema
- [ ] Define Storyline table schema
- [ ] Define AnchorEvent table schema
- [ ] Define Branch table schema
- [ ] Define Chapter table schema
- [ ] Add compound indexes for queries
- [ ] Implement MangaRepository CRUD
- [ ] Implement StorylineRepository CRUD
- [ ] Implement AnchorEventRepository CRUD
- [ ] Implement BranchRepository CRUD
- [ ] Implement ChapterRepository CRUD
- [ ] Create database migration system
- [ ] Add data export/import functionality

### 1.5 Error Handling & Logging
- [ ] Create AppError base class
- [ ] Implement NetworkError subclass
- [ ] Implement LLMError subclass
- [ ] Implement ValidationError subclass
- [ ] Create ErrorBoundary React component
- [ ] Implement error logging system
- [ ] Add log levels (ERROR, WARN, INFO, DEBUG)
- [ ] Create developer console (hidden feature)

### 1.6 Configuration UI
- [ ] Create SettingsScreen component
- [ ] Implement ProviderConfigModal
- [ ] Create Toast notification system
- [ ] Implement API key input with masking
- [ ] Add test connection functionality
- [ ] Implement theme toggle (manual only)

---

## Component 2: Manga Ingestion Engine

### 2.1 Core Upload Infrastructure
- [ ] Create file type detection utility
- [ ] Implement drag-and-drop hook
- [ ] Create file reader utility with progress
- [ ] Support CBZ/ZIP format
- [ ] Support CBR/RAR format
- [ ] Support PDF format
- [ ] Support individual images (PNG, JPG, WebP)

### 2.2 Archive Processing
- [ ] Implement ZIP/CBZ extractor (JSZip)
- [ ] Implement RAR/CBR extractor (unrar-js)
- [ ] Create progress callback system
- [ ] Handle nested folder structures
- [ ] Implement memory-efficient streaming
- [ ] Add corrupt archive detection

### 2.3 PDF Processing
- [ ] Integrate pdf.js
- [ ] Render PDF pages to canvas
- [ ] Convert canvas to WebP/JPEG
- [ ] Extract PDF metadata
- [ ] Show per-page progress

### 2.4 Image Processing
- [ ] Implement natural sort algorithm
- [ ] Create thumbnail generator (200x280px)
- [ ] Generate WebP thumbnails
- [ ] Add image validation
- [ ] Detect double-page spreads
- [ ] Handle image orientation

### 2.5 Page Ordering
- [ ] Implement natural sort for pages
- [ ] Support numeric extract from filenames
- [ ] Handle folder + file ordering
- [ ] Add manual reorder capability
- [ ] Support reverse order (right-to-left)

### 2.6 Duplicate Detection
- [ ] Implement MD5/SHA-256 hashing
- [ ] Check against existing manga
- [ ] Show duplicate warning modal
- [ ] Options: Skip, Replace, Import as new

### 2.7 Auto Chapter Segmentation
- [ ] Implement cover page detection
- [ ] Detect chapter title placement
- [ ] Analyze panel density
- [ ] Detect distinctive art style
- [ ] Identify bonus/omake pages
- [ ] Implement page number OCR
- [ ] Detect volume boundaries
- [ ] Create segmentation review UI
- [ ] Allow manual boundary adjustment

### 2.8 Storage Integration
- [ ] Extend database schema for chapters
- [ ] Save manga metadata
- [ ] Store page references
- [ ] Save thumbnails to IndexedDB
- [ ] Handle partial processing recovery

### 2.9 UI Components
- [ ] Create DropZone component
- [ ] Create ProgressModal component
- [ ] Create MangaCard component
- [ ] Create LibraryGrid component
- [ ] Create DuplicateModal component
- [ ] Create ChapterSegmentationReview component

---

## Component 3: Storyline Analyzer

### 3.1 Image Preprocessor
- [ ] Create image quality assessment
- [ ] Implement format optimization (WebP)
- [ ] Calculate optimal batch sizes
- [ ] Handle double-page spreads
- [ ] Implement user-configurable preprocessing
- [ ] Add optional AI upscaling toggle
- [ ] Implement margin cropping
- [ ] Add auto-rotate functionality

### 3.2 Prompt Engine
- [ ] Create multi-stage prompt architecture
- [ ] Build Visual Overview prompt
- [ ] Build Character Discovery prompt
- [ ] Build Timeline Extraction prompt
- [ ] Build Relationship Mapping prompt
- [ ] Build Theme Synthesis prompt
- [ ] Implement genre-specific prompt variants
- [ ] Add prompt versioning system
- [ ] Create A/B testing framework
- [ ] Implement user customization interface

### 3.3 LLM Orchestrator
- [ ] Create AnalysisService class
- [ ] Implement batch processing logic
- [ ] Create batch calculator per provider
- [ ] Implement overlapping batches
- [ ] Add progress tracking
- [ ] Implement sequential processing
- [ ] Add thorough mode (10-15 min)
- [ ] Implement retry with exponential backoff (3x)
- [ ] Add fallback provider switching
- [ ] Implement detailed cost tracking

### 3.4 Response Parser
- [ ] Implement JSON extraction
- [ ] Create Zod schema validation
- [ ] Handle malformed JSON with LLM repair
- [ ] Implement strict validation
- [ ] Add schema evolution support
- [ ] Store raw responses for debugging
- [ ] Implement backward-compatible migrations

### 3.5 Character Analyzer
- [ ] Implement character extraction
- [ ] Create descriptive ID system for unnamed characters
- [ ] Build character deduplication (LLM-based)
- [ ] Implement alias resolution
- [ ] Create relationship mapping
- [ ] Track character states across batches
- [ ] Implement historical relationship tracking
- [ ] Support dynamic character introduction
- [ ] Calculate per-character confidence scores

### 3.6 Timeline Constructor
- [ ] Implement event extraction
- [ ] Support both reading and chronological order
- [ ] Add LLM-flagged flashback detection
- [ ] Implement significance-based event filtering
- [ ] Create multi-factor significance scoring
- [ ] Build full causal dependency graph
- [ ] Track timeline gaps with estimation
- [ ] Cross-reference parallel events

### 3.7 Quality Assessor
- [ ] Implement multi-factor confidence calibration
- [ ] Create severity-based blocking system
- [ ] Build impact-based issue classification
- [ ] Implement guided intervention wizard
- [ ] Add auto-retry for low confidence
- [ ] Create user review triggers (< 0.5 confidence)
- [ ] Build quality metrics dashboard

### 3.8 Analysis Merger
- [ ] Implement character timeline merge
- [ ] Create deduplication for overlapping batches
- [ ] Build hybrid contradiction resolution (confidence + LLM)
- [ ] Implement overlap merge with gap detection
- [ ] Track relationship evolution across batches
- [ ] Generate multiple output views (for Components 4-6)
- [ ] Implement full audit provenance

### 3.9 UI Components
- [ ] Create AnalysisButton component
- [ ] Create AnalysisProgress component
- [ ] Create StorylineSummary component
- [ ] Create CharacterGrid component
- [ ] Create CharacterDetailModal component
- [ ] Create TimelineList component
- [ ] Create TimelineEventCard component
- [ ] Create AnalysisError component

---

## Component 4: Anchor Event Detector

### 4.1 Candidate Filtering
- [ ] Filter by significance (MODERATE+)
- [ ] Filter by major character involvement
- [ ] Analyze causal impact
- [ ] Apply diversity constraints
- [ ] Create candidate pool builder

### 4.2 LLM Analysis
- [ ] Create anchor analysis prompt
- [ ] Implement batch candidate processing
- [ ] Generate alternative outcomes (2-4 per anchor)
- [ ] Classify anchor types (9 types)
- [ ] Calculate branching potential scores

### 4.3 Scoring and Ranking
- [ ] Calculate multi-dimension scores
- [ ] Implement branching potential algorithm
- [ ] Calculate narrative weight
- [ ] Identify affected characters
- [ ] Count downstream events
- [ ] Estimate branch complexity
- [ ] Apply diversity filters

### 4.4 Data Storage
- [ ] Create AnchorEvent table
- [ ] Create AlternativeOutcome table
- [ ] Implement anchor repository
- [ ] Add analysis caching

### 4.5 UI Components
- [ ] Create AnchorCard component
- [ ] Create AnchorList component
- [ ] Create AnchorDetailModal component
- [ ] Create ManualAnchorForm component
- [ ] Create FilterModal component
- [ ] Create DetectionProgress component

---

## Component 5: Branch Generator

### 5.1 Context Assembler
- [ ] Extract anchor event details
- [ ] Compile full character states (all context required)
- [ ] Assemble world state snapshot
- [ ] Gather narrative style profile
- [ ] Implement adaptive context selection per anchor type
- [ ] Package context in timeline narrative format

### 5.2 Premise Generator
- [ ] Transform alternatives into premises
- [ ] Generate "what if" statements
- [ ] Create branch titles and descriptions
- [ ] Implement hybrid format (hook + subtitle)
- [ ] Support theme-based premise distinctness
- [ ] Add user guidance (character focus)
- [ ] Validate premises (plausibility + story-fit + interest)

### 5.3 Branch Variation Generator
- [ ] Generate 2-5 branches per anchor (anchor-dependent)
- [ ] Differentiate by consequence type (personal/political/cosmic)
- [ ] Implement theme progression
- [ ] Support user mood preference (hopeful/tragic/mixed/dark)
- [ ] Implement adaptive trajectory depth
- [ ] Project arcs for all affected characters

### 5.4 Consistency Validator
- [ ] Implement context-aware strictness
- [ ] Create tiered validation (core/secondary/minor traits)
- [ ] Support user-controlled deviation levels
- [ ] Distinguish hard vs. soft world rules
- [ ] Implement suggest-fix workflow
- [ ] Validate all 8 dimensions

### 5.5 Branch Refiner
- [ ] Implement user-triggered refinement
- [ ] Support user-decided iteration count (1-5)
- [ ] Create 8-priority refinement areas
- [ ] Implement critique-based refinement
- [ ] Support instruction + conversation feedback
- [ ] Stop on user satisfaction

### 5.6 Branch Comparator
- [ ] Implement 8-dimension comparison
- [ ] Create tree diagram visualization
- [ ] Calculate character fate similarity
- [ ] Show detailed similarities with toggle
- [ ] Support full arc comparison scope
- [ ] Allow unlimited branch comparison

### 5.7 Data Storage
- [ ] Create Branch table
- [ ] Store branch premises and trajectories
- [ ] Save character state snapshots
- [ ] Implement branch versioning

### 5.8 UI Components
- [ ] Create BranchCard component
- [ ] Create BranchList component
- [ ] Create BranchComparisonView component
- [ ] Create PremiseEditor component
- [ ] Create BranchDetailModal component

---

## Component 6: Story Continuation Engine

### 6.1 Context Manager
- [ ] Include all previous chapters in full (Gemini 1M context)
- [ ] Track reactive character evolution
- [ ] Implement user-controlled world state changes
- [ ] Support full parallel structure
- [ ] Create comprehensive character knowledge database
- [ ] Implement event-based memory derivation

### 6.2 Outline Architect
- [ ] Always show outline before writing (mandatory approval)
- [ ] Generate very detailed outlines (dialogue snippets)
- [ ] Support suggestion-based modification
- [ ] Mirror original manga structure variety
- [ ] Plan scene-by-scene emotional arcs
- [ ] Support user cliffhanger selection per chapter

### 6.3 Content Composer
- [ ] Implement iterative generation (draft→review→expand→polish)
- [ ] Add timeout/retry + user intervention for stuck generation
- [ ] Show complete polished chapter (no streaming)
- [ ] Enforce style guide throughout
- [ ] Match original dialogue-to-narration ratio
- [ ] Support rich descriptions (user adjustable)

### 6.4 Voice Synthesizer
- [ ] Implement hybrid voice capture (examples + rules + profile)
- [ ] Support reactive voice evolution
- [ ] Allow user-defined voices for minor characters
- [ ] Implement user-guided differentiation for similar voices
- [ ] Train narrative voice on original prose samples
- [ ] Match original manga internal monologue style

### 6.5 Continuity Guardian
- [ ] Implement continuous background validation
- [ ] Create context-aware strictness levels
- [ ] Implement suggest-fix workflow
- [ ] Build per-character knowledge database
- [ ] Verify all cross-chapter callbacks
- [ ] Rank error severity appropriately

### 6.6 Chapter Refiner
- [ ] Support multi-level refinement scope
- [ ] Allow unlimited refinement iterations
- [ ] Implement explicit user-approved learning
- [ ] Provide all 7 AI assistance features
- [ ] Create branching version history
- [ ] Implement AI-assisted collaboration mode

### 6.7 Story Archivist
- [ ] Retain all versions
- [ ] Support branching from any point in generated story
- [ ] Export to all 6 formats (TXT, MD, EPUB, PDF, HTML, DOCX)
- [ ] Organize library by branch tree structure
- [ ] Implement comprehensive search (title, content, character, tags)
- [ ] Support export-only sharing (privacy-first)

### 6.8 UI Components
- [ ] Create ChapterReader component
- [ ] Create ChapterEditor component
- [ ] Create OutlinePreview component
- [ ] Create GenerationSetup component
- [ ] Create StoryProgress component
- [ ] Create AIAssistPanel component

---

## Component 7: React UI Application

### 7.1 Application Shell
- [ ] Implement top bar + sidebar navigation
- [ ] Create manual-only theme toggle (light/dark)
- [ ] Build desktop-first responsive design
- [ ] Implement subtle Apple-style animations (200-400ms)
- [ ] Apply airy layout density (generous whitespace)
- [ ] Place primary actions contextually
- [ ] Implement keyboard shortcuts
- [ ] Add toast notification system

### 7.2 Library Manager
- [ ] Support adaptive view (grid/list/compact)
- [ ] Implement both + auto-organization (folders + tags + AI)
- [ ] Add titles-only search (fast, fuzzy)
- [ ] Nest generated stories under source manga
- [ ] Implement priority quick actions
- [ ] Create tutorial empty state

### 7.3 Upload Flow
- [ ] Create modal upload experience
- [ ] Implement drag-and-drop with visual feedback
- [ ] Support optional chapter segmentation review
- [ ] Build queue display with polling progressbar
- [ ] Handle errors inline
- [ ] Show comprehensive progress (percentage + stages + time)
- [ ] Display success with next step suggestions
- [ ] Support batch upload

### 7.4 Analysis Viewer (96 hrs)
- [ ] Create tabbed interface with 5 views (Summary, Timeline, Characters, Themes, Relationships)
- [ ] Implement horizontal scrollable timeline with zoom/pan
- [ ] Build character card grid with expandable detail view
- [ ] Create theme visualization with keyword highlighting
- [ ] Implement relationship graph visualization
- [ ] Add real-time streaming updates during analysis
- [ ] Support user notes and ratings on analysis elements
- [ ] Implement export (PDF, JSON, Print-friendly)
- [ ] Add timeline zoom and navigation controls
- [ ] Implement keyboard shortcuts (arrow navigation, zoom, tab switching)
- [ ] Add virtualized rendering for large datasets
- [ ] Ensure full accessibility (screen reader, keyboard navigation, ARIA labels)

### 7.5 Anchor Explorer (100 hrs)
- [ ] Display anchor cards/list (TBD based on interrogation)
- [ ] Show anchor detail view (TBD based on interrogation)
- [ ] Support selection workflow (TBD based on interrogation)
- [ ] Display confidence and impact
- [ ] Support manual anchor creation (TBD based on interrogation)
- [ ] Allow user rating and notes

### 7.6 Branch Studio (106 hrs)
- [ ] Create comparison grid view (2-3 columns side-by-side)
- [ ] Implement branch generation settings panel
- [ ] Build branch cards with premise display and preview
- [ ] Create tree visualization mode for branch relationships
- [ ] Implement premise editing interface with validation
- [ ] Build branch selection workflow with confirmation
- [ ] Add regenerate with feedback mechanism
- [ ] Implement variation grouping by premise similarity
- [ ] Create "Continue to Story Generation" flow
- [ ] Add generation settings panel (creativity, style, length)
- [ ] Implement outline preview before full generation
- [ ] Add keyboard shortcuts (navigation, selection, actions)
- [ ] Ensure full accessibility support

### 7.7 Story Reader & Editor (112 hrs)
- [ ] Implement vertical scroll reading mode (default)
- [ ] Create chapter navigation (previous/next, dropdown, keyboard)
- [ ] Build reading progress tracking (scroll position + time)
- [ ] Implement branch switching panel with history
- [ ] Create collapsible table of contents drawer
- [ ] Add typography preferences (font, size, line spacing, margins)
- [ ] Implement theme support (light/dark/sepia/custom)
- [ ] Create manga-style RTL reading mode with spreads
- [ ] Build focus mode (distraction-free reading)
- [ ] Add bookmarking system with quick access
- [ ] Implement reading statistics dashboard
- [ ] Create AI assistant panel for editing suggestions
- [ ] Add keyboard shortcuts (navigation, bookmarks, settings)
- [ ] Ensure full accessibility (screen reader, focus management)

### 7.8 Settings Panel (98 hrs)
- [ ] Create category sidebar navigation (General, LLM, Analysis, Appearance, Data, Advanced)
- [ ] Implement search and filter for settings
- [ ] Build encrypted API key storage with secure input
- [ ] Create LLM provider configuration (add/edit/delete providers)
- [ ] Implement connection testing with status indicators
- [ ] Add analysis quality preferences (speed vs thoroughness)
- [ ] Build theme and appearance settings (light/dark, accent color)
- [ ] Implement data export/import functionality
- [ ] Create storage management (cleanup, usage stats)
- [ ] Add accessibility settings (motion, contrast, font size)
- [ ] Build advanced settings panel with warnings
- [ ] Implement auto-save and unsaved change detection
- [ ] Add keyboard navigation support
- [ ] Ensure WCAG 2.1 AA accessibility compliance

### 7.9 Onboarding Flow (98 hrs)
- [ ] Create welcome screen with animated feature introduction
- [ ] Build multi-step wizard framework with progress indicator
- [ ] Implement feature introduction slides (Library, Analysis, Branching, Reading)
- [ ] Create API setup wizard with validation
- [ ] Build interactive tutorial system (spotlight/highlight overlays)
- [ ] Add sample manga pre-loading for first-time users
- [ ] Implement progress tracking and resume capability
- [ ] Create skip and exit handling with confirmation
- [ ] Add contextual help integration (tooltips, info buttons)
- [ ] Implement "What's New" feature spotlights for updates
- [ ] Ensure full accessibility compliance (keyboard navigation, screen reader)

### 7.10 Feedback System (98 hrs)
- [ ] Implement full-page error boundary with recovery options
- [ ] Create component-level error boundaries (graceful degradation)
- [ ] Build recovery actions (retry, reset to safe state, export data)
- [ ] Implement toast notification system (success, error, warning, info)
- [ ] Create user feedback form with category selection
- [ ] Add automatic context collection (logs, state, system info)
- [ ] Build system status dashboard (LLM health, storage, performance)
- [ ] Implement real-time health indicators in UI
- [ ] Create debug log viewer for troubleshooting
- [ ] Add log export functionality for support
- [ ] Implement error deduplication to prevent spam
- [ ] Add privacy controls for data collection
- [ ] Ensure accessibility (error announcements, focus management)

---

## Cross-Cutting Concerns

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Reduced motion support
- [ ] High contrast mode
- [ ] Focus indicators

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse Score > 90
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading

### Security
- [ ] API key encryption at rest
- [ ] No sensitive data in logs
- [ ] Secure IndexedDB storage
- [ ] Input validation
- [ ] XSS protection

### Testing
- [ ] Unit test coverage > 70%
- [ ] Integration tests for each component
- [ ] E2E tests for critical paths
- [ ] Visual regression tests
- [ ] Performance benchmarks

---

## Summary Statistics

| Category | Items | Completed |
|----------|-------|-----------|
| Component 1: Core Infrastructure | 45 | 0 |
| Component 2: Manga Ingestion | 45 | 0 |
| Component 3: Storyline Analyzer | 65 | 0 |
| Component 4: Anchor Detector | 22 | 0 |
| Component 5: Branch Generator | 38 | 0 |
| Component 6: Story Continuation | 50 | 0 |
| Component 7: React UI | 98 | 0 |
| Cross-Cutting | 20 | 0 |
| **Total** | **383** | **0** |

---

*Last Updated: 2026-02-15*
*Status: Planning Complete — All Component 7 UI specs finalized (708 hrs)*
