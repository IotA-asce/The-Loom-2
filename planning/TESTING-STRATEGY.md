# Testing Strategy Document

> **Project:** The Loom 2 — Manga Branching Narrative Generator  
> **Last Updated:** 2026-02-13  
> **Status:** Draft  
> **Estimated Implementation Effort:** 3-4 weeks full-time

---

## 1. Testing Philosophy & Goals

### 1.1 Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲         ~10% (Critical paths)
                 ╱  (20)  ╲
                ╱──────────╲
               ╱Integration ╲    ~20% (Component workflows)
              ╱    (40)      ╲
             ╱────────────────╲
            ╱   Unit Tests      ╲  ~70% (Business logic)
           ╱      (140)          ╲
          ╱────────────────────────╲
```

| Level | Ratio | Target Count | Execution Time |
|-------|-------|--------------|----------------|
| **Unit Tests** | 70% | ~140 tests | < 30s |
| **Integration Tests** | 20% | ~40 tests | < 2min |
| **E2E Tests** | 10% | ~20 tests | < 5min |

### 1.2 Coverage Targets

| Metric | Target | Critical Paths |
|--------|--------|----------------|
| **Overall Coverage** | > 70% | 100% |
| **LLM Provider Layer** | > 90% | 100% |
| **Database Layer** | > 85% | 100% |
| **State Management** | > 80% | 100% |
| **Analysis Pipeline** | > 75% | 100% |
| **UI Components** | > 60% | Critical flows |
| **Utilities** | > 90% | 100% |

### 1.3 Quality Gates

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRE-COMMIT HOOKS                           │
├─────────────────────────────────────────────────────────────────┤
│  ✓ TypeScript strict type checking                              │
│  ✓ ESLint with auto-fix                                         │
│  ✓ Prettier formatting                                          │
│  ✓ Unit tests for changed files (staged)                        │
│  ✓ No console.log / debugger statements                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PR CHECKS                                 │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Full unit test suite (< 30s)                                 │
│  ✓ Integration tests (< 2min)                                   │
│  ✓ Coverage threshold enforcement (> 70%)                       │
│  ✓ Build verification                                           │
│  ✓ Bundle size check (< 500KB initial)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MERGE TO MAIN                              │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Full E2E test suite (< 5min)                                 │
│  ✓ Visual regression baseline update                            │
│  ✓ Lighthouse CI performance audit                              │
│  ✓ Accessibility audit (axe-core)                               │
│  ✓ Dependency security audit                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Testing Tools & Framework

### 2.1 Tool Selection Matrix

| Category | Tool | Justification | Effort |
|----------|------|---------------|--------|
| **Unit Testing** | Vitest | Native Vite integration, fast HMR, compatible with Jest APIs | 2 days |
| **Component Testing** | React Testing Library + Vitest | User-centric queries, encourages accessibility, no implementation details | 1 day |
| **E2E Testing** | Playwright | Auto-waiting, trace viewer, cross-browser, parallel execution | 3 days |
| **Visual Regression** | Storybook + Chromatic | Component isolation, cloud-based diffing, CI integration | 2 days |
| **Performance** | Lighthouse CI + Web Vitals | Industry standard, budget enforcement, trend tracking | 1 day |
| **Accessibility** | axe-core + jest-axe | Automated a11y checks, WCAG 2.1 AA compliance | 1 day |
| **Mocking** | MSW (Mock Service Worker) | API mocking without code changes, shared mocks across test levels | 1 day |

### 2.2 Why Vitest Over Jest

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Native ESM support - no transpilation needed
    deps: {
      inline: [/dexie/],
    },
  },
});
```

| Feature | Vitest | Jest |
|---------|--------|------|
| Vite Native | ✅ Yes | ❌ Requires config |
| HMR in Tests | ✅ Yes | ❌ No |
| ESM First | ✅ Native | ⚠️ Experimental |
| TypeScript | ✅ Native | ⚠️ ts-jest required |
| Speed | ✅ Faster | ⚠️ Slower |
| Watch Mode | ✅ Built-in | ✅ Yes |

### 2.3 Why Playwright Over Cypress

| Feature | Playwright | Cypress |
|---------|------------|---------|
| Cross-browser | ✅ Chromium, Firefox, WebKit | ⚠️ Chromium, Firefox (limited) |
| Parallelization | ✅ Built-in sharding | ⚠️ Requires orchestration |
| Trace Viewer | ✅ Built-in | ❌ Third-party |
| Auto-waiting | ✅ Smart defaults | ✅ Yes |
| API Testing | ✅ Native | ⚠️ Via cy.request |
| Mobile Emulation | ✅ Device descriptors | ⚠️ Viewport only |
| Execution Speed | ✅ Faster | ⚠️ Slower |

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
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
    // Mobile viewport tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 3. Unit Testing Strategy

### 3.1 What to Test

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UNIT TEST PRIORITIES                            │
├─────────────────────────────────────────────────────────────────────┤
│  🔴 CRITICAL (Must Test)                                            │
│     • LLM Provider Abstraction Layer                                │
│     • Database Repository Methods (Dexie.js)                        │
│     • State Management Logic (Zustand stores)                       │
│     • Analysis Pipeline Algorithms                                  │
│     • Data Transformation Utilities                                 │
├─────────────────────────────────────────────────────────────────────┤
│  🟡 IMPORTANT (Should Test)                                         │
│     • Custom Hooks                                                  │
│     • Image Processing Utilities                                    │
│     • Parsing/Serialization Logic                                   │
│     • Validation Functions                                          │
├─────────────────────────────────────────────────────────────────────┤
│  🟢 NICE-TO-HAVE (Can Test)                                         │
│     • Simple UI Utilities                                           │
│     • Constants/Configuration                                       │
│     • Type Guards                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 LLM Provider Testing

