# Component 7: React UI Application

## Definition

The user-facing interface that ties together all backend components into a cohesive, beautiful experience. Built with React and TypeScript, following Apple.com aesthetic principles — clean, whitespace-driven, purposeful motion, and content-first design.

This is the layer users interact with to upload manga, analyze stories, discover anchor events, generate branches, and read continued narratives.

---

## Boundaries

### In Scope
- All user interface components and screens
- Navigation and routing
- State management for UI
- Theme and appearance
- Responsive design (desktop, tablet, mobile)
- Animations and transitions
- Accessibility (keyboard navigation, screen readers)
- Progressive Web App features (optional)
- Onboarding and help
- Settings and configuration UI

### Out of Scope
- Backend logic (handled by Components 1-6)
- LLM API calls (handled by Component 1/3/5/6)
- Database operations (handled by Component 1)
- Image processing (handled by Component 2)

---

## Core Design Principles

### Apple Aesthetic Mandate

| Principle | Implementation |
|-----------|----------------|
| **Whitespace** | Generous padding, content breathes |
| **Typography** | System fonts, clear hierarchy, readable sizes |
| **Color** | Restrained palette, purposeful accents |
| **Motion** | Subtle, purposeful, ease-in-out curves |
| **Simplicity** | One primary action per screen |
| **Depth** | Layered interfaces, subtle shadows |

### Navigation Philosophy

- Clear hierarchy
- Contextual actions
- Minimal cognitive load
- Progressive disclosure

---

## User Flows

### Primary Flows

1. **Upload → Analyze → Discover Anchors → Generate Branches → Read**
   - Complete pipeline from manga to story

2. **Browse Library → Continue Reading**
   - Return to existing stories

3. **Explore Branches → Compare → Select → Continue**
   - Branch exploration workflow

4. **Settings → Configure API → Adjust Preferences**
   - Configuration flow

---

## Key Screens

### Core Screens

| Screen | Purpose |
|--------|---------|
| **Library** | Browse manga and stories |
| **Upload** | Import new manga |
| **Analysis** | View storyline analysis |
| **Anchors** | Explore anchor events |
| **Branches** | Generate and compare branches |
| **Reader** | Read and edit chapters |
| **Settings** | Configure application |

### Supporting Screens

| Screen | Purpose |
|--------|---------|
| **Welcome/Onboarding** | First-time user experience |
| **Help/Documentation** | User assistance |
| **Feedback** | Submit feedback |
| **Export** | Download stories |

---

## Component Dependencies

- **Core Infrastructure** (Component 1)
  - State management (Zustand)
  - API clients
  - Database (Dexie.js)
  
- **All Backend Components** (2-6)
  - Services to call
  - Data to display
  - Workflows to guide

---

## Tech Stack Considerations

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | React 18 | Concurrent features, Suspense |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Apple-like utility classes |
| Animation | Framer Motion | Purposeful, smooth |
| Icons | Lucide React | Clean, consistent |
| State | Zustand | Lightweight, TypeScript-friendly |
| Routing | React Router | Declarative routing |

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | < 768px | Phones |
| Tablet | 768-1024px | iPad, small laptops |
| Desktop | > 1024px | Full desktop |

---

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Reduced motion support
- High contrast mode
- Focus indicators

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

---

## Design System

### Colors (Apple-inspired)

```css
/* Light Mode */
--background-primary: #ffffff;
--background-secondary: #f5f5f7;
--text-primary: #1d1d1f;
--text-secondary: #86868b;
--accent: #0071e3;

/* Dark Mode */
--background-primary: #000000;
--background-secondary: #1d1d1f;
--text-primary: #f5f5f7;
--text-secondary: #86868b;
--accent: #0a84ff;
```

### Typography Scale

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Large Title | 34px | Bold | Screen titles |
| Title 1 | 28px | Semibold | Page headers |
| Title 2 | 22px | Semibold | Section headers |
| Headline | 17px | Semibold | Labels |
| Body | 17px | Regular | Primary text |
| Callout | 16px | Regular | Emphasized |
| Subhead | 15px | Regular | Secondary text |
| Footnote | 13px | Regular | Captions |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Component internal |
| md | 16px | Component padding |
| lg | 24px | Section padding |
| xl | 32px | Large sections |
| 2xl | 48px | Screen padding |
| 3xl | 64px | Major sections |

---

## Success Criteria

- [ ] Interface feels premium and Apple-like
- [ ] All user flows are intuitive
- [ ] Responsive on all device sizes
- [ ] Accessible to all users
- [ ] Performant and smooth
- [ ] Consistent with design system
- [ ] Users can complete core tasks without confusion

---

## 10 Sub-Components to Interrogate

1. **Application Shell** — Navigation, layout, theme
2. **Library Manager** — Browse and organize manga
3. **Upload Flow** — Import with chapter segmentation
4. **Analysis Viewer** — View storyline analysis
5. **Anchor Explorer** — Browse and select anchors
6. **Branch Studio** — Generate and compare branches
7. **Reader & Editor** — Read and edit chapters
8. **Settings & Configuration** — App preferences
9. **Onboarding & Help** — User guidance
10. **Feedback System** — Status and feedback

---

*This component brings everything together into a cohesive, beautiful experience.*
