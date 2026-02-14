# Storyline Analyzer: UI Specifications

## Apple Aesthetic Application

Analysis interfaces should feel scientific yet beautiful — like Apple Health or Research apps. Clean data visualization, subtle animations, and clear hierarchy.

| Principle | Application |
|-----------|-------------|
| Whitespace | Generous padding around data sections |
| Data Visualization | Clean timeline, character cards |
| Motion | Smooth progress animations |
| Typography | Clear hierarchy: summary > timeline > details |

---

## Screen 1: Analysis Initiation

**Layout:**
```
+--------------------------------------------------+
|  Manga Title                          [Close]    |
+--------------------------------------------------+
|                                                  |
|                                                  |
|              [Document Icon]                     |
|                                                  |
|         Ready to Analyze                         |
|                                                  |
|         This manga has not been analyzed yet.    |
|         The AI will read through all pages       |
|         and extract the storyline.               |
|                                                  |
|         Estimated time: 2-3 minutes              |
|                                                  |
|                                                  |
|         [      Start Analysis      ]             |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Document Icon: SF Symbol doc.text.magnifyingglass, 80px, blue
- Title: 28px semibold
- Description: 17px secondary text, centered
- Estimation: 15px tertiary text
- Button: 48px height, blue fill

**States:**

| State | Visual |
|-------|--------|
| Ready | Blue icon, solid button |
| Cached | Green check icon, "View Analysis" button |
| Stale | Yellow warning, "Re-analyze" button |

---

## Screen 2: Analysis in Progress

**Layout:**
```
+--------------------------------------------------+
|  Analyzing...                         [Cancel]   |
+--------------------------------------------------+
|                                                  |
|                                                  |
|            [Circular Progress]                   |
|                  75%                             |
|                                                  |
|         Processing batch 3 of 4...               |
|                                                  |
|  +--------------------------------------------+  |
|  | [===================>          ] 75%        |  |
|  +--------------------------------------------+  |
|                                                  |
|         Discovered:                              |
|         3 characters    12 events                |
|                                                  |
|         Estimated: 45 seconds remaining          |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Circular progress: 120px diameter, blue stroke
- Percentage: 34px semibold, centered
- Progress bar: Full width, 8px height, rounded caps
- Stats: 17px body, gray
- Estimation: 15px tertiary

**Animations:**
- Circular progress: Smooth stroke animation
- Progress bar: Width transition 0.3s ease
- Stats: Count up animation on change

---

## Screen 3: Analysis Complete

