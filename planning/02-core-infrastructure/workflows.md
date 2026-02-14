# Core Infrastructure: Workflows

## 1. Application Bootstrap

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  App Start  │────▶│ Load Config  │────▶│ Init Stores │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │  Restore State  │
              │  (if persisted) │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   App Ready     │
              └─────────────────┘
```

**Steps:**
1. Load environment configuration
2. Initialize Zustand stores with persistence
3. Restore user preferences from IndexedDB
4. Validate API key format (not validity — that happens on use)
5. Render application shell

---

## 2. LLM Provider Registration

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User enters │────▶│  Validate    │────▶│   Store in  │
│   API key   │     │   format     │     │   config    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Test connection │
              │   (optional)    │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        ┌─────────┐       ┌─────────┐
        │ Success │       │  Fail   │
        └─────────┘       └─────────┘
```

**Steps:**
1. User inputs API key in settings
2. Format validation (starts with correct prefix)
3. Encrypted storage in IndexedDB
4. Optional: Test call to verify validity
5. Update available providers list

---

## 3. State Persistence

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  State      │────▶│  Debounced   │────▶│   IndexedDB │
│  Change     │     │   Save (1s)  │     │   Update    │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Persisted State:**
- User preferences (theme, default LLM)
- API keys (encrypted)
- Active story IDs (not full content)
- UI state (sidebar collapsed, etc.)

**Not Persisted (in-memory only):**
- Current analysis progress
- Temporary UI states
- Cached LLM responses (may be cached separately)

---

## 4. Error Handling Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Error     │────▶│  Error Type  │────▶│   Handler   │
│  Occurs     │     │   Detected   │     │   Selected  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
          ┌────────────┬────────────┬───────────┘
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Network │  │  LLM    │  │   App   │
    │  Error  │  │  Error  │  │  Error  │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Retry   │  │ Fallback│  │  Crash  │
    │ Logic   │  │ Provider│  │Boundary │
    └─────────┘  └─────────┘  └─────────┘
```

**Error Categories:**
- **NetworkError**: Retry with exponential backoff
- **LLMError**: Switch to fallback provider if configured
- **ValidationError**: User-facing form error
- **AppError**: Error boundary + crash reporting

---

## 5. Database Migration

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   App       │────▶│ Check Schema │────▶│  Migration  │
│   Opens     │     │   Version    │     │   Needed?   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                   ┌────────────┴────────────┐
                                   │                         │
                                   ▼                         ▼
                            ┌─────────┐               ┌─────────┐
                            │   No    │               │   Yes   │
                            └────┬────┘               └────┬────┘
                                 │                         │
                                 ▼                         ▼
                          ┌───────────┐             ┌───────────┐
                          │ Continue  │             │ Run Migrations
                          │   App     │             │ & Validate
                          └───────────┘             └───────────┘
```
