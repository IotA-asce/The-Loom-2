# React UI Application: Sub-Component Breakdown

> Component 7 decomposed into 10 focused sub-components. Each will be interrogated separately to define the Apple-aesthetic interface.

---

## Sub-Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REACT UI APPLICATION (Component 7)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    7.1 Application Shell                        │   │
│  │         (Navigation, layout, theme, global state)               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                     │
│         │                    │                    │                     │
│         ▼                    ▼                    ▼                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
│  │  7.2        │      │  7.3        │      │  7.4        │            │
│  │  Library    │      │  Upload     │      │  Analysis   │            │
│  │  Manager    │      │  Flow       │      │  Viewer     │            │
│  └─────────────┘      └─────────────┘      └─────────────┘            │
│         │                    │                    │                     │
│         └────────────────────┼────────────────────┘                     │
│                              ▼                                         │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
│  │  7.5        │      │  7.6        │      │  7.7        │            │
│  │  Anchor     │      │  Branch     │      │  Reader     │            │
│  │  Explorer   │      │  Studio     │      │  & Editor   │            │
│  └─────────────┘      └─────────────┘      └─────────────┘            │
│                              │                                         │
│         ┌────────────────────┼────────────────────┐                    │
│         │                    │                    │                    │
│         ▼                    ▼                    ▼                    │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐           │
│  │  7.8        │      │  7.9        │      │  7.10       │           │
│  │  Settings   │      │  Onboarding │      │  Feedback   │           │
│  │  & Config   │      │  & Help     │      │  System     │           │
│  └─────────────┘      └─────────────┘      └─────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Component 7.1: Application Shell

**Purpose:** The foundational container — navigation, layout structure, theming, global state management, and responsive behavior.

**Responsibilities:**
- Top navigation bar with logo and primary actions
- Sidebar navigation for main sections (Library, Upload, etc.)
- Theme management (light/dark/auto)
- Responsive layout (desktop/tablet/mobile)
- Global state (current view, user preferences)
- Toast notifications and modals
- Keyboard shortcuts

**Key Questions:**
1. Navigation structure — sidebar, top bar, or both?
2. Theme approach — system preference, manual toggle, or both?
3. Mobile strategy — responsive web or dedicated mobile views?
4. Animation philosophy — subtle (Apple) or more pronounced?

---

## Sub-Component 7.2: Library Manager

**Purpose:** Browse, organize, and manage the user's manga collection and generated stories.

**Responsibilities:**
- Grid/list view of manga cards
- Search and filter functionality
- Sorting options (recent, alphabetical, progress)
- Collection organization (folders, tags)
- Import status indicators
- Quick actions (analyze, delete, export)

**Key Questions:**
1. Default view — grid or list? What information density?
2. Organization — folders, tags, or both? Auto or manual?
3. Search scope — titles only or full content?
4. Generated stories — separate section or integrated?

---

## Sub-Component 7.3: Upload Flow

**Purpose:** Import manga files with drag-and-drop and chapter segmentation.

**Responsibilities:**
- Drag-and-drop zone with visual feedback
- File type validation and preview
- Progress indication during processing
- Chapter segmentation review interface
- Duplicate detection and handling
- Batch upload support

**Key Questions:**
1. Upload entry point — dedicated page or modal?
2. Chapter segmentation — mandatory review or optional?
3. Batch handling — queue display or background processing?
4. Error handling — inline or separate error view?

---

## Sub-Component 7.4: Analysis Viewer

**Purpose:** View storyline analysis results — timeline, characters, themes.

**Responsibilities:**
- Storyline summary display
- Interactive timeline visualization
- Character cards and relationships
- Theme exploration
- Analysis progress for ongoing analysis
- Trigger re-analysis

**Key Questions:**
1. Timeline view — linear, branching, or both?
2. Character display — grid, list, or relationship graph?
3. Analysis status — inline or separate progress view?
4. Interactivity — how much can users manipulate the analysis?

---

## Sub-Component 7.5: Anchor Explorer

**Purpose:** Browse, review, and select anchor events for branching.

**Responsibilities:**
- List/grid of detected anchor events
- Anchor detail view with alternatives
- Confidence and impact visualization
- User rating and notes
- Manual anchor creation
- Selection for branch generation

**Key Questions:**
1. Anchor presentation — cards, list, or timeline overlay?
2. Detail view — inline expand or modal?
3. Selection workflow — select then generate, or continuous?
4. Manual anchors — prominent feature or hidden?

---

## Sub-Component 7.6: Branch Studio

**Purpose:** Generate, compare, and refine story branches.

**Responsibilities:**
- Branch generation setup (preferences, count)
- Branch comparison interface
- Branch detail and preview
- Branch selection for continuation
- User editing of branch premise
- Export branches

**Key Questions:**
1. Generation flow — inline or dedicated page?
2. Comparison view — side-by-side, list, or tree?
3. Branch editing — what can users modify?
4. Selection workflow — single or multiple branches?

---

## Sub-Component 7.7: Reader & Editor

**Purpose:** Read generated chapters and edit them with AI assistance.

**Responsibilities:**
- Clean reading interface with typography controls
- Chapter navigation (next/previous, jump to)
- In-place editing with formatting toolbar
- AI assistance panel (rewrite, expand, etc.)
- Version history and branching
- Export and sharing options

**Key Questions:**
1. Reading mode — distraction-free or with controls?
2. Editing — inline or separate edit mode?
3. AI assistance — always visible or on-demand?
4. Version control — prominent or hidden?

---

## Sub-Component 7.8: Settings & Configuration

**Purpose:** Configure application preferences, API keys, and behavior.

**Responsibilities:**
- LLM provider configuration (API keys, preferences)
- Default generation settings
- Theme and appearance
- Notification preferences
- Data management (export, clear)
- Advanced/developer options

**Key Questions:**
1. Settings organization — grouped by category or search?
2. API key management — secure but accessible?
3. Defaults — per-user or per-project?
4. Advanced settings — hidden or visible?

---

## Sub-Component 7.9: Onboarding & Help

**Purpose:** Guide new users and provide help throughout the app.

**Responsibilities:**
- First-time user onboarding flow
- Contextual tips and hints
- Comprehensive help documentation
- Tutorial mode for complex features
- FAQ and troubleshooting
- Feedback submission

**Key Questions:**
1. Onboarding length — quick or comprehensive?
2. Help style — tooltips, modals, or dedicated page?
3. Contextual tips — persistent or dismissible?
4. Tutorial — interactive or video/text?

---

## Sub-Component 7.10: Feedback System

**Purpose:** Collect user feedback, report issues, and show system status.

**Responsibilities:**
- In-app feedback submission
- Bug reporting with logs
- Feature request voting
- System status (API health, queue status)
- Analytics and usage insights (opt-in)
- Release notes and updates

**Key Questions:**
1. Feedback entry — always visible or menu item?
2. Bug reports — automated log collection or manual?
3. Status visibility — always visible or on-demand?
4. Analytics — opt-in or opt-out?

---

## Interrogation Sequence

We will discuss each sub-component in order, gathering:
- Specific UI/UX preferences
- Apple aesthetic application
- Navigation and flow preferences
- Accessibility considerations

Ready to begin with **Sub-Component 7.1: Application Shell**?
