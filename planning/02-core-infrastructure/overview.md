# Component 1: Core Infrastructure

## Definition

The foundational layer upon which all other components are built. Establishes project architecture, state management patterns, LLM provider abstraction, and cross-cutting concerns like configuration, error handling, and data persistence.

---

## Boundaries

### In Scope
- Project scaffolding and build configuration
- State management architecture (React Context + Zustand)
- LLM Provider abstraction layer
- Database schema and persistence (SQLite/IndexedDB for local, optional cloud)
- Configuration management (API keys, user preferences)
- Error handling and logging infrastructure
- Type definitions and shared utilities

### Out of Scope
- Specific manga parsing logic (handled in Component 2)
- LLM analysis prompts and logic (handled in Component 3)
- UI components (handled in Component 7)
- Image generation (future component)

---

## Inputs

| Source | Data | Purpose |
|--------|------|---------|
| User | API keys (Gemini, OpenAI, etc.) | LLM authentication |
| User | Preferences (theme, default LLM) | Personalization |
| System | Environment variables | Build-time config |

## Outputs

| Consumer | Data | Purpose |
|----------|------|---------|
| All Components | Typed interfaces, state stores | Consistent development |
| All Components | LLMProvider instance | Unified LLM access |
| All Components | Database client | Persistent storage |

---

## Success Criteria

- [ ] Project builds without errors
- [ ] State management supports offline-first workflow
- [ ] LLM provider can be swapped via configuration
- [ ] Database schema supports all planned entities
- [ ] Type safety enforced across codebase
- [ ] Error boundaries catch and log failures gracefully

---

## Dependencies

None — this is the foundation.

## Dependents

All other components (2-7) depend on this.
