# Browser Compatibility Specification

> **The Loom 2** — Manga Branching Narrative Generator  
> **Tech Stack:** Vite + React + TypeScript, Dexie.js (IndexedDB), File System Access API, Web Workers, Canvas/WebGL, Modern CSS

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  Chrome 90+  │  Edge 90+  │  Firefox 88+  │  Safari 15+     │
│       ✅ Fully Supported — All features enabled              │
└─────────────────────────────────────────────────────────────┘
```

[![Browser Support](https://img.shields.io/badge/browser%20support-Chrome%2090%2B%20%7C%20Edge%2090%2B%20%7C%20Firefox%2088%2B%20%7C%20Safari%2015%2B-brightgreen)](./BROWSER-SUPPORT.md)

---

## Table of Contents

1. [Browser Support Matrix](#1-browser-support-matrix)
2. [Feature Detection Strategy](#2-feature-detection-strategy)
3. [Critical API Support](#3-critical-api-support)
4. [Responsive Breakpoints](#4-responsive-breakpoints)
5. [Operating System Variations](#5-operating-system-variations)
6. [Testing Strategy](#6-testing-strategy)
7. [Degradation Strategies](#7-degradation-strategies)
8. [Browser-Specific Bugs](#8-browser-specific-bugs)
9. [Progressive Web App Support](#9-progressive-web-app-support)
10. [Accessibility Compatibility](#10-accessibility-compatibility)
11. [Performance by Browser](#11-performance-by-browser)
12. [Implementation Guidelines](#12-implementation-guidelines)
13. [Update Policy](#13-update-policy)

---

## 1. Browser Support Matrix

### Tier 1: Fully Supported (Critical Path)

| Browser | Minimum Version | Reason |
|---------|-----------------|--------|
| Chrome | 90+ | Largest user base, all features supported, best IndexedDB performance |
| Edge | 90+ | Chromium-based, enterprise users, identical feature set to Chrome |
| Firefox | 88+ | Standard compliance, privacy-focused users, good IndexedDB support |
| Safari | 15+ | macOS/iOS users, significantly improved IndexedDB in v15 |

**Tier 1 Guarantees:**
- ✅ All core features functional
- ✅ All enhanced features functional
- ✅ Optimal performance
- ✅ Full PWA support (where applicable)
- ✅ Priority bug fixes

### Tier 2: Partially Supported (Graceful Degradation)

| Browser | Support Level | Limitations |
|---------|---------------|-------------|
| Chrome 80-89 | Basic | Missing CSS Container Queries, some performance optimizations |
| Firefox 78-87 | Basic | IndexedDB limitations, slower transactions |
| Safari 14 | Basic | Missing File System Access API, slower IndexedDB, CSS gaps |
| Mobile Safari | Functional | Touch optimization required, 100vh issues, PWA limitations |
| Chrome Android | Functional | Same feature set as desktop Chrome, touch adaptations needed |
| Samsung Internet | Functional | Chromium-based, some API variations |

**Tier 2 Guarantees:**
- ✅ Core narrative generation functional
- ✅ Basic file upload/download works
- ⚠️ Some enhanced features may degrade
- ⚠️ Performance may be reduced
- ⚠️ Some UI polish may be missing

### Tier 3: Not Supported

| Browser | Reason |
|---------|--------|
| Internet Explorer 11 | EOL December 2022, missing all modern APIs (IndexedDB 2.0, Promises, async/await) |
| Safari < 14 | Missing critical IndexedDB features, async/await issues |
| Chrome < 80 | Missing CSS containment, outdated JavaScript features |
| Firefox < 78 | ESR too old, missing ResizeObserver, CSS Grid gaps |
| Opera < 75 | Pre-Chromium versions, significant compatibility issues |
| Android Browser (stock) | Inconsistent API support, WebKit variations |

**Tier 3 Behavior:**
- ❌ Redirect to unsupported browser page
- ❌ No core functionality available
- 📄 Friendly upgrade message displayed

---

## 2. Feature Detection Strategy

### Progressive Enhancement Model

```
┌──────────────────────────────────────────────────────────────┐
│                    OPTIMAL EXPERIENCE                        │
│     (Latest browsers: Chrome 90+, Firefox 88+, Safari 15+)   │
│  • File System Access API   • Web Workers                    │
│  • Smooth animations        • Full PWA features              │
│  • CSS Container Queries    • Clipboard API                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   ENHANCED EXPERIENCE                        │
│                  (Modern browsers: 2-3 years)                │
│  • Standard file input      • Main thread fallback           │
│  • CSS Grid/Flexbox         • Basic animations               │
│  • Service Worker           • Manual clipboard               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     CORE EXPERIENCE                          │
│                   (All browsers: Baseline)                   │
│  • Basic file reading       • Synchronous processing         │
│  • Float-based layout       • Essential functionality only   │
└──────────────────────────────────────────────────────────────┘
```

### Feature Detection Methods

#### API Detection (TypeScript)

```typescript
// lib/browser-support.ts

