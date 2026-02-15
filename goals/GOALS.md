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
- [x] Add Zustand persistence middleware
- [x] Add Redux DevTools compatibility
- [x] Configure React Query client
- [x] Setup QueryClientProvider in app root
- [x] Implement encrypted storage for API keys (crypto-js)

### 1.3 LLM Provider Abstraction
- [x] Define LLMProvider interface
- [x] Implement GeminiProvider (primary)
- [x] Implement OpenAIProvider (fallback)
- [x] Implement AnthropicProvider (optional)
- [x] Create LLM Provider Factory
- [x] Implement API key validation
- [x] Add token usage tracking
- [x] Implement retry logic with exponential backoff
- [x] Add automatic fallback on failure

### 1.4 Database Layer
- [x] Setup Dexie.js database
- [x] Define Manga table schema
- [x] Define Storyline table schema
- [x] Define AnchorEvent table schema
- [x] Define Branch table schema
- [x] Define Chapter table schema
- [x] Add compound indexes for queries
- [x] Implement MangaRepository CRUD
- [x] Implement StorylineRepository CRUD
- [x] Implement AnchorEventRepository CRUD
- [x] Implement BranchRepository CRUD
- [x] Implement ChapterRepository CRUD
- [x] Create database migration system
- [x] Add data export/import functionality

### 1.5 Error Handling & Logging
- [x] Create AppError base class
- [x] Implement NetworkError subclass
- [x] Implement LLMError subclass
- [x] Implement ValidationError subclass
- [x] Create ErrorBoundary React component
- [x] Implement error logging system
- [x] Add log levels (ERROR, WARN, INFO, DEBUG)
- [x] Create developer console (hidden feature)

### 1.6 Configuration UI
- [x] Create SettingsScreen component
- [x] Implement ProviderConfigModal
- [x] Create Toast notification system
- [x] Implement API key input with masking
- [x] Add test connection functionality
- [x] Implement theme toggle (manual only)

---

## Component 2: Manga Ingestion Engine

### 2.1 Core Upload Infrastructure
- [x] Create file type detection utility
- [x] Implement drag-and-drop hook
- [x] Create file reader utility with progress
- [x] Support CBZ/ZIP format
- [x] Support CBR/RAR format
- [x] Support PDF format
- [x] Support individual images (PNG, JPG, WebP)

### 2.2 Archive Processing
- [x] Implement ZIP/CBZ extractor (JSZip)
- [x] Implement RAR/CBR extractor (unrar-js)
- [x] Create progress callback system
- [x] Handle nested folder structures
- [x] Implement memory-efficient streaming
- [x] Add corrupt archive detection

### 2.3 PDF Processing
- [x] Integrate pdf.js
- [x] Render PDF pages to canvas
- [x] Convert canvas to WebP/JPEG
- [x] Extract PDF metadata
- [x] Show per-page progress

### 2.4 Image Processing
- [x] Implement natural sort algorithm
- [x] Create thumbnail generator (200x280px)
- [x] Generate WebP thumbnails
- [x] Add image validation
- [x] Detect double-page spreads
- [x] Handle image orientation

### 2.5 Page Ordering
- [x] Implement natural sort for pages
- [x] Support numeric extract from filenames
- [x] Handle folder + file ordering
- [x] Add manual reorder capability
- [x] Support reverse order (right-to-left)

### 2.6 Duplicate Detection
- [x] Implement MD5/SHA-256 hashing
- [x] Check against existing manga
- [x] Show duplicate warning modal
- [x] Options: Skip, Replace, Import as new

### 2.7 Auto Chapter Segmentation
- [x] Implement cover page detection
- [x] Detect chapter title placement
- [x] Analyze panel density
- [x] Detect distinctive art style
- [x] Identify bonus/omake pages
- [x] Implement page number OCR
- [x] Detect volume boundaries
- [x] Create segmentation review UI
- [x] Allow manual boundary adjustment

### 2.8 Storage Integration
- [x] Extend database schema for chapters
- [x] Save manga metadata
- [x] Store page references
- [x] Save thumbnails to IndexedDB
- [x] Handle partial processing recovery

### 2.9 UI Components
- [x] Create DropZone component
- [x] Create ProgressModal component
- [x] Create MangaCard component
- [x] Create LibraryGrid component
- [x] Create DuplicateModal component
- [x] Create ChapterSegmentationReview component

---

## Component 3: Storyline Analyzer

### 3.1 Image Preprocessor
- [x] Create image quality assessment
- [x] Implement format optimization (WebP)
- [x] Calculate optimal batch sizes
- [x] Handle double-page spreads
- [x] Implement user-configurable preprocessing
- [x] Add optional AI upscaling toggle
- [x] Implement margin cropping
- [x] Add auto-rotate functionality

