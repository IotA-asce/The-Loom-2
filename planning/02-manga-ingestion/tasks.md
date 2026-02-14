# Manga Ingestion Engine: Implementation Tasks

## Phase 1: Core Upload Infrastructure

### T1.1: Install Dependencies
**Effort:** 20 minutes
- Install JSZip for ZIP/CBZ support
- Install pdf.js for PDF support
- Install unrar-js or libarchive.js for RAR/CBR

### T1.2: Create File Type Detector
**Effort:** 45 minutes
- Create detectFileType function
- Check by extension and MIME type
- Return standardized type enum
- Handle edge cases

### T1.3: Create Drag and Drop Hook
**Effort:** 1 hour
- Implement useDragAndDrop hook
- Handle dragenter, dragover, dragleave, drop events
- Prevent default browser behavior
- Return files, isDragging, isOver

### T1.4: Create File Reader Utility
**Effort:** 45 minutes
- Read files as ArrayBuffer
- Read files as DataURL
- Progress callback support
- Abort controller support

---

## Phase 2: Archive Processing

### T2.1: Implement ZIP/CBZ Extractor
**Effort:** 1.5 hours
- Create extractZip function
- Filter for image files only
- Progress callback during extraction
- Return ordered file list

### T2.2: Implement RAR/CBR Extractor
**Effort:** 1.5 hours
- Create extractRar function
- Handle WASM loading for unrar-js
- Same interface as ZIP extractor
- Error handling for corrupt archives

### T2.3: Implement PDF Processor
**Effort:** 2 hours
- Load PDF with pdf.js
- Render pages to canvas
- Convert canvas to image blobs
- Progress per page
- Extract PDF metadata

---

## Phase 3: Image Processing

### T3.1: Create Natural Sort Utility
**Effort:** 45 minutes
- Implement natural sort algorithm
- Handle numeric parts correctly
- Support various filename patterns
- Unit tests

### T3.2: Create Thumbnail Generator
**Effort:** 1.5 hours
- Load image to offscreen canvas
- Resize with high quality
- Convert to WebP
- Store in IndexedDB
- Cancelable generation

### T3.3: Create Image Validator
**Effort:** 45 minutes
- Check if file is valid image
- Detect corrupt images
- Get image dimensions
- Return validation result

---

## Phase 4: Storage Integration

### T4.1: Extend Database Schema
**Effort:** 30 minutes
- Add Manga table with metadata
- Add Page table with image references
- Add Thumbnail table
- Add file hash for duplicate detection

### T4.2: Create Manga Repository
**Effort:** 1 hour
- Create MangaRepository class
- Save manga with pages
- Update manga metadata
- Delete manga with cleanup

### T4.3: Create Import Service
**Effort:** 2 hours
- Orchestrate full import flow
- Coordinate extraction, validation, ordering
- Generate thumbnails
- Save to database
- Progress callbacks

---

## Phase 5: Duplicate Detection

### T5.1: Create Hash Utility
**Effort:** 30 minutes
- Calculate MD5 or SHA-256 hash
- Stream hash for large files
- Return hex string

### T5.2: Create Duplicate Checker
**Effort:** 45 minutes
- Check hash against database
- Return duplicate status
- Get existing manga if duplicate

### T5.3: Create Duplicate Handler
**Effort:** 30 minutes
- Skip import option
- Replace existing option
- Import as new option

---

## Phase 6: Chapter Segmentation

### T6.1: Create Cover Page Detector
**Effort:** 2 hours
- Visual analysis for chapter cover characteristics
- Title text detection
- Panel density analysis
- Art style distinctiveness check

### T6.2: Create Bonus Artwork Filter
**Effort:** 1.5 hours
- Detect omake/bonus pages
- Character illustration detection
- Commentary page identification
- Advertisement filtering

### T6.3: Create Page Number OCR
**Effort:** 1.5 hours
- OCR for page numbers
- Discontinuity detection
- Confidence scoring
- Fallback when no numbers present

### T6.4: Create Chapter Segmentation Service
**Effort:** 2 hours
- Coordinate multiple detection methods
- Combine results with confidence weighting
- Handle edge cases (merged chapters, missing covers)
- Output chapter boundaries

### T6.5: Create Chapter Review UI
**Effort:** 2 hours
- Preview segmented chapters
- Drag to adjust boundaries
- Merge/split chapter controls
- Confidence indicators per boundary

---

## Phase 8: UI Components

### T8.1: Create DropZone Component
**Effort:** 2 hours
- Full drag and drop UI
- All state visualizations
- Apple aesthetic styling
- Touch support fallback

### T8.2: Create ProgressModal Component
**Effort:** 1.5 hours
- Progress bar with percentage
- Stage label
- Cancel button
- Error state

### T8.3: Create MangaCard Component
**Effort:** 1 hour
- Thumbnail display
- Title and metadata
- Hover effects
- Click to open

### T8.4: Create LibraryGrid Component
**Effort:** 1 hour
- Responsive grid layout
- Empty state
- Loading skeletons
- Import button

### T8.5: Create DuplicateModal Component
**Effort:** 45 minutes
- Warning message
- Three action buttons
- Manga preview

---

## Phase 7: Integration

### T9.1: Create Import Page
**Effort:** 1.5 hours
- Drop zone centered
- Progress handling
- Error handling
- Success transition

### T9.2: Create Library Page
**Effort:** 1.5 hours
- Grid of manga cards
- Import button
- Empty state
- Responsive layout

### T9.3: Wire Up Import Flow
**Effort:** 1 hour
- Connect DropZone to ImportService
- Handle progress updates
- Handle completion
- Handle errors

---

## Phase 9: Testing

### T10.1: Unit Tests
**Effort:** 2 hours
- Test file type detection
- Test natural sort
- Test hash calculation
- Test image validation

### T10.2: Integration Tests
**Effort:** 1.5 hours
- Test full import flow
- Test with different formats
- Test duplicate detection
- Test cancel functionality

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Upload Infrastructure | 4 | ~3 hours |
| 2. Archive Processing | 3 | ~5 hours |
| 3. Image Processing | 3 | ~3 hours |
| 4. Storage Integration | 3 | ~3.5 hours |
| 5. Duplicate Detection | 3 | ~1.5 hours |
| 6. Chapter Segmentation | 5 | ~9 hours |
| 7. UI Components | 5 | ~6.5 hours |
| 8. Integration | 3 | ~4 hours |
| 9. Testing | 2 | ~3.5 hours |
| **Total** | **31** | **~39 hours** |

---

## Definition of Done

- [ ] All file formats supported (CBZ, CBR, PDF, images)
- [ ] Drag and drop works smoothly
- [ ] Progress shown during import
- [ ] Thumbnails generated
- [ ] Library grid displays manga
- [ ] Duplicate detection works
- [ ] Auto chapter segmentation functional
- [ ] Apple aesthetic matches specs
- [ ] All tests pass

---

## Dependencies

Requires Component 1 (Core Infrastructure) to be complete:
- Database layer
- State management
- Error handling
- Configuration store

---

## Next Component

After completing Manga Ingestion Engine, proceed to:
**Component 3: Storyline Analyzer**
