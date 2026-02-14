# Manga Ingestion Engine: UI Specifications

## Apple Aesthetic Application

This component features the primary entry point for user content. The upload experience must feel effortless and delightful.

| Principle | Application |
|-----------|-------------|
| Whitespace | Drop zone takes center stage, minimal chrome |
| Motion | Smooth state transitions, progress animations |
| Feedback | Immediate visual response to every action |
| Simplicity | One primary action: drop files here |

---

## Screen 1: Empty Library / Upload Entry

**Layout:**
```
+--------------------------------------------------+
|                                                  |
|                                                  |
|                                                  |
|              [Upload Icon]                       |
|                                                  |
|         Drop manga files here                    |
|                                                  |
|    or                                            |
|                                                  |
|         [     Select Files     ]                 |
|                                                  |
|                                                  |
|    Supports: CBZ, CBR, PDF, Images               |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Background: system background color
- Upload Icon: SF Symbol document.arrow.up, 64px, gray
- Primary Text: 28px semibold, centered
- Button: 44px height, pill shape, blue accent
- Supported formats: 15px secondary text

**States:**

| State | Appearance |
|-------|------------|
| Idle | Subtle dashed border 2px, gray |
| Drag Over | Solid blue border 3px, blue tint bg, scale 1.02 |
| Invalid | Red border, shake animation |

---

## Screen 2: Processing Upload

**Layout:**
```
+--------------------------------------------------+
|                                                  |
|              [Animated Spinner]                  |
|                                                  |
|         Processing MyManga.cbz                   |
|                                                  |
|         [=====================>    ] 85%         |
|                                                  |
|         Extracting images...                     |
|                                                  |
|              [Cancel]                            |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Spinner: Circular progress, blue accent
- Filename: 22px semibold
- Progress bar: 280px width, 4px height, rounded
- Stage label: 17px secondary text
- Cancel: Text button, red on hover

**Animation:**
- Progress bar: Smooth width transition, 0.3s ease
- Stage changes: Crossfade text, 0.2s
- Complete: Green checkmark scales up from center

---

## Screen 3: Library Grid

**Layout:**
```
+--------------------------------------------------+
|  Library                              [+ Import] |
+--------------------------------------------------+
|                                                  |
|  +-----------+  +-----------+  +-----------+    |
|  |           |  |           |  |           |    |
|  |  Cover    |  |  Cover    |  |  Cover    |    |
|  |           |  |           |  |           |    |
|  +-----------+  +-----------+  +-----------+    |
|  Manga Title    Another One     Third Manga     |
|  24 pages       18 pages        32 pages        |
|                                                  |
|  +-----------+  +-----------+  +-----------+    |
|  |           |  |           |  |           |    |
|  |           |  |           |  |           |    |
|  |           |  |           |  |           |    |
|  +-----------+  +-----------+  +-----------+    |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Card: 200x280px thumbnail, 12px border radius
- Title: 17px semibold, 1 line, ellipsis overflow
- Metadata: 15px secondary text
- Gap: 24px between cards
- Hover: Scale 1.03, subtle shadow

---

## Screen 4: Duplicate Warning Modal

**Layout:**
```
+--------------------------------------+
|                                      |
|         Duplicate Detected           |
|                                      |
|   This file appears to already       |
|   exist in your library.             |
|                                      |
|   [Skip Import]                      |
|   [Replace Existing]                 |
|   [Import as New]                    |
|                                      |
+--------------------------------------+
```

**Visual Specifications:**
- Modal: 400px width, 20px padding
- Title: 22px semibold
- Message: 17px body text
- Buttons: Stacked, full width, 48px height
- Destructive action: Red text

---

## Screen 5: Import Error

**Layout:**
```
+--------------------------------------------------+
|                                                  |
|              [Error Icon]                        |
|                                                  |
|         Could not import file                    |
|                                                  |
|         File appears to be corrupt               |
|         or unsupported format.                   |
|                                                  |
|              [Try Again]                         |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Error Icon: SF Symbol exclamationmark.triangle, 64px, red
- Title: 22px semibold
- Message: 17px secondary text
- Button: Secondary style

---

## Color Usage

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Drop Zone Border | gray 300 | gray 600 |
| Drop Zone Active | blue 500 | blue 400 |
| Progress Bar | blue 500 | blue 400 |
| Progress Track | gray 200 | gray 700 |
| Error | red 500 | red 400 |
| Success | green 500 | green 400 |

---

## Animation Specifications

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Drag Over | 0.2s | ease-out |
| Progress Update | 0.3s | ease-in-out |
| Card Hover | 0.2s | ease-out |
| Modal Enter | 0.3s | spring |
| Modal Exit | 0.2s | ease-in |
| Shake Error | 0.5s | shake keyframes |

---

## Responsive Breakpoints

| Breakpoint | Grid Columns | Drop Zone |
|------------|--------------|-----------|
| Desktop (>1024px) | 3-4 columns | Full center |
| Tablet (768-1024px) | 2-3 columns | Full center |
| Mobile (<768px) | 1-2 columns | Full screen |

---

## Screen 7: Chapter Segmentation Review

**Layout:**
```
+--------------------------------------------------+
|  Chapter Segmentation                 [Auto]     |
+--------------------------------------------------+
|                                                  |
|  Detected 5 chapters with 85% confidence         |
|                                                  |
|  +------------------------------------------+   |
|  | Ch 1 | Page 1-24              [Adjust]   |   |
|  |      | Cover: "The Beginning"            |   |
|  |      | Confidence: 95%                   |   |
|  +------------------------------------------+   |
|  +------------------------------------------+   |
|  | Ch 2 | Page 25-48             [Adjust]   |   |
|  |      | Cover: "First Battle"             |   |
|  |      | Confidence: 88%                   |   |
|  +------------------------------------------+   |
|  +------------------------------------------+   |
|  | ???  | Page 49-50             [Review]   |   |
|  |      | Possible bonus artwork            |   |
|  |      | Confidence: 45%                   |   |
|  +------------------------------------------+   |
|                                                  |
|  [Add Chapter]  [Merge Selected]                 |
|                                                  |
|  [   Import as Separate Manga Entries   ]        |
|  [   Import as Grouped Chapters         ]        |
|                                                  |
+--------------------------------------------------+
```

**Visual Specifications:**
- Chapter rows: Full width, 72px height
- Cover thumbnail: 48x64px, left side
- Confidence badge: Color-coded (green >80%, yellow 50-80%, red <50%)
- Adjust button: Opens boundary editor
- Bonus artwork flagged with warning color

**Adjust Chapter Boundary Modal:**
```
+--------------------------------------+
|  Adjust Chapter 2 Boundaries          |
+--------------------------------------+
|                                       |
|  [Thumbnail Grid - 10 pages visible]  |
|                                       |
|  Start: Page 25    [<-] [->]         |
|  End:   Page 48    [<-] [->]         |
|                                       |
|  Pages: 24                            |
|                                       |
|  Preview:                             |
|  +--------------------------------+  |
|  | First page of chapter          |  |
|  | Last page of chapter           |  |
|  +--------------------------------+  |
|                                       |
|  [Cancel]        [Save Changes]      |
+--------------------------------------+
```

**Specifications:**
- Thumbnail grid: Horizontal scroll, 80px height
- Page navigation: Arrow buttons, jump by 1 or 5
- Live preview: Updates as boundaries change
- Visual indicators: Green line at chapter start, red line at end
