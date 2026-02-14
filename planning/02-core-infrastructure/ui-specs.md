# Core Infrastructure: UI Specifications

> **Note:** This component is primarily backend/infrastructure. UI elements here are for configuration and developer tooling only. Main UI in Component 7.

---

## Apple Aesthetic Application

Even configuration screens follow Apple.com principles:

| Principle | Application |
|-----------|-------------|
| **Whitespace** | Generous padding around settings groups (48px+) |
| **Typography** | SF Pro (macOS/iOS), Inter (fallback). Clear hierarchy with -apple-system font stack |
| **Color** | Minimal. Neutral grays, single accent (blue `#0071e3`), dark mode support |
| **Inputs** | Clean borders, subtle focus states, generous touch targets (44px min) |
| **Feedback** | Subtle animations (0.2s ease), toast notifications |

---

## UI Elements

### E1: Settings Screen

**Layout:**
```
┌─────────────────────────────────────────┐
│  Settings                    [Close]    │  ← 64px height, centered title
├─────────────────────────────────────────┤
│                                         │
│  LLM PROVIDERS                          │  ← Section header (13px uppercase, gray)
│  ─────────────────────────────────────  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔵 Gemini                  ▶     │  │  ← Row (72px height)
│  │     Status: Connected             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  ⚪ OpenAI                  ▶     │  │
│  │     Status: Not configured        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ Add Provider]                       │  ← Secondary button
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  APPEARANCE                             │
│  ─────────────────────────────────────  │
│                                         │
│  Theme                              ▶   │  ← Navigation row
│  Language                           ▶   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  DATA                                   │
│  ─────────────────────────────────────  │
│                                         │
│  Export All Data                        │
│  Import Data                            │
│  Clear All Data                   [⚠️]  │  ← Destructive action
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Background: `systemGray6` / `#f5f5f7` (light), `#1d1d1f` (dark)
- Section headers: 13px, uppercase, `systemGray` / `#86868b`
- Row height: 72px
- Row separator: 1px `systemGray5`
- Chevron: `systemGray3`, 20px

---

### E2: API Key Input Modal

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│     Configure Gemini                    │  ← 28px semibold, centered
│                                         │
│     ┌─────────────────────────────┐     │
│     │ API Key                     │     │  ← Label (17px regular)
│     │ ┌─────────────────────────┐ │     │
│     │ │ AIzaSy...               │ │     │  ← Input (48px height)
│     │ └─────────────────────────┘ │     │
│     │                             │     │
│     │ [ℹ️] Your key is stored     │     │  ← 13px helper, gray
│     │     locally and encrypted   │     │
│     └─────────────────────────────┘     │
│                                         │
│     [    Test Connection    ]           │  ← Primary button
│                                         │
│              or                         │  ← 13px gray text
│                                         │
│     [      Cancel      ]                │  ← Text button
│                                         │
└─────────────────────────────────────────┘
```

**Interaction States:**
- Input focus: Blue border (`#0071e3`), subtle shadow
- Testing: Button shows spinner, disabled state
- Success: Green checkmark, auto-close after 1s
- Error: Red text below input, shake animation on modal

**Animation:**
- Modal entrance: Scale from 0.95 → 1.0, opacity 0 → 1 (0.3s ease-out)
- Modal exit: Reverse (0.2s ease-in)

---

### E3: Toast Notifications

**Types:**
```
┌─────────────────────────────────────────┐
│  ✅  Connected to Gemini          ✕     │  ← Success (green)
├─────────────────────────────────────────┤
│  ⚠️  Rate limit approaching       ✕     │  ← Warning (yellow)
├─────────────────────────────────────────┤
│  ❌  Failed to save changes       ✕     │  ← Error (red)
├─────────────────────────────────────────┤
│  ℹ️  Export completed             ✕     │  ← Info (blue)
└─────────────────────────────────────────┘
```

**Specifications:**
- Position: Bottom center, 24px from edge
- Width: Auto (max 400px)
- Height: 56px
- Border-radius: 12px
- Shadow: `0 8px 24px rgba(0,0,0,0.12)`
- Icon: 24px SF Symbol
- Auto-dismiss: 4s (except errors)
- Swipe to dismiss: Supported

**Animation:**
- Entrance: Slide up + fade (0.4s spring)
- Exit: Slide down + fade (0.2s ease)
- Stacking: Up to 3, offset by 8px

---

### E4: Developer Console (Hidden Feature)

**Access:** Settings → tap version number 5 times

**Layout:**
```
┌─────────────────────────────────────────┐
│  Developer              [Clear] [Close] │
├─────────────────────────────────────────┤
│  ─────────────────────────────────────  │
│  [LOGS] [STATE] [NETWORK] [PERF]        │  ← Segmented control
│  ─────────────────────────────────────  │
│                                         │
│  14:32:01  INFO  App initialized        │
│  14:32:02  INFO  Restored session       │
│  14:32:05  DEBUG Gemini request: 234ms  │
│  14:32:08  WARN  Slow query detected    │
│  14:32:12  ERROR Failed to parse image  │
│                                         │
│  ─────────────────────────────────────  │
│  [Copy Logs]        [Export State]      │
└─────────────────────────────────────────┘
```

**Specifications:**
- Monospace font (SF Mono / Menlo)
- Log levels color-coded
- Copy-to-clipboard on tap
- Share sheet for export

---

## Color Palette

```css
/* Light Mode */
--background-primary: #ffffff;
--background-secondary: #f5f5f7;      /* systemGray6 */
--background-tertiary: #e8e8ed;       /* systemGray5 */

--text-primary: #1d1d1f;
--text-secondary: #86868b;            /* systemGray */
--text-tertiary: #6e6e73;             /* systemGray2 */

--accent: #0071e3;                    /* Apple blue */
--accent-hover: #0077ed;
--success: #34c759;
--warning: #ff9500;
--error: #ff3b30;

--border: rgba(0, 0, 0, 0.1);
--border-strong: rgba(0, 0, 0, 0.2);

/* Dark Mode */
--background-primary: #000000;
--background-secondary: #1d1d1f;
--background-tertiary: #2c2c2e;

--text-primary: #f5f5f7;
--text-secondary: #86868b;
--text-tertiary: #6e6e73;

--accent: #0a84ff;
--accent-hover: #409cff;
```

---

## Typography Scale

| Style | Size | Weight | Line | Usage |
|-------|------|--------|------|-------|
| Large Title | 34px | Bold | 41px | Modal headers |
| Title 1 | 28px | Semibold | 34px | Screen titles |
| Title 2 | 22px | Semibold | 28px | Section headers |
| Title 3 | 20px | Semibold | 25px | Card titles |
| Headline | 17px | Semibold | 22px | Button text, labels |
| Body | 17px | Regular | 22px | Primary text |
| Callout | 16px | Regular | 21px | Emphasized body |
| Subhead | 15px | Regular | 20px | Secondary text |
| Footnote | 13px | Regular | 18px | Helper text, captions |
| Caption | 12px | Regular | 16px | Metadata |

---

## Animation Curves

```css
/* Standard */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Entrance (decelerate) */
--ease-entrance: cubic-bezier(0.0, 0.0, 0.2, 1);

/* Exit (accelerate) */
--ease-exit: cubic-bezier(0.4, 0.0, 1, 1);

/* Spring (bouncy) */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```
