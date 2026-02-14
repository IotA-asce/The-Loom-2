# Core Infrastructure: Implementation Tasks

## Phase 1: Project Setup

### T1.1: Initialize Vite Project
**Effort:** 30 min
- [ ] Run `npm create vite@latest the-loom-2 -- --template react-ts`
- [ ] Install dependencies: `react`, `react-dom`, `@types/react`, `@types/react-dom`
- [ ] Configure path aliases in `vite.config.ts`
- [ ] Verify dev server starts correctly

### T1.2: Configure TypeScript
**Effort:** 20 min
- [ ] Enable strict mode in `tsconfig.json`
- [ ] Add path mapping for `@/*`
- [ ] Create `src/types/index.ts` barrel export
- [ ] Verify build passes without errors

### T1.3: Setup Linting & Formatting
**Effort:** 30 min
- [ ] Install ESLint with TypeScript support
- [ ] Install Prettier
- [ ] Configure `.eslintrc.cjs`
- [ ] Configure `.prettierrc`
- [ ] Add lint-staged and husky for pre-commit hooks
- [ ] Verify pre-commit hooks run

### T1.4: Install Core Dependencies
**Effort:** 15 min
```bash
npm install zustand immer @tanstack/react-query dexie dexie-react-hooks
npm install crypto-js @types/crypto-js
npm install clsx tailwind-merge
```

---

## Phase 2: State Management

### T2.1: Create Zustand Store Structure
**Effort:** 1 hour
- [ ] Create `src/stores/` directory
- [ ] Implement `usePreferencesStore` with persistence
- [ ] Implement `useConfigStore` with encrypted persistence
- [ ] Implement `useUIStore` (non-persisted)
- [ ] Add middleware for persistence and devtools

### T2.2: Setup React Query
**Effort:** 45 min
- [ ] Configure QueryClient in `src/lib/query-client.ts`
- [ ] Setup QueryClientProvider in App root
- [ ] Define default query options (staleTime, retry)
- [ ] Create query key factory functions

### T2.3: Implement Persistence Layer
**Effort:** 1 hour
- [ ] Create encryption utility using crypto-js
- [ ] Implement storage adapter for Zustand
- [ ] Handle encryption key derivation
- [ ] Add migration handling for store versions
- [ ] Test persistence across reloads

---

## Phase 3: LLM Provider Abstraction

### T3.1: Define Provider Interface
**Effort:** 45 min
- [ ] Create `src/lib/llm/types.ts` with all interfaces
- [ ] Define `LLMProvider` abstract class
- [ ] Define configuration types
- [ ] Define request/response types
- [ ] Add token usage tracking types

### T3.2: Implement Gemini Provider
**Effort:** 2 hours
- [ ] Create `GeminiProvider` class
- [ ] Implement `validateKey()` with test call
- [ ] Implement `analyzeImages()` with multimodal support
- [ ] Implement `generateText()` for story generation
- [ ] Implement `generateStructured()` for typed outputs
- [ ] Add error handling and retry logic
- [ ] Write unit tests

### T3.3: Implement OpenAI Provider
**Effort:** 1.5 hours
- [ ] Create `OpenAIProvider` class
- [ ] Implement all interface methods
- [ ] Handle GPT-4V image inputs
- [ ] Add error handling
- [ ] Write unit tests

### T3.4: Create Provider Factory
**Effort:** 30 min
- [ ] Create `createProvider(type, config)` function
- [ ] Implement provider registry
- [ ] Add provider availability checking
- [ ] Create hook: `useLLMProvider()`

---

## Phase 4: Database Layer

### T4.1: Setup Dexie Database
**Effort:** 1 hour
- [ ] Create `src/lib/db/index.ts`
- [ ] Define `LoomDatabase` class extending Dexie
- [ ] Define all table schemas
- [ ] Add compound indexes for queries
- [ ] Create type-safe table accessors