**Layout:**
```
+--------------------------------------------------+
|  Analysis Complete                    [Share]    |
+--------------------------------------------------+
|                                                  |
|  SUMMARY                                         |
|  ----------------------------------------------  |
|  In a world where magic has faded, a young       |
|  blacksmith named Kira discovers an ancient      |
|  forge that still holds power. When the          |
|  tyrannical Empire learns of her discovery,      |
|  she must flee her village and seek allies       |
|  among the scattered resistance...               |
|                                                  |
|  [Read More]                                     |
|                                                  |
|                                                  |
|  CHARACTERS (5)                    [View All]    |
|  ----------------------------------------------  |
|  +----------+  +----------+  +----------+       |
|  |          |  |          |  |          |       |
|  |   Kira   |  |   Rook   |  |  Empire  |       |
|  |          |  |          |  |   Lord   |       |
|  +----------+  +----------+  +----------+       |
|  Protagonist    Ally       Antagonist           |
|                                                  |
|                                                  |
|  TIMELINE (15 events)              [View All]    |
|  ----------------------------------------------  |
|  +------------------------------------------+   |
|  | 1 | The Last Forge                       |   |
|  |   | Kira discovers the ancient forge     |   |
|  +------------------------------------------+   |
|  +------------------------------------------+   |
|  | 2 | The Empire's Eye                     |   |
|  |   | Scouts report the magical activity   |   |
|  +------------------------------------------+   |
|  +------------------------------------------+   |
|  | 3 | Flight in the Night                  |   |
|  |   | Kira escapes the village raid        |   |
|  +------------------------------------------+   |
|                                                  |
|                                                  |
|         [   Find Anchor Events   ]               |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Summary: 17px body, 3 lines max with expand
- Character cards: 100px square, 12px radius, subtle shadow
- Timeline: Full-width rows, alternating subtle backgrounds
- Event number: 20px blue circle
- CTA Button: Full width, 48px height, blue

**Interactions:**
- Summary: Tap "Read More" to expand
- Character cards: Tap for detail modal
- Timeline rows: Tap for event detail
- Swipe: Horizontal scroll on character row

---

## Screen 4: Character Detail Modal

**Layout:**
```
+--------------------------------------+
|                                      |
|         [Character Portrait]         |
|                                      |
|         Kira                         |
|         Protagonist                  |
|                                      |
|  --------------------------------    |
|                                      |
|  Description                         |
|  A determined young blacksmith with  |
|  copper hair and green eyes. Quiet   |
|  but fiercely protective of friends. |
|                                      |
|  --------------------------------    |
|                                      |
|  Traits                              |
|  [Determined] [Loyal] [Skilled]      |
|                                      |
|  --------------------------------    |
|                                      |
|  Relationships                       |
|  Rook - Ally - Childhood friend      |
|  Empire Lord - Enemy - Tyrant        |
|                                      |
|  --------------------------------    |
|                                      |
|  First Appearance: Page 5            |
|                                      |
|           [Close]                    |
|                                      |
+--------------------------------------+
```

**Visual Specifications:**
- Modal: 90% width, max 500px, 20px radius
- Portrait: 120px circle, placeholder gradient
- Name: 28px semibold
- Role: 17px blue, uppercase
- Traits: Pill badges, 8px padding, blue background
- Relationships: Row per relation with type badge

---

## Screen 5: Timeline Detail View

**Layout:**
```
+--------------------------------------------------+
|  Timeline                             [Filter]   |
+--------------------------------------------------+
|                                                  |
|  Filter: [All] [Major] [Character: Kira]         |
|                                                  |
|  +------------------------------------------+   |
|  |                                          |   |
|  |  1                                       |   |
|  |  The Last Forge                          |   |
|  |  Major Event - Page 5-8                  |   |
|  |                                          |   |
|  |  Kira stumbles upon the ancient forge    |   |
|  |  hidden beneath her family's workshop.   |   |
|  |  The forge responds to her touch,        |   |
|  |  revealing she has latent magical        |   |
|  |  abilities.                              |   |
|  |                                          |   |
|  |  Characters: Kira                        |   |
|  |  Location: Village Forge                 |   |
|  |                                          |   |
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |                                          |   |
|  |  2                                       |   |
|  |  The Empire's Eye                        |   |
|  |  Moderate Event - Page 12-15             |   |
|  |  ...                                     |   |
|  |                                          |   |
|  +------------------------------------------+   |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Filter bar: Pill buttons, horizontal scroll
- Event cards: 16px radius, subtle border
- Event number: 28px blue circle
- Significance: Colored dot (Minor=gray, Major=orange, Climax=red)
- Page range: 15px tertiary text

---

## Screen 6: Analysis Error

**Layout:**
```
+--------------------------------------------------+
|                                                  |
|              [Error Icon]                        |
|                                                  |
|         Analysis Failed                          |
|                                                  |
|         The AI service returned an error.        |
|                                                  |
|         Error: Rate limit exceeded               |
|                                                  |
|         [   Retry Analysis   ]                   |
|                                                  |
|         [  Change Settings  ]                    |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Error Icon: SF Symbol exclamationmark.triangle, 80px, red
- Title: 28px semibold
- Message: 17px body
- Error detail: 15px monospace, gray background
- Primary button: Blue fill
- Secondary button: Gray outline

---

## Color Usage

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Progress Ring | blue 500 | blue 400 |
| Progress Track | gray 200 | gray 700 |
| Character Card BG | white | gray 800 |
| Timeline Row Alt | gray 50 | gray 900 |
| Event Number | blue 500 | blue 400 |
| Significance Major | orange 500 | orange 400 |
| Significance Climax | red 500 | red 400 |

---

## Animation Specifications

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Progress Ring | Continuous | Linear |
| Progress Bar | 0.3s | ease-in-out |
| Card Hover | 0.2s | ease-out |
| Modal Enter | 0.3s | spring |
| Timeline Expand | 0.3s | ease-out |
| Stats Counter | 0.5s | ease-out |
