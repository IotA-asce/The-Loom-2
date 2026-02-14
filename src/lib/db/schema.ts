/**
 * Database Schema Definitions
 * 
 * TypeScript type definitions for all database tables.
 * These types define the shape of data stored in IndexedDB.
 */

// ============================================================================
// Common Types
// ============================================================================

/** Entity status */
export type EntityStatus = 'active' | 'archived' | 'deleted';

/** Analysis status */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Content status */
export type ContentStatus = 'draft' | 'review' | 'published';

/** Event significance level */
export type SignificanceLevel = 'minor' | 'moderate' | 'major' | 'critical';

/** Anchor event type */
export type AnchorEventType =
  | 'decision'
  | 'coincidence'
  | 'revelation'
  | 'betrayal'
  | 'sacrifice'
  | 'encounter'
  | 'conflict'
  | 'transformation'
  | 'mystery';

// ============================================================================
// Manga Table
// ============================================================================

/**
 * Manga entity - represents an imported manga/comic
 */
export interface Manga {
  /** Unique identifier (auto-generated) */
  id?: string;
  
  /** Manga title */
  title: string;
  
  /** Original title (if different) */
  originalTitle?: string;
  
  /** Author/Artist name */
  author: string;
  
  /** Description/summary */
  description?: string;
  
  /** Cover image (base64 or blob URL) */
  coverImage?: string;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Page image URLs/paths */
  pageUrls: string[];
  
  /** Thumbnail URLs/paths */
  thumbnailUrls: string[];
  
  /** Status */
  status: EntityStatus;
  
  /** Tags/categories */
  tags: string[];
  
  /** Analysis status */
  analysisStatus: AnalysisStatus;
  
  /** Analysis progress (0-100) */
  analysisProgress: number;
  
  /** User rating (1-5) */
  userRating?: number;
  
  /** User notes */
  userNotes?: string;
  
  /** Source file info */
  sourceInfo?: {
    filename: string;
    fileSize: number;
    fileType: string;
    importedAt: number;
  };
  
  /** Metadata from source */
  metadata?: Record<string, unknown>;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Storyline Table
// ============================================================================

/**
 * Character entity
 */
export interface Character {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  firstAppearance: number; // Page number
  importance: 'major' | 'supporting' | 'minor';
  appearance?: string;
  personality?: string;
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  id: string;
  pageNumber: number;
  chapterNumber?: number;
  title: string;
  description: string;
  characters: string[]; // Character IDs
  significance: SignificanceLevel;
  isFlashback: boolean;
  chronologicalOrder?: number;
}

/**
 * Theme entity
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  prevalence: number; // 0-1
}

/**
 * Relationship entity
 */
export interface Relationship {
  id: string;
  characterA: string;
  characterB: string;
  type: string;
  description: string;
  evolution: Array<{
    pageNumber: number;
    state: string;
  }>;
}

/**
 * Storyline entity - represents analysis results for a manga
 */
export interface Storyline {
  /** Unique identifier */
  id?: string;
  
  /** Associated manga ID */
  mangaId: string;
  
  /** Analysis status */
  status: AnalysisStatus;
  
  /** Processing stage */
  stage: 'visual' | 'characters' | 'timeline' | 'relationships' | 'themes' | 'complete';
  
  /** Visual overview */
  visualOverview?: {
    artStyle: string;
    genreIndicators: string[];
    narrativeDensity: 'sparse' | 'moderate' | 'dense';
    panelComplexity: 'simple' | 'moderate' | 'complex';
  };
  
  /** Characters discovered */
  characters: Character[];
  
  /** Timeline of events */
  timeline: TimelineEvent[];
  
  /** Themes identified */
  themes: Theme[];
  
  /** Character relationships */
  relationships: Relationship[];
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Issues found during analysis */
  issues?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    pageNumber?: number;
  }>;
  
  /** Raw LLM responses for debugging */
  rawResponses?: Record<string, unknown>;
  
  /** Token usage statistics */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  /** Analysis duration in ms */
  analysisDuration?: number;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Anchor Event Table
// ============================================================================

/**
 * Alternative outcome for an anchor event
 */
export interface AlternativeOutcome {
  id: string;
  description: string;
  consequences: string[];
  affectedCharacters: string[];
}

/**
 * Branching potential score
 */
export interface BranchingPotential {
  score: number; // 0-1
  narrativeWeight: number;
  characterImpact: number;
  worldImpact: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Anchor event entity - represents a key story point for branching
 */
export interface AnchorEvent {
  /** Unique identifier */
  id?: string;
  
