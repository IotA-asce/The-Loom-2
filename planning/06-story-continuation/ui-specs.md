# Story Continuation Engine: UI Specifications

## Apple Aesthetic Application

The reading and writing interface should feel like a premium reading app — clean, focused on content, with subtle controls that don't distract from the story.

| Principle | Application |
|-----------|-------------|
| **Focus** | Content-first, chrome minimized |
| **Typography** | Beautiful reading typography, adjustable |
| **Whitespace** | Generous margins for comfortable reading |
| **Motion** | Smooth page transitions, subtle animations |
| **Feedback** | Progress indicators, save states |

---

## Screen 1: Chapter Generation Setup

**Layout:**
```
+--------------------------------------------------+
|  New Chapter                                    [X]|
+--------------------------------------------------+
|                                                  |
|  Continue from: "The Dark Bargain"               |
|  Branch: Kira chose the forbidden ritual         |
|                                                  |
|  PREVIOUS CHAPTER SUMMARY                        |
|  ┌────────────────────────────────────────┐     |
|  │ Kira performed the ritual, sacrificing │     |
|  │ her memories of her mother to gain     │     |
|  │ dark power. She now feels the magic    │     |
|  │ coursing through her, but at what      │     |
|  │ cost...                                │     |
|  └────────────────────────────────────────┘     |
|                                                  |
|  CHAPTER OPTIONS                                 |
|                                                  |
|  Target Length: [Standard ▼]                     |
|    • Short (~10 min)                             |
|    • Standard (~15 min)                          |
|    • Long (~25 min)                              |
|                                                  |
|  Tone: [Match Branch ▼]                          |
|    • Darker                                      |
|    • Lighter                                     |
|    • More action                                 |
|    • More character focus                        |
|                                                  |
|  Special Requests (optional):                    |
|  [Focus on Kira's internal conflict             ]|
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │     [  Generate Chapter Outline  ]     │     │
|  └────────────────────────────────────────┘     │
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Branch info card: Subtle background, 12px radius
- Summary box: Light gray background
- Dropdowns: Native iOS style
- Text area: 100px height, expands
- Primary button: Full width, 48px height

---

## Screen 2: Chapter Outline Preview

**Layout:**
```
+--------------------------------------------------+
|  Chapter 4 Outline                      [Back]   |
+--------------------------------------------------+
|                                                  |
|  Title: The Price of Power                       |
|  Estimated: 2,800 words • ~14 min read           |
|                                                  |
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    |
|                                                  |
|  Scene 1: AWAKENING                              |
|  ├─ Characters: Kira, Dark Presence              |
|  ├─ Location: Ritual Chamber                     |
|  ├─ Purpose: Kira wakes with new power           |
|  └─ Beat: Fear, wonder, uncertainty              │
|                                                  |
|  Scene 2: CONFRONTATION                          │
|  ├─ Characters: Kira, Rook                       │
|  ├─ Location: Chamber entrance                   │
|  ├─ Purpose: Rook finds Kira, reacts to change   │
|  └─ Beat: Tension, distrust, desperation         │
|                                                  |
|  Scene 3: FIRST USE                              │
|  ├─ Characters: Kira, Bandits                    │
|  ├─ Location: Forest path                        │
|  ├─ Purpose: Kira tests her new power            │
|  └─ Beat: Action, violence, horror at ease       │
|                                                  |
|  Scene 4: AFTERMATH                              │
|  ├─ Characters: Kira                             │
|  ├─ Location: Forest clearing                    │
|  ├─ Purpose: Kira processes what she's done      │
|  └─ Beat: Guilt, resolve, cliffhanger            │
|                                                  |
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
|                                                  │
|  Unresolved Threads:                             │
|  • Rook's suspicion of Kira                      │
|  • Empire's approaching forces                   │
|                                                  │
|  ┌────────────────────────────────────────┐     │
|  │  [  Generate Full Chapter  ]           │     │
|  │  [  Modify Outline  ]                  │     │
|  └────────────────────────────────────────┘     │
|                                                  │
+--------------------------------------------------+
```

**Visual Specifications:**
- Scene headers: 17px semibold
- Scene details: 15px, gray, indented
- Beat line: Italic, blue accent
- Unresolved threads: Pill badges
- Secondary button: Gray outline

---

## Screen 3: Chapter Reading

**Layout:**
```
+--------------------------------------------------+
|  ←  The Price of Power                  [Menu]   |
+--------------------------------------------------+
|                                                  |
|                                                  |
|         Chapter 4                                |
|                                                  |
|         The Price of Power                       |
|                                                  |
|  ─────────────────────────────────────────────   │
|                                                  │
|                                                  │
|     Kira woke to darkness. Not the comfortable   │
|     darkness of sleep, but a profound, hungry    │
|     void that seemed to pulse with its own       │
|     heartbeat. She raised her hand before her    │
|     face and watched shadows coil around her     │
|     fingers like eager serpents.                 │
|                                                  │
|     "It worked," she whispered, and the darkness │
|     whispered back.                              │
|                                                  │
|     The memories of her mother were already      │
|     fading—not gone, but distant, like           │
|     photographs left in the sun. Kira reached    │
|     for them, panicked, but the dark power       │
|     surged through her veins and the panic       │
|     melted into something else. Something        │
|     powerful. Something hungry.                  │
|                                                  │
|     She was still staring at her transformed     │
|     hand when the chamber door burst open.       │
|                                                  │
|                                                  │
|  ─────────────────────────────────────────────   │
|                                                  │
|  ~2,400 words • 12 min read • Quality: 92%       │
|                                                  │
|  ┌────────────────────────────────────────┐     │
|  │  [Edit]  [Regenerate]  [Next Chapter →]│     │
|  └────────────────────────────────────────┘     │
|                                                  │
+--------------------------------------------------+
```

**Visual Specifications:**
- Chapter number: 15px uppercase, gray, centered
- Chapter title: 28px serif font, centered
- Body text: 18px serif, 1.6 line height
- Margins: 24px horizontal
- Quality badge: Right side of footer
- Action bar: Floating, semi-transparent

**Reading Settings (accessible via menu):**
- Font size adjustment
- Font family (serif/sans)
- Theme (light/sepia/dark)
- Line spacing

---

## Screen 4: Chapter Editor

**Layout:**
```
+--------------------------------------------------+
|  Editing Chapter 4                      [Done]   |
+--------------------------------------------------+
|                                                  │
|  ┌────────────────────────────────────────┐     │
|  │ Title: [The Price of Power         ]   │     │
|  └────────────────────────────────────────┘     │
|                                                  │
|  [Full text editor with formatting toolbar]     │
|                                                  │
|  ┌────────────────────────────────────────┐     │
|  │ AI Assist                              │     │
|  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │     │
|  │ • Rewrite selection                    │     │
|  │ • Expand description                   │     │
|  │ • Make more tense                      │     │
|  │ • Add dialogue                         │     │
|  │ • Fix continuity issue                 │     │
|  └────────────────────────────────────────┘     │
|                                                  │
|  ┌────────────────────────────────────────┐     │
|  │ Suggestions:                           │     │
|  │ "Consider adding more sensory details  │     │
|  │  to the ritual scene"                  │     │
|  └────────────────────────────────────────┘     │
|                                                  │
|  [Save Draft]  [Discard Changes]                 │
|                                                  │
+--------------------------------------------------+
```

**Visual Specifications:**
- Text editor: Full remaining space
- Toolbar: Bold, italic, undo, redo
- AI assist panel: Collapsible, right side
- Suggestions: Subtle cards below editor

---

## Screen 5: Story Progress View

**Layout:**
```
+--------------------------------------------------+
|  Story Progress                         [Read]   |
+--------------------------------------------------+
|                                                  │
|  Branch: The Dark Bargain                        │
|  4 chapters • ~45 min read time                  │
|                                                  │
|  CHAPTERS                                        │
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
|                                                  │
|  ✓ Ch 1: The Forbidden Door                      │
|    ~2,100 words                                  │
|                                                  │
|  ✓ Ch 2: The Choice                              │
|    ~2,400 words                                  │
|                                                  │
|  ✓ Ch 3: Sacrifice                               │
|    ~2,200 words                                  │
|                                                  │
|  ✓ Ch 4: The Price of Power                      │
|    ~2,400 words                                  │
|                                                  │
|  → Ch 5: [Generate Next]                         │
|                                                  │
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
|                                                  │
|  CHARACTER ARCS                                  │
|  • Kira: Dark transformation in progress         │
|  • Rook: Growing suspicion                       │
|                                                  │
|  UNRESOLVED THREADS                              │
|  • Empire's approach                             │
|  • Kira's memory loss                            │
|                                                  │
|  [Export Story]  [End Story Here]                │
|                                                  │
+--------------------------------------------------+
```

**Visual Specifications:**
- Chapter list: Checkmark for completed
- Current chapter: Highlighted
- Next chapter: CTA button style
- Character arcs: Progress indicators
- Unresolved threads: Bullet list

---

## Color Usage (Reading Themes)

| Element | Light | Sepia | Dark |
|---------|-------|-------|------|
| Background | white | #f4ecd8 | #1a1a1a |
| Text | #1a1a1a | #5b4636 | #d1d1d1 |
| Accent | blue 500 | brown 600 | blue 400 |
| Selection | blue 100 | brown 200 | blue 900 |

---

## Animation Specifications

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Page Turn | 0.4s | ease-out |
| Menu Open | 0.3s | ease-out |
| Chapter Load | 0.5s | ease-in-out |
| Text Selection | 0.1s | linear |
| Scroll | native | native |