export const FeatureDetection = {
  /**
   * File System Access API - Modern file handling
   * Enables native file picker with drag-and-drop
   */
  fileSystemAccess(): boolean {
    return 'showOpenFilePicker' in window && 
           'showSaveFilePicker' in window;
  },

  /**
   * Web Workers - Background processing
   * Essential for non-blocking image analysis
   */
  webWorkers(): boolean {
    return typeof Worker !== 'undefined';
  },

  /**
   * Service Worker - PWA support and caching
   */
  serviceWorker(): boolean {
    return 'serviceWorker' in navigator;
  },

  /**
   * Clipboard API - Modern copy/paste
   */
  clipboard(): boolean {
    return navigator.clipboard != null && 
           typeof navigator.clipboard.writeText === 'function';
  },

  /**
   * IndexedDB 2.0 - Required for Dexie.js
   */
  indexedDB(): boolean {
    return 'indexedDB' in window && 
           typeof indexedDB.open === 'function';
  },

  /**
   * ResizeObserver - Efficient resize handling
   */
  resizeObserver(): boolean {
    return 'ResizeObserver' in window;
  },

  /**
   * IntersectionObserver - Lazy loading and visibility
   */
  intersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  },

  /**
   * CSS Container Queries support
   */
  containerQueries(): boolean {
    return CSS.supports('container-type', 'inline-size');
  },

  /**
   * Check if browser is fully supported (Tier 1)
   */
  isFullySupported(): boolean {
    return this.indexedDB() && 
           this.webWorkers() && 
           this.serviceWorker();
  },

  /**
   * Check if browser meets minimum requirements
   */
  isMinimumSupported(): boolean {
    // Check for IE
    const isIE = navigator.userAgent.includes('Trident/');
    if (isIE) return false;

    // Check for old Safari
    const safariMatch = navigator.userAgent.match(/Version\/(\d+).*Safari/);
    if (safariMatch && parseInt(safariMatch[1]) < 14) {
      return false;
    }

    return this.indexedDB();
  }
};
```

#### CSS Feature Queries

```css
/* Modern layout with Grid */
@supports (display: grid) {
  .story-branch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

/* Fallback for older browsers */
@supports not (display: grid) {
  .story-branch-grid {
    display: flex;
    flex-wrap: wrap;
  }
  
  .story-branch-grid > * {
    flex: 0 0 300px;
    margin: 0.75rem;
  }
}

/* Container Queries for component-level responsiveness */
@supports (container-type: inline-size) {
  .branch-card-container {
    container-type: inline-size;
    container-name: branch-card;
  }
  
  @container branch-card (min-width: 400px) {
    .branch-card { /* expanded layout */ }
  }
}

/* CSS Subgrid support */
@supports (grid-template-columns: subgrid) {
  .nested-branch-grid {
    grid-template-columns: subgrid;
  }
}

/* Logical properties support */
@supports (margin-inline-start: 1rem) {
  .localized-content {
    margin-inline-start: 1rem;
    margin-inline-end: 1rem;
  }
}
```

#### Dynamic Polyfill Loading

```typescript
// lib/polyfills.ts

interface PolyfillConfig {
  test: () => boolean;
  src: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const POLYFILLS: PolyfillConfig[] = [
  {
    test: () => !('IntersectionObserver' in window),
    src: 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver',
    priority: 'high'
  },
  {
    test: () => !('ResizeObserver' in window),
    src: '/polyfills/resize-observer.js',
    priority: 'medium'
  },
  {
    test: () => !('scrollBehavior' in document.documentElement.style),
    src: 'https://cdn.jsdelivr.net/npm/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js',
    priority: 'low'
  }
];

export async function loadPolyfills(): Promise<void> {
  const needed = POLYFILLS.filter(p => p.test());
  
  // Load critical polyfills synchronously
  const critical = needed.filter(p => p.priority === 'critical');
  await Promise.all(critical.map(loadScript));
  
  // Load remaining polyfills asynchronously
  const remaining = needed.filter(p => p.priority !== 'critical');
  remaining.forEach(p => loadScript(p));
}

function loadScript(config: PolyfillConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = config.src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}
```

---

## 3. Critical API Support

### IndexedDB (via Dexie.js)

| Browser | Support | Version | Notes |
|---------|---------|---------|-------|
| Chrome | ✅ Full | 90+ | Best performance, largest storage quotas |
| Edge | ✅ Full | 90+ | Identical to Chrome (Chromium-based) |
| Firefox | ✅ Full | 88+ | Good performance, standard-compliant |
| Safari | ✅ Full | 15+ | Significantly improved from v14 |
| Safari | ⚠️ Partial | 14.x | Slower transactions, occasional quirks |
| iOS Safari | ✅ Full | 15+ | Storage may be cleared under memory pressure |
| Chrome Android | ✅ Full | 90+ | Same as desktop |

**Dexie.js Specific Considerations:**

```typescript
// lib/db.ts
import Dexie from 'dexie';

// Browser-specific optimizations
const db = new Dexie('LoomNarrativeDB');

// Safari 14 workaround: longer transaction timeout
db.open().catch(err => {
  if (err.name === 'TimeoutError' && isSafari()) {
    // Retry with increased timeout
    return db.open({
      upgrade: (db, oldVersion, newVersion, transaction) => {
        // Extended timeout handling
      }
    });
  }
  throw err;
});

// iOS storage warning
export function checkStoragePressure(): void {
  if (isIOS()) {
    console.warn('iOS may clear IndexedDB under memory pressure. Consider cloud backup.');
  }
}
```

### File APIs Comparison

| API | Chrome | Edge | Firefox | Safari | Notes |
|-----|--------|------|---------|--------|-------|
| FileReader | ✅ | ✅ | ✅ | ✅ | Universal support |
| Blob URLs | ✅ | ✅ | ✅ | ✅ | `URL.createObjectURL()` |
| File System Access | ✅ 86+ | ✅ 86+ | ❌ | ❌ | Native file picker |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ | Standard API |
| Clipboard (files) | ✅ 104+ | ✅ 104+ | ❌ | ❌ | Copy/paste files |
| Native File System | ✅ | ✅ | ❌ | ❌ | Origin-private storage |

**Implementation Strategy:**

```typescript
// lib/file-handling.ts

interface FileHandler {
  openFiles(): Promise<File[]>;
  saveFile(data: Blob, suggestedName: string): Promise<void>;
}

/**
 * Modern File System Access API implementation
 */
class ModernFileHandler implements FileHandler {
  async openFiles(): Promise<File[]> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Manga Images',
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        }
      }],
      multiple: true
    });
    return Promise.all(fileHandle.map(h => h.getFile()));
  }

  async saveFile(data: Blob, suggestedName: string): Promise<void> {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [{
        description: 'JSON Narrative',
        accept: { 'application/json': ['.json'] }
      }]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }
}