```typescript
// src/lib/llm/__tests__/gemini-provider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../gemini-provider';
import { mockGeminiResponses } from '@/test/fixtures/llm-responses';

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider({
      apiKey: 'test-key',
      model: 'gemini-pro',
    });
    
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('generateContent', () => {
    it('should send correct request format', async () => {
      const mockResponse = mockGeminiResponses.success();
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await provider.generateContent('Test prompt');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Test prompt'),
        })
      );
    });

    it('should handle rate limiting with retry', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Rate Limited',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeminiResponses.success()),
        } as Response);

      const result = await provider.generateContent('Test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should throw ProviderError on authentication failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      } as Response);

      await expect(provider.generateContent('Test'))
        .rejects
        .toThrow('Authentication failed');
    });

    it('should track token usage', async () => {
      const mockResponse = mockGeminiResponses.withTokenUsage(150, 200);
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await provider.generateContent('Test');

      expect(result.usage).toEqual({
        promptTokens: 150,
        completionTokens: 200,
        totalTokens: 350,
      });
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid key', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      } as Response);

      const isValid = await provider.validateApiKey();

      expect(isValid).toBe(true);
    });

    it('should return false for invalid key', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const isValid = await provider.validateApiKey();

      expect(isValid).toBe(false);
    });
  });
});
```

### 3.3 Database Repository Testing

```typescript
// src/lib/db/__tests__/manga-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MangaRepository } from '../repositories/manga-repository';
import { createTestDatabase } from '@/test/utils/test-database';
import { mangaFactory } from '@/test/factories/manga';

describe('MangaRepository', () => {
  let db: ReturnType<typeof createTestDatabase>;
  let repository: MangaRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    repository = new MangaRepository(db);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('create', () => {
    it('should create manga with chapters', async () => {
      const manga = mangaFactory.build({
        title: 'Test Manga',
        chapterCount: 3,
      });

      const created = await repository.create(manga);

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Test Manga');
      expect(created.chapters).toHaveLength(3);
    });

    it('should prevent duplicate titles', async () => {
      const manga = mangaFactory.build({ title: 'Duplicate' });
      await repository.create(manga);

      await expect(repository.create(manga))
        .rejects
        .toThrow('Manga with this title already exists');
    });
  });

  describe('findById', () => {
    it('should return manga with chapters', async () => {
      const manga = mangaFactory.build();
      const created = await repository.create(manga);

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.chapters).toBeDefined();
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('should update reading progress', async () => {
      const manga = await repository.create(mangaFactory.build());

      await repository.updateProgress(manga.id, {
        chapterId: 1,
        pageIndex: 5,
        lastReadAt: new Date(),
      });

      const updated = await repository.findById(manga.id);
      expect(updated?.progress?.chapterId).toBe(1);
      expect(updated?.progress?.pageIndex).toBe(5);
    });
  });

  describe('delete', () => {
    it('should cascade delete chapters and pages', async () => {
      const manga = await repository.create(mangaFactory.build());

      await repository.delete(manga.id);

      const found = await repository.findById(manga.id);
      expect(found).toBeNull();
      
      // Verify chapters are also deleted
      const chapters = await db.chapters.where('mangaId').equals(manga.id).toArray();
      expect(chapters).toHaveLength(0);
    });
  });
});
```

### 3.4 Zustand Store Testing

```typescript
// src/stores/__tests__/config-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConfigStore } from '../config-store';
import { createMockStorage } from '@/test/utils/mock-storage';

describe('ConfigStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('provider management', () => {
    it('should add LLM provider', () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.addProvider({
          id: 'test-provider',
          name: 'Test Provider',
          type: 'gemini',
          apiKey: 'encrypted-key',
        });
      });

      expect(result.current.providers).toHaveLength(1);
      expect(result.current.providers[0].name).toBe('Test Provider');
    });

    it('should set active provider', () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.addProvider({
          id: 'provider-1',
          name: 'Provider 1',
          type: 'gemini',
          apiKey: 'key1',
        });
        result.current.setActiveProvider('provider-1');
      });

      expect(result.current.activeProviderId).toBe('provider-1');
    });

    it('should encrypt API keys before storage', () => {
      const mockStorage = createMockStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.addProvider({
          id: 'secure-provider',
          name: 'Secure',
          type: 'openai',
          apiKey: 'sk-secret-key',
        });
      });

      // Verify encryption occurred
      const stored = mockStorage.getItem('config-storage');
      expect(stored).not.toContain('sk-secret-key');
      expect(stored).toContain('encrypted');
    });
  });

  describe('persistence', () => {
    it('should persist to localStorage', () => {
      const mockStorage = createMockStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.addProvider({
          id: 'persisted',
          name: 'Persisted',
          type: 'gemini',
          apiKey: 'key',
        });
      });

      const stored = mockStorage.getItem('config-storage');
      const parsed = JSON.parse(stored || '{}');
      expect(parsed.state.providers).toHaveLength(1);
    });
  });
});
```

### 3.5 Mocking Strategy

```typescript
// src/test/mocks/llm.ts
import { vi } from 'vitest';

export const mockLLMResponses = {
  analysis: {
    valid: () => ({
      characters: [
        { name: 'Ichigo', role: 'protagonist', description: 'Soul Reaper' },
      ],
      timeline: [
        { chapter: 1, events: ['Meets Rukia'] },
      ],
    }),
    malformed: () => 'Invalid JSON response',
    empty: () => ({ characters: [], timeline: [] }),
  },
  branch: {
    valid: () => ({
      premise: 'What if Ichigo never met Rukia?',
      impact: 'He never becomes a Soul Reaper',
      variations: ['Stays human', 'Dies early', 'Finds another path'],
    }),
  },
};

// src/test/mocks/indexeddb.ts
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

export function setupMockIndexedDB() {
  // fake-indexeddb provides in-memory IndexedDB implementation
  global.indexedDB = new IDBFactory();
}

// src/test/mocks/files.ts
export function createMockFile(
  name: string,
  type: string,
  size: number = 1024
): File {
  const blob = new Blob([''.padStart(size, '0')], { type });
  return new File([blob], name, { type });
}

export function createMockCBZ(chapterCount: number = 1): File {
  // Mock CBZ file for testing
  return createMockFile(
    `chapter_${chapterCount}.cbz`,
    'application/vnd.comicbook+zip',
    1024 * 1024 // 1MB
  );
}
```

