/**
 * Repository Implementations
 * 
 * Specific repository implementations for each entity type.
 * Extends BaseRepository with entity-specific operations.
 */

import { db } from './database';
import { BaseRepository } from './repository';
import type {
  Manga,
  Storyline,
  AnchorEvent,
  Branch,
  Chapter,
} from './schema';

// ============================================================================
// Manga Repository
// ============================================================================

/**
 * Manga repository
 */
export class MangaRepository extends BaseRepository<Manga> {
  constructor() {
    super(db.manga);
  }

  /**
   * Find manga by title (partial match)
   */
  async findByTitle(title: string): Promise<Manga[]> {
    return this.table
      .filter((m) => m.title.toLowerCase().includes(title.toLowerCase()))
      .toArray();
  }

  /**
   * Find manga by author
   */
  async findByAuthor(author: string): Promise<Manga[]> {
    return this.table
      .where('author')
      .equals(author)
      .toArray();
  }

  /**
   * Find manga by status
   */
  async findByStatus(status: Manga['status']): Promise<Manga[]> {
    return this.table
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * Find manga with analysis status
   */
  async findByAnalysisStatus(status: Manga['analysisStatus']): Promise<Manga[]> {
    return this.table
      .filter((m) => m.analysisStatus === status)
      .toArray();
  }

  /**
   * Search manga by title or author
   */
  async search(query: string): Promise<Manga[]> {
    const lowerQuery = query.toLowerCase();
    return this.table
      .filter(
        (m) =>
          m.title.toLowerCase().includes(lowerQuery) ||
          m.author.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  /**
   * Get recently updated manga
   */
  async getRecent(limit = 10): Promise<Manga[]> {
    return this.table
      .orderBy('updatedAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Update analysis progress
   */
  async updateAnalysisProgress(
    id: string,
    progress: number,
    status?: Manga['analysisStatus']
  ): Promise<Manga | undefined> {
    const updates: Partial<Manga> = { analysisProgress: Math.min(100, Math.max(0, progress)) };
    if (status) {
      updates.analysisStatus = status;
    }
    return this.update(id, updates);
  }
}

// ============================================================================
// Storyline Repository
// ============================================================================

/**
 * Storyline repository
 */
export class StorylineRepository extends BaseRepository<Storyline> {
  constructor() {
    super(db.storylines);
  }

  /**
   * Find storyline by manga ID
   */
  async findByMangaId(mangaId: string): Promise<Storyline | undefined> {
    return this.table
      .where('mangaId')
      .equals(mangaId)
      .first();
  }

  /**
   * Find storylines by status
   */
  async findByStatus(status: Storyline['status']): Promise<Storyline[]> {
    return this.table
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * Find storylines by manga and status
   */
  async findByMangaAndStatus(
    mangaId: string,
    status: Storyline['status']
  ): Promise<Storyline[]> {
    return this.table
      .where({ mangaId, status })
      .toArray();
  }

  /**
   * Update analysis stage
   */
  async updateStage(
    id: string,
    stage: Storyline['stage']
  ): Promise<Storyline | undefined> {
    return this.update(id, { stage });
  }

  /**
   * Add character to storyline
   */
  async addCharacter(
    id: string,
    character: Storyline['characters'][0]
  ): Promise<Storyline | undefined> {
    const storyline = await this.findById(id);
    if (!storyline) return undefined;

    return this.update(id, {
      characters: [...storyline.characters, character],
    });
  }

  /**
   * Add timeline event
   */
  async addTimelineEvent(
    id: string,
    event: Storyline['timeline'][0]
  ): Promise<Storyline | undefined> {
    const storyline = await this.findById(id);
    if (!storyline) return undefined;

    return this.update(id, {
      timeline: [...storyline.timeline, event],
    });
  }
}

// ============================================================================
// Anchor Event Repository
// ============================================================================

/**
 * Anchor event repository
 */
export class AnchorEventRepository extends BaseRepository<AnchorEvent> {
  constructor() {
    super(db.anchorEvents);
  }

  /**
   * Find anchor events by manga ID
   */
  async findByMangaId(mangaId: string): Promise<AnchorEvent[]> {
    return this.table
      .where('mangaId')
      .equals(mangaId)
      .toArray();
  }

  /**
   * Find anchor events by storyline ID
   */
  async findByStorylineId(storylineId: string): Promise<AnchorEvent[]> {
    return this.table
      .where('storylineId')
      .equals(storylineId)
      .toArray();
  }

  /**
   * Find anchor events by status
   */
  async findByStatus(status: AnchorEvent['status']): Promise<AnchorEvent[]> {
    return this.table
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * Find anchor events by type
   */
  async findByType(type: AnchorEvent['type']): Promise<AnchorEvent[]> {
    return this.table
      .where('type')
      .equals(type)
      .toArray();
  }

  /**
   * Find anchor events by significance
   */
  async findBySignificance(
    minSignificance: AnchorEvent['significance']
  ): Promise<AnchorEvent[]> {
    const order: AnchorEvent['significance'][] = ['minor', 'moderate', 'major', 'critical'];
    const minIndex = order.indexOf(minSignificance);
    
    return this.table
      .filter((e) => order.indexOf(e.significance) >= minIndex)
      .toArray();
  }

  /**
   * Find high confidence anchor events
   */
  async findHighConfidence(
    minConfidence = 0.7
  ): Promise<AnchorEvent[]> {
    return this.table
      .where('confidence')
      .aboveOrEqual(minConfidence)
      .toArray();
  }

  /**
   * Find anchor events by page range
   */
  async findByPageRange(
    mangaId: string,
    startPage: number,
    endPage: number
  ): Promise<AnchorEvent[]> {
    return this.table
      .where('mangaId')
      .equals(mangaId)
      .and((e) => e.pageNumber >= startPage && e.pageNumber <= endPage)
      .toArray();
  }

  /**
   * Approve anchor event
   */
  async approve(id: string): Promise<AnchorEvent | undefined> {
    return this.update(id, { status: 'approved' });
  }

  /**
   * Reject anchor event
   */
  async reject(id: string): Promise<AnchorEvent | undefined> {
    return this.update(id, { status: 'rejected' });
  }
}

// ============================================================================
// Branch Repository
// ============================================================================

/**
 * Branch repository
 */
export class BranchRepository extends BaseRepository<Branch> {
  constructor() {
    super(db.branches);
  }

  /**
   * Find branches by manga ID
   */
  async findByMangaId(mangaId: string): Promise<Branch[]> {
    return this.table
      .where('mangaId')
      .equals(mangaId)
      .toArray();
  }

  /**
   * Find branches by anchor event ID
   */
  async findByAnchorEventId(anchorEventId: string): Promise<Branch[]> {
    return this.table
      .where('anchorEventId')
      .equals(anchorEventId)
      .toArray();
  }

  /**
   * Find branches by status
   */
  async findByStatus(status: Branch['status']): Promise<Branch[]> {
    return this.table
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * Find selected branches for an anchor
   */
  async findSelectedByAnchor(anchorEventId: string): Promise<Branch | undefined> {
    return this.table
      .where({ anchorEventId, status: 'selected' })
      .first();
  }

  /**
   * Find branches by quality score
   */
  async findHighQuality(minScore = 0.7): Promise<Branch[]> {
    return this.table
      .filter((b) => b.qualityScore >= minScore)
      .toArray();
  }

  /**
   * Select a branch (mark as selected, deselect others for same anchor)
   */
  async selectBranch(id: string): Promise<void> {
    await db.transaction('rw', this.table, async () => {
      const branch = await this.findById(id);
      if (!branch) return;

      // Deselect other branches for same anchor
      await this.updateMany(
        (b) => b.anchorEventId === branch.anchorEventId && b.id !== id,
        { status: 'review' }
      );

      // Select this branch
      await this.update(id, { status: 'selected' });
    });
  }
}

// ============================================================================
// Chapter Repository
// ============================================================================

/**
 * Chapter repository
 */
export class ChapterRepository extends BaseRepository<Chapter> {
  constructor() {
    super(db.chapters);
  }

  /**
   * Find chapters by manga ID
   */
  async findByMangaId(mangaId: string): Promise<Chapter[]> {
    return this.table
      .where('mangaId')
      .equals(mangaId)
      .toArray();
  }

  /**
   * Find chapters by branch ID
   */
  async findByBranchId(branchId: string): Promise<Chapter[]> {
    return this.table
      .where('branchId')
      .equals(branchId)
      .sortBy('order');
  }

  /**
   * Find chapters by status
   */
  async findByStatus(status: Chapter['status']): Promise<Chapter[]> {
    return this.table
      .where('status')
      .equals(status)
      .toArray();
  }

  /**
   * Find chapter by order in branch
   */
  async findByOrder(branchId: string, order: number): Promise<Chapter | undefined> {
    return this.table
      .where({ branchId, order })
      .first();
  }

  /**
   * Get next chapter
   */
  async getNextChapter(chapterId: string): Promise<Chapter | undefined> {
    const chapter = await this.findById(chapterId);
    if (!chapter) return undefined;

    return this.table
      .where({ branchId: chapter.branchId, order: chapter.order + 1 })
      .first();
  }

  /**
   * Get previous chapter
   */
  async getPreviousChapter(chapterId: string): Promise<Chapter | undefined> {
    const chapter = await this.findById(chapterId);
    if (!chapter || chapter.order <= 1) return undefined;

    return this.table
      .where({ branchId: chapter.branchId, order: chapter.order - 1 })
      .first();
  }

  /**
   * Reorder chapters in a branch
   */
  async reorderChapters(_branchId: string, newOrder: string[]): Promise<void> {
    await db.transaction('rw', this.table, async () => {
      for (let i = 0; i < newOrder.length; i++) {
        await this.update(newOrder[i], { order: i + 1 });
      }
    });
  }

  /**
   * Get total word count for a branch
   */
  async getTotalWordCount(branchId: string): Promise<number> {
    const chapters = await this.findByBranchId(branchId);
    return chapters.reduce((sum, c) => sum + c.wordCount, 0);
  }
}

// ============================================================================
// Repository Exports
// ============================================================================

/**
 * Repository instances (singletons)
 */
export const repositories = {
  manga: new MangaRepository(),
  storylines: new StorylineRepository(),
  anchorEvents: new AnchorEventRepository(),
  branches: new BranchRepository(),
  chapters: new ChapterRepository(),
};

/**
 * Get all repositories
 */
export const getRepositories = () => repositories;