/**
 * Legacy file input fallback
 */
class LegacyFileHandler implements FileHandler {
  async openFiles(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = () => resolve(Array.from(input.files || []));
      input.click();
    });
  }

  async saveFile(data: Blob, suggestedName: string): Promise<void> {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Factory function
export function createFileHandler(): FileHandler {
  if (FeatureDetection.fileSystemAccess()) {
    return new ModernFileHandler();
  }
  return new LegacyFileHandler();
}
```

### Required Polyfills

| Feature | Polyfill | Size | Priority | Load Strategy |
|---------|----------|------|----------|---------------|
| IntersectionObserver | `intersection-observer` | ~3KB | High | Sync on page load |
| ResizeObserver | `resize-observer-polyfill` | ~2KB | Medium | Async after load |
| Smooth Scroll | `smoothscroll-polyfill` | ~2KB | Low | Async after load |
| `Array.prototype.flat` | Core-js | ~1KB | Low | Bundle inclusion |
| `Object.fromEntries` | Core-js | ~0.5KB | Low | Bundle inclusion |

---

## 4. Responsive Breakpoints

### Desktop-First Breakpoint Strategy

```css
/* Base: Desktop (> 1200px) - Primary Experience */
:root {
  --sidebar-width: 280px;
  --timeline-height: 200px;
  --branch-grid-columns: 3;
  --modal-max-width: 900px;
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  :root {
    --sidebar-width: 320px;
    --branch-grid-columns: 4;
    --modal-max-width: 1100px;
  }
}

/* Tablet (768px - 1199px) - Adapted Layout */
@media (max-width: 1199px) {
  :root {
    --sidebar-width: 240px;
    --timeline-height: 160px;
    --branch-grid-columns: 2;
    --modal-max-width: 700px;
  }
  
  .main-layout {
    grid-template-columns: var(--sidebar-width) 1fr;
  }
}

/* Mobile (< 768px) - Simplified Layout */
@media (max-width: 767px) {
  :root {
    --sidebar-width: 100%;
    --timeline-height: 120px;
    --branch-grid-columns: 1;
    --modal-max-width: 100%;
  }
  
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    max-height: 50vh;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateY(0);
  }
}

/* Small Mobile (< 480px) - Minimal Layout */
@media (max-width: 479px) {
  :root {
    --timeline-height: 100px;
  }
  
  .branch-card {
    padding: 0.75rem;
  }
}
```

### Input Method Detection

```css
/* Touch devices - Larger touch targets */
@media (hover: none) and (pointer: coarse) {
  .interactive-element {
    min-height: 44px;
    min-width: 44px;
  }
  
  .button {
    padding: 12px 20px;
  }
  
  .timeline-node {
    width: 32px;
    height: 32px;
  }
  
  /* Remove hover-dependent UI */
  .hover-reveal {
    opacity: 1;
  }
}

/* Mouse devices - Hover effects */
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .hover-reveal {
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .hover-reveal:hover {
    opacity: 1;
  }
}

