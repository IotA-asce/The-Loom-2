# Performance Optimization Guide

> The Loom 2 — Performance targets, strategies, and implementation patterns for a smooth manga branching narrative experience.

---

## Table of Contents

1. [Performance Targets](#1-performance-targets)
2. [Bundle Optimization](#2-bundle-optimization)
3. [Image Optimization](#3-image-optimization)
4. [Memory Management](#4-memory-management)
5. [IndexedDB Optimization](#5-indexeddb-optimization)
6. [React Performance](#6-react-performance)
7. [Animation Performance](#7-animation-performance)
8. [Worker Threads](#8-worker-threads)
9. [Network Optimization](#9-network-optimization)
10. [Profiling & Monitoring](#10-profiling--monitoring)
11. [Large Manga Handling](#11-large-manga-handling)
12. [Performance Checklist](#12-performance-checklist)

---

## 1. Performance Targets

### Web Vitals Goals

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.0s | 1.5s |
| Largest Contentful Paint (LCP) | < 2.0s | 2.5s |
| Time to Interactive (TTI) | < 2.0s | 3.0s |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.25 |
| First Input Delay (FID) | < 50ms | 100ms |
| Interaction to Next Paint (INP) | < 200ms | 500ms |

### Application-Specific Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Library load (100 manga) | < 500ms | From DB to render |
| Thumbnail render | < 100ms | First paint per thumbnail |
| Page navigation | < 200ms | Route transition complete |
| Modal open | < 150ms | From click to interactive |
| Analysis progress update | < 50ms | UI refresh on progress |
| Chapter load (50 pages) | < 300ms | From selection to display |
| Search results | < 100ms | Debounced input response |
| Export generation | < 5s | Full manga export |

### Device Targets

| Device Tier | CPU | Memory | Target FPS |
|-------------|-----|--------|------------|
| High-end | 8+ cores | 16GB+ | 60fps |
| Mid-range | 4-6 cores | 8GB | 60fps |
| Low-end | 2-4 cores | 4GB | 30fps minimum |

---

## 2. Bundle Optimization

### Code Splitting Strategy

```typescript
// App.tsx - Route-based code splitting
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@mui/material';

// Route-based lazy loading
const LibraryView = lazy(() => import('./views/LibraryView'));
const AnalysisViewer = lazy(() => import('./views/AnalysisViewer'));
const BranchStudio = lazy(() => import('./views/BranchStudio'));
const StoryReader = lazy(() => import('./views/StoryReader'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

// Router configuration
function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LibraryView />} />
        <Route path="/analysis/:id" element={<AnalysisViewer />} />
        <Route path="/branch/:id" element={<BranchStudio />} />
        <Route path="/read/:id" element={<StoryReader />} />
      </Routes>
    </Suspense>
  );
}
```

```typescript
// Component-level splitting for heavy features
import { lazy } from 'react';

const HeavyChart = lazy(() => import('./components/HeavyChart'));
const PDFViewer = lazy(() => import('./components/PDFViewer'));
const ImageEditor = lazy(() => import('./components/ImageEditor'));

// Usage with visibility-based loading
function AnalysisPanel({ showChart, data }: { showChart: boolean; data: AnalysisData }) {
  return (
    <div>
      <LightweightSummary data={data} />
      {showChart && (
        <Suspense fallback={<Skeleton height={300} />}>
          <HeavyChart data={data} />
        </Suspense>
      )}
    </div>
  );
}
```

### Chunk Organization

| Chunk | Contents | Size Target | Priority |
|-------|----------|-------------|----------|
| `main` | Core app, routing, shell, auth | < 150KB | Critical |
| `vendor-react` | React, React-DOM | < 100KB | Critical |
| `vendor-ui` | MUI core, icons | < 120KB | Critical |
| `vendor-state` | Zustand, Immer | < 30KB | Critical |
| `manga` | Upload, processing, viewer | < 150KB | High |
| `analysis` | Analysis UI, results, charts | < 150KB | Medium |
| `branch` | Branch studio, comparison tools | < 100KB | Medium |
| `reader` | Story reader, editor | < 100KB | Medium |
| `utils-heavy` | File parsers, compressors | < 80KB | Low (lazy) |

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: false, filename: 'bundle-analysis.html' }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-state': ['zustand', 'immer', 'zustand/middleware'],
          'vendor-db': ['dexie', 'dexie-react-hooks'],
          'vendor-utils': ['date-fns', 'lodash-es'],
        },
        // Ensure consistent chunk naming for caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|webp/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Source maps for production debugging (can be disabled)
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material'],
  },
});
```

### Tree Shaking Best Practices

```typescript
// ✅ GOOD: Import only what you need
import { format, parseISO } from 'date-fns';
import { debounce, throttle } from 'lodash-es';

// ❌ BAD: Import entire library
import * as dateFns from 'date-fns'; // ~200KB
import _ from 'lodash'; // ~70KB

// ✅ GOOD: Named imports from MUI
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ❌ BAD: Deep imports bypass tree shaking
import { Button, TextField } from '@mui/material'; // May import entire package
```

### Dependency Audit Checklist

| Heavy Library | Lightweight Alternative | Savings |
|---------------|------------------------|---------|
| `moment` | `date-fns` | ~230KB → ~15KB |
| `lodash` | `lodash-es` + specific imports | ~70KB → ~5KB |
| `@mui/icons-material` | Individual icon imports | Variable |
| `chart.js` | `recharts` (if tree-shaken) | Check bundle |
| `axios` | Native `fetch` + wrapper | ~30KB → 0KB |
| `uuid` | `crypto.randomUUID()` | ~5KB → 0KB (modern browsers) |

---

## 3. Image Optimization

### Format Strategy

| Use Case | Format | Quality | Notes |
|----------|--------|---------|-------|
| Original storage | WebP | 85% | Best compression, keep source |
| Thumbnails | WebP | 70%, 200x280px | Fast gallery rendering |
| Display (reader) | WebP | 80% | Balance quality/size |
| Export | WebP / JPEG | 90% | User-facing quality |
| Fallback | JPEG | 85% | Legacy browser support |

### Progressive Loading Implementation

```typescript
// components/ProgressiveImage.tsx
import { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc: string;
  alt: string;
  className?: string;
}

export function ProgressiveImage({ 
  src, 
  placeholderSrc, 
  alt,
  className 
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Start with blur placeholder
    setCurrentSrc(placeholderSrc);
    setIsLoaded(false);

    // Load full image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [src, placeholderSrc]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        filter: isLoaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s ease-out',
      }}
      loading="lazy"
    />
  );
}
```

### Lazy Loading with Intersection Observer

```typescript
// hooks/useLazyImage.ts
import { useEffect, useRef, useState } from 'react';

interface LazyImageOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyImage(
  imageUrl: string | null,
  options: LazyImageOptions = {}
) {
  const { rootMargin = '50px', threshold = 0.1 } = options;
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [imageUrl, rootMargin, threshold]);

  useEffect(() => {
    if (!shouldLoad || !imageUrl) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setIsLoaded(true);

    return () => {
      img.onload = null;
    };
  }, [shouldLoad, imageUrl]);

  return { elementRef, shouldLoad, isLoaded };
}
```

### Virtual Scrolling for Large Lists

```typescript
// components/VirtualMangaGrid.tsx
import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MangaCard } from './MangaCard';

interface VirtualMangaGridProps {
  mangaList: Manga[];
  columnCount: number;
  cardHeight: number;
}

export function VirtualMangaGrid({
  mangaList,
  columnCount,
  cardHeight,
}: VirtualMangaGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Group items into rows
  const rows = useMemo(() => {
    const result: Manga[][] = [];
    for (let i = 0; i < mangaList.length; i += columnCount) {
      result.push(mangaList.slice(i, i + columnCount));
    }
    return result;
  }, [mangaList, columnCount]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardHeight + 16, // + gap
    overscan: 3, // Render 3 rows above/below visible area
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: '16px',
                padding: '0 16px',
              }}
            >
              {row.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Image Processing Worker

```typescript
// workers/image-processor.worker.ts
import { expose } from 'comlink';

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

class ImageProcessor {
  async processImage(
    file: File,
    options: ProcessImageOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1200,
      maxHeight = 1800,
      quality = 0.85,
      format = 'webp',
    } = options;

    // Create bitmap from file
    const bitmap = await createImageBitmap(file);

    // Calculate new dimensions
    let { width, height } = bitmap;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    // Draw to canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(bitmap, 0, 0, width, height);

    // Convert to blob
    const blob = await canvas.convertToBlob({
      type: `image/${format}`,
      quality,
    });

    // Cleanup
    bitmap.close();

    return {
      blob,
      width,
      height,
      size: blob.size,
    };
  }

  async generateThumbnail(file: File): Promise<ProcessedImage> {
    return this.processImage(file, {
      maxWidth: 200,
      maxHeight: 280,
      quality: 0.7,
      format: 'webp',
    });
  }
}

expose(ImageProcessor);
```

---

## 4. Memory Management

### Image Lifecycle Management

```typescript
// utils/imageLifecycle.ts
interface ManagedImage {
  url: string;
  size: number;
  lastAccessed: number;
  element?: HTMLImageElement;
}

class ImageMemoryManager {
  private images = new Map<string, ManagedImage>();
  private maxMemoryMB = 200;
  private currentMemoryMB = 0;
  private maxActiveImages = 20;

  private calculateSize(width: number, height: number): number {
    // RGBA = 4 bytes per pixel
    return (width * height * 4) / (1024 * 1024);
  }

  registerImage(id: string, url: string, width: number, height: number): void {
    const size = this.calculateSize(width, height);

    // Check memory limit
    if (this.currentMemoryMB + size > this.maxMemoryMB) {
      this.cleanupLRU();
    }

    this.images.set(id, {
      url,
      size,
      lastAccessed: Date.now(),
    });

    this.currentMemoryMB += size;
  }

  touchImage(id: string): void {
    const image = this.images.get(id);
    if (image) {
      image.lastAccessed = Date.now();
    }
  }

  releaseImage(id: string): void {
    const image = this.images.get(id);
    if (image) {
      URL.revokeObjectURL(image.url);
      this.currentMemoryMB -= image.size;
      this.images.delete(id);
    }
  }

  private cleanupLRU(): void {
    // Sort by last accessed, oldest first
    const sorted = Array.from(this.images.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Release oldest images until we're under limit
    for (const [id, image] of sorted) {
      if (this.currentMemoryMB <= this.maxMemoryMB * 0.8) break;
      this.releaseImage(id);
    }
  }

  cleanup(): void {
    this.images.forEach((_, id) => this.releaseImage(id));
    this.images.clear();
    this.currentMemoryMB = 0;
  }

  getStats(): { currentMB: number; imageCount: number } {
    return {
      currentMB: Math.round(this.currentMemoryMB * 100) / 100,
      imageCount: this.images.size,
    };
  }
}

export const imageManager = new ImageMemoryManager();
```

### React Hook for Image Cleanup

```typescript
// hooks/useManagedImage.ts
import { useEffect, useRef } from 'react';
import { imageManager } from '../utils/imageLifecycle';

export function useManagedImage(
  imageId: string,
  imageUrl: string | null,
  dimensions: { width: number; height: number }
) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!imageUrl || registeredRef.current) return;

    // Register image with memory manager
    imageManager.registerImage(
      imageId,
      imageUrl,
      dimensions.width,
      dimensions.height
    );
    registeredRef.current = true;

    return () => {
      // Cleanup on unmount
      imageManager.releaseImage(imageId);
      registeredRef.current = false;
    };
  }, [imageId, imageUrl, dimensions.width, dimensions.height]);

  // Touch image on each render to update LRU
  useEffect(() => {
    if (registeredRef.current) {
      imageManager.touchImage(imageId);
    }
  });
}
```

### Memory-Optimized Image Component

```typescript
// components/MemoryOptimizedImage.tsx
import { useEffect, useRef, useState } from 'react';
import { imageManager } from '../utils/imageLifecycle';

interface MemoryOptimizedImageProps {
  src: string;
  alt: string;
  mangaId: string;
  pageNumber: number;
  naturalWidth: number;
  naturalHeight: number;
  className?: string;
}

export function MemoryOptimizedImage({
  src,
  alt,
  mangaId,
  pageNumber,
  naturalWidth,
  naturalHeight,
  className,
}: MemoryOptimizedImageProps) {
  const imageId = `${mangaId}-page-${pageNumber}`;
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Register on mount
    imageManager.registerImage(imageId, src, naturalWidth, naturalHeight);

    return () => {
      // Cleanup on unmount
      imageManager.releaseImage(imageId);
    };
  }, [imageId, src, naturalWidth, naturalHeight]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          imageManager.touchImage(imageId);
        } else {
          // Optional: unload off-screen images
          // setIsVisible(false);
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [imageId]);

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
```

---

## 5. IndexedDB Optimization

### Optimized Database Schema

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Manga {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: 'uploading' | 'processing' | 'ready' | 'analyzing' | 'error';
  totalPages: number;
  thumbnailBlob?: Blob;
  thumbnailUrl?: string;
  // Don't store full images here - use separate object store
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  pageCount: number;
}

export interface Page {
  id: string;
  chapterId: string;
  pageNumber: number;
  // Store image blob separately for better performance
  imageBlobId: string;
  thumbnailBlobId: string;
  analysisId?: string;
}

export interface ImageBlob {
  id: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

export class MangaDatabase extends Dexie {
  manga!: Table<Manga, string>;
  chapters!: Table<Chapter, string>;
  pages!: Table<Page, string>;
  imageBlobs!: Table<ImageBlob, string>;

  constructor() {
    super('MangaDB');

    this.version(1).stores({
      // Primary key + indexed fields
      manga: 'id, title, createdAt, updatedAt, status',
      chapters: 'id, mangaId, number, [mangaId+number]',
      pages: 'id, chapterId, pageNumber, [chapterId+pageNumber]',
      imageBlobs: 'id, size',
    });

    // Optimize bulk operations
    this.chapters.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
    });
  }
}

export const db = new MangaDatabase();
```

### Optimized Query Patterns

```typescript
// db/queries.ts
import { db } from './schema';

// ✅ GOOD: Use compound indexes
export async function getChapterPages(chapterId: string) {
  return db.pages
    .where('[chapterId+pageNumber]')
    .between([chapterId, Dexie.minKey], [chapterId, Dexie.maxKey])
    .sortBy('pageNumber');
}

// ✅ GOOD: Limit results for pagination
export async function getMangaLibrary(
  limit: number = 50,
  offset: number = 0
) {
  return db.manga
    .orderBy('updatedAt')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

// ✅ GOOD: Use cursors for large datasets
export async function processAllPages(
  mangaId: string,
  processor: (page: Page) => Promise<void>
) {
  const chapters = await db.chapters.where('mangaId').equals(mangaId).toArray();
  
  for (const chapter of chapters) {
    await db.pages
      .where('chapterId')
      .equals(chapter.id)
      .each(async (page) => {
        await processor(page);
      });
  }
}

// ✅ GOOD: Batch operations
export async function bulkAddPages(pages: Page[]) {
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    await db.pages.bulkAdd(batch);
  }
}

// ❌ BAD: Loading entire table
export async function badGetAllManga() {
  return db.manga.toArray(); // Loads everything into memory!
}
```

### Storage Quota Monitoring

```typescript
// utils/storageMonitor.ts
interface StorageInfo {
  usage: number;
  quota: number;
  percentage: number;
}

class StorageMonitor {
  private warningThreshold = 0.8;
  private criticalThreshold = 0.95;
  private listeners: Set<(info: StorageInfo) => void> = new Set();

  async getStorageInfo(): Promise<StorageInfo> {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: Infinity, percentage: 0 };
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || Infinity;
    const percentage = quota === Infinity ? 0 : usage / quota;

    return { usage, quota, percentage };
  }

  async checkQuota(): Promise<'ok' | 'warning' | 'critical'> {
    const { percentage } = await this.getStorageInfo();

    if (percentage > this.criticalThreshold) return 'critical';
    if (percentage > this.warningThreshold) return 'warning';
    return 'ok';
  }

  async cleanupIfNeeded(): Promise<void> {
    const status = await this.checkQuota();

    if (status === 'critical') {
      await this.emergencyCleanup();
    } else if (status === 'warning') {
      await this.cleanupOldThumbnails();
    }
  }

  private async cleanupOldThumbnails(): Promise<void> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Find old manga
    const oldManga = await db.manga
      .where('updatedAt')
      .below(thirtyDaysAgo)
      .toArray();

    for (const manga of oldManga) {
      // Remove thumbnail blob but keep record
      if (manga.thumbnailBlob) {
        delete manga.thumbnailBlob;
        await db.manga.put(manga);
      }
    }
  }

  private async emergencyCleanup(): Promise<void> {
    // Remove all non-essential image blobs, keep metadata
    await db.imageBlobs.clear();
  }

  subscribe(listener: (info: StorageInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(info: StorageInfo): void {
    this.listeners.forEach((listener) => listener(info));
  }
}

export const storageMonitor = new StorageMonitor();
```

---

## 6. React Performance

### Component Memoization

```typescript
// components/MangaCard.tsx
import { memo, useCallback } from 'react';
import { Card, CardMedia, CardContent, Typography } from '@mui/material';

interface MangaCardProps {
  manga: Manga;
  onClick: (id: string) => void;
  selected?: boolean;
}

// Memoize expensive card component
export const MangaCard = memo(function MangaCard({
  manga,
  onClick,
  selected,
}: MangaCardProps) {
  const handleClick = useCallback(() => {
    onClick(manga.id);
  }, [onClick, manga.id]);

  return (
    <Card
      onClick={handleClick}
      sx={{
        border: selected ? '2px solid primary.main' : 'none',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
      }}
    >
      <CardMedia
        component="img"
        height={280}
        image={manga.thumbnailUrl}
        alt={manga.title}
        loading="lazy"
      />
      <CardContent>
        <Typography variant="subtitle2" noWrap>
          {manga.title}
        </Typography>
      </CardContent>
    </Card>
  );
}, areEqual);

// Custom comparison function
function areEqual(prev: MangaCardProps, next: MangaCardProps): boolean {
  return (
    prev.manga.id === next.manga.id &&
    prev.manga.title === next.manga.title &&
    prev.manga.thumbnailUrl === next.manga.thumbnailUrl &&
    prev.selected === next.selected &&
    prev.onClick === next.onClick
  );
}
```

### State Optimization with Zustand

```typescript
// stores/useMangaStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MangaState {
  manga: Map<string, Manga>;
  selectedId: string | null;
  filter: { status?: string; search?: string };
  
  // Actions
  setSelected: (id: string | null) => void;
  updateManga: (id: string, updates: Partial<Manga>) => void;
  setFilter: (filter: MangaState['filter']) => void;
}

export const useMangaStore = create<MangaState>()(
  subscribeWithSelector(
    immer((set) => ({
      manga: new Map(),
      selectedId: null,
      filter: {},

      setSelected: (id) =>
        set((state) => {
          state.selectedId = id;
        }),

      updateManga: (id, updates) =>
        set((state) => {
          const existing = state.manga.get(id);
          if (existing) {
            state.manga.set(id, { ...existing, ...updates });
          }
        }),

      setFilter: (filter) =>
        set((state) => {
          state.filter = filter;
        }),
    }))
  )
);

// Optimized selectors - only re-render when selected data changes
export const useSelectedManga = () =>
  useMangaStore((state) =>
    state.selectedId ? state.manga.get(state.selectedId) : null
  );

export const useMangaCount = () =>
  useMangaStore((state) => state.manga.size);

export const useFilteredManga = () =>
  useMangaStore((state) => {
    const { manga, filter } = state;
    return Array.from(manga.values()).filter((m) => {
      if (filter.status && m.status !== filter.status) return false;
      if (filter.search && !m.title.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  });
```

### Debounced State Updates

```typescript
// hooks/useDebouncedSearch.ts
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash-es';

export function useDebouncedSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  delay: number = 150
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const debouncedSetQuery = useMemo(
    () => debounce(setDebouncedQuery, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetQuery(query);
    return () => debouncedSetQuery.cancel();
  }, [query, debouncedSetQuery]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items;
    return items.filter((item) => searchFn(item, debouncedQuery));
  }, [items, debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== debouncedQuery,
  };
}
```

### Expensive Calculation Memoization

```typescript
// components/AnalysisDashboard.tsx
import { useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function AnalysisDashboard({ mangaId }: { mangaId: string }) {
  // Get only the data we need
  const { pages, analysisResults } = useAnalysisStore(
    useShallow((state) => ({
      pages: state.getPagesForManga(mangaId),
      analysisResults: state.getResultsForManga(mangaId),
    }))
  );

  // Memoize expensive aggregations
  const statistics = useMemo(() => {
    if (!analysisResults.length) return null;

    const totalCharacters = analysisResults.reduce(
      (sum, r) => sum + (r.characters?.length || 0),
      0
    );

    const sentimentDistribution = analysisResults.reduce(
      (acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const characterFrequency = analysisResults
      .flatMap((r) => r.characters || [])
      .reduce((acc, char) => {
        acc[char.name] = (acc[char.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalCharacters,
      sentimentDistribution,
      characterFrequency,
      coverage: (analysisResults.length / pages.length) * 100,
    };
  }, [analysisResults, pages.length]);

  // Memoize callbacks
  const handleExport = useCallback(() => {
    exportAnalysis(mangaId, statistics);
  }, [mangaId, statistics]);

  return (
    <DashboardLayout>
      <StatsPanel stats={statistics} />
      <ExportButton onClick={handleExport} />
    </DashboardLayout>
  );
}
```

### List Rendering Optimization

```typescript
// components/OptimizedList.tsx
import { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  keyExtractor: (item: T) => string;
}

// Memoized row renderer
const Row = memo(function Row<T>({
  data,
  index,
  style,
}: {
  data: { items: T[]; renderItem: (item: T, index: number) => React.ReactNode };
  index: number;
  style: React.CSSProperties;
}) {
  return (
    <div style={style}>
      {data.renderItem(data.items[index], index)}
    </div>
  );
});

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight,
  keyExtractor,
}: OptimizedListProps<T>) {
  const itemData = { items, renderItem };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight}
          itemData={itemData}
          itemKey={(index) => keyExtractor(items[index])}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}
```

---

## 7. Animation Performance

### CSS Animation Best Practices

```css
/* animations.css */

/* ✅ GPU-accelerated properties only */
.fade-in {
  opacity: 0;
  animation: fadeIn 300ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-up {
  transform: translateY(20px);
  opacity: 0;
  animation: slideUp 300ms ease-out forwards;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ✅ Use will-change sparingly */
.modal-content {
  will-change: transform, opacity;
}

.modal-content.animated {
  animation: modalEnter 300ms ease-out;
}

/* Remove will-change after animation */
.modal-content.animation-complete {
  will-change: auto;
}

/* ✅ Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### React Animation Component

```typescript
// components/AnimatedModal.tsx
import { useEffect, useRef, useState } from 'react';
import { Modal, Box } from '@mui/material';

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const modalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  outline: 'none',
};

export function AnimatedModal({ open, onClose, children }: AnimatedModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
    }
  }, [open]);

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        ref={contentRef}
        sx={{
          ...modalStyles,
          opacity: open ? 1 : 0,
          transform: open
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -45%) scale(0.95)',
          transition: prefersReducedMotion
            ? 'none'
            : 'opacity 300ms ease-out, transform 300ms ease-out',
          willChange: isAnimating ? 'transform, opacity' : 'auto',
        }}
        onTransitionEnd={handleAnimationEnd}
      >
        {children}
      </Box>
    </Modal>
  );
}

// Hook to detect reduced motion preference
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

### Animation Timing Reference

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Modal enter | 300ms | `cubic-bezier(0, 0, 0.2, 1)` | Dialogs, overlays |
| Modal exit | 200ms | `cubic-bezier(0.4, 0, 1, 1)` | Quick dismissal |
| Page transition | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Route changes |
| Hover effects | 150ms | `ease` | Interactive elements |
| Progress updates | 200ms | `ease-out` | Progress bars |
| Skeleton fade | 300ms | `ease-in-out` | Loading states |
| Toast appear | 200ms | `ease-out` | Notifications |
| Toast disappear | 150ms | `ease-in` | Quick removal |

### Layout Stability

```typescript
// components/SafeImage.tsx
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function SafeImage({ src, alt, width, height, className }: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: isLoaded ? 'transparent' : '#e0e0e0',
        aspectRatio: `${width} / ${height}`,
      }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
        className={className}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      />
    </div>
  );
}
```

---

## 8. Worker Threads

### Web Worker Setup

```typescript
// workers/image-processor.worker.ts
/// <reference lib="webworker" />

interface WorkerMessage {
  id: string;
  type: 'process' | 'thumbnail' | 'extract-archive' | 'hash';
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// Image processing in worker
async function processImage(
  imageData: ImageBitmap,
  options: { width?: number; height?: number; quality?: number }
): Promise<Blob> {
  const { width, height, quality = 0.85 } = options;

  const canvas = new OffscreenCanvas(
    width || imageData.width,
    height || imageData.height
  );
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get context');

  ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);

  return canvas.convertToBlob({ type: 'image/webp', quality });
}

async function generateThumbnail(file: File): Promise<{ blob: Blob; url: string }> {
  const bitmap = await createImageBitmap(file);
  
  // Calculate thumbnail size
  const maxSize = 280;
  const ratio = Math.min(maxSize / bitmap.width, maxSize / bitmap.height);
  const width = bitmap.width * ratio;
  const height = bitmap.height * ratio;

  const blob = await processImage(bitmap, { width, height, quality: 0.7 });
  bitmap.close();

  return { blob, url: URL.createObjectURL(blob) };
}

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = e.data;

  try {
    let result: unknown;

    switch (type) {
      case 'thumbnail': {
        const file = payload as File;
        result = await generateThumbnail(file);
        break;
      }

      case 'hash': {
        const file = payload as File;
        result = await computeFileHash(file);
        break;
      }

      case 'process': {
        const { imageData, options } = payload as {
          imageData: ImageBitmap;
          options: { width?: number; height?: number; quality?: number };
        };
        result = await processImage(imageData, options);
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = { id, success: true, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};

export type {};
```

### Worker Pool Manager

```typescript
// utils/workerPool.ts
interface WorkerTask {
  id: string;
  type: string;
  payload: unknown;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

class WorkerPool {
  private workers: Worker[] = [];
  private queue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private taskId = 0;

  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(new URL(this.workerScript, import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e) => {
        const { id, success, result, error } = e.data;
        const task = this.activeTasks.get(id);

        if (task) {
          this.activeTasks.delete(id);
          if (success) {
            task.resolve(result);
          } else {
            task.reject(new Error(error));
          }
          this.processQueue();
        }
      };

      this.workers.push(worker);
    }
  }

  private getAvailableWorker(): Worker | null {
    // Simple round-robin or find worker with no active tasks
    return (
      this.workers.find((w) => !this.hasActiveTaskForWorker(w)) || null
    );
  }

  private hasActiveTaskForWorker(worker: Worker): boolean {
    // In a more sophisticated implementation, track which worker has which task
    return this.activeTasks.size >= this.workers.length;
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const worker = this.getAvailableWorker();
    if (!worker) return;

    const task = this.queue.shift()!;
    this.activeTasks.set(task.id, task);
    worker.postMessage({
      id: task.id,
      type: task.type,
      payload: task.payload,
    });
  }

  execute<T>(type: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `task-${++this.taskId}`;
      const task: WorkerTask = { id, type, payload, resolve, reject };

      this.queue.push(task);
      this.processQueue();
    });
  }

  terminate(): void {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.queue = [];
    this.activeTasks.clear();
  }
}

// Singleton instance
export const imageWorkerPool = new WorkerPool(
  '../workers/image-processor.worker.ts',
  4
);
```

### React Hook for Worker Operations

```typescript
// hooks/useImageWorker.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { imageWorkerPool } from '../utils/workerPool';

interface UseThumbnailResult {
  thumbnailUrl: string | null;
  isProcessing: boolean;
  error: Error | null;
}

export function useThumbnail(file: File | null): UseThumbnailResult {
  const [result, setResult] = useState<UseThumbnailResult>({
    thumbnailUrl: null,
    isProcessing: false,
    error: null,
  });

  const abortRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setResult({ thumbnailUrl: null, isProcessing: false, error: null });
      return;
    }

    abortRef.current = false;
    setResult((prev) => ({ ...prev, isProcessing: true, error: null }));

    imageWorkerPool
      .execute<{ blob: Blob; url: string }>('thumbnail', file)
      .then((data) => {
        if (!abortRef.current) {
          setResult({
            thumbnailUrl: data.url,
            isProcessing: false,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!abortRef.current) {
          setResult({ thumbnailUrl: null, isProcessing: false, error });
        }
      });

    return () => {
      abortRef.current = true;
    };
  }, [file]);

  return result;
}

// Batch processing hook
export function useBatchProcessing<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize?: number; concurrency?: number } = {}
) {
  const { batchSize = 10, concurrency = 4 } = options;
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const process = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const allResults: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map((item) => processor(item));

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);

      setResults([...allResults]);
      setProgress(Math.round((allResults.length / items.length) * 100));
    }

    setIsProcessing(false);
    return allResults;
  }, [items, processor, batchSize]);

  return { process, progress, results, isProcessing };
}
```

---

## 9. Network Optimization

### LLM Request Optimization

```typescript
// utils/llmClient.ts
interface LLMRequestOptions {
  images: ImageData[];
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

class LLMClient {
  private abortController: AbortController | null = null;
  private retryDelays = [1000, 2000, 4000, 8000];

  async analyzeMangaPages(
    options: LLMRequestOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<LLMResponse[]> {
    const { images, prompt } = options;
    const batchSize = 10; // Process 10 pages at a time
    const results: LLMResponse[] = [];

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);

      // Cancel any previous request
      this.abortController?.abort();
      this.abortController = new AbortController();

      try {
        const batchResults = await this.sendBatchRequest(
          batch,
          prompt,
          this.abortController.signal
        );
        results.push(...batchResults);
        onProgress?.(Math.min(i + batchSize, images.length), images.length);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Analysis cancelled');
        }
        throw error;
      }
    }

    return results;
  }

  private async sendBatchRequest(
    images: ImageData[],
    prompt: string,
    signal: AbortSignal,
    attempt: number = 0
  ): Promise<LLMResponse[]> {
    try {
      // Compress images before sending
      const compressedImages = await Promise.all(
        images.map((img) => this.compressImage(img, 1200))
      );

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: compressedImages,
          prompt,
          model: 'gpt-4-vision',
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (signal.aborted) throw error;

      // Retry with exponential backoff
      if (attempt < this.retryDelays.length) {
        await this.delay(this.retryDelays[attempt]);
        return this.sendBatchRequest(images, prompt, signal, attempt + 1);
      }

      throw error;
    }
  }

  private async compressImage(
    imageData: ImageData,
    maxWidth: number
  ): Promise<string> {
    // Use canvas to compress image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const scale = Math.min(1, maxWidth / imageData.width);
    canvas.width = imageData.width * scale;
    canvas.height = imageData.height * scale;

    // Draw and compress
    const img = new Image();
    img.src = imageData.dataUrl;
    await new Promise((resolve) => (img.onload = resolve));

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancel(): void {
    this.abortController?.abort();
  }
}

export const llmClient = new LLMClient();
```

### Service Worker Configuration

```typescript
// sw.ts (Service Worker)
/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache critical assets (injected by Workbox build)
precacheAndRoute(self.__WB_MANIFEST);

// Cache thumbnails - Cache First, 30 days
registerRoute(
  ({ url }) => url.pathname.startsWith('/thumbnails/'),
  new CacheFirst({
    cacheName: 'thumbnails-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// API responses - Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Static assets - Cache First, 1 year
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// index.html - Network First (for updates)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
      }),
    ],
  })
);

// Skip waiting for immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Network-Aware Loading

```typescript
// hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';

interface NetworkStatus {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
  downlink: number;
  rtt: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    effectiveType: '4g',
    saveData: false,
    downlink: 10,
    rtt: 50,
  });

  useEffect(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return;

    const updateStatus = () => {
      setStatus({
        effectiveType: connection.effectiveType,
        saveData: connection.saveData,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    };

    updateStatus();
    connection.addEventListener('change', updateStatus);

    return () => connection.removeEventListener('change', updateStatus);
  }, []);

  return status;
}

// Usage for adaptive quality
export function useAdaptiveImageQuality(): number {
  const { effectiveType, saveData } = useNetworkStatus();

  if (saveData) return 0.6;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 0.6;
  if (effectiveType === '3g') return 0.75;
  return 0.85;
}
```

---

## 10. Profiling & Monitoring

### Web Vitals Integration

```typescript
// utils/webVitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

class WebVitalsMonitor {
  private metrics: Map<MetricName, Metric> = new Map();
  private listeners: Set<(metric: Metric) => void> = new Set();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Cumulative Layout Shift
    onCLS((metric) => this.handleMetric(metric as unknown as Metric), {
      reportAllChanges: true,
    });

    // First Input Delay
    onFID((metric) => this.handleMetric(metric as unknown as Metric));

    // First Contentful Paint
    onFCP((metric) => this.handleMetric(metric as unknown as Metric));

    // Largest Contentful Paint
    onLCP((metric) => this.handleMetric(metric as unknown as Metric));

    // Time to First Byte
    onTTFB((metric) => this.handleMetric(metric as unknown as Metric));

    // Interaction to Next Paint
    onINP((metric) => this.handleMetric(metric as unknown as Metric));
  }

  private handleMetric(metric: Metric): void {
    this.metrics.set(metric.name, metric);
    this.listeners.forEach((listener) => listener(metric));

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, metric);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: Metric): void {
    // Replace with your analytics endpoint
    const payload = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      page: window.location.pathname,
      timestamp: Date.now(),
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(payload));
    }
  }

  getMetric(name: MetricName): Metric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<MetricName, Metric | undefined> {
    return {
      CLS: this.metrics.get('CLS'),
      FID: this.metrics.get('FID'),
      FCP: this.metrics.get('FCP'),
      LCP: this.metrics.get('LCP'),
      TTFB: this.metrics.get('TTFB'),
      INP: this.metrics.get('INP'),
    };
  }

  subscribe(listener: (metric: Metric) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const webVitalsMonitor = new WebVitalsMonitor();
```

### React Profiler Integration

```typescript
// components/PerformanceProfiler.tsx
import { Profiler, ReactNode, useCallback } from 'react';

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

const THRESHOLD = 16; // 16ms = 60fps

export function PerformanceProfiler({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const onRender = useCallback(
    (
      profilerId: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      const data: ProfilerData = {
        id: profilerId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      };

      // Log slow renders
      if (actualDuration > THRESHOLD) {
        console.warn(
          `[Performance] Slow render detected:`,
          profilerId,
          `${actualDuration.toFixed(2)}ms`,
          phase
        );
      }

      // Send to analytics in production
      if (import.meta.env.PROD && actualDuration > THRESHOLD) {
        sendToAnalytics(data);
      }
    },
    []
  );

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

function sendToAnalytics(data: ProfilerData): void {
  // Implement analytics reporting
}
```

### Custom Performance Marks

```typescript
// utils/performanceMarks.ts
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

export function measure(name: string, startMark: string, endMark?: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      
      // Get the measurement
      const entries = performance.getEntriesByName(name, 'measure');
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && import.meta.env.DEV) {
        console.log(`[Performance] ${name}: ${lastEntry.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Mark might not exist yet
    }
  }
}

export function clearMarks(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMarks) {
    performance.clearMarks(name);
  }
}

export function clearMeasures(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMeasures) {
    performance.clearMeasures(name);
  }
}

// Usage example
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  
  mark(startMark);
  
  try {
    const result = await fn();
    mark(endMark);
    measure(name, startMark, endMark);
    return result;
  } catch (error) {
    mark(endMark);
    measure(name, startMark, endMark);
    throw error;
  } finally {
    clearMarks(startMark);
    clearMarks(endMark);
  }
}
```

### Performance Budgets Configuration

```javascript
// budgets.config.js
module.exports = {
  budgets: [
    {
      name: 'Initial Bundle',
      path: '/assets/main-*.js',
      limit: '150kb',
      enforcement: 'error',
    },
    {
      name: 'Vendor React',
      path: '/assets/vendor-react-*.js',
      limit: '100kb',
      enforcement: 'error',
    },
    {
      name: 'Vendor UI',
      path: '/assets/vendor-ui-*.js',
      limit: '120kb',
      enforcement: 'warn',
    },
    {
      name: 'Total JavaScript',
      path: '/assets/*.js',
      limit: '500kb',
      enforcement: 'error',
    },
    {
      name: 'CSS',
      path: '/assets/*.css',
      limit: '50kb',
      enforcement: 'warn',
    },
    {
      name: 'Images',
      path: '/assets/images/*',
      limit: '500kb',
      enforcement: 'warn',
    },
  ],
  lighthouse: {
    performance: 90,
    accessibility: 90,
    'best-practices': 90,
    seo: 80,
  },
};
```

---

## 11. Large Manga Handling

### Pagination Strategies

```typescript
// hooks/usePaginatedPages.ts
import { useState, useCallback, useEffect } from 'react';
import { db } from '../db/schema';

interface UsePaginatedPagesOptions {
  chapterId: string;
  pageSize?: number;
  preloadAhead?: number;
}

export function usePaginatedPages(options: UsePaginatedPagesOptions) {
  const { chapterId, pageSize = 50, preloadAhead = 10 } = options;
  
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadPages = useCallback(async (offset: number, limit: number) => {
    setIsLoading(true);
    
    const results = await db.pages
      .where('[chapterId+pageNumber]')
      .between([chapterId, offset + 1], [chapterId, offset + limit])
      .toArray();

    setPages(results);
    setIsLoading(false);
  }, [chapterId]);

  // Load initial pages
  useEffect(() => {
    db.pages
      .where('chapterId')
      .equals(chapterId)
      .count()
      .then(setTotalPages);
    
    loadPages(0, pageSize);
  }, [chapterId, pageSize, loadPages]);

  // Preload next batch when approaching end
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);

    // Check if we need to load more
    const currentBatchEnd = Math.floor(newPage / pageSize) * pageSize + pageSize;
    if (newPage + preloadAhead >= currentBatchEnd && currentBatchEnd < totalPages) {
      loadPages(currentBatchEnd, pageSize);
    }
  }, [newPage, pageSize, preloadAhead, totalPages, loadPages]);

  return {
    pages,
    currentPage,
    totalPages,
    isLoading,
    setCurrentPage: handlePageChange,
  };
}
```

### Streaming Analysis

```typescript
// utils/streamingAnalysis.ts
import { EventEmitter } from 'events';

interface AnalysisProgress {
  completed: number;
  total: number;
  currentPage: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  results: PageAnalysis[];
}

class StreamingAnalysis extends EventEmitter {
  private status: AnalysisProgress['status'] = 'running';
  private pausedResolve: (() => void) | null = null;

  async analyze(
    mangaId: string,
    pages: Page[],
    batchSize: number = 10
  ): Promise<void> {
    const progress: AnalysisProgress = {
      completed: 0,
      total: pages.length,
      currentPage: 0,
      status: 'running',
      results: [],
    };

    for (let i = 0; i < pages.length; i += batchSize) {
      // Check for pause
      if (this.status === 'paused') {
        await new Promise<void>((resolve) => {
          this.pausedResolve = resolve;
        });
      }

      if (this.status === 'error') break;

      const batch = pages.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.processBatch(mangaId, batch);
        progress.results.push(...batchResults);
        progress.completed += batch.length;
        progress.currentPage = i + batch.length;

        this.emit('progress', { ...progress });

        // Save intermediate results
        await this.saveCheckpoint(mangaId, progress);
      } catch (error) {
        this.status = 'error';
        this.emit('error', error);
        throw error;
      }
    }

    progress.status = 'completed';
    this.emit('complete', progress);
  }

  private async processBatch(
    mangaId: string,
    pages: Page[]
  ): Promise<PageAnalysis[]> {
    // Process batch in worker
    return Promise.all(
      pages.map((page) => this.analyzePage(mangaId, page))
    );
  }

  private async analyzePage(mangaId: string, page: Page): Promise<PageAnalysis> {
    // Actual analysis logic
    return {} as PageAnalysis;
  }

  private async saveCheckpoint(
    mangaId: string,
    progress: AnalysisProgress
  ): Promise<void> {
    await db.analysisCheckpoints.put({
      mangaId,
      progress,
      timestamp: Date.now(),
    });
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
      this.emit('paused');
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.pausedResolve?.();
      this.pausedResolve = null;
      this.emit('resumed');
    }
  }

  cancel(): void {
    this.status = 'error';
    this.pausedResolve?.();
    this.emit('cancelled');
  }
}

export const streamingAnalysis = new StreamingAnalysis();
```

### Memory-Efficient Display

```typescript
// components/ChapterReader.tsx
import { useCallback, useRef, useState, useEffect } from 'react';

interface ChapterReaderProps {
  chapter: Chapter;
  pages: Page[];
}

export function ChapterReader({ chapter, pages }: ChapterReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 5 });
  const imageRefs = useRef<Map<number, HTMLImageElement>>(new Map());

  // Track visible pages with IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
          
          if (entry.isIntersecting) {
            // Load image
            const img = imageRefs.current.get(pageNum);
            if (img && !img.src) {
              img.src = img.getAttribute('data-src') || '';
            }
          } else {
            // Unload off-screen images (optional, for very large chapters)
            const img = imageRefs.current.get(pageNum);
            if (img && Math.abs(pageNum - visibleRange.start) > 10) {
              // Keep a buffer of 10 pages
              // img.src = ''; // Uncomment to aggressively unload
            }
          }
        });
      },
      {
        root: container,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    // Observe all page elements
    container.querySelectorAll('[data-page]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pages, visibleRange]);

  return (
    <div ref={containerRef} style={{ overflowY: 'auto', height: '100vh' }}>
      {pages.map((page, index) => (
        <div
          key={page.id}
          data-page={page.pageNumber}
          style={{
            minHeight: '80vh', // Reserve space to prevent layout shift
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            ref={(el) => {
              if (el) imageRefs.current.set(page.pageNumber, el);
            }}
            data-src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 12. Performance Checklist

### Pre-Release Checklist

#### Critical (Must Pass)
- [ ] **Lighthouse Performance Score** > 90
- [ ] **First Contentful Paint** < 1.0s on 3G
- [ ] **Time to Interactive** < 2.0s on desktop
- [ ] **No Layout Shifts** during initial load (CLS < 0.1)
- [ ] **60fps Animations** - all transitions smooth
- [ ] **Memory Stable** - no leaks after 30 min usage
- [ ] **Bundle Size** under all budgets
- [ ] **Web Workers** used for image processing

#### Important (Should Pass)
- [ ] **Lighthouse Accessibility** > 90
- [ ] **Lighthouse Best Practices** > 90
- [ ] **Works on Low-End Devices** - test on 4GB RAM
- [ ] **Reduced Motion** fully supported
- [ ] **Offline Functionality** - core features work
- [ ] **Large Manga Test** - 500+ pages performant
- [ ] **Concurrent Uploads** - handle 10+ files

#### Nice to Have
- [ ] **PWA Installable** - service worker working
- [ ] **Background Sync** - for offline uploads
- [ ] **Push Notifications** - analysis complete alerts

### Ongoing Monitoring

#### Weekly
- [ ] **Bundle Size Tracking** - compare to baseline
- [ ] **New Dependencies** - audit for size impact
- [ ] **Performance Regression Tests** - run Lighthouse CI

#### Monthly
- [ ] **Real User Monitoring** - review Web Vitals data
- [ ] **Memory Profiling** - check for leaks
- [ ] **Dependency Updates** - check for lighter alternatives

#### Quarterly
- [ ] **Full Performance Audit** - comprehensive review
- [ ] **Device Testing** - test on latest low-end devices
- [ ] **Competitive Analysis** - benchmark against similar apps

### Performance Testing Script

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('LCP should be under 2.5s', async ({ page }) => {
    await page.goto('/');
    
    const lcpPromise = page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    const lcp = await lcpPromise;
    expect(lcp).toBeLessThan(2500);
  });

  test('Library load should be under 500ms', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="manga-grid"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(500);
  });

  test('Modal animation should be 60fps', async ({ page }) => {
    await page.goto('/');
    
    // Measure frame rate during modal animation
    const frameRate = await page.evaluate(async () => {
      const frameTimes: number[] = [];
      let lastTime = performance.now();
      
      const measureFrame = () => {
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;
        
        if (frameTimes.length < 30) {
          requestAnimationFrame(measureFrame);
        }
      };
      
      requestAnimationFrame(measureFrame);
      
      // Wait for measurement
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      // Calculate average frame rate
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      return 1000 / avgFrameTime;
    });
    
    expect(frameRate).toBeGreaterThan(55);
  });
});
```

### Performance Budget CI Check

```yaml
# .github/workflows/performance.yml
name: Performance Budget

on: [pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Check bundle size
        run: npx bundlesize
        
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

---

## Quick Reference

### Target Metrics Summary

| Metric | Target | Check Command |
|--------|--------|---------------|
| FCP | < 1.0s | Lighthouse |
| LCP | < 2.0s | Lighthouse |
| TTI | < 2.0s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| INP | < 200ms | web-vitals |
| Bundle | < 500KB | bundlesize |
| Library load | < 500ms | custom |
| Memory | < 200MB | DevTools |

### Emergency Performance Fixes

```typescript
// If app is slow:

// 1. Check for memory leaks
// DevTools > Performance > Memory - take heap snapshots

// 2. Profile React renders
// React DevTools Profiler - look for unnecessary re-renders

// 3. Check bundle size
// npx vite-bundle-visualizer

// 4. Verify lazy loading
// Network tab - check chunks are loaded on demand

// 5. Test without extensions
// Incognito mode - rule out extension interference
```

---

*Last updated: 2024*
*Next review: Quarterly or after major feature releases*