### 3.6 Test Utilities & Patterns

```typescript
// src/test/utils/test-helpers.ts
import { expect } from 'vitest';

/**
 * Arrange-Act-Assert pattern helper
 */
export function testCase<TInput, TOutput>({
  name,
  input,
  setup,
  action,
  expected,
}: {
  name: string;
  input: TInput;
  setup?: () => void;
  action: (input: TInput) => TOutput | Promise<TOutput>;
  expected: TOutput | ((result: TOutput) => void);
}) {
  it(name, async () => {
    setup?.();
    const result = await action(input);
    
    if (typeof expected === 'function') {
      (expected as (result: TOutput) => void)(result);
    } else {
      expect(result).toEqual(expected);
    }
  });
}

// src/test/factories/manga.ts
import { faker } from '@faker-js/faker';

export const mangaFactory = {
  build: (overrides: Partial<Manga> = {}): Manga => ({
    id: overrides.id ?? faker.number.int(),
    title: overrides.title ?? faker.lorem.words(3),
    author: overrides.author ?? faker.person.fullName(),
    description: overrides.description ?? faker.lorem.paragraph(),
    coverImage: overrides.coverImage ?? faker.image.url(),
    chapterCount: overrides.chapterCount ?? faker.number.int({ min: 1, max: 50 }),
    chapters: overrides.chapters ?? chapterFactory.buildList(
      overrides.chapterCount ?? 10
    ),
    createdAt: overrides.createdAt ?? faker.date.past(),
    updatedAt: overrides.updatedAt ?? faker.date.recent(),
    ...overrides,
  }),
  buildList: (count: number): Manga[] => 
    Array.from({ length: count }, () => mangaFactory.build()),
};

// src/test/setup.ts
import '@testing-library/jest-dom';
import { setupMockIndexedDB } from './mocks/indexeddb';
import { vi } from 'vitest';

// Setup mocks before all tests
setupMockIndexedDB();

// Mock crypto for API key encryption
vi.mock('crypto-js', () => ({
  AES: {
    encrypt: vi.fn((text) => `encrypted:${text}`),
    decrypt: vi.fn((text) => text.replace('encrypted:', '')),
  },
  enc: {
    Utf8: {},
  },
}));
```

---

## 4. Integration Testing Strategy

### 4.1 Integration Test Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION TEST MATRIX                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Upload Flow]                                                      │
│    ├─→ File Upload → Validation → Extraction → Storage              │
│    ├─→ Duplicate Detection → Merge vs Create                        │
│    └─→ Progress Updates → UI Synchronization                        │
│                                                                     │
│  [Analysis Pipeline]                                                │
│    ├─→ Preprocessor → Image Optimization                            │
│    ├─→ LLM Request → Response Handling                              │
│    ├─→ Parser → Data Validation                                     │
│    └─→ Merger → Database Storage                                    │
│                                                                     │
│  [Branch Generation]                                                │
│    ├─→ Anchor Selection → Context Assembly                          │
│    ├─→ LLM Premise Generation                                       │
│    ├─→ Validation → Storage                                         │
│    └─→ UI Update → Navigation                                       │
│                                                                     │
│  [Settings Persistence]                                             │
│    ├─→ Form Changes → Validation                                    │
│    ├─→ Encryption → Storage                                         │
│    ├─→ Page Reload → Decryption                                     │
│    └─→ Provider Switch → Active Connection                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Upload Flow Integration

```typescript
// src/lib/upload/__tests__/upload-flow.integration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadService } from '../upload-service';
import { MangaRepository } from '@/lib/db/repositories/manga-repository';
import { createMockCBZ } from '@/test/mocks/files';
import { createTestDatabase } from '@/test/utils/test-database';

describe('Upload Flow Integration', () => {
  let uploadService: UploadService;
  let mangaRepo: MangaRepository;
  let db: ReturnType<typeof createTestDatabase>;

  beforeEach(async () => {
    db = createTestDatabase();
    mangaRepo = new MangaRepository(db);
    uploadService = new UploadService({
      mangaRepository: mangaRepo,
      onProgress: vi.fn(),
    });
    await db.open();
  });

  it('should complete full upload flow', async () => {
    const mockFile = createMockCBZ(3); // 3 chapters

    // Arrange: Start upload
    const uploadPromise = uploadService.upload(mockFile);

    // Act: Process upload
    const result = await uploadPromise;

    // Assert: Verify database state
    const manga = await mangaRepo.findById(result.mangaId);
    expect(manga).toBeDefined();
    expect(manga?.chapters).toHaveLength(3);
    expect(manga?.status).toBe('uploaded');
  });

  it('should detect and handle duplicates', async () => {
    // Arrange: Upload once
    const mockFile = createMockCBZ(1);
    await uploadService.upload(mockFile);

    // Act: Upload same file
    const result = await uploadService.upload(mockFile, {
      duplicateAction: 'skip',
    });

    // Assert
    expect(result.status).toBe('duplicate-skipped');
    const allManga = await mangaRepo.findAll();
    expect(allManga).toHaveLength(1);
  });

  it('should emit progress events', async () => {
    const progressHandler = vi.fn();
    uploadService = new UploadService({
      mangaRepository: mangaRepo,
      onProgress: progressHandler,
    });

    const mockFile = createMockCBZ(2);
    await uploadService.upload(mockFile);

    // Verify progress callbacks
    expect(progressHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'extracting',
        progress: expect.any(Number),
      })
    );
  });
});
```

### 4.3 Analysis Pipeline Integration