/* Stylus/pen input */
@media (pointer: fine) and (hover: none) {
  .drawing-canvas {
    touch-action: none;
  }
}
```

### Mobile-Specific Considerations

| Element | Desktop | Mobile (< 768px) |
|---------|---------|------------------|
| Navigation | Sidebar (280px) | Bottom sheet / Hamburger |
| Timeline | Horizontal, scrollable | Vertical, collapsible |
| Branch Grid | 2-4 columns | Single column |
| Modals | Centered, max 900px | Full-screen |
| Context Menus | Right-click | Long-press / Action sheet |
| Image Preview | Hover zoom | Tap to expand |
| Delete Actions | Click trash icon | Swipe to delete |

---

## 5. Operating System Variations

### macOS

**Expected Behaviors:**
- Native application feel with smooth animations
- Keyboard shortcuts using Cmd (⌘) key
- Momentum scrolling with elastic bounce
- San Francisco font family priority
- Vibrancy/blur effects in sidebar

```css
/* macOS-specific styles */
@supports (-webkit-backdrop-filter: blur(10px)) {
  .macos .sidebar {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

/* Scrollbar styling for macOS */
.macos ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.macos ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
```

### Windows

**Expected Behaviors:**
- Standard web behavior with Windows UI conventions
- Keyboard shortcuts using Ctrl key
- Segoe UI font family priority
- High DPI awareness for scaling
- Respect Windows color scheme (light/dark)

```typescript
// Detect Windows high contrast mode
const isHighContrast = window.matchMedia('(-ms-high-contrast: active)').matches;

if (isHighContrast) {
  document.body.classList.add('high-contrast');
}
```

### Linux

**Expected Behaviors:**
- Functional across distributions
- Respect system font (varies by distro)
- Standard scroll behavior (no momentum by default)
- May vary significantly based on desktop environment

### iOS Safari

**Critical Considerations:**

```css
/* Safe area handling for notched devices */
.safe-area-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Bottom nav bar fix - iOS Safari 100vh issue */
.full-height-ios {
  height: 100vh;
  height: -webkit-fill-available;
  height: 100dvh; /* Modern fallback */
}

/* Disable double-tap zoom */
.touch-action-manipulation {
  touch-action: manipulation;
}

/* Prevent callout menu on long press */
.no-callout {
  -webkit-touch-callout: none;
  user-select: none;
}
```

**iOS PWA Meta Tags:**

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Loom 2">
<link rel="apple-touch-icon" href="/icon-180x180.png">
```

### Android Chrome

**Expected Behaviors:**
- Similar to desktop Chrome for features
- Hardware back button handling
- System share sheet integration
- Respect system dark mode

```typescript
// Handle Android back button in PWA
window.addEventListener('popstate', (e) => {
  if (isModalOpen()) {
    closeModal();
    e.preventDefault();
  }
});

// Android share
if (navigator.share) {
  await navigator.share({
    title: 'My Manga Narrative',
    text: 'Check out this branching story!',
    url: shareableUrl
  });
}
```

---

## 6. Testing Strategy

### Automated Testing Matrix

| Tool | Purpose | Browsers | Frequency |
|------|---------|----------|-----------|
| Playwright | E2E regression | Chromium, Firefox, WebKit | Every PR |
| Vitest | Unit tests | JSDOM/Node | Every PR |
| Lighthouse CI | Performance, PWA | Chrome | Every PR |
| BrowserStack Automate | Cross-browser | Chrome, Firefox, Safari, Edge | Nightly |
| Applitools | Visual regression | All Tier 1 | Weekly |

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'tablet-safari',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
  
  // Critical user flows
  testMatch: [
    'tests/e2e/upload.spec.ts',
    'tests/e2e/analysis.spec.ts',
    'tests/e2e/branching.spec.ts',
    'tests/e2e/persistence.spec.ts',
  ],
});
```

### Manual Testing Checklist

#### Core Functionality
- [ ] **Upload Flow**
  - [ ] Drag and drop files (desktop)
  - [ ] File picker selection (all platforms)
  - [ ] Multiple file upload
  - [ ] Progress indicator display
  - [ ] Error handling for invalid files

- [ ] **Analysis Progress**
  - [ ] Progress bar updates smoothly
  - [ ] Cancel operation works
  - [ ] Background processing continues
  - [ ] Results display correctly

- [ ] **Timeline Interaction**
  - [ ] Click to navigate branches
  - [ ] Drag to reorder (if supported)
  - [ ] Scroll/Zoom on all devices
  - [ ] Touch gestures on mobile

- [ ] **Branch Comparison**
  - [ ] Side-by-side view renders
  - [ ] Synchronized scrolling
  - [ ] Highlight differences
  - [ ] Export comparison

- [ ] **Story Reading**
  - [ ] Panel navigation
  - [ ] Reading direction (LTR/RTL)
  - [ ] Keyboard shortcuts
  - [ ] Mobile swipe navigation

- [ ] **Settings Persistence**
  - [ ] Settings save to IndexedDB
  - [ ] Settings restore on reload
  - [ ] Cross-session persistence
  - [ ] Import/export settings

- [ ] **Keyboard Navigation**
  - [ ] Tab order logical
  - [ ] Focus indicators visible
  - [ ] Arrow key navigation
  - [ ] Enter/Space activation
  - [ ] Escape to close modals

- [ ] **Touch Gestures**
  - [ ] Swipe between panels
  - [ ] Pinch to zoom
  - [ ] Long press for context
  - [ ] Pull to refresh

### Test Environment Requirements

| Environment | Priority | Purpose |
|-------------|----------|---------|
| macOS Safari (latest) | Critical | Primary development platform |
| Windows 11 Chrome | Critical | Largest user base |
| iOS Safari (latest) | High | Mobile users |
| Android Chrome (latest) | High | Mobile users |
| macOS Firefox | Medium | Alternative desktop |
| Windows 11 Edge | Medium | Enterprise users |
| iPad Safari | Medium | Tablet experience |
| Safari 14 (macOS) | Low | Legacy support verification |

---

## 7. Degradation Strategies

### Graceful Degradation Matrix

| Feature | Optimal | Degraded | Fallback |
|---------|---------|----------|----------|
| File System Access | Native file picker | Traditional file input | Basic form upload |
| Web Workers | Background analysis | Main thread (blocking) | Server-side processing |
| CSS Grid | Complex layouts | Flexbox layouts | Float-based layouts |
| CSS Container Queries | Component responsive | Media queries | Fixed layouts |
| Smooth scroll | Animated scroll | Instant scroll | N/A |
| Clipboard API | One-click copy | Manual selection + copy | Copy button with instructions |
| PWA Install | Standalone app | Browser shortcut | Bookmark only |
| Offline Support | Full offline | Cached assets only | Online only |
| Background Sync | Auto-save | Manual save | Manual save with warning |

### Implementation Examples

```typescript
// File upload with graceful degradation
export async function selectFiles(): Promise<File[]> {
  // Tier 1: File System Access API
  if (FeatureDetection.fileSystemAccess()) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [IMAGE_FILE_TYPE]
      });
      return await Promise.all(handles.map(h => h.getFile()));
    } catch (err) {
      // User cancelled or API failed
      if (err.name === 'AbortError') return [];
    }
  }
  
  // Tier 2: Traditional file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = () => resolve(Array.from(input.files || []));
    input.click();
  });
}

