# Deployment & DevOps Specification

> **Project:** The Loom 2 - Manga Branching Narrative Generator  
> **Type:** Vite + React + TypeScript SPA (Client-side only)  
> **Version:** 1.0.0  
> **Last Updated:** 2026-02-13

---

## Executive Summary

The Loom 2 is a client-side Single Page Application (SPA) with no backend server requirements. This specification outlines a zero-cost deployment strategy leveraging static site hosting with CDN distribution. The architecture prioritizes simplicity, performance, and reliability while maintaining the ability to scale if needed.

**Key Decisions:**
- ✅ Static hosting over serverless (no backend needed)
- ✅ Cloudflare Pages (free tier, generous limits)
- ✅ GitHub Actions for CI/CD (native integration)
- ✅ Zero-cost infrastructure for typical usage

---

## 1. Deployment Architecture

### 1.1 Recommended Approach: Static Site Hosting

| Provider | Primary Use | Rationale |
|----------|-------------|-----------|
| **Cloudflare Pages** | Primary | Free unlimited bandwidth, 500 builds/month, excellent global CDN |
| Vercel | Alternative | Great ecosystem, similar free tier |
| Netlify | Alternative | Mature platform, good DX |
| GitHub Pages | Fallback | Free, but limited to public repos |

**Justification:** As a client-side SPA that processes data locally (IndexedDB) and calls external LLM APIs directly, there's no need for server-side processing. Static hosting provides:
- **Global CDN** for fast asset delivery
- **Edge caching** for optimal performance
- **Simplified deployment** with automatic HTTPS
- **Cost efficiency** at zero cost for our scale

### 1.2 Architecture Diagram

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │         Cloudflare Edge Network      │     │             │
│    User     │────→│  ┌─────────┐    ┌───────────────┐   │────→│  LLM APIs   │
│   Browser   │     │  │   PoP   │    │   KV Store    │   │     │(Gemini/etc) │
│             │←────│  │ (Cache) │    │ (Config only) │   │←────│             │
└──────┬──────┘     │  └─────────┘    └───────────────┘   │     └─────────────┘
       │            └─────────────────────────────────────┘
       │                              │
       │                              ↓
       │                      ┌───────────────┐
       │                      │ Static Files  │
       │                      │ (dist folder) │
       │                      └───────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Client-Side Components                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   React SPA  │  │  IndexedDB   │  │ LocalStorage │  │ Service Worker   │ │
│  │  (Vite+TS)   │  │  (Dexie.js)  │  │  (Settings)  │  │ (Optional PWA)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Data Flow

1. **Initial Load**: User requests `app.theloom2.com` → Cloudflare edge serves static files
2. **App Initialization**: React app mounts, loads user data from IndexedDB
3. **User Interaction**: All state changes happen client-side
4. **API Calls**: Direct from browser to LLM providers (Gemini/OpenAI) with user-provided keys
5. **Data Persistence**: Stories and progress saved to IndexedDB only

---

## 2. Environment Strategy

### 2.1 Environment Definitions

| Environment | Purpose | Branch | URL Pattern | Auto-Deploy |
|-------------|---------|--------|-------------|-------------|
| Development | Local development | `feature/*` | `localhost:5173` | N/A |
| Preview | PR validation | `pull/*` | `*.theloom2.pages.dev` | On PR |
| Staging | Pre-release testing | `staging` | `staging.theloom2.com` | On merge to `staging` |
| Production | Live application | `main` | `app.theloom2.com` | Manual approval |

### 2.2 Environment Variables

#### Build-Time Variables (Vite)

These are injected at build time and become part of the bundle:

```bash
# .env.development
VITE_APP_NAME="The Loom 2"
VITE_APP_VERSION="1.0.0"
VITE_API_BASE_URL="https://api.example.com"
VITE_ENABLE_DEBUG=true

# .env.production
VITE_APP_NAME="The Loom 2"
VITE_APP_VERSION="1.0.0"
VITE_API_BASE_URL="https://api.example.com"
VITE_ENABLE_DEBUG=false
```

**Important:** All `VITE_` prefixed variables are embedded in the client bundle. Never put secrets here.

#### Runtime Variables

Since this is a client-side app, true runtime environment variables don't exist. Instead, use:

1. **Feature Flags**: Load from a JSON config file or API endpoint
2. **User Configuration**: Store in localStorage/IndexedDB
3. **Build Variants**: Different builds for different environments