```typescript
// src/lib/analysis/__tests__/pipeline.integration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisPipeline } from '../pipeline';
import { LLMService } from '@/lib/llm/llm-service';
import { MangaRepository } from '@/lib/db/repositories/manga-repository';
import { mangaFactory } from '@/test/factories/manga';
import { mockLLMResponses } from '@/test/mocks/llm';

describe('Analysis Pipeline Integration', () => {
  let pipeline: AnalysisPipeline;
  let llmService: LLMService;
  let mangaRepo: MangaRepository;

  beforeEach(() => {
    llmService = new LLMService();
    mangaRepo = new MangaRepository(createTestDatabase());
    
    pipeline = new AnalysisPipeline({
      llmService,
      mangaRepository: mangaRepo,
    });

    // Mock LLM responses
    vi.spyOn(llmService, 'analyze').mockResolvedValue(
      mockLLMResponses.analysis.valid()
    );
  });

  it('should process manga through full pipeline', async () => {
    // Arrange
    const manga = await mangaRepo.create(
      mangaFactory.build({ chapterCount: 5 })
    );

    // Act
    const result = await pipeline.analyze(manga.id, {
      onProgress: vi.fn(),
    });

    // Assert
    expect(result.status).toBe('completed');
    expect(result.characters).toBeDefined();
    expect(result.timeline).toBeDefined();

    // Verify stored in database
    const updatedManga = await mangaRepo.findById(manga.id);
    expect(updatedManga?.analysis).toBeDefined();
    expect(updatedManga?.status).toBe('analyzed');
  });

  it('should handle LLM errors with retry', async () => {
    vi.spyOn(llmService, 'analyze')
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(mockLLMResponses.analysis.valid());

    const manga = await mangaRepo.create(mangaFactory.build());
    
    const result = await pipeline.analyze(manga.id);

    expect(result.status).toBe('completed');
    expect(llmService.analyze).toHaveBeenCalledTimes(3);
  });

  it('should handle malformed LLM responses', async () => {
    vi.spyOn(llmService, 'analyze').mockResolvedValue(
      mockLLMResponses.analysis.malformed()
    );

    const manga = await mangaRepo.create(mangaFactory.build());

    await expect(pipeline.analyze(manga.id))
      .rejects
      .toThrow('Failed to parse analysis response');
  });
});
```

### 4.4 Database Integration

```typescript
// src/lib/db/__tests__/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../database';

describe('Database Integration', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database('test-db');
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  describe('CRUD operations', () => {
    it('should perform full CRUD on all entities', async () => {
      // Create
      const manga = await db.mangas.add({
        title: 'Test Manga',
        createdAt: new Date(),
      });

      // Read
      const found = await db.mangas.get(manga);
      expect(found?.title).toBe('Test Manga');

      // Update
      await db.mangas.update(manga, { title: 'Updated' });
      const updated = await db.mangas.get(manga);
      expect(updated?.title).toBe('Updated');

      // Delete
      await db.mangas.delete(manga);
      const deleted = await db.mangas.get(manga);
      expect(deleted).toBeUndefined();
    });
  });

  describe('transactions', () => {
    it('should rollback on error', async () => {
      await expect(
        db.transaction('rw', db.mangas, db.chapters, async () => {
          await db.mangas.add({ title: 'Test' });
          throw new Error('Intentional error');
        })
      ).rejects.toThrow();

      // Verify no data persisted
      const count = await db.mangas.count();
      expect(count).toBe(0);
    });
  });

  describe('export/import', () => {
    it('should export and import data consistently', async () => {
      // Seed data
      await db.mangas.add({ title: 'Export Test' });

      // Export
      const exportData = await db.export();

      // Delete all
      await db.delete();
      await db.open();

      // Import
      await db.import(exportData);

      // Verify
      const mangas = await db.mangas.toArray();
      expect(mangas).toHaveLength(1);
      expect(mangas[0].title).toBe('Export Test');
    });
  });
});
```

---

## 5. E2E Testing Strategy

### 5.1 Critical User Paths

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRITICAL USER PATHS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PATH 1: Onboarding                                                 │
│  ───────────────────                                                │
│  First Visit → Welcome Screen → API Key Setup → LLM Test           │
│      → Tutorial → Main Dashboard                                    │
│                                                                     │
│  PATH 2: Upload Flow                                                │
│  ───────────────────                                                │
│  Library View → Drag-Drop CBZ → Processing → Preview               │
│      → Confirm → Library with New Manga                             │
│                                                                     │
│  PATH 3: Analysis Flow                                              │
│  ───────────────────                                                │
│  Select Manga → Start Analysis → Progress Monitoring               │
│      → Results Review → Timeline View                               │
│                                                                     │
│  PATH 4: Branch Generation                                          │
│  ───────────────────                                                │
│  Timeline View → Select Anchor → Branch Options                    │
│      → Preview Branch → Create Branch → Navigate to Branch         │
│                                                                     │
│  PATH 5: Reading Experience                                         │
│  ───────────────────                                                │
│  Library → Open Manga → Chapter List → Reader                      │
│      → Branch Switch → Continue Reading                            │
│                                                                     │
│  PATH 6: Export Flow                                                │
│  ───────────────────                                                │
│  Story View → Export Menu → Format Selection                       │
│      → Download Progress → File Saved                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 E2E Test Examples