// Analysis with worker fallback
export async function analyzeImage(image: File): Promise<AnalysisResult> {
  if (FeatureDetection.webWorkers()) {
    // Use Web Worker for non-blocking analysis
    const worker = new Worker('/workers/analysis.js');
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => resolve(e.data);
      worker.onerror = reject;
      worker.postMessage({ image }, [image]);
    });
  }
  
  // Degraded: Main thread (show loading spinner)
  showBlockingLoading('Analyzing image... This may take a moment.');
  try {
    return await analyzeOnMainThread(image);
  } finally {
    hideBlockingLoading();
  }
}
```

### Feature Notification System

```typescript
// components/BrowserSupportNotice.tsx

interface SupportNotice {
  type: 'info' | 'warning' | 'error';
  feature: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function checkAndNotify(): SupportNotice | null {
  // Critical: Check IndexedDB
  if (!FeatureDetection.indexedDB()) {
    return {
      type: 'error',
      feature: 'Storage',
      message: 'Your browser does not support required storage features. The application cannot function.',
      action: {
        label: 'View Supported Browsers',
        onClick: () => window.location.href = '/browser-support'
      }
    };
  }
  
  // Warning: Missing Web Workers
  if (!FeatureDetection.webWorkers()) {
    return {
      type: 'warning',
      feature: 'Performance',
      message: 'Image analysis will run slower on your browser. Consider updating for better performance.'
    };
  }
  
  // Info: Missing File System Access
  if (!FeatureDetection.fileSystemAccess()) {
    return {
      type: 'info',
      feature: 'File Picker',
      message: 'A modern browser like Chrome or Edge would provide a better file selection experience.'
    };
  }
  
  return null;
}
```

---

## 8. Browser-Specific Bugs & Workarounds

### Safari-Specific Issues

| Issue | Version | Impact | Workaround |
|-------|---------|--------|------------|
| IndexedDB slow transactions | 14.x | High | Increase timeouts, batch operations |
| 100vh includes bottom bar | All | High | Use `-webkit-fill-available` or `dvh` |
| File input styling limited | All | Medium | Use custom button overlay |
| `gap` in flexbox | < 14.1 | Low | Use margin fallback |
| Date parsing inconsistencies | All | Low | Use explicit date formats |

```css
/* Safari 100vh fix */
.full-viewport {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  min-height: 100dvh;
}

/* Flexbox gap fallback */
.flex-with-gap {
  display: flex;
  gap: 1rem;
}

@supports not (gap: 1rem) {
  .flex-with-gap > * + * {
    margin-left: 1rem;
  }
}
```

```typescript
// Safari IndexedDB timeout extension
export function withSafariTimeout<T>(promise: Promise<T>): Promise<T> {
  if (isSafari()) {
    const timeout = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Transaction timeout')), 30000);
    });
    return Promise.race([promise, timeout]);
  }
  return promise;
}
```

### Firefox-Specific Issues

| Issue | Version | Impact | Workaround |
|-------|---------|--------|------------|
| Drag & drop file handling | All | Medium | Use DataTransfer.files directly |
| CSS containment performance | < 95 | Low | Disable containment in Firefox |
| `scrollbar-width` property | All | Low | Use standard scrollbar styling |
| Color input styling | All | Low | Custom color picker |

```typescript
// Firefox drag & drop workaround
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  
  // Firefox requires explicit access to dataTransfer
  const files = e.dataTransfer?.files;
  if (files) {
    handleFiles(Array.from(files));
  }
});
```

### Chrome-Specific Issues

| Issue | Version | Impact | Workaround |
|-------|---------|--------|------------|
| Extension conflicts | All | Medium | Detect and warn about interfering extensions |
| Scroll-linked effects jank | < 96 | Low | Use `content-visibility` |
| Font rendering subpixel | All | Low | Use `-webkit-font-smoothing` |

```typescript
// Detect interfering extensions
detectExtensionInterference(): void {
  const testKey = '__loom_extension_test__';
  try {
    window[testKey] = true;
    if (!window[testKey]) {
      console.warn('Potential extension interference detected');
    }
    delete window[testKey];
  } catch {
    // Extension may be blocking modifications
  }
}
```

### Mobile-Specific Issues

| Issue | Platform | Impact | Workaround |
|-------|----------|--------|------------|
| Virtual keyboard resize | iOS | High | Use visual viewport API |
| 300ms tap delay | Old Android | Medium | `touch-action: manipulation` |
| Momentum scroll pause | iOS | Medium | Use `-webkit-overflow-scrolling` |
| File picker crashes | Some Android | High | Limit file size, validate MIME |

```typescript
// iOS virtual keyboard handling
if ('visualViewport' in window) {
  window.visualViewport?.addEventListener('resize', () => {
    const keyboardHeight = window.innerHeight - window.visualViewport!.height;
    document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
  });
}
```

---

## 9. Progressive Web App Support

### PWA Requirements

| Requirement | Implementation | Notes |
|-------------|----------------|-------|
| HTTPS | Required | Service workers require secure context |
| Service Worker | `sw.ts` | Caching strategy, offline support |
| Web App Manifest | `manifest.json` | App metadata, icons, display mode |
| Icon Set | Multiple sizes | 72x72 to 512x512, maskable variant |

### Browser Support Matrix

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Install prompt | ✅ | ✅ | ⚠️ (Android only) | ❌ |
| Offline support | ✅ | ✅ | ✅ | ✅ (Limited) |
| Background sync | ✅ | ✅ | ❌ | ❌ |
| Periodic sync | ✅ | ❌ | ❌ | ❌ |
| Push notifications | ✅ | ✅ | ❌ | ❌ |
| Badging API | ✅ | ✅ | ❌ | ❌ |
| File handling | ✅ | ✅ | ❌ | ❌ |

### iOS PWA Limitations

```typescript
// iOS PWA detection and warnings
export function checkIOSPWALimitations(): void {
  const isIOSPWA = isIOS() && window.navigator.standalone;
  
  if (isIOSPWA) {
    // Warn about storage limitations
    const warning: SupportNotice = {
      type: 'warning',
      feature: 'Storage',
      message: 'iOS may clear your data when storage is low. Regularly export your narratives.'
    };
    
    // Auto-backup reminder
    scheduleBackupReminder();
  }
}
```

### Service Worker Strategy

```typescript
// sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';

