# Component 2: Manga Ingestion Engine

## Definition

The entry point for all manga content into the application. Handles multi-format file upload, archive extraction, image validation, page ordering, and storage of processed manga with metadata. Provides both drag-and-drop and file picker interfaces.

---

## Boundaries

### In Scope
- File upload (drag-and-drop and file picker)
- Format support: CBZ, CBR, ZIP, RAR, PDF, individual images (PNG, JPG, WebP)
- Archive extraction (client-side)
- Image validation (format, corruption check)
- Page ordering and metadata extraction
- Thumbnail generation
- Progress tracking for upload/processing
- Storage integration with database
- Import history management
- Auto chapter segmentation for folder uploads (cover detection, bonus filtering)

### Out of Scope
- Actual content analysis (Component 3)
- OCR text extraction (may be part of Component 3)
- Duplicate detection across users (single-user app)
- Cloud storage sync (future feature)
- Bulk library import from external sources

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| User | File(s) via drag-drop | Primary input method |
| User | File(s) via file picker | Alternative input method |
| User | Manual metadata (title, chapter) | Override auto-detected metadata |
| System | Core Infrastructure DB | Store processed manga data |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| Database | Manga entity with metadata | Persistent storage |
| Database | Page records with thumbnails | Display and reference |
| Component 3 | Manga ID and page data | Storyline analysis |
| UI | Progress updates | User feedback |

---

## Success Criteria

- [ ] User can upload CBZ, CBR, ZIP, RAR, PDF, and image files
- [ ] Files are extracted/validated client-side (no server upload)
- [ ] Pages are ordered correctly (alphanumeric, natural sort)
- [ ] Thumbnails generated for quick preview
- [ ] Progress shown during upload/processing
- [ ] Failed files show clear error messages
- [ ] Duplicate detection prevents re-importing same file
- [ ] Manga appears in library immediately after processing
- [ ] Auto chapter segmentation detects 80%+ of chapter boundaries correctly

---

## Dependencies

- **Core Infrastructure** (Component 1)
  - Database layer (Dexie.js) for storage
  - State management for upload progress
  - Error handling system
  - Configuration store

## Dependents

- **Storyline Analyzer** (Component 3)
  - Requires processed manga data
  - Uses page images for LLM analysis