  /** Associated manga ID */
  mangaId: string;
  
  /** Associated storyline ID */
  storylineId: string;
  
  /** Source timeline event ID */
  timelineEventId: string;
  
  /** Event type */
  type: AnchorEventType;
  
  /** Event title */
  title: string;
  
  /** Event description */
  description: string;
  
  /** Page number where event occurs */
  pageNumber: number;
  
  /** Characters involved */
  characters: string[];
  
  /** Significance level */
  significance: SignificanceLevel;
  
  /** Detection status */
  status: 'detected' | 'review' | 'approved' | 'rejected' | 'manual';
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Alternative outcomes */
  alternatives: AlternativeOutcome[];
  
  /** Branching potential */
  branchingPotential: BranchingPotential;
  
  /** User notes */
  userNotes?: string;
  
  /** User rating of detection quality */
  userRating?: number;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Branch Table
// ============================================================================

/**
 * Character state snapshot at branch point
 */
export interface CharacterState {
  characterId: string;
  name: string;
  state: string;
  knowledge: string[];
  relationships: Record<string, string>;
}

/**
 * World state snapshot at branch point
 */
export interface WorldState {
  description: string;
  keyFacts: string[];
  activeConflicts: string[];
  availableResources: string[];
}

/**
 * Premise for a branch
 */
export interface BranchPremise {
  title: string;
  subtitle?: string;
  hook: string;
  whatIf: string;
  themes: string[];
}

/**
 * Trajectory for a branch
 */
export interface BranchTrajectory {
  summary: string;
  keyEvents: string[];
  characterArcs: Array<{
    characterId: string;
    arc: string;
    ending: string;
  }>;
  endingType: 'hopeful' | 'tragic' | 'bittersweet' | 'ambiguous' | 'open';
  estimatedChapters: number;
}

/**
 * Branch entity - represents an alternate story timeline
 */
export interface Branch {
  /** Unique identifier */
  id?: string;
  
  /** Associated manga ID */
  mangaId: string;
  
  /** Source anchor event ID */
  anchorEventId: string;
  
  /** Selected alternative outcome ID */
  alternativeId: string;
  
  /** Branch premise */
  premise: BranchPremise;
  
  /** Character states at branch point */
  characterStates: CharacterState[];
  
  /** World state at branch point */
  worldState: WorldState;
  
  /** Branch trajectory */
  trajectory: BranchTrajectory;
  
  /** Status */
  status: 'generated' | 'review' | 'selected' | 'writing' | 'complete';
  
  /** Generation quality score */
  qualityScore: number;
  
  /** User preference rating */
  userPreference?: number;
  
  /** Parent branch ID (for nested branches) */
  parentBranchId?: string;
  
  /** Version for iterative refinement */
  version: number;
  
  /** Generation parameters used */
  generationParams?: {
    creativity: number;
    mood: string;
    focusCharacters: string[];
  };
  
  /** Created timestamp */
  createdAt: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Chapter Table
// ============================================================================

/**
 * Chapter scene
 */
export interface Scene {
  id: string;
  title?: string;
  characters: string[];
  setting: string;
  summary: string;
  emotionalArc: string;
}

/**
 * Chapter entity - represents a written chapter
 */
export interface Chapter {
  /** Unique identifier */
  id?: string;
  
  /** Associated manga ID */
  mangaId: string;
  
  /** Associated branch ID */
  branchId: string;
  
  /** Chapter number within branch */
  order: number;
  
  /** Chapter title */
  title: string;
  
  /** Chapter content (markdown) */
  content: string;
  
  /** Summary/abstract */
  summary?: string;
  
  /** Scenes in this chapter */
  scenes: Scene[];
  
  /** Characters appearing */
  characters: string[];
  
  /** Word count */
  wordCount: number;
  
  /** Status */
  status: ContentStatus;
  
  /** Generation metadata */
  generationMetadata?: {
    model: string;
    provider: string;
    tokensUsed: number;
    generationTime: number;
    outlineId: string;
  };
  
  /** User edits */
  editHistory?: Array<{
    timestamp: number;
    type: string;
    description: string;
  }>;
  
  /** User feedback */
  userFeedback?: {
    rating?: number;
    notes?: string;
    flags?: string[];
  };
  
  /** Created timestamp */
  createdAt: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}