// Precache built assets
precacheAndRoute(self.__WB_MANIFEST);

// API calls: Stale while revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);

// Images: Cache first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      {
        // Max 50 images, 30 days
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    ],
  })
);

// IndexedDB sync on reconnect
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-narratives') {
    event.waitUntil(syncNarrativesToCloud());
  }
});
```

---

## 10. Accessibility Compatibility

### Screen Reader Matrix

| Browser + Reader | Version | Support Level | Notes |
|------------------|---------|---------------|-------|
| Chrome + NVDA | Latest | ⭐⭐⭐⭐⭐ Excellent | Best combination |
| Firefox + NVDA | Latest | ⭐⭐⭐⭐⭐ Excellent | Strong standards compliance |
| Chrome + JAWS | Latest | ⭐⭐⭐⭐⭐ Excellent | Enterprise standard |
| Safari + VoiceOver | Latest | ⭐⭐⭐⭐ Good | macOS/iOS native |
| Edge + Narrator | Latest | ⭐⭐⭐⭐ Good | Windows built-in |
| Firefox + Orca | Latest | ⭐⭐⭐☆☆ Fair | Linux standard |

### Required ARIA Implementation

```tsx
// Accessible branch card component
interface BranchCardProps {
  branch: StoryBranch;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function BranchCard({ branch, isActive, onSelect, onDelete }: BranchCardProps) {
  return (
    <article
      role="article"
      aria-label={`Story branch: ${branch.title}`}
      aria-current={isActive ? 'true' : undefined}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={isActive ? 'active' : ''}
    >
      <h3>{branch.title}</h3>
      <p>{branch.description}</p>
      
      {/* Live region for status updates */}
      <span 
        role="status" 
        aria-live="polite" 
        className="sr-only"
      >
        {branch.analysisStatus}
      </span>
      
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label={`Delete branch ${branch.title}`}
      >
        Delete
      </button>
    </article>
  );
}
```

### Skip Links & Focus Management

```tsx
// App.tsx
export function App() {
  return (
    <>
      {/* Skip to main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Skip to navigation */}
      <a href="#main-nav" className="skip-link">
        Skip to navigation
      </a>
      
      <nav id="main-nav" aria-label="Main navigation">
        {/* Navigation content */}
      </nav>
      
      <main id="main-content" tabIndex={-1}>
        {/* Main content */}
      </main>
    </>
  );
}
```

```css
/* Skip link styles */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 9999;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}

/* Focus indicators */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 11. Performance by Browser

### IndexedDB Performance Benchmarks

