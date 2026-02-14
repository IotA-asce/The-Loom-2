# Manga Ingestion Engine: Workflows

## 1. Single File Upload (Drag & Drop)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User drags  │────▶│  Validate    │────▶│  Extract/   │
│ file to drop│     │  file type   │     │  Parse      │
│    zone     │     │              │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
          │                                     │
          │              ┌──────────────────────┘
          │              ▼
          │     ┌─────────────────┐
          │     │ Generate        │
          │     │ thumbnails      │
          │     │ (background)    │
          │     └────────┬────────┘
          │              │
          │              ▼
          │     ┌─────────────────┐
          │     │ Save to DB      │
          │     └────────┬────────┘
          │              │
          ▼              ▼
   ┌──────────┐   ┌─────────────┐
   │  Error   │   │   Success   │
   │  Display │   │   Show in   │
   │          │   │   Library   │
   └──────────┘   └─────────────┘
```

**Steps:**
1. User drags file into drop zone
2. Visual feedback: drop zone highlights, file icon appears
3. File type validation (extension + MIME type)
4. File size check (warn if > 100MB)
5. Archive extraction (if CBZ/CBR/ZIP/RAR)
6. Image validation (corruption check, format support)
7. Natural sort ordering of pages
8. Thumbnail generation (async, background)
9. Save manga metadata + pages to IndexedDB
10. Update library view

---

## 2. Multiple Files Upload

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User drops  │────▶│  Queue       │────▶│ Process     │
│ multiple    │     │  files       │     │ sequentially│
│ files       │     │              │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Overall progress│
              │ (X of N files)  │
              └─────────────────┘
```

**Steps:**
1. Accept multiple files in drop zone
2. Create processing queue
3. Process files sequentially (memory management)
4. Show aggregate progress bar
5. Individual file status (pending/processing/done/error)
6. Continue queue even if one file fails
7. Summary modal after completion

---

## 3. Folder Upload (Directory Drop)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User drops  │────▶│  Traverse    │────▶│ Identify    │
│ folder      │     │  directory   │     │ chapters    │
│             │     │  structure   │     │ by folders  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Create manga    │
              │ per subfolder   │
              │ or single with  │
              │ chapter metadata│
              └─────────────────┘
```

**Steps:**
1. Detect folder drop (via `webkitGetAsEntry`)
2. Recursively read directory structure
3. Identify chapters:
   - If subfolders contain images → each folder = one chapter
   - If flat image list → single manga with chapter detection via naming
4. Group pages by chapter
5. Process each chapter as manga entry or chapter sub-entry

---

## 4. Import from Individual Images

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User picks  │────▶│  Preview     │────▶│ Manual      │
│ image files │     │  grid        │     │ reordering  │
│             │     │              │     │ (optional)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Confirm &       │
              │ save as manga   │
              └─────────────────┘
```

**Steps:**
1. Accept multiple image selection
2. Show preview grid of selected images
3. Allow drag-to-reorder if needed
4. Prompt for manga title
5. Auto-suggest title from filename patterns
6. Save as single manga entry

---

## 5. PDF Import

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ PDF file    │────▶│ pdf.js       │────▶│ Render each │
│ uploaded    │     │ loading      │     │ page to     │
│             │     │              │     │ canvas      │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Convert canvas  │
              │ to image blobs  │
              └─────────────────┘
```

**Steps:**
1. Load PDF with pdf.js
2. Detect page count
3. Render each page to offscreen canvas
4. Convert canvas to WebP/JPEG blob
5. Process like standard images
6. Extract PDF metadata if available

---

## 6. Duplicate Detection

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ File        │────▶│ Calculate    │────▶│ Check       │
│ selected    │     │ file hash    │     │ against DB  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                   ┌────────────┴────────────┐
                                   │                         │
                                   ▼                         ▼
                            ┌─────────┐               ┌─────────┐
                            │ Unique  │               │ Duplicate
                            └────┬────┘               └────┬────┘
                                 │                         │
                                 ▼                         ▼
                          ┌───────────┐             ┌───────────┐
                          │ Continue  │             │ Show      │
                          │ processing│             │ warning   │
                          └───────────┘             │ (skip/replace)
                                                    └───────────┘
```

**Steps:**
1. Calculate MD5/SHA-256 hash of file content
2. Query database for existing hash
3. If duplicate: show modal with options:
   - Skip import
   - Replace existing (delete old, import new)
   - Import as duplicate (if different version)
4. Store hash in metadata for future detection

---

## 7. Processing State Recovery

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ App         │────▶│ Check for    │────▶│ Resume or   │
│ restarts    │     │ incomplete   │     │ clean up    │
│             │     │ processing   │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Steps:**
1. On app start, check for mangas with `status: 'processing'`
2. If found, attempt to resume or mark as failed
3. Clean up partial data if corrupted
4. Notify user of recovered/failed imports

---

## 8. Folder Upload with Chapter Segmentation

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User drops  │────▶│  Load all    │────▶│  Detect     │
│ folder of   │     │  images      │     │  chapter    │
│ images      │     │              │     │  covers     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Filter bonus    │
              │ artwork         │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ OCR page nums   │
              │ (optional)      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Segment into    │
              │ chapters        │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ User review &   │
              │ adjustment      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Import as       │
              │ separate manga  │
              │ entries or      │
              │ chapter groups  │
              └─────────────────┘
```

**Steps:**
1. User drops folder containing entire manga as loose images
2. Load all images and sort by filename
3. Detect potential chapter covers using visual analysis:
   - Check for title text placement
   - Analyze panel density (covers have fewer panels)
   - Detect distinctive art style
   - Look for chapter numbering patterns
4. Identify and filter bonus/omake pages
5. Optionally OCR page numbers to detect discontinuities
6. Segment images into chapter groups
7. Show user preview with detected boundaries
8. Allow user to adjust boundaries, merge/split chapters
9. Import as separate manga entries or grouped chapters
