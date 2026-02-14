# Manga Ingestion Engine: Features

## F1: Multi-Format Upload Support

**Description:** Accept manga in various file formats.

**Supported Formats:**
- CBZ (.cbz, .zip) - Archive extract, standard manga format
- CBR (.cbr, .rar) - Archive extract, requires unrar-js
- PDF (.pdf) - pdf.js render, convert pages to images
- Images (.png, .jpg, .jpeg, .webp) - Direct, individual or multiple

**Requirements:**
- Format auto-detection by extension and MIME type
- Graceful error for unsupported formats
- File type icon in upload UI

**Acceptance Criteria:**
- CBZ opens and extracts all images
- CBR opens (using unrar-js) and extracts
- PDF renders all pages at reasonable quality
- Individual images accepted
- Mixed file selection handled gracefully

---

## F2: Drag and Drop Interface

**Description:** Primary method for importing manga files.

**Interaction States:**
- Idle: Subtle dashed border, upload icon, hint text
- Drag Over: Solid border, blue tint, scale up slightly
- Valid Drop: Green check preview, ready to accept
- Invalid Drop: Red tint, shake animation, error hint
- Processing: Progress bar, file info, cancel button
- Complete: Green checkmark, fade to library

**Requirements:**
- Full-screen drop zone or dedicated area
- Accept files from file manager
- Accept files from browser (drag from other tab)
- Visual feedback for all states
- Touch support for mobile (tap to open picker)

**Acceptance Criteria:**
- Drag file from desktop triggers drag-over state
- Drop processes file immediately
- Invalid files show helpful error
- Multiple files queued correctly
- Cancel button stops processing


---

## F3: Archive Extraction

**Description:** Extract images from CBZ/CBR/ZIP files client-side.

**Libraries:**
- ZIP/CBZ: JSZip
- RAR/CBR: unrar-js or libarchive.js

**Process:**
1. Read archive as binary
2. List all entries
3. Filter for image files
4. Extract in chunks for memory management
5. Create object URLs for images

**Requirements:**
- Progress callback during extraction
- Skip non-image files silently
- Handle nested folders
- Memory-efficient streaming extraction

**Acceptance Criteria:**
- 100MB archive extracts without crash
- Progress updates every 5 percent or 100ms
- Nested folder structure flattened or preserved
- Corrupt archive detected and reported


---

## F4: Page Ordering

**Description:** Ensure manga pages are in correct reading order.

**Sorting Strategies:**
- Natural Sort for standard naming patterns
- Numeric Extract for filenames like vol1_p003.jpg
- Folder plus File for organized releases
- Manual drag-to-reorder for non-standard naming

**Requirements:**
- Automatic natural sort as default
- Preview grid for verification
- Drag-to-reorder capability
- Reverse order option for right-to-left manga

**Acceptance Criteria:**
- page1.png comes before page2.png
- page10.png comes after page9.png
- User can reorder by dragging
- Order persists with manga metadata

---

## F5: Thumbnail Generation

Generate small previews for library view.

Specifications:
- Size: 200x280px for manga aspect ratio
- Format: WebP with JPEG fallback
- Quality: 80
- First page used as cover
- Generated async in background

Requirements:
- Non-blocking generation
- Cancelable if user navigates away
- Placeholder while generating

Acceptance Criteria:
- Thumbnail generated for each manga
- Generation does not block UI
- Placeholder shown while generating
- Thumbnails stored efficiently

---

## F6: Duplicate Detection

Detect and handle duplicate manga imports.

Method:
- Calculate file hash MD5 or SHA-256
- Check against existing manga hashes
- Show modal if duplicate detected

Options on Duplicate:
- Skip import
- Replace existing
- Import as new version

Requirements:
- Hash calculated during import
- Fast hash comparison
- Clear duplicate indication

---

## F7: PDF Import Support

Import and convert PDF manga to images.

Library: pdf.js

Process:
1. Load PDF with pdf.js
2. Detect page count
3. Render each page to canvas
4. Convert to WebP or JPEG blob
5. Process as standard images

Requirements:
- Progress shown per page
- Reasonable quality setting
- Memory-efficient rendering
- Extract PDF metadata if available
## F8: Import Progress Tracking

Show real-time progress of import operations.

Progress Stages:
- Reading file
- Extracting archive
- Validating images
- Ordering pages
- Generating thumbnails
- Saving to database

Requirements:
- Progress bar with percentage
- Current stage label
- Estimated time remaining
- Cancel button
- Error state with retry

---

## F9: Auto Chapter Segmentation

Automatically detect chapter boundaries when importing a folder of scanned images.

Use Case: User shares entire manga folder containing multiple chapters as loose images

Detection Methods:
- Cover Page Detection: Identify chapter cover pages by visual characteristics
- Bonus Artwork Filter: Detect and filter out omake/bonus pages
- Page Number OCR: Read page numbers if present to detect discontinuities
- Volume Break Detection: Identify volume boundaries if multiple volumes present

Visual Cover Page Indicators:
- Chapter title prominently displayed
- Author name present
- Distinctive art style (often colored or higher detail)
- Chapter number visible
- Minimal panel layout (often single image or title spread)

Bonus Artwork Detection:
- Character illustrations without story context
- Artist notes or commentary pages
- Advertisement pages
- Preview pages for other manga

Output:
- Segmented chapters with detected boundaries
- Confidence score per segmentation
- User review interface for manual adjustment
- Option to merge/split detected chapters

Requirements:
- Multi-method detection for robustness
- User can override auto-detection
- Preview before final import
- Handles edge cases (merged chapters, missing covers)

Acceptance Criteria:
- Correctly segments 80 percent of standard manga chapters
- Bonus pages identified and optionally filtered
- User can manually adjust boundaries
- Works with both Japanese and English manga