```
┌─────────────────────────────────────────────────────────────┐
│                    INDEXEDDB PERFORMANCE                    │
├─────────────────────────────────────────────────────────────┤
│  Chrome 90+      ★★★★★  Fastest, 50MB+ storage typical     │
│  Edge 90+        ★★★★★  Identical to Chrome                 │
│  Firefox 88+     ★★★★☆  Good, standard-compliant            │
│  Safari 15+      ★★★★☆  Much improved from v14              │
│  Safari 14       ★★★☆☆  Slower transactions, workarounds    │
│  iOS Safari      ★★★☆☆  May be cleared under pressure       │
└─────────────────────────────────────────────────────────────┘
```

### Canvas/Image Processing Performance

```
┌─────────────────────────────────────────────────────────────┐
│                  CANVAS/WEBGL PERFORMANCE                   │
├─────────────────────────────────────────────────────────────┤
│  Chrome 90+      ★★★★★  Best Canvas 2D performance          │
│  Firefox 88+     ★★★★☆  Excellent WebGL support             │
│  Safari 15+      ★★★★☆  Good, Metal backend                 │
│  Edge 90+        ★★★★★  Same as Chrome                      │
└─────────────────────────────────────────────────────────────┘
```

### Runtime Performance Optimization

```typescript
// lib/performance.ts

export const PerformanceOptimizations = {
  /**
   * Use IntersectionObserver for lazy loading (if supported)
   */
  lazyLoadImages(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback: Load all images immediately
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src!;
      });
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  },

  /**
   * Content visibility for off-screen content
   */
  optimizeOffscreenContent(): void {
    if (CSS.supports('content-visibility', 'auto')) {
      document.querySelectorAll('.branch-panel').forEach(el => {
        (el as HTMLElement).style.contentVisibility = 'auto';
      });
    }
  },

  /**
   * Use ResizeObserver for efficient resize handling
   */
  efficientResize(callback: () => void): () => void {
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(callback);
      return () => ro.disconnect();
    }
    
    // Fallback: Throttled resize events
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
};
```

---

## 12. Implementation Guidelines

### Browser Support Utility Module

```typescript
// lib/browser-support.ts

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  version: number;
  os: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
  isMobile: boolean;
  supportTier: 1 | 2 | 3;
}

export const BrowserSupport = {
  /**
   * Detect browser information from user agent
   */
  detect(): BrowserInfo {
    const ua = navigator.userAgent;
    
    // Browser detection
    let name: BrowserInfo['name'] = 'unknown';
    let version = 0;
    
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      name = 'chrome';
      version = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '0');
    } else if (ua.includes('Firefox/')) {
      name = 'firefox';
      version = parseInt(ua.match(/Firefox\/(\d+)/)?.[1] || '0');
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      name = 'safari';
      version = parseInt(ua.match(/Version\/(\d+)/)?.[1] || '0');
    } else if (ua.includes('Edg/')) {
      name = 'edge';
      version = parseInt(ua.match(/Edg\/(\d+)/)?.[1] || '0');
    }
    
    // OS detection
    let os: BrowserInfo['os'] = 'unknown';
    if (ua.includes('Windows')) os = 'windows';
    else if (ua.includes('Mac OS X') || ua.includes('macOS')) os = 'macos';
    else if (ua.includes('Linux')) os = 'linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';
    else if (ua.includes('Android')) os = 'android';
    
    // Support tier determination
    let supportTier: BrowserInfo['supportTier'] = 3;
    if (
      (name === 'chrome' && version >= 90) ||
      (name === 'edge' && version >= 90) ||
      (name === 'firefox' && version >= 88) ||
      (name === 'safari' && version >= 15)
    ) {
      supportTier = 1;
    } else if (
      (name === 'chrome' && version >= 80) ||
      (name === 'edge' && version >= 80) ||
      (name === 'firefox' && version >= 78) ||
      (name === 'safari' && version >= 14)
    ) {
      supportTier = 2;
    }
    
    return {
      name,
      version,
      os,
      isMobile: os === 'ios' || os === 'android',
      supportTier
    };
  },

  /**
   * Check if browser meets minimum requirements
   */
  isSupported(): boolean {
    const info = this.detect();
    return info.supportTier <= 2;
  },

  /**
   * Check if browser is fully supported (Tier 1)
   */
  isFullySupported(): boolean {
    return this.detect().supportTier === 1;
  },

  /**
   * Feature detection methods
   */
  features: {
    indexedDB: () => 'indexedDB' in window,
    fileSystemAccess: () => 'showOpenFilePicker' in window,
    webWorkers: () => typeof Worker !== 'undefined',
    serviceWorker: () => 'serviceWorker' in navigator,
    clipboard: () => navigator.clipboard != null,
    resizeObserver: () => 'ResizeObserver' in window,
    intersectionObserver: () => 'IntersectionObserver' in window,
    containerQueries: () => CSS.supports('container-type', 'inline-size'),
    webGL: () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    }
  },

  /**
   * OS-specific helpers
   */
  os: {
    isMac: () => navigator.platform.includes('Mac'),
    isWindows: () => navigator.platform.includes('Win'),
    isIOS: () => /iPhone|iPad|iPod/.test(navigator.userAgent),
    isAndroid: () => /Android/.test(navigator.userAgent),
    isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }
};

export default BrowserSupport;
```