### 2.3 Secrets Management

| Secret Type | Handling | Notes |
|-------------|----------|-------|
| LLM API Keys | User-provided only | Never stored server-side |
| Analytics Keys | Build-time env | Low sensitivity |
| Sentry DSN | Build-time env | Public by design |

**Decision Record (ADR-001):** No server-side secrets storage. All API keys are user-managed and stored encrypted in IndexedDB only.

---

## 3. CI/CD Pipeline

### 3.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GitHub Actions Workflow                           │
└─────────────────────────────────────────────────────────────────────────────┘

Pull Request ─────────────────────────────────────────────────────────────────►
    │
    ├──► Lint (ESLint) ──► Type Check ──► Unit Tests ──► Build Verification
    │                                                        │
    └──► Deploy Preview ────────────────────────────────────►│

Merge to Main ────────────────────────────────────────────────────────────────►
    │
    ├──► Full Test Suite ──► Build Production ──► Deploy Staging
    │                                               │
    └──► Smoke Tests ──► [MANUAL APPROVAL] ──► Deploy Production

Nightly ──────────────────────────────────────────────────────────────────────►
    │
    ├──► Visual Regression Tests
    ├──► Performance Benchmarks
    └──► Dependency Audit (npm audit + Snyk)
```

### 3.2 GitHub Actions Configuration

#### Main Workflow: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 1: Quality Gates (Run on every push/PR)
  # ═════════════════════════════════════════════════════════════════════════════
  
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: ESLint
        run: pnpm lint
      
      - name: Prettier check
        run: pnpm format:check

  type-check:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 2: Build Verification
  # ═════════════════════════════════════════════════════════════════════════════
  
  build:
    name: Build Verification
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm build
        env:
          VITE_APP_VERSION: ${{ github.sha }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 3: Deploy Preview (PR only)
  # ═════════════════════════════════════════════════════════════════════════════
  
  deploy-preview:
    name: Deploy Preview
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read
      deployments: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: the-loom-2
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 4: Deploy Staging
  # ═════════════════════════════════════════════════════════════════════════════
  
  deploy-staging:
    name: Deploy to Staging
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: staging
      url: https://staging.theloom2.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Staging
        uses: cloudflare/pages-action@v1
        with:
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: the-loom-2-staging
          directory: dist

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 5: Smoke Tests
  # ═════════════════════════════════════════════════════════════════════════════
  
  smoke-test:
    name: Smoke Tests
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:smoke
        env:
          TEST_URL: https://staging.theloom2.com

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 6: Deploy Production (Manual approval required)
  # ═════════════════════════════════════════════════════════════════════════════
  
  deploy-production:
    name: Deploy to Production
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: production
      url: https://app.theloom2.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Production
        uses: cloudflare/pages-action@v1
        with:
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: the-loom-2
          directory: dist
      
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: the-loom
          SENTRY_PROJECT: the-loom-2
        with:
          environment: production
          version: ${{ github.sha }}

  # ═════════════════════════════════════════════════════════════════════════════
  # STAGE 7: Nightly Jobs
  # ═════════════════════════════════════════════════════════════════════════════
  
  visual-regression:
    name: Visual Regression Tests
    if: github.event.schedule == '0 2 * * *'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:visual

  dependency-audit:
    name: Dependency Audit
    if: github.event.schedule == '0 2 * * *'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        continue-on-error: true
```

### 3.3 Pipeline Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Build Time | < 3 minutes | > 5 minutes |
| Test Duration | < 2 minutes | > 4 minutes |
| Deployment Time | < 1 minute | > 2 minutes |
| Pipeline Success Rate | > 95% | < 90% |

---

## 4. Build Configuration

### 4.1 Vite Configuration

#### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer (only in analyze mode)
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  // Build settings
  build: {
    // Output directory
    outDir: 'dist',
    
    // Asset naming with content hash for long-term caching
    assetsDir: 'assets',
    
    // Generate source maps (dev only)
    sourcemap: mode === 'development',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: {
          // Vendor libraries - rarely change
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['zustand', 'immer'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-db': ['dexie'],
          // Feature chunks - split by route/feature
          'feature-editor': ['./src/features/editor'],
          'feature-story': ['./src/features/story'],
          'feature-analytics': ['./src/features/analytics'],
        },
        // Entry file naming
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf|eot)$/.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          if (ext === 'css') {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    
    // Asset inlining thresholds
    assetsInlineLimit: 4096, // 4KB
    
    // CSS settings
    cssCodeSplit: true,
    cssMinify: true,
    
    // Report bundle size
    reportCompressedSize: true,
    
    // Chunk size warning
    chunkSizeWarningLimit: 500, // KB
  },
  
  // Development server
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    host: true,
  },
  
  // Preview server (for testing production build)
  preview: {
    port: 4173,
    strictPort: true,
  },
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'dexie',
    ],
    exclude: [],
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
}));
```

### 4.2 TypeScript Configuration

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4.3 Bundle Analysis

```bash
# Analyze bundle size
pnpm build:analyze

