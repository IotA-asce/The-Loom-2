# Core Infrastructure: Features

## F1: Project Scaffolding

**Description:** Initialize the React + TypeScript project with build tooling.

**Requirements:**
- Vite for fast development and optimized builds
- TypeScript with strict mode enabled
- Path aliases (`@/` for src)
- ESLint + Prettier configuration
- Git hooks for code quality

**Acceptance Criteria:**
- [ ] `npm run dev` starts dev server in < 2s
- [ ] `npm run build` produces production bundle
- [ ] No TypeScript errors in strict mode
- [ ] Import paths use `@/` aliases consistently

---

## F2: State Management Architecture

**Description:** Define how application state is structured and persisted.

**Requirements:**
- Zustand for global state (lightweight, TypeScript-friendly)
- React Query (TanStack Query) for server/LLM state
- Immer for immutable updates
- Persistence middleware for Zustand stores

**Store Structure:**
```typescript
// User preferences
interface PreferencesStore {
  theme: 'light' | 'dark' | 'auto';
  defaultLLM: string;
  language: string;
}

// API configuration
interface ConfigStore {
  providers: LLMProviderConfig[];
  activeProviderId: string;
}

// App-level UI state
interface UIStore {
  sidebarOpen: boolean;
  activeModal: string | null;
}
```

**Acceptance Criteria:**
- [ ] State changes trigger reactive UI updates
- [ ] User preferences persist across sessions
-- [ ] API keys encrypted before persistence
- [ ] State can be time-travel debugged (Redux DevTools compatible)

---

## F3: LLM Provider Abstraction

**Description:** Unified interface for multiple LLM providers.

**Interface:**
```typescript
interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: LLMCapabilities;
  
  configure(config: ProviderConfig): void;
  validateKey(): Promise<boolean>;
  
  // Core methods
  analyzeImages(images: ImageData[], prompt: string): Promise<AnalysisResult>;
  generateText(prompt: string, context?: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T>;
}
```

**Implementations:**
- `GeminiProvider` — primary, full multimodal support
- `OpenAIProvider` — GPT-4V for images, GPT-4 for text
- `AnthropicProvider` — Claude 3 for text (no native image in API yet)

**Acceptance Criteria:**
- [ ] Providers implement common interface
- [ ] Switching providers doesn't require code changes in consuming components
- [ ] Failed requests trigger automatic retry with exponential backoff
- [ ] Token usage tracked per request

---

## F4: Database Layer

**Description:** Client-side persistence for application data.

**Technology:** Dexie.js (IndexedDB wrapper) for browser storage

**Schema:**
```typescript
interface DatabaseSchema {
  // Manga imports
  mangas: {
    id: string;
    title: string;
    sourceFiles: FileMetadata[];
    pageCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  
  // Storyline analysis results
  storylines: {
    id: string;
    mangaId: string;
    summary: string;
    timeline: TimelineEvent[];
    rawAnalysis: string;
  };
  
  // Anchor events
  anchorEvents: {
    id: string;
    storylineId: string;
    chapter: number;
    page: number;
    description: string;
    significance: string;
    branchesGenerated: boolean;
  };
  
  // Branches
  branches: {
    id: string;
    anchorEventId: string;
    premise: string;
    summary: string;
    isSelected: boolean;
  };
  
  // Generated chapters
  chapters: {
    id: string;
    branchId: string | null; // null = original timeline continuation
    sequence: number;
    title: string;
    content: string;
    generatedAt: Date;
  };
}
```

**Acceptance Criteria:**
- [ ] All CRUD operations type-safe
- [ ] Queries indexed for performance
- [ ] Data export/import functionality
- [ ] Migration system for schema updates

---

## F5: Configuration Management

**Description:** Secure storage and retrieval of user configuration.

**Requirements:**
- Encrypted storage of API keys (crypto-js AES)
- Environment-specific overrides
- Validation on input
- Export/Import settings

**Security:**
- API keys never logged
- Encryption key derived from user session
- Clear documentation that this is client-side only (not foolproof)

**Acceptance Criteria:**
- [ ] API keys encrypted at rest
- [ ] Configuration validated before save
- [ ] Invalid config prevents app launch with clear error
- [ ] Settings can be exported as JSON

---

## F6: Error Handling & Logging

**Description:** Centralized error management and diagnostic logging.

**Error Types:**
```typescript
class AppError extends Error {
  code: string;
  userMessage: string;
  shouldRetry: boolean;
}

class NetworkError extends AppError { }
class LLMError extends AppError { 
  provider: string;
  statusCode?: number;
}
class ValidationError extends AppError { }
```

**Logging Levels:**
- ERROR: Failures requiring user attention
- WARN: Degraded functionality
- INFO: Significant state changes
- DEBUG: Development diagnostics

**Acceptance Criteria:**
- [ ] All errors have user-friendly messages
- [ ] Errors categorized for appropriate handling
- [ ] Logs viewable in developer mode
- [ ] Critical errors reported to error boundary

---

## F7: Type System

**Description:** Comprehensive TypeScript definitions shared across components.

**Core Types:**
- Domain types (Manga, Storyline, AnchorEvent, Branch, Chapter)
- API types (LLM requests/responses)
- UI types (Component props, events)
- Utility types (Result<T,E>, AsyncState)

**Acceptance Criteria:**
- [ ] No `any` types in production code
- [ ] All API responses validated against schemas
- [ ] Type guards for runtime type checking
- [ ] JSDoc comments on public APIs