### Unsupported Browser Page

```tsx
// pages/UnsupportedBrowser.tsx

export function UnsupportedBrowserPage() {
  const browser = BrowserSupport.detect();
  
  return (
    <div className="unsupported-browser">
      <h1>Browser Not Supported</h1>
      
      <p>
        We detected you're using <strong>{browser.name} {browser.version}</strong>,
        which doesn't support the features required for The Loom 2.
      </p>
      
      <h2>Why can't I use this browser?</h2>
      <p>
        The Loom 2 requires modern browser features like IndexedDB for storing your
        narratives, Web Workers for background processing, and modern CSS for the
        visual experience.
      </p>
      
      <h2>Supported Browsers</h2>
      <ul className="browser-list">
        <li>
          <strong>Google Chrome</strong> 90 or later
          <a href="https://www.google.com/chrome/">Download</a>
        </li>
        <li>
          <strong>Microsoft Edge</strong> 90 or later
          <a href="https://www.microsoft.com/edge">Download</a>
        </li>
        <li>
          <strong>Mozilla Firefox</strong> 88 or later
          <a href="https://www.mozilla.org/firefox/">Download</a>
        </li>
        <li>
          <strong>Apple Safari</strong> 15 or later (macOS)
          <span>Update via System Preferences</span>
        </li>
      </ul>
      
      <p className="help-text">
        If you believe this is an error, please{' '}
        <a href="/contact">contact support</a>.
      </p>
    </div>
  );
}
```

### App Initialization

```typescript
// main.tsx
import { BrowserSupport } from './lib/browser-support';
import { UnsupportedBrowserPage } from './pages/UnsupportedBrowser';

// Check browser support before mounting app
if (!BrowserSupport.isSupported()) {
  // Redirect to unsupported page
  window.location.href = '/unsupported-browser';
  // Or render inline:
  // ReactDOM.createRoot(document.getElementById('root')!).render(<UnsupportedBrowserPage />);
} else {
  // Load polyfills for Tier 2 browsers
  if (!BrowserSupport.isFullySupported()) {
    await import('./lib/polyfills');
  }
  
  // Mount app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  );
}
```

---

## 13. Update Policy

### Browser Support Lifecycle

| Tier | Support Duration | Update Policy |
|------|------------------|---------------|
| Tier 1 | 2 years from release | Full support, all features |
| Tier 2 | 1 year from Tier 1 promotion | Graceful degradation |
| Tier 3 | None | Redirect to unsupported page |

### Quarterly Review Process

1. **Browser Usage Analysis**
   - Review analytics for browser distribution
   - Identify emerging browser versions
   - Check for deprecated feature usage

2. **Version Bump Evaluation**
   - Consider bumping minimum versions if:
     - Usage of old versions drops below 2%
     - Security vulnerabilities exist
     - Feature support significantly improved

3. **Documentation Updates**
   - Update this document with new versions
   - Update README badges
   - Notify users of support changes

### Communication Strategy

| Change Type | Notice Period | Communication |
|-------------|---------------|---------------|
| New Tier 1 version | None | Release notes |
| Tier 2 → Tier 3 | 3 months | In-app warning, blog post |
| Tier 1 → Tier 2 | 6 months | In-app warning, email, blog |
| Feature deprecation | 3 months | Console warning, docs |

---

## Appendix A: Browser Support Badge

For use in README.md:

```markdown
[![Browser Support](https://img.shields.io/badge/browser%20support-Chrome%2090%2B%20%7C%20Edge%2090%2B%20%7C%20Firefox%2088%2B%20%7C%20Safari%2015%2B-brightgreen)](./planning/BROWSER-SUPPORT.md)
```

Alternative formats:

```markdown
<!-- Simple -->
![Chrome 90+](https://img.shields.io/badge/Chrome-90%2B-blue)
![Firefox 88+](https://img.shields.io/badge/Firefox-88%2B-orange)
![Safari 15+](https://img.shields.io/badge/Safari-15%2B-blue)

<!-- Detailed -->
| Tier | Browsers |
|------|----------|
| 🟢 Full | Chrome 90+, Edge 90+, Firefox 88+, Safari 15+ |
| 🟡 Partial | Chrome 80+, Firefox 78+, Safari 14 |
| 🔴 None | IE, Safari < 14, Chrome < 80 |
```

---

## Appendix B: Test Matrix Summary

| Test | Chrome | Firefox | Safari | Edge | iOS | Android |
|------|--------|---------|--------|------|-----|---------|
| File Upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Drag & Drop | ✅ | ✅* | ✅ | ✅ | N/A | N/A |
| IndexedDB | ✅ | ✅ | ✅* | ✅ | ⚠️ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ |
| Offline | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| Keyboard Nav | ✅ | ✅ | ✅ | ✅ | N/A | N/A |
| Screen Reader | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

\* See [Browser-Specific Bugs](#8-browser-specific-bugs--workarounds) section

---

*Document Version: 1.0*  
*Last Updated: 2026-02-13*  
*Next Review: 2026-05-13*
