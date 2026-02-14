# Anchor Event Detector: UI Specifications

## Apple Aesthetic Application

The anchor detection interface should feel like exploring a story map — clean, focused, with subtle visual hierarchy guiding the eye to important decision points.

| Principle | Application |
|-----------|-------------|
| **Whitespace** | Generous padding around anchor cards |
| **Focus** | Clear visual distinction for selected anchors |
| **Typography** | Event titles prominent, details secondary |
| **Motion** | Smooth expand/collapse for details |
| **Feedback** | Confidence badges, impact indicators |

---

## Screen 1: Anchor Detection Loading

**Layout:**
```
+--------------------------------------------------+
|  Detecting Anchor Events                [Cancel] |
+--------------------------------------------------+
|                                                  |
|                                                  |
|            [Circular Progress]                   |
|                  Analyzing...                    |
|                                                  |
|         Scanning timeline for pivotal            |
|         moments...                               |
|                                                  |
|         Events analyzed: 24/40                   |
|         Potential anchors found: 8               |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Circular progress: 80px, blue stroke
- Status text: 17px secondary
- Counters: 22px semibold
- Estimated time: 10-30 seconds for typical manga

---

## Screen 2: Anchor Event List

**Layout:**
```
+--------------------------------------------------+
|  Anchor Events                          [Filter] |
+--------------------------------------------------+
|  8 potential branching points detected           |
|                                                  |
|  Sort: [Relevance ▼]    Filter: [All Types ▼]    |
|                                                  |
|  +------------------------------------------+   |
|  | ⭐ 95%  THE DECISION AT THE CROSSROADS   |   |
|  |        Decision • Page 45-52             |   |
|  |                                          |   |
|  |        Kira chose to save the village    |   |
|  |        Could have: Fled, Fought,         |   |
|  |        Negotiated                        |   |
|  |                                          |   |
|  |        Impact: High • 4 chars affected   |   |
|  |        [Select]  [Details]               |   |
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |    88%  THE STRANGER'S WARNING           |   |
|  |        Revelation • Page 78-82           |   |
|  |                                          |   |
|  |        Rook revealed his true identity   |   |
|  |        Could have: Stayed silent, Ran    |   |
|  |                                          |   |
|  |        Impact: Very High • Story pivot   |   |
|  |        [Select]  [Details]               |   |
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |    72%  THE MISSED CONFESSION            |   |
|  |        Missed Chance • Page 120-121      |   |
|  |        ...                               |   |
|  +------------------------------------------+   |
|                                                  |
|  [+ Add Manual Anchor]                           |
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │  2 anchors selected                    │     |
|  │  [     Generate Branches     ]         │     |
|  └────────────────────────────────────────┘     |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Cards: Full width, 12px radius, subtle shadow
- Confidence badge: 
  - 90-100%: Green circle
  - 70-89%: Blue circle
  - 50-69%: Orange circle
  - <50%: Gray circle (hidden by default)
- Type label: 13px uppercase, gray
- Impact: Color-coded (High=orange, Very High=red)
- Select button: Toggle style (selected = blue fill)
- Bottom bar: Sticky, shows selection count

**Interactions:**
- Tap card: Expand/collapse details
- Select button: Toggle selection state
- Details button: Open full detail modal
- Swipe left: Quick actions (favorite, hide)

---

## Screen 3: Anchor Detail Modal

**Layout:**
```
+--------------------------------------+
|  The Decision at the Crossroads      |
|  Chapter 3, Pages 45-52              |
+--------------------------------------+
|                                      |
|  CONFIDENCE                          |
|  [██████████████████░░] 95%          |
|                                      |
|  WHAT HAPPENED                       |
|  Kira stood at the crossroads        |
|  between pursuing the Empire spy     |
|  and returning to defend her         |
|  village from attack. She chose      |
|  the village, saving it but letting  |
|  the spy escape with vital           |
|  intelligence.                       |
|                                      |
|  ALTERNATIVE OUTCOMES                |
|  +--------------------------------+ |
|  | 1. Pursue the Spy              | |
|  |    The village falls, but Kira | |
|  |    captures critical intel...  | |
|  |    [Preview Branch]            | |
|  +--------------------------------+ |
|  +--------------------------------+ |
|  | 2. Attempt Negotiation         | |
|  |    Kira tries to save both,    | |
|  |    leading to a tense...       | |
|  |    [Preview Branch]            | |
|  +--------------------------------+ |
|  +--------------------------------+ |
|  | 3. Call for Reinforcements     | |
|  |    She sends a signal to...    | |
|  |    [Preview Branch]            | |
|  +--------------------------------+ |
|                                      |
|  IMPACT ANALYSIS                     |
|  Characters affected: 4              |
|  Downstream changes: 8 events        |
|  Branch complexity: Moderate         |
|                                      |
|  [⭐ Favorite]  [📝 Add Note]        |
|                                      |
|  ┌────────────────────────────────┐ |
|  │     [  Select for Branching  ] │ |
|  └────────────────────────────────┘ |
|                                      |
+--------------------------------------+
```