```typescript
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('completes full onboarding', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Verify welcome screen
    await expect(page.getByRole('heading', { name: /welcome to the loom/i }))
      .toBeVisible();

    // Click "Get Started"
    await page.getByRole('button', { name: /get started/i }).click();

    // API Key setup
    await expect(page.getByText(/connect your llm/i)).toBeVisible();
    
    await page.getByLabel(/api key/i).fill('test-api-key');
    await page.getByRole('button', { name: /validate/i }).click();

    // Wait for validation
    await expect(page.getByText(/connection successful/i)).toBeVisible();

    // Continue to tutorial
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Complete tutorial steps
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /start creating/i }).click();

    // Verify dashboard loaded
    await expect(page.getByText(/your library/i)).toBeVisible();
  });

  test('handles invalid API key', async ({ page }) => {
    await page.goto('/setup');

    await page.getByLabel(/api key/i).fill('invalid-key');
    await page.getByRole('button', { name: /validate/i }).click();

    await expect(page.getByText(/invalid api key/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i }))
      .toBeDisabled();
  });
});

// e2e/upload.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Flow', () => {
  test('uploads CBZ file successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click upload button
    await page.getByRole('button', { name: /upload manga/i }).click();

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, '../fixtures/test-manga.cbz')
    );

    // Verify processing state
    await expect(page.getByText(/processing/i)).toBeVisible();

    // Wait for completion
    await expect(page.getByText(/upload complete/i)).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: /add to library/i }).click();

    // Verify in library
    await expect(page.getByText('Test Manga')).toBeVisible();
  });

  test('detects duplicate upload', async ({ page }) => {
    // First upload
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, '../fixtures/test-manga.cbz')
    );
    await page.getByRole('button', { name: /add to library/i }).click();

    // Try uploading same file
    await page.getByRole('button', { name: /upload manga/i }).click();
    await fileInput.setInputFiles(
      path.join(__dirname, '../fixtures/test-manga.cbz')
    );

    // Verify duplicate detection
    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /skip/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /replace/i })).toBeVisible();
  });
});

// e2e/analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed test data
    await page.goto('/');
    await page.evaluate(() => {
      // Add test manga via localStorage or API
      localStorage.setItem('test-manga-seed', JSON.stringify({
        id: 'test-manga',
        title: 'Bleach Test',
        status: 'uploaded',
      }));
    });
  });

  test('completes analysis workflow', async ({ page }) => {
    // Navigate to manga
    await page.goto('/manga/test-manga');

    // Start analysis
    await page.getByRole('button', { name: /analyze storyline/i }).click();

    // Verify analysis modal
    await expect(page.getByText(/analyzing storyline/i)).toBeVisible();

    // Mock LLM response for deterministic test
    await page.route('**/generativelanguage.googleapis.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  characters: [{ name: 'Ichigo', role: 'protagonist' }],
                  timeline: [{ chapter: 1, summary: 'Meets Rukia' }],
                }),
              }],
            },
          }],
        }),
      });
    });

    // Wait for completion
    await expect(page.getByText(/analysis complete/i)).toBeVisible({ timeout: 30000 });

    // View results
    await page.getByRole('button', { name: /view results/i }).click();

    // Verify timeline view
    await expect(page.getByText(/timeline/i)).toBeVisible();
    await expect(page.getByText('Ichigo')).toBeVisible();
  });
});

// e2e/branching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Branch Generation', () => {
  test('creates branch from anchor', async ({ page }) => {
    // Navigate to analyzed manga
    await page.goto('/manga/test-manga/timeline');

    // Select anchor event
    await page.getByTestId('anchor-1').click();

    // Generate branches
    await page.getByRole('button', { name: /generate branches/i }).click();

    // Verify branch options appear
    await expect(page.getByText(/possible branches/i)).toBeVisible();

    // Select a branch
    await page.getByTestId('branch-option-1').click();

    // Preview branch
    await page.getByRole('button', { name: /preview/i }).click();

    // Verify preview modal
    await expect(page.getByText(/branch preview/i)).toBeVisible();

    // Create branch
    await page.getByRole('button', { name: /create this branch/i }).click();

    // Verify redirect to new branch
    await expect(page).toHaveURL(/\/branch\/.+/);
  });
});
```

### 5.3 Test Data Management

```typescript
// e2e/fixtures/test-helpers.ts
import { Page } from '@playwright/test';

export async function seedTestManga(page: Page, mangaData: any) {
  await page.evaluate((data) => {
    // Use Dexie directly to seed data
    const db = (window as any).db;
    return db.mangas.add(data);
  }, mangaData);
}

export async function clearTestData(page: Page) {
  await page.evaluate(() => {
    indexedDB.deleteDatabase('loom-database');
  });
}

export async function setupMockLLM(page: Page, response: any) {
  await page.route('**/generativelanguage.googleapis.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{
          content: { parts: [{ text: JSON.stringify(response) }] },
        }],
      }),
    });
  });
}

// e2e/global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Prepare test fixtures
  // Verify test files exist
  // Setup mock server if needed
}

export default globalSetup;
```

### 5.4 Cross-Browser Configuration

| Browser | Priority | Tests | Notes |
|---------|----------|-------|-------|
| **Chrome** | Required | Full suite | Primary development browser |
| **Firefox** | Required | Critical paths | Gecko engine differences |
| **Safari** | Required | Critical paths | WebKit, iOS simulation |
| **Edge** | Nice-to-have | Critical paths | Chromium-based |

---

## 6. Component-Specific Test Plans

### 6.1 Component 1: Core Infrastructure

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Store Persistence | 15 | 3 | 2 | 2 days |
| API Key Encryption | 10 | 2 | 1 | 1 day |
| LLM Provider Switching | 12 | 4 | 2 | 2 days |
| Error Boundaries | 5 | 2 | 1 | 1 day |
| **Total** | **42** | **11** | **6** | **6 days** |

```typescript
// Test examples for Core Infrastructure

describe('Store Persistence', () => {
  it('persists across page reloads', async () => {
    // Set state
    const { result, unmount } = renderHook(() => useConfigStore());
    act(() => result.current.setTheme('dark'));
    unmount();

    // Simulate reload by creating new store instance
    const { result: newResult } = renderHook(() => useConfigStore());
    expect(newResult.current.theme).toBe('dark');
  });
});

describe('API Key Encryption', () => {
  it('encrypts before localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.addProvider({
      id: 'test',
      apiKey: 'secret123',
    }));

    const storedValue = setItemSpy.mock.calls[0][1];
    expect(storedValue).not.toContain('secret123');
    expect(JSON.parse(storedValue)).toHaveProperty('encrypted');
  });
});
```