# Check for duplicates
pnpm depcheck

# Verify tree shaking
pnpm build -- --mode analyze
```

---

## 5. CDN Configuration

### 5.1 Cloudflare Pages Setup

#### Dashboard Configuration

| Setting | Value |
|---------|-------|
| Build Command | `pnpm build` |
| Build Output Directory | `dist` |
| Root Directory | `/` |
| Node Version | `20` |

#### Environment Variables (Dashboard)

```
VITE_APP_NAME=The Loom 2
VITE_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
VITE_ANALYTICS_ID=xxx
```

### 5.2 Headers Configuration

#### `_headers` (Cloudflare Pages)

```
# Security headers for all routes
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Cache static assets forever (they have content hashes)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache images
/images/*
  Cache-Control: public, max-age=86400

# Cache fonts
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Never cache HTML (SPA routing)
/index.html
  Cache-Control: no-cache, no-store, must-revalidate

# API responses (if any)
/api/*
  Cache-Control: no-cache
```

### 5.3 Redirects Configuration

#### `_redirects` (Cloudflare Pages)

```
# WWW to apex redirect
https://www.theloom2.com/* https://app.theloom2.com/:splat 301!

# Force HTTPS
http://app.theloom2.com/* https://app.theloom2.com/:splat 301!

# SPA fallback - all routes to index.html
/* /index.html 200
```

### 5.4 Cache Invalidation Strategy

| Asset Type | Cache Duration | Invalidation Trigger |
|------------|----------------|---------------------|
| JS/CSS (hashed) | 1 year | New build |
| Images | 1 day | Manual purge |
| HTML | No cache | Every deploy |
| API responses | No cache | N/A |

---

## 6. Domain & DNS Setup

### 6.1 Recommended Domain Strategy

| Domain | Purpose | Type |
|--------|---------|------|
| `app.theloom2.com` | Main application | CNAME → Cloudflare Pages |
| `staging.theloom2.com` | Staging environment | CNAME → Cloudflare Pages |
| `www.theloom2.com` | Redirect to apex | 301 Redirect |
| `theloom2.com` | Marketing site (future) | Separate project |

### 6.2 Cloudflare DNS Configuration

```dns
# DNS Records
Type    Name              Value                                    TTL
───────────────────────────────────────────────────────────────────────────
A       @                 192.0.2.1 (Cloudflare Pages)             Auto
CNAME   app               the-loom-2.pages.dev                     Auto
CNAME   staging           the-loom-2-staging.pages.dev             Auto
CNAME   www               app.theloom2.com                         Auto

# Page Rules
1. app.theloom2.com/*
   - SSL: Full (Strict)
   - Always Use HTTPS: ON
   - Security Level: Medium
   - Browser Cache TTL: 4 hours

2. staging.theloom2.com/*
   - SSL: Full (Strict)
   - Always Use HTTPS: ON
   - Browser Cache TTL: 30 minutes
```

### 6.3 SSL/TLS Configuration

| Setting | Value |
|---------|-------|
| Mode | Full (Strict) |
| Certificate | Cloudflare Managed |
| Minimum TLS Version | 1.2 |
| HSTS | Enabled (max-age: 15552000) |

---

## 7. Rollback Strategy

### 7.1 Rollback Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Error Rate | > 1% of page loads | Automatic rollback consideration |
| Core Web Vitals | LCP > 4s, CLS > 0.25 | Performance rollback |
| User Reports | > 5 critical bug reports | Emergency rollback |
| Failed Smoke Tests | Any failure | Block deployment |

### 7.2 Rollback Methods

#### Method 1: Cloudflare Pages Instant Rollback (Preferred)

```bash
# Using Wrangler CLI
npx wrangler pages deployment list --project-name the-loom-2
npx wrangler pages deployment tail --project-name the-loom-2 --deployment-id <ID>
```

**Time to rollback:** < 30 seconds

#### Method 2: Git Revert + Redeploy

```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main

# Or roll back to specific tag
git checkout v1.2.0
git checkout -b hotfix/rollback-v1.2.0
git push origin hotfix/rollback-v1.2.0
# Create PR and merge
```

**Time to rollback:** 3-5 minutes

#### Method 3: Version Pinning (Emergency)

```bash
# In Cloudflare dashboard:
# Pages → the-loom-2 → Deployments → Click "..." on working version → "Activate"
```

**Time to rollback:** < 1 minute

### 7.3 Rollback Decision Matrix

| Severity | Impact | Method | Approval |
|----------|--------|--------|----------|
| Critical | App unusable | Instant | Auto or on-call |
| High | Major feature broken | Instant | On-call |
| Medium | Minor feature broken | Git revert | Team lead |
| Low | Cosmetic issue | Next deploy | Regular process |

---

## 8. Monitoring & Alerting

### 8.1 Client-Side Error Tracking

#### Sentry Configuration

```typescript
// src/monitoring/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  beforeSend(event) {
    // Filter out known non-actionable errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    return event;
  },
});
```

#### Sentry Alert Rules

| Alert | Condition | Notification |
|-------|-----------|--------------|
| Error Spike | > 50 errors in 5 min | Slack + Email |
| New Error Type | First occurrence | Slack |
| Daily Digest | Daily summary | Email |
| Release Health | Adoption < 80% after 24h | Slack |

### 8.2 Performance Monitoring

#### Web Vitals

```typescript
// src/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function initWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
  
  // Send to analytics (optional)
  getCLS(sendToAnalytics);
  getLCP(sendToAnalytics);
}

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    keepalive: true,
  });
}
```

#### Performance Budgets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB | < 600ms | 600ms - 1s | > 1s |
| JS Bundle | < 200KB | 200KB - 500KB | > 500KB |

### 8.3 Uptime Monitoring

#### Cloudflare Health Checks

```
Health Check Configuration:
- URL: https://app.theloom2.com/health
- Method: GET
- Interval: 60 seconds
- Timeout: 5 seconds
- Expected codes: 200
- Follow redirects: Yes
```

#### Status Page

Use Cloudflare's built-in status page or external service:
- **Recommended:** UptimeRobot (free tier: 50 monitors)
- **Alternative:** Better Uptime (free tier: 10 monitors)

### 8.4 Alert Routing

| Alert Type | Urgency | Channel | Response Time |
|------------|---------|---------|---------------|
| Site Down | Critical | SMS + Slack + Email | 15 min |
| Error Spike | High | Slack + Email | 1 hour |
| Performance | Medium | Slack | 4 hours |
| Security | Critical | SMS + Email | Immediate |

---

## 9. Database Migrations (IndexedDB)

### 9.1 Migration Strategy

Since data is stored client-side in IndexedDB via Dexie.js, migrations happen in the browser:

```typescript
// src/db/migrations.ts
import Dexie from 'dexie';

export const db = new Dexie('TheLoom2');

// Migration definitions
export const migrations = {
  // Version 1: Initial schema
  1: {
    stores: {
      stories: '++id, title, createdAt, updatedAt',
      chapters: '++id, storyId, order',
      settings: 'key',
    },
  },
  
  // Version 2: Add tags to stories
  2: {
    upgrade: (tx) => {
      return tx.table('stories').toCollection().modify((story) => {
        story.tags = story.tags || [];
      });
    },
  },
  
  // Version 3: Add user preferences
  3: {
    stores: {
      preferences: 'key',
    },
  },
};

// Apply migrations
db.version(1).stores(migrations[1].stores);
db.version(2).stores(migrations[2].stores).upgrade(migrations[2].upgrade);
db.version(3).stores(migrations[3].stores);
```

### 9.2 Migration Best Practices

1. **Never delete data in migrations** - Always migrate/transform
2. **Always be backward compatible** - Old app versions should still work
3. **Test migrations** - Use migration test suite
4. **Version your schema** - Document all changes

### 9.3 Migration Rollback

```typescript
// src/db/rollback.ts
export async function rollbackToVersion(targetVersion: number) {
  // Export current data
  const exportData = await db.export();
  
  // Store backup in localStorage (limited size)
  localStorage.setItem('db_backup', JSON.stringify(exportData));
  
  // Clear and reopen with target version
  await db.delete();
  
  // Re-initialize with lower version
  db.close();
  // Re-open logic...
}
```

### 9.4 Data Export/Import

```typescript
// src/db/backup.ts
export async function exportUserData(): Promise<Blob> {
  const data = {
    version: db.verno,
    exportedAt: new Date().toISOString(),
    stories: await db.table('stories').toArray(),
    chapters: await db.table('chapters').toArray(),
    settings: await db.table('settings').toArray(),
  };
  
  return new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
}

export async function importUserData(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Validate version compatibility
  if (data.version > db.verno) {
    throw new Error('Backup is from a newer version. Please update the app first.');
  }
  
  // Import logic...
}
```

---

## 10. Security Considerations

### 10.1 Content Security Policy (CSP)

```
# _headers (Cloudflare Pages)
/*
  Content-Security-Policy: default-src 'self'; 
    script-src 'self' 'unsafe-inline' https://js.sentry-cdn.com; 
    style-src 'self' 'unsafe-inline'; 
    img-src 'self' data: blob: https:; 
    font-src 'self'; 
    connect-src 'self' https://api.example.com https://sentry.io https://*.googleapis.com; 
    media-src 'self' blob:; 
    worker-src 'self' blob:; 
    frame-ancestors 'none'; 
    base-uri 'self'; 
    form-action 'self';
```

### 10.2 Subresource Integrity (SRI)

Vite generates SRI hashes automatically when configured:

```typescript
// vite.config.ts
import { sri } from 'vite-plugin-sri';

export default defineConfig({
  plugins: [
    // ... other plugins
    sri({
      algorithm: 'sha384',
    }),
  ],
});
```

### 10.3 API Key Handling

```typescript
// src/services/llm-api.ts
import { encrypt, decrypt } from '@/utils/crypto';

const ENCRYPTION_KEY = 'loom2-user-key'; // Derived from user password or device

export async function storeApiKey(provider: string, apiKey: string): Promise<void> {
  const encrypted = await encrypt(apiKey, ENCRYPTION_KEY);
  await db.settings.put({ key: `apiKey_${provider}`, value: encrypted });
}

export async function getApiKey(provider: string): Promise<string | null> {
  const record = await db.settings.get(`apiKey_${provider}`);
  if (!record) return null;
  return decrypt(record.value, ENCRYPTION_KEY);
}
```

### 10.4 Dependency Security

#### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: '/'
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    labels:
      - dependencies
      - security
    reviewers:
      - team-maintainers
    
  - package-ecosystem: github-actions
    directory: '/'
    schedule:
      interval: weekly
```

#### Security Scanning

```bash
# npm audit
npm audit --audit-level=moderate

# Snyk (free for open source)
npx snyk test

# License compliance
npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause;ISC'
```

---

## 11. Performance Optimization

### 11.1 Build-Time Optimizations

#### Code Splitting by Route

```typescript
// src/router.tsx
import { lazy, Suspense } from 'react';

const StoryEditor = lazy(() => import('./features/editor/StoryEditor'));
const StoryList = lazy(() => import('./features/story/StoryList'));
const Analytics = lazy(() => import('./features/analytics/Analytics'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<StoryList />} />
        <Route path="/edit/:id" element={<StoryEditor />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

#### Dynamic Imports for Heavy Components

```typescript
// Lazy load chart library (heavy)
const ChartComponent = lazy(() => import('./ChartComponent'));

// Lazy load off-screen features
const ImportExportModal = lazy(() => 
  import('./features/import-export/ImportExportModal')
);
```

### 11.2 Deploy-Time Optimizations

#### Brotli/Gzip Compression

Cloudflare Pages automatically compresses assets. Verify with:

```bash
curl -H "Accept-Encoding: br" -I https://app.theloom2.com/assets/main.js
# Check for: content-encoding: br
```

#### Image Optimization

```typescript
// Use modern formats
import heroImage from './hero.webp?w=800&format=webp';

// Responsive images
<picture>
  <source srcSet="image.avif" type="image/avif" />
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### 11.3 Runtime Optimizations

#### Service Worker (PWA)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400,
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## 12. Cost Estimation

### 12.1 Infrastructure Costs (Monthly)

| Service | Provider | Free Tier | Paid (if needed) |
|---------|----------|-----------|------------------|
| Static Hosting | Cloudflare Pages | Unlimited | $0 |
| CDN | Cloudflare | Unlimited | $0 |
| DNS | Cloudflare | Unlimited | $0 |
| SSL Certificate | Cloudflare | Unlimited | $0 |
| Error Tracking | Sentry | 5k errors/mo | $26/mo (100k) |
| Uptime Monitoring | UptimeRobot | 50 monitors | $7/mo |
| Domain | Namecheap | - | ~$10/year |
| **Total** | | **$0** | **~$43/mo** |

### 12.2 Bandwidth Estimates

| Scenario | Monthly Users | Avg Page Size | Bandwidth | Cost |
|----------|---------------|---------------|-----------|------|
| Launch | 1,000 | 500KB | 500MB | $0 |
| Growth | 10,000 | 500KB | 5GB | $0 |
| Popular | 100,000 | 500KB | 50GB | $0 |
| Viral | 1,000,000 | 500KB | 500GB | $0 |

**Note:** Cloudflare Pages has no bandwidth limit on the free tier.

### 12.3 Build Minutes

| Activity | Builds/Month | Duration | Total Minutes | Cost |
|----------|---------------|----------|---------------|------|
| Production | 10 | 3 min | 30 | $0 |
| Staging | 30 | 3 min | 90 | $0 |
| PR Previews | 50 | 3 min | 150 | $0 |
| **Total** | | | **270** | **$0** |

**Limit:** 500 builds/month on free tier.

---

## 13. Backup & Recovery

### 13.1 Backup Scope

| Item | Backup Method | Frequency | Retention |
|------|---------------|-----------|-----------|
| Source Code | GitHub | Continuous | Infinite |
| Build Config | GitHub | Continuous | Infinite |
| CI/CD Config | GitHub | Continuous | Infinite |
| User Data | N/A (client-side) | N/A | N/A |

### 13.2 Disaster Recovery Plan

#### Scenario 1: Repository Compromise

```bash
# Recovery steps:
1. Clone from last known good backup
2. Rotate all secrets (Cloudflare API keys, Sentry tokens)
3. Audit recent commits
4. Notify users if API keys were exposed
5. Force password resets if applicable
```

#### Scenario 2: Accidental Data Loss

Since all user data is client-side:
- Users are responsible for their own backups
- Provide clear export instructions in UI
- Consider cloud sync feature (future)

#### Scenario 3: DNS/Domain Issues

```
Recovery Procedure:
1. Verify Cloudflare status: https://www.cloudflarestatus.com/
2. Check DNS propagation: dig +trace app.theloom2.com
3. Switch to backup DNS provider if needed
4. Update nameservers at registrar
5. Monitor for 24 hours
```

### 13.3 Rapid Redeployment

```bash
# Emergency redeployment script
#!/bin/bash
set -e

echo "Starting emergency redeployment..."

# 1. Verify environment
git fetch origin
git checkout main
git pull

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Run tests
pnpm test:ci

# 4. Build
pnpm build

# 5. Deploy to Cloudflare
npx wrangler pages deploy dist --project-name the-loom-2

echo "Deployment complete!"
echo "Verify at: https://app.theloom2.com"
```

---

## 14. Release Process

### 14.1 Versioning Strategy

**Semantic Versioning (SemVer):** `MAJOR.MINOR.PATCH`

| Version Type | When to Increment | Example |
|--------------|-------------------|---------|
| MAJOR | Breaking changes | 1.0.0 → 2.0.0 |
| MINOR | New features, backward compatible | 1.0.0 → 1.1.0 |
| PATCH | Bug fixes | 1.0.0 → 1.0.1 |

### 14.2 Release Checklist

```markdown
## Release vX.Y.Z

### Pre-Release
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped in package.json

### Release
- [ ] Create release branch: `git checkout -b release/vX.Y.Z`
- [ ] Run full test suite: `pnpm test:ci`
- [ ] Build production: `pnpm build`
- [ ] Smoke test on staging
- [ ] Create git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Monitor for 1 hour

### Post-Release
- [ ] Update release notes on GitHub
- [ ] Announce in Discord/Slack
- [ ] Update status page
- [ ] Schedule post-mortem if issues
```

### 14.3 Changelog Maintenance

#### `CHANGELOG.md` Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.2.0] - 2026-02-15

### Added
- New storyline branching visualization
- Export to PDF feature
- Dark mode support

### Changed
- Improved LLM prompt caching
- Updated React to v18.3

### Fixed
- Fixed IndexedDB migration error
- Fixed memory leak in story editor

## [1.1.0] - 2026-01-20

...
```

### 14.4 GitHub Releases

Create releases via GitHub CLI:

```bash
# Create release notes from changelog
git tag v1.2.0
git push origin v1.2.0

gh release create v1.2.0 \
  --title "The Loom 2 v1.2.0" \
  --notes-file CHANGELOG.md \
  --latest
```

---

## 15. Effort Estimates

### 15.1 Initial Setup Effort

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Cloudflare Pages setup | 2 hours | P0 |
| GitHub Actions workflow | 4 hours | P0 |
| Domain & DNS configuration | 2 hours | P0 |
| Sentry integration | 2 hours | P1 |
| Build optimization | 4 hours | P1 |
| Security headers setup | 2 hours | P1 |
| Documentation | 4 hours | P2 |
| **Total** | **20 hours** | |

### 15.2 Ongoing Maintenance

| Activity | Frequency | Estimated Time |
|----------|-----------|----------------|
| Dependency updates | Weekly | 1 hour |
| Security audits | Monthly | 2 hours |
| Performance review | Monthly | 2 hours |
| Cost review | Quarterly | 1 hour |
| Disaster recovery drill | Quarterly | 2 hours |
| **Monthly Total** | | **~8 hours** |

---

## 16. Decision Records

### ADR-001: Static Hosting Over Serverless

**Status:** Accepted  
**Date:** 2026-02-13

**Context:** The Loom 2 is a client-side SPA with no backend requirements. Users' data is stored locally.

**Decision:** Use static hosting (Cloudflare Pages) instead of serverless functions.

**Consequences:**
- ✅ Zero hosting costs
- ✅ Simple deployment
- ✅ Global CDN
- ❌ No server-side logic possible
- ❌ API keys must be handled client-side

### ADR-002: No User Data Backup (Client-Side Only)

**Status:** Accepted  
**Date:** 2026-02-13

**Context:** All user data is stored in IndexedDB in the browser.

**Decision:** Do not implement centralized backup. Provide export/import functionality instead.

**Consequences:**
- ✅ Zero liability for user data
- ✅ No GDPR/data privacy concerns
- ✅ Works offline
- ❌ Users can lose data if browser storage is cleared
- ❌ No cross-device sync

### ADR-003: Manual Production Deployments

**Status:** Accepted  
**Date:** 2026-02-13

**Context:** Production deployments require verification.

**Decision:** Require manual approval for production deployments.

**Consequences:**
- ✅ Prevents accidental releases
- ✅ Allows smoke testing on staging
- ❌ Slightly slower release cycle
- ❌ Requires on-call person

---

## 17. Appendices

### A. Quick Reference Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:ci          # Run tests for CI
pnpm test:smoke       # Run smoke tests
pnpm test:visual      # Run visual regression tests

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm type-check       # Run TypeScript check

# Deployment
pnpm deploy:staging   # Deploy to staging
pnpm deploy:prod      # Deploy to production (manual)

# Maintenance
pnpm outdated         # Check for outdated deps
pnpm audit            # Security audit
pnpm build:analyze    # Analyze bundle size
```

### B. File Structure

```
.github/
├── workflows/
│   ├── ci-cd.yml          # Main CI/CD pipeline
│   ├── nightly.yml        # Nightly jobs
│   └── dependabot.yml     # Dependency updates
public/
├── _headers               # Cloudflare headers
├── _redirects             # Cloudflare redirects
└── _routes.json           # Cloudflare routing
src/
├── db/
│   ├── index.ts           # Dexie database setup
│   └── migrations.ts      # Migration definitions
├── monitoring/
│   ├── sentry.ts          # Sentry configuration
│   └── web-vitals.ts      # Web Vitals setup
└── ...
vite.config.ts           # Vite configuration
```

### C. External Resources

| Resource | URL |
|----------|-----|
| Cloudflare Pages Docs | https://developers.cloudflare.com/pages/ |
| Vite Deployment Guide | https://vitejs.dev/guide/static-deploy.html |
| Sentry React Docs | https://docs.sentry.io/platforms/javascript/guides/react/ |
| Web Vitals | https://web.dev/vitals/ |
| CSP Reference | https://content-security-policy.com/ |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-13 | DevOps Team | Initial specification |

---

*This document is a living specification. Update it as the deployment strategy evolves.*