### 3.2 Prompt Engine
- [x] Create multi-stage prompt architecture
- [x] Build Visual Overview prompt
- [x] Build Character Discovery prompt
- [x] Build Timeline Extraction prompt
- [x] Build Relationship Mapping prompt
- [x] Build Theme Synthesis prompt
- [x] Implement genre-specific prompt variants
- [x] Add prompt versioning system
- [x] Create A/B testing framework
- [x] Implement user customization interface

### 3.3 LLM Orchestrator
- [x] Create AnalysisService class
- [x] Implement batch processing logic
- [x] Create batch calculator per provider
- [x] Implement overlapping batches
- [x] Add progress tracking
- [x] Implement sequential processing
- [x] Add thorough mode (10-15 min)
- [x] Implement retry with exponential backoff (3x)
- [x] Add fallback provider switching
- [x] Implement detailed cost tracking

### 3.4 Response Parser
- [x] Implement JSON extraction
- [x] Create Zod schema validation
- [x] Handle malformed JSON with LLM repair
- [x] Implement strict validation
- [x] Add schema evolution support
- [x] Store raw responses for debugging
- [x] Implement backward-compatible migrations

### 3.5 Character Analyzer
- [x] Implement character extraction
- [x] Create descriptive ID system for unnamed characters
- [x] Build character deduplication (LLM-based)
- [x] Implement alias resolution
- [x] Create relationship mapping
- [x] Track character states across batches
- [x] Implement historical relationship tracking
- [x] Support dynamic character introduction
- [x] Calculate per-character confidence scores

### 3.6 Timeline Constructor
- [x] Implement event extraction
- [x] Support both reading and chronological order
- [x] Add LLM-flagged flashback detection
- [x] Implement significance-based event filtering
- [x] Create multi-factor significance scoring
- [x] Build full causal dependency graph
- [x] Track timeline gaps with estimation
- [x] Cross-reference parallel events

### 3.7 Quality Assessor
- [x] Implement multi-factor confidence calibration
- [x] Create severity-based blocking system
- [x] Build impact-based issue classification
- [x] Implement guided intervention wizard
- [x] Add auto-retry for low confidence
- [x] Create user review triggers (< 0.5 confidence)
- [x] Build quality metrics dashboard

### 3.8 Analysis Merger
- [x] Implement character timeline merge
- [x] Create deduplication for overlapping batches
- [x] Build hybrid contradiction resolution (confidence + LLM)
- [x] Implement overlap merge with gap detection
- [x] Track relationship evolution across batches
- [x] Generate multiple output views (for Components 4-6)
- [x] Implement full audit provenance

### 3.9 UI Components
- [x] Create AnalysisButton component
- [x] Create AnalysisProgress component
- [x] Create StorylineSummary component
- [x] Create CharacterGrid component
- [x] Create CharacterDetailModal component
- [x] Create TimelineList component
- [x] Create TimelineEventCard component
- [x] Create AnalysisError component

---

## Component 4: Anchor Event Detector

### 4.1 Candidate Filtering
- [x] Filter by significance (MODERATE+)
- [x] Filter by major character involvement
- [x] Analyze causal impact
- [x] Apply diversity constraints
- [x] Create candidate pool builder

### 4.2 LLM Analysis
- [x] Create anchor analysis prompt
- [x] Implement batch candidate processing
- [x] Generate alternative outcomes (2-4 per anchor)
- [x] Classify anchor types (9 types)
- [x] Calculate branching potential scores

### 4.3 Scoring and Ranking
- [x] Calculate multi-dimension scores
- [x] Implement branching potential algorithm
- [x] Calculate narrative weight
- [x] Identify affected characters
- [x] Count downstream events
- [x] Estimate branch complexity
- [x] Apply diversity filters

### 4.4 Data Storage
- [x] Create AnchorEvent table (exists)
- [x] Create AlternativeOutcome table (embedded in schema)
- [x] Implement anchor repository
- [x] Add analysis caching with 24hr TTL

### 4.5 UI Components
- [x] Create AnchorCard component
- [x] Create AnchorList component
- [x] Create AnchorDetailModal component
- [x] Create ManualAnchorForm component
- [ ] Create FilterModal component
- [ ] Create DetectionProgress component

---

## Component 5: Branch Generator

### 5.1 Context Assembler
- [x] Extract anchor event details
- [x] Compile full character states (all context required)
- [x] Assemble world state snapshot
- [x] Gather narrative style profile
- [x] Implement adaptive context selection per anchor type
- [x] Package context in timeline narrative format

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