### 6.2 Component 2: Manga Ingestion

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| File Type Detection | 8 | 2 | 1 | 1 day |
| Archive Extraction | 10 | 3 | 2 | 2 days |
| Duplicate Detection | 6 | 2 | 1 | 1 day |
| Chapter Segmentation | 12 | 3 | 1 | 2 days |
| **Total** | **36** | **10** | **5** | **6 days** |

### 6.3 Component 3: Storyline Analyzer

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Prompt Generation | 10 | 2 | 0 | 1 day |
| Response Parsing | 15 | 4 | 1 | 2 days |
| Error Recovery | 8 | 3 | 1 | 1 day |
| Analysis Accuracy | 5 | 2 | 1 | 1 day |
| **Total** | **38** | **11** | **3** | **5 days** |

```typescript
describe('Response Parsing', () => {
  const parser = new AnalysisParser();

  it.each([
    ['valid JSON', '{"characters":[]}', { characters: [] }],
    ['JSON with markdown', '```json\n{"characters":[]}\n```', { characters: [] }],
    ['nested response', '{"data":{"characters":[]}}', { data: { characters: [] } }],
  ])('parses %s', (_, input, expected) => {
    expect(parser.parse(input)).toEqual(expected);
  });

  it('recovers from malformed JSON with retry', async () => {
    const mockRetry = vi.fn().mockResolvedValue('{"characters":[]}');
    
    const result = await parser.parseWithRetry('invalid', mockRetry);
    
    expect(mockRetry).toHaveBeenCalled();
    expect(result).toEqual({ characters: [] });
  });
});
```

### 6.4 Component 4: Anchor Detector

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Scoring Algorithm | 12 | 2 | 0 | 2 days |
| Impact Calculation | 8 | 2 | 0 | 1 day |
| Manual Anchor Creation | 5 | 2 | 1 | 1 day |
| **Total** | **25** | **6** | **1** | **4 days** |

### 6.5 Component 5: Branch Generator

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Context Assembly | 8 | 3 | 0 | 1 day |
| Premise Generation | 10 | 3 | 1 | 2 days |
| Consistency Validation | 6 | 2 | 0 | 1 day |
| **Total** | **24** | **8** | **1** | **4 days** |

### 6.6 Component 6: Story Continuation

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Outline Generation | 10 | 3 | 1 | 2 days |
| Content Continuity | 8 | 2 | 1 | 1 day |
| Voice Consistency | 6 | 2 | 0 | 1 day |
| Chapter Refinement | 5 | 2 | 0 | 1 day |
| **Total** | **29** | **9** | **2** | **5 days** |

### 6.7 Component 7: React UI

| Feature | Unit Tests | Integration | E2E | Effort |
|---------|------------|-------------|-----|--------|
| Component Rendering | 20 | 0 | 0 | 2 days |
| User Interactions | 15 | 0 | 0 | 2 days |
| Accessibility | 10 | 0 | 0 | 1 day |
| Responsive Behavior | 5 | 0 | 3 | 1 day |
| **Total** | **50** | **0** | **3** | **6 days** |

---

## 7. Visual Regression Testing

### 7.1 Storybook Setup

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/react-vite',
};

export default config;
```

### 7.2 Component Stories

```typescript
// src/components/MangaCard/MangaCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MangaCard } from './MangaCard';

