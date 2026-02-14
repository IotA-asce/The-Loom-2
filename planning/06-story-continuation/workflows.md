# Story Continuation Engine: Workflows

## 1. Chapter Generation Flow

```
User selects branch and requests new chapter
    ↓
+--------------------------------------------------+
|  Load Context                                    |
|  - Branch premise and trajectory                 |
|  - Character states (current)                    |
|  - World state                                   |
|  - Previous chapters (if any)                    |
|  - Narrative style profile                       |
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Generate Chapter Outline                        |
|  - Plan chapter structure                        |
|  - Identify key scenes                           |
|  - Map character arcs                            |
|  - Plan emotional beats                          |
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Generate Full Chapter                           |
|  - Write scene by scene                          |
|  - Maintain character voices                     |
|  - Progress plot                                 |
|  - Ensure pacing                                 |
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Quality Check                                   |
|  - Coherence validation                          |
|  - Style consistency                             |
|  - Continuity check                              |
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Present to User                                 |
|  - Display chapter                               |
|  - Show outline                                  |
|  - Offer edit/regenerate                         |
+--------------------------------------------------+
```

---

## 2. Context Assembly for Chapter

```
Chapter Generation Request
    ↓
Assemble Context Package:
    ↓
┌─────────────────────────────────────────────────┐
│ BRANCH CONTEXT                                  │
│ - Premise: What if Kira chose differently...    │
│ - Trajectory: Story direction                   │
│ - Current point in narrative arc                │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ CHARACTER STATES                                │
│ - Current emotional states                      │
│ - Recent experiences (from previous chapters)   │
│ - Current motivations                           │
│ - Relationship status                           │
│ - Voice/dialogue patterns                       │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ PREVIOUS CHAPTERS                               │
│ - Last 2-3 chapters (full text)                 │
│ - Earlier chapters (summaries)                  │
│ - Unresolved plot threads                       │
│ - Running themes                                │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ NARRATIVE STYLE                                 │
│ - Tone and atmosphere                           │
│ - Pacing preferences                            │
│ - Dialogue style                                │
│ - Description density                           │
└─────────────────────────────────────────────────┘
    ↓
Context Package → LLM
```

---

## 3. Chapter Outline Generation

```
Context Package
    ↓
Generate Outline Prompt:
"Based on the current state, plan Chapter X:

Current Situation: [summary]
Characters Available: [list]
Unresolved Threads: [list]
Trajectory Direction: [direction]

Create outline with:
1. Chapter title
2. 3-5 scenes with purpose
3. Character presence per scene
4. Key emotional beats
5. Setup for next chapter

Output structured outline."
    ↓
LLM Response
    ↓
Parse Outline
    ↓
Validate Outline
    ↓
Store Outline
```

**Outline Structure:**
```
Chapter X: [Title]

Scene 1: [Purpose - Setup]
- Characters: [who]
- Location: [where]
- Key Event: [what happens]
- Emotional Beat: [feeling]

Scene 2: [Purpose - Rising Action]
...

Scene 3: [Purpose - Climax]
...

Scene 4: [Purpose - Resolution/Hook]
- Ends with: [cliffhanger or wrap-up]
- Unresolved: [threads for next chapter]
```

---

## 4. Scene-by-Scene Writing

```
Chapter Outline
    ↓
For each scene in outline:
    ↓
+--------------------------------------------------+
|  Generate Scene                                  |
|  - Scene context from outline                    |
|  - Character voices for present characters       |
|  - Previous scene ending (continuity)            |
|  - Emotional target                              |
+--------------------------------------------------+
    ↓
Write Scene Content
    ↓
Add to Chapter
    ↓
Next Scene
    ↓
(Repeat until all scenes written)
```

**Scene Writing Prompt:**
```
Write Scene X: [purpose]

Context:
- Previous scene ended with: [ending]
- Characters present: [list with current states]
- Location: [setting description]
- Must accomplish: [narrative goal]
- Emotional tone: [feeling]

Character Voices:
[Character A]: [speech pattern examples]
[Character B]: [speech pattern examples]

Style: [narrative style guidance]
Length: [target word count]

Write the scene maintaining voice, progressing plot, hitting emotional beat.
```

---

## 5. Chapter Quality Validation

```
Generated Chapter
    ↓
+--------------------------------------------------+
|  Coherence Check                                 |
|  - Does it follow from previous chapter?         |
|  - Are character actions motivated?              |
|  - Is plot progression logical?                  │
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Voice Consistency Check                         |
|  - Do characters sound like themselves?          |
|  - Does narrative voice match style?             |
|  - Is dialogue natural?                          │
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Continuity Check                                |
|  - No contradictions with previous chapters      |
|  - Character knowledge correct                   |
|  - World rules followed                          │
+--------------------------------------------------+
    ↓
Quality Score: 0-1
    ↓
Pass → Present to User
Fail → Flag for revision
```

---

## 6. User Review and Editing

```
+--------------------------------------------------+
|  Chapter X: [Title]                     [Edit]   |
+--------------------------------------------------+
|                                                  |
|  [Generated chapter text displayed...]          |
|                                                  |
|  ~2,400 words • ~12 min read                     |
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │  Quality: 92%                          │     │
|  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │     │
|  └────────────────────────────────────────┘     │
|                                                  |
|  [Regenerate]  [Edit Manually]  [Continue →]    |
|                                                  |
+--------------------------------------------------+
```

**User Options:**
- **Accept:** Save chapter, continue to next
- **Regenerate:** Rewrite with same outline or new
- **Edit:** Manual editing interface
- **Adjust:** Give feedback for regeneration

---

## 7. Manual Editing Interface

```
+--------------------------------------------------+
|  Editing Chapter X                      [Done]   |
+--------------------------------------------------+
|                                                  |
|  [Full text editor with chapter content]        |
|                                                  |
|  ┌────────────────────────────────────────┐     |
|  │ Suggestions:                           │     │
|  │ • Make dialogue more tense             │     │
|  │ • Expand the fight scene               │     │
|  │ • Add more internal monologue          │     │
|  └────────────────────────────────────────┘     │
|                                                  |
|  [AI Assist] - Get help with selected text      |
|                                                  |
+--------------------------------------------------+
```

**Editing Features:**
- Full text editing
- AI assistance (rewrite selection)
- Suggestion panel
- Version history
- Undo/redo

---

## 8. Multi-Chapter Arc Planning

```
Branch Selected
    ↓
+--------------------------------------------------+
|  Plan Story Arc                                  |
|  - Estimated chapter count                       |
|  - Major plot milestones                         |
|  - Character arc endpoints                       |
|  - Theme resolution                              |
+--------------------------------------------------+
    ↓
User Reviews Arc Plan
    ↓
Generate Chapters Sequentially
    ↓
After Each Chapter:
  - Update character states
  - Note plot progression
  - Track unresolved threads
    ↓
User Decides:
  - Continue to next chapter
  - End story here
  - Branch again
```

---

## 9. Story Conclusion

```
User indicates story should end
    ↓
+--------------------------------------------------+
|  Generate Final Chapter                          |
|  - Resolve main conflicts                        |
|  - Complete character arcs                       |
|  - Satisfying conclusion                         |
|  - Optional epilogue                             |
+--------------------------------------------------+
    ↓
+--------------------------------------------------+
|  Story Complete                                  |
|  - X chapters generated                          |
|  - Export options                                |
|  - Archive or continue?                          |
+--------------------------------------------------+
```