**Visual Specifications:**
- Modal: 90% width, max 500px, 20px radius
- Confidence bar: Full width, 8px height
- Alternative cards: Subtle border, left accent color
- Impact stats: 15px, gray
- Action buttons: Text + icon style

---

## Screen 4: Manual Anchor Creation

**Layout:**
```
+--------------------------------------------------+
|  Create Manual Anchor                   [Cancel] |
+--------------------------------------------------+
|                                                  |
|  SOURCE                                          |
|  [Select from Timeline Events ▼]                |
|  or                                              |
|  Page Range: [====|==========>====]             |
|  Start: 45    End: 52                           |
|                                                  |
|  ANCHOR DETAILS                                  |
|  Title:                                          |
|  [The Decision at the Crossroads    ]           |
|                                                  |
|  What Happened:                                  |
|  [                                              |
|   Kira chose to save the village...             |
|                                                  |
|   Multi-line text area                          |
|  ]                                               |
|                                                  |
|  What Could Change:                              |
|  [                                              |
|   She could have pursued the spy...             |
|                                                  |
|   Multi-line text area                          |
|  ]                                               |
|                                                  |
|  Type: [Decision              ▼]                |
|                                                  |
|  Alternative 1: [Fled to safety          ]      |
|  Alternative 2: [Negotiated with enemy   ]      |
|  [+ Add Another Alternative]                     |
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │         [    Save Anchor    ]          │     |
|  └────────────────────────────────────────┘     |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Input fields: 48px height, rounded 8px
- Text areas: Min 100px height, expand
- Dropdown: Native iOS-style picker
- Dynamic alternatives: Can add/remove
- Validation: Red border on invalid fields

---

## Screen 5: Filter and Sort

**Layout:**
```
+--------------------------------------------------+
|  Filter Anchors                         [Reset]  |
+--------------------------------------------------+
|                                                  |
|  SORT BY                                         |
|  (•) Relevance (branching potential)            |
|  ( ) Confidence                                 |
|  ( ) Timeline position                          |
|  ( ) Impact level                               |
|                                                  |
|  ANCHOR TYPE                                     |
|  [All Types ▼]                                   |
|                                                  |
|  Or select specific:                             |
|  [✓] Decision    [✓] Accident                   |
|  [✓] Revelation  [✓] Conflict                   |
|  [✓] Meeting     [✓] Betrayal                   |
|  [ ] Missed Chance                              |
|  [ ] External                                   |
|  [ ] Sacrifice                                  |
|                                                  |
|  CONFIDENCE RANGE                                |
|  [High (80-100%) ▼]                              |
|                                                  |
|  IMPACT LEVEL                                    |
|  [Any Impact ▼]                                  |
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │      [    Apply Filters    ]           │     |
|  └────────────────────────────────────────┘     |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Radio buttons for single-select
- Checkboxes for multi-select
- Segmented control for quick toggles
- Apply button: Primary, full width

---

## Color Usage

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Confidence High (90%+) | green 500 | green 400 |
| Confidence Medium (70-89%) | blue 500 | blue 400 |
| Confidence Low (50-69%) | orange 500 | orange 400 |
| Impact High | orange 500 | orange 400 |
| Impact Very High | red 500 | red 400 |
| Selected Card | blue 50 bg | blue 900 bg |
| Alternative Card Border | gray 200 | gray 700 |

---

## Animation Specifications

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Card Expand | 0.3s | ease-out |
| Card Collapse | 0.2s | ease-in |
| Select Toggle | 0.15s | ease |
| Modal Enter | 0.3s | spring |
| List Filter | 0.2s | ease |
| Progress Update | 0.3s | ease-in-out |