const meta: Meta<typeof MangaCard> = {
  component: MangaCard,
  title: 'Library/MangaCard',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

export default meta;

export const Default: StoryObj<typeof MangaCard> = {
  args: {
    title: 'Bleach',
    author: 'Tite Kubo',
    chapterCount: 686,
    coverUrl: '/bleach-cover.jpg',
  },
};

export const Analyzing: StoryObj<typeof MangaCard> = {
  args: {
    ...Default.args,
    status: 'analyzing',
    progress: 45,
  },
};

export const WithBranches: StoryObj<typeof MangaCard> = {
  args: {
    ...Default.args,
    branchCount: 3,
  },
};

export const LongTitle: StoryObj<typeof MangaCard> = {
  args: {
    ...Default.args,
    title: 'This is an Extremely Long Manga Title That Might Break The Layout',
  },
};
```

### 7.3 Screenshot Coverage

| Screen/Component | Viewports | Themes | Priority |
|------------------|-----------|--------|----------|
| Onboarding Flow | Desktop, Mobile | Light, Dark | Critical |
| Library Grid | Desktop, Tablet, Mobile | Light, Dark | Critical |
| Upload Modal | Desktop, Mobile | Light, Dark | High |
| Timeline View | Desktop, Tablet | Light, Dark | High |
| Branch Preview | Desktop | Light, Dark | High |
| Reader View | Desktop, Tablet, Mobile | Light, Dark | Medium |
| Settings Panels | Desktop | Light, Dark | Medium |
| Error States | Desktop | Light | Low |

### 7.4 Chromatic Integration

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true
```

---

## 8. Performance Testing

### 8.1 Bundle Size Budgets

```javascript
// bundlesize.config.js
module.exports = {
  files: [
    {
      path: './dist/assets/index-*.js',
      maxSize: '150 kB',
      compression: 'gzip',
    },
    {
      path: './dist/assets/vendor-*.js',
      maxSize: '250 kB',
      compression: 'gzip',
    },
    {
      path: './dist/assets/index-*.css',
      maxSize: '30 kB',
      compression: 'gzip',
    },
  ],
};
```

### 8.2 Web Vitals Targets

| Metric | Target | Good | Poor |
|--------|--------|------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 2.5s | > 4s |
| **INP** (Interaction to Next Paint) | < 200ms | < 200ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.1 | > 0.25 |
| **TTFB** (Time to First Byte) | < 600ms | < 600ms | > 1s |
| **FCP** (First Contentful Paint) | < 1.8s | < 1.8s | > 3s |

### 8.3 Lighthouse CI Configuration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/library',
        'http://localhost:5173/manga/1',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 8.4 Memory Leak Detection

```typescript
// e2e/performance/memory.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memory Leak Detection', () => {
  test('should not leak memory during navigation', async ({ page }) => {
    // Get initial heap size
    const initialMetrics = await page.evaluate(() => {
      if ('gc' in window) (window as any).gc();
      return performance.memory?.usedJSHeapSize;
    });

    // Perform navigation cycles
    for (let i = 0; i < 20; i++) {
      await page.goto('/library');
      await page.goto('/manga/test-manga');
      await page.goto('/manga/test-manga/timeline');
    }

    // Force GC and measure
    const finalMetrics = await page.evaluate(() => {
      if ('gc' in window) (window as any).gc();
      return performance.memory?.usedJSHeapSize;
    });

    // Allow 50% growth tolerance
    expect(finalMetrics).toBeLessThan(initialMetrics * 1.5);
  });
});
```

### 8.5 Large Manga Handling

| Scenario | Pages | Target Memory | Target Load Time |
|----------|-------|---------------|------------------|
| Small Manga | 50 | < 50MB | < 2s |
| Medium Manga | 300 | < 100MB | < 5s |
| Large Manga | 1000 | < 200MB | < 10s |
| Extreme Manga | 3000+ | < 500MB | < 30s |

---

## 9. Accessibility Testing

### 9.1 Automated axe-core Checks

```typescript
// src/test/a11y.ts
import { run } from 'axe-core';
import { Page } from '@playwright/test';

export async function checkA11y(page: Page, options = {}) {
  const results = await page.evaluate((opts) => {
    return run(document, {
      rules: {
        'color-contrast': { enabled: true },
        'empty-heading': { enabled: true },
        'heading-order': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
      },
      ...opts,
    });
  }, options);

  return results;
}

// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

const pages = ['/', '/library', '/settings', '/manga/1'];

for (const pageUrl of pages) {
  test(`a11y check for ${pageUrl}`, async ({ page }) => {
    await page.goto(pageUrl);
    const results = await checkA11y(page);
    
    expect(results.violations).toHaveLength(0);
  });
}
```

### 9.2 Keyboard Navigation Tests

```typescript
// e2e/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('navigates library with keyboard only', async ({ page }) => {
    await page.goto('/library');

    // Tab to first manga card
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('manga-card-1')).toBeFocused();

    // Arrow navigation
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('manga-card-2')).toBeFocused();

    // Enter to open
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/manga\/\d+/);
  });

  test('modal trap focus', async ({ page }) => {
    await page.goto('/library');
    await page.getByRole('button', { name: /upload/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Tab cycles within modal
    const focusableElements = await modal.locator('button, input').all();
    for (let i = 0; i < focusableElements.length + 2; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be in modal
    const activeElement = await page.evaluate(() => document.activeElement);
    const isInModal = await modal.evaluate(
      (el, active) => el.contains(active),
      activeElement
    );
    expect(isInModal).toBe(true);
  });
});
```

### 9.3 Screen Reader Testing

| Feature | NVDA (Win) | VoiceOver (Mac) | TalkBack (Android) |
|---------|------------|-----------------|---------------------|
| Navigation | Required | Required | Nice-to-have |
| Form Labels | Required | Required | Nice-to-have |
| Dynamic Updates | Required | Required | Nice-to-have |
| Error Messages | Required | Required | Nice-to-have |

### 9.4 Color Contrast Validation

```typescript
// Unit test for contrast
import { getContrastRatio } from '@/utils/color';

describe('Color Contrast', () => {
  it.each([
    ['#FFFFFF', '#000000', 21], // Maximum contrast
    ['#757575', '#FFFFFF', 4.6], // WCAG AA threshold
    ['#FFFFFF', '#0066CC', 4.5], // Blue on white
  ])('%s on %s has contrast ratio >= %s', (fg, bg, minRatio) => {
    expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(minRatio);
  });
});
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-regression:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.13.x
          lhci autorun
```

### 10.2 Pre-commit Hooks

```javascript
// .husky/pre-commit (or lint-staged config)
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit',
    'vitest related --run',
  ],
  '*.{css,scss}': ['prettier --write'],
  '*.md': ['prettier --write'],
};
```

### 10.3 Quality Gates

| Gate | Required Checks | Block Merge |
|------|-----------------|-------------|
| **Fast Feedback** | Lint, Type Check, Unit Tests (changed) | Yes |
| **PR Check** | Full Unit Tests (>70% coverage), Integration | Yes |
| **Pre-merge** | E2E (Critical paths), Build | Yes |
| **Nightly** | Full E2E (all browsers), Visual Regression, Performance | No |

---

## 11. Test Data Management

### 11.1 Directory Structure

```
src/test/
├── fixtures/              # Static test data
│   ├── manga/
│   │   ├── small.cbz     # 5 pages, 1 chapter
│   │   ├── medium.cbz    # 150 pages, 5 chapters
│   │   └── large.cbz     # 1000+ pages
│   ├── images/
│   │   ├── cover.jpg
│   │   ├── page-001.jpg
│   │   └── page-002.png
│   └── llm-responses/
│       ├── analysis/
│       ├── branches/
│       └── continuation/
├── factories/             # Test data generators
│   ├── manga.ts
│   ├── chapter.ts
│   ├── character.ts
│   └── branch.ts
├── mocks/                 # Mock implementations
│   ├── llm.ts
│   ├── indexeddb.ts
│   ├── files.ts
│   └── storage.ts
└── utils/                 # Test utilities
    ├── test-database.ts
    ├── test-helpers.ts
    ├── render.tsx
    └── setup.ts
```

### 11.2 Mock LLM Response Library

```typescript
// src/test/fixtures/llm-responses/analysis.ts
export const analysisResponses = {
  bleach: {
    characters: [
      { name: 'Ichigo Kurosaki', role: 'protagonist', description: 'Orange-haired Soul Reaper' },
      { name: 'Rukia Kuchiki', role: 'deuteragonist', description: 'Soul Reaper who gave Ichigo powers' },
      { name: 'Orihime Inoue', role: 'supporting', description: 'Ichigo\'s classmate with healing powers' },
    ],
    timeline: [
      { chapter: 1, title: 'The Death and the Strawberry', events: ['Ichigo meets Rukia', 'Becomes substitute Soul Reaper'] },
      { chapter: 2, title: 'Starter', events: ['First Hollow battle'] },
    ],
  },
  
  // Template for generating test responses
  generate: (options: { chapterCount: number }) => ({
    characters: [
      { name: 'Test Protagonist', role: 'protagonist' },
    ],
    timeline: Array.from({ length: options.chapterCount }, (_, i) => ({
      chapter: i + 1,
      title: `Chapter ${i + 1}`,
      events: ['Event occurs'],
    })),
  }),
};
```

### 11.3 Database Seeding

```typescript
// src/test/utils/seed-database.ts
import { Database } from '@/lib/db/database';
import { mangaFactory } from '../factories/manga';

export async function seedDatabase(db: Database, scenario: string) {
  switch (scenario) {
    case 'empty':
      return;
      
    case 'single-manga':
      await db.mangas.add(mangaFactory.build());
      break;
      
    case 'with-analysis':
      await db.mangas.add(mangaFactory.build({
        status: 'analyzed',
        analysis: {
          characters: [{ name: 'Test', role: 'protagonist' }],
          timeline: [],
        },
      }));
      break;
      
    case 'with-branches':
      const manga = await db.mangas.add(mangaFactory.build({
        status: 'analyzed',
      }));
      await db.branches.add({
        mangaId: manga,
        title: 'Alternate Timeline',
        divergencePoint: 1,
      });
      break;
      
    case 'full-library':
      for (let i = 0; i < 20; i++) {
        await db.mangas.add(mangaFactory.build());
      }
      break;
  }
}
```

---

## 12. Debugging & Troubleshooting

### 12.1 Test Failure Investigation Guide

```
┌─────────────────────────────────────────────────────────────────────┐
│              TEST FAILURE INVESTIGATION FLOWCHART                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TEST FAILS                                                         │
│     │                                                               │
│     ▼                                                               │
│  Is it flaky? (fails intermittently)                                │
│     ├── YES → Check for race conditions, timeouts, async issues     │
│     │         ├─ Add explicit waits                                 │
│     │         ├─ Increase timeout                                   │
│     │         └─ Check for side effects between tests               │
│     │                                                               │
│     └── NO → Check error message                                    │
│              │                                                      │
│              ├─ "Cannot find element" → Check selector, timing      │
│              ├─ "Expected X but got Y" → Check data, mocks          │
│              ├─ "Network error" → Check MSW setup, API mocking      │
│              └─ "Timeout" → Check for infinite loops, async hangs   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| **Forgetting cleanup** | Test pollution, flaky tests | Always use `beforeEach`/`afterEach` |
| **Real network calls** | Slow tests, external dependencies | Use MSW to mock all API calls |
| **Missing `act()`** | React warnings, state not updated | Wrap state updates in `act()` or use RTL |
| **Hardcoded IDs** | Test conflicts | Use factory functions with unique IDs |
| **Large test data** | Slow tests, memory issues | Keep fixtures small and focused |
| **Testing implementation** | Brittle tests | Test behavior, not implementation |

### 12.3 Debugging Tools

```typescript
// Enable debug mode in tests
const DEBUG = process.env.DEBUG_TESTS === 'true';

// Helper for debugging
export function debugLog(label: string, data: unknown) {
  if (DEBUG) {
    console.log(`[DEBUG: ${label}]`, JSON.stringify(data, null, 2));
  }
}

// Usage in tests
debugLog('store state', store.getState());
debugLog('llm response', response);
```

### 12.4 Playwright Debugging

```bash
# Run with UI mode for debugging
npx playwright test --ui

# Run specific test with headed browser
npx playwright test upload.spec.ts --headed

# Generate trace for failed tests
npx playwright test --trace on

# Show HTML report
npx playwright show-report
```

### 12.5 Vitest Debugging

```bash
# Run specific test file
npx vitest run src/lib/llm/__tests__/gemini-provider.test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Watch mode
npx vitest --watch

# Debug with Node inspector
node --inspect-brk node_modules/vitest/vitest.mjs --run
```

---

## Appendix A: Estimated Effort Summary

| Section | Estimated Effort |
|---------|------------------|
| Testing Infrastructure Setup | 3 days |
| Unit Tests - Core Infrastructure | 6 days |
| Unit Tests - Manga Ingestion | 6 days |
| Unit Tests - Storyline Analyzer | 5 days |
| Unit Tests - Other Components | 12 days |
| Integration Tests | 5 days |
| E2E Tests | 7 days |
| Visual Regression Setup | 2 days |
| CI/CD Integration | 3 days |
| **Total** | **~49 days** |

## Appendix B: Testing Checklist

### Pre-Development
- [ ] Install and configure Vitest
- [ ] Install and configure React Testing Library
- [ ] Install and configure Playwright
- [ ] Setup MSW for API mocking
- [ ] Configure coverage reporting
- [ ] Setup pre-commit hooks

### Per Component
- [ ] Unit tests for business logic
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Storybook stories created
- [ ] Accessibility checks passing

### Before Release
- [ ] All tests passing
- [ ] Coverage > 70%
- [ ] Visual regression baseline established
- [ ] Performance budgets met
- [ ] Accessibility audit passed
- [ ] Cross-browser testing complete

---

*This document is a living document and should be updated as the testing strategy evolves.*
