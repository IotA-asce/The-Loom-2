# Project Vision: The Loom 2

## The Project

**The Loom 2** is an interactive storytelling platform that reimagines manga narratives through AI-powered timeline branching. Users upload manga (scanned pages, CBZ files, or image sequences), which are analyzed by Large Language Models to understand the storyline, identify pivotal "anchor events," and generate alternate timeline branches. Users can explore "what if" scenarios, continuing stories from branch points chapter by chapter.

## Core Goals

1. **Parse**: Ingest manga in multiple formats (images, CBZ, PDF) and extract storyline via LLM
2. **Analyze**: Understand narrative structure and identify anchor events — pivotal moments where choices shaped the timeline
3. **Branch**: Generate compelling alternate timeline branches from anchor events
4. **Continue**: Allow chapter-by-chapter continuation of both original and branched storylines
5. **Experience**: Deliver an immersive, Apple-aesthetic UI for the entire workflow

## Success Criteria

- [ ] Users can upload manga and receive structured storyline analysis
- [ ] Anchor events are identified with narrative context and significance
- [ ] Each anchor event presents 2-5 meaningful branch alternatives
- [ ] Selected branches can be continued into coherent, serialized chapters
- [ ] Full workflow operable from React UI without touching config files
- [ ] UI follows Apple.com design language (clean, whitespace-driven, purposeful motion)
- [ ] Modular LLM support (Gemini primary, extensible to others)

## Constraints

- UI must follow [Apple.com aesthetic](./BIBLE.md#iii-universal-aesthetic-rule)
- LLM must be swappable (Gemini default, but architecture supports multiple)
- Future-proofed for image generation (manga panel creation) — not in MVP
- State must persist across sessions (storylines, branches, chapters)
- Client-side processing where possible; server for heavy LLM operations

## Future Vision (Post-MVP)

- AI-generated manga panels to visualize branched stories
- Community sharing of branched timelines
- Voice/animation integration
- Multi-language support for source manga

---

*Vision established: 2026-02-13*