### T4.2: Implement Entity Stores
**Effort:** 2 hours
- [ ] Create `MangaRepository` with CRUD operations
- [ ] Create `StorylineRepository` with CRUD operations
- [ ] Create `AnchorEventRepository` with CRUD operations
- [ ] Create `BranchRepository` with CRUD operations
- [ ] Create `ChapterRepository` with CRUD operations
- [ ] Add relationship queries (getBranchesForEvent, etc.)

### T4.3: Database Migrations
**Effort:** 45 min
- [ ] Create migration runner
- [ ] Implement version check on startup
- [ ] Write migration from v1 to v2 (as template)
- [ ] Add migration error handling

---

## Phase 5: Error Handling & Logging

### T5.1: Error Class Hierarchy
**Effort:** 30 min
- [ ] Create `AppError` base class
- [ ] Create `NetworkError`, `LLMError`, `ValidationError`
- [ ] Add error codes enum
- [ ] Create error message mapping

### T5.2: Error Boundary
**Effort:** 45 min
- [ ] Create `ErrorBoundary` React component
- [ ] Add fallback UI for crashes
- [ ] Implement error reporting (to console for now)
- [ ] Add "Reset Application" option

### T5.3: Logging System
**Effort:** 30 min
- [ ] Create logger with levels (error, warn, info, debug)
- [ ] Add log storage (ring buffer, max 1000 entries)
- [ ] Create `useLogger()` hook
- [ ] Add console output in dev mode

---

## Phase 6: Configuration UI

### T6.1: Settings Screen Layout
**Effort:** 1.5 hours
- [ ] Create `SettingsScreen` component
- [ ] Implement section grouping
- [ ] Add navigation rows
- [ ] Style per Apple aesthetic specs

### T6.2: Provider Configuration Modal
**Effort:** 1.5 hours
- [ ] Create `ProviderConfigModal` component
- [ ] Implement API key input with masking
- [ ] Add validation and test connection
- [ ] Implement save/cancel flow

### T6.3: Toast Notification System
**Effort:** 1 hour
- [ ] Create `ToastProvider` context
- [ ] Implement `Toast` component with variants
- [ ] Add toast queue management
- [ ] Implement auto-dismiss and swipe-to-close
- [ ] Create `useToast()` hook

---

## Phase 7: Developer Tools

### T7.1: Developer Console
**Effort:** 1 hour
- [ ] Create hidden developer screen
- [ ] Implement log viewer with filtering
- [ ] Add state inspector (read-only)
- [ ] Add export functionality

### T7.2: Debug Gestures
**Effort:** 30 min
- [ ] Implement version tap detection (5x)
- [ ] Add keyboard shortcut (Cmd+Shift+D)
- [ ] Create entry point in settings

---

## Phase 8: Integration & Testing

### T8.1: Integration Tests
**Effort:** 2 hours
- [ ] Test store persistence across reloads
- [ ] Test provider switching
- [ ] Test database CRUD operations
- [ ] Test error boundaries

### T8.2: Build Verification
**Effort:** 30 min
- [ ] Verify production build succeeds
- [ ] Check bundle size (target: < 500KB initial)
- [ ] Verify no TypeScript errors
- [ ] Run all lint checks

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Project Setup | 4 | ~2 hours |
| 2. State Management | 3 | ~3 hours |
| 3. LLM Provider | 4 | ~5 hours |
| 4. Database | 3 | ~4 hours |
| 5. Error Handling | 3 | ~2 hours |
| 6. Configuration UI | 3 | ~4 hours |
| 7. Developer Tools | 2 | ~1.5 hours |
| 8. Integration | 2 | ~2.5 hours |
| **Total** | **24** | **~24 hours** |

---

## Definition of Done

- [ ] All 24 tasks complete
- [ ] `npm run build` succeeds with no errors
- [ ] All stores persist and restore correctly
- [ ] Both Gemini and OpenAI providers functional
- [ ] Database operations type-safe and tested
- [ ] Settings UI matches Apple aesthetic
- [ ] Error boundaries catch all thrown errors
- [ ] Developer console accessible and functional

---

## Next Component

After completing Core Infrastructure, proceed to:
**Component 2: Manga Ingestion Engine**
