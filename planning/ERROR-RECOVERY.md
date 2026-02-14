# Error Recovery & Resilience Specification

## The Loom 2 - Manga Branching Narrative Generator

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-02-13

---

## 1. Error Classification

### 1.1 Severity Levels

| Level | Description | Examples | Response |
|-------|-------------|----------|----------|
| **Critical** | App unusable | Database corruption, Total system failure | Enter recovery mode, offer data export |
| **High** | Core feature broken | All LLM providers failed, Storage inaccessible | Fallback + user notification |
| **Medium** | Operation failed | Analysis error, Parse failure | Retry with backoff + error reporting |
| **Low** | Minor issue | Single image load failed, Non-critical timeout | Silent retry, degrade gracefully |

### 1.2 Error Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR TAXONOMY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Network   │  │   Storage   │  │      Processing         │ │
│  │   Errors    │  │   Errors    │  │       Errors            │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤ │
│  │• API failure│  │• DB full   │  │• Analysis failure       │ │
│  │• Timeout   │  │• Corruption │  │• Parse error            │ │
│  │• Rate limit│  │• Quota ex.  │  │• Pipeline stall         │ │
│  │• DNS fail  │  │• Version    │  │• Validation error       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │    UI       │  │              User Errors                │  │
│  │   Errors    │  ├─────────────────────────────────────────┤  │
│  ├─────────────┤  │• Invalid input                          │  │
│  │• Render fail│  │• Unsupported file format                │  │
│  │• State inc. │  │• File too large                         │  │
│  │• DOM error  │  │• Permission denied                      │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Error Metadata Structure

```typescript
interface ErrorMetadata {
  id: string;                    // Unique error ID (e.g., "ERR-001-2024")
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'network' | 'storage' | 'processing' | 'ui' | 'user';
  code: string;                  // Machine-readable code
  timestamp: number;             // Unix timestamp
  context: {
    component: string;           // Where error occurred
    operation: string;           // What operation was running
    userAction?: string;         // User action that triggered it
  };
  recoverable: boolean;          // Can this be recovered from?
  retryable: boolean;            // Should retry be attempted?
  userMessage: string;           // Friendly user message
  technicalDetails?: string;     // For debugging (not shown to user)
}
```

---

## 2. LLM Error Recovery

### 2.1 Exponential Backoff Strategy

```typescript
interface RetryStrategy {
  maxRetries: number;            // Maximum retry attempts
  baseDelay: number;             // Initial delay in ms
  maxDelay: number;              // Maximum delay cap
  backoffMultiplier: number;     // Exponential factor
  jitter: boolean;               // Add randomness to prevent thundering herd
}

const defaultRetryStrategy: RetryStrategy = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
};

class RetryManager {
  private attempt = 0;
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    strategy: RetryStrategy = defaultRetryStrategy
  ): Promise<T> {
    while (this.attempt < strategy.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        this.attempt++;
        
        if (this.attempt >= strategy.maxRetries) {
          throw error;
        }
        
        const delay = this.calculateDelay(strategy);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }
  
  private calculateDelay(strategy: RetryStrategy): number {
    const exponentialDelay = 
      strategy.baseDelay * Math.pow(strategy.backoffMultiplier, this.attempt);
    const cappedDelay = Math.min(exponentialDelay, strategy.maxDelay);
    
    if (strategy.jitter) {
      // Add 0-20% random jitter
      return cappedDelay * (0.8 + Math.random() * 0.2);
    }
    
    return cappedDelay;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2.2 Error Types & Responses

| Error | HTTP Status | Detection | Recovery |
|-------|-------------|-----------|----------|
| **Rate Limit** | 429 | HTTP status + `Retry-After` header | Wait specified time + retry with backoff |
| **Timeout** | 408/504 | Request timeout | Retry with 1.5x timeout, max 3x |
| **Invalid Key** | 401 | HTTP status | Prompt user, disable provider until fixed |
| **Server Error** | 5xx | HTTP status | Retry 2x, then fallback provider |
| **Quota Exceeded** | 429/403 | Error message pattern | Notify user, suggest upgrade, pause usage |
| **Content Filtered** | 200 + flag | Response `safety_ratings` | Return filtered notice, offer manual input |
| **Context Length** | 400/413 | Error message | Truncate context, retry with shorter prompt |
| **Invalid Request** | 400 | HTTP status | Log for debugging, don't retry |

### 2.3 Fallback Strategy

```typescript
interface LLMProvider {
  name: string;
  priority: number;           // Lower = higher priority
  isAvailable: () => Promise<boolean>;
  generate: (prompt: string) => Promise<LLMResponse>;
  healthStatus: ProviderHealth;
}

interface ProviderHealth {
  consecutiveFailures: number;
  lastFailure: number | null;
  averageLatency: number;
  successRate: number;
}

class LLMFallbackManager {
  private providers: LLMProvider[] = [];
  private currentProviderIndex = 0;
  
  async generateWithFallback(prompt: string): Promise<LLMResponse> {
    const errors: Error[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      
      try {
        if (await provider.isAvailable()) {
          const result = await this.tryWithRetry(provider, prompt);
          this.updateHealth(provider, true);
          return result;
        }
      } catch (error) {
        this.updateHealth(provider, false);
        errors.push(error as Error);
        
        // Move to next provider
        this.currentProviderIndex = 
          (this.currentProviderIndex + 1) % this.providers.length;
      }
    }
    
    // All providers failed
    throw new AggregateError(
      errors,
      'All LLM providers failed. Please check your API keys or try again later.'
    );
  }
  
  private async tryWithRetry(
    provider: LLMProvider, 
    prompt: string
  ): Promise<LLMResponse> {
    const retryManager = new RetryManager();
    return retryManager.executeWithRetry(() => provider.generate(prompt));
  }
  
  private updateHealth(provider: LLMProvider, success: boolean): void {
    if (success) {
      provider.healthStatus.consecutiveFailures = 0;
      provider.healthStatus.successRate = 
        (provider.healthStatus.successRate * 0.9) + 0.1;
    } else {
      provider.healthStatus.consecutiveFailures++;
      provider.healthStatus.lastFailure = Date.now();
      provider.healthStatus.successRate = 
        (provider.healthStatus.successRate * 0.9);
    }
  }
}
```

### 2.4 Partial Response Handling

```typescript
interface Checkpoint {
  id: string;
  timestamp: number;
  pagesProcessed: number;
  totalPages: number;
  partialResults: PageAnalysis[];
  context: AnalysisContext;
}

class CheckpointManager {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private readonly CHECKPOINT_INTERVAL = 10; // pages
  
  async saveCheckpoint(
    operationId: string, 
    progress: AnalysisProgress
  ): Promise<void> {
    if (progress.pagesProcessed % this.CHECKPOINT_INTERVAL === 0) {
      const checkpoint: Checkpoint = {
        id: `${operationId}-${progress.pagesProcessed}`,
        timestamp: Date.now(),
        pagesProcessed: progress.pagesProcessed,
        totalPages: progress.totalPages,
        partialResults: progress.results,
        context: progress.context
      };
      
      this.checkpoints.set(operationId, checkpoint);
      
      // Persist to IndexedDB
      await this.persistCheckpoint(checkpoint);
    }
  }
  
  async resumeFromCheckpoint(operationId: string): Promise<Checkpoint | null> {
    // Try memory first
    const memoryCheckpoint = this.checkpoints.get(operationId);
    if (memoryCheckpoint) return memoryCheckpoint;
    
    // Fall back to storage
    return await this.loadCheckpointFromStorage(operationId);
  }
  
  async cleanupCheckpoint(operationId: string): Promise<void> {
    this.checkpoints.delete(operationId);
    await this.deleteFromStorage(operationId);
  }
}
```

### 2.5 Streaming Response Handling

```typescript
class StreamingLLMHandler {
  private buffer = '';
  private partialChunks: string[] = [];
  
  async *streamWithRecovery(
    generator: AsyncGenerator<string>
  ): AsyncGenerator<string> {
    try {
      for await (const chunk of generator) {
        this.buffer += chunk;
        this.partialChunks.push(chunk);
        
        // Yield complete tokens
        const completeTokens = this.extractCompleteTokens();
        for (const token of completeTokens) {
          yield token;
        }
      }
      
      // Yield any remaining buffered content
      if (this.buffer.length > 0) {
        yield this.buffer;
      }
      
    } catch (error) {
      // Attempt to recover partial content
      const partialContent = this.buffer + this.partialChunks.join('');
      
      if (partialContent.length > 100) {
        // Significant content received, treat as partial success
        yield partialContent;
        console.warn('Stream interrupted, returning partial content');
      } else {
        throw error;
      }
    }
  }
  
  private extractCompleteTokens(): string[] {
    // Split buffer on natural boundaries (spaces, newlines, etc.)
    const tokens: string[] = [];
    let lastBoundary = 0;
    
    for (let i = 0; i < this.buffer.length; i++) {
      if (/[\s\n\r]/.test(this.buffer[i])) {
        if (i > lastBoundary) {
          tokens.push(this.buffer.slice(lastBoundary, i + 1));
        }
        lastBoundary = i + 1;
      }
    }
    
    // Keep incomplete token in buffer
    this.buffer = this.buffer.slice(lastBoundary);
    
    return tokens;
  }
}
```

---

## 3. Database Error Recovery

### 3.1 IndexedDB Failure Scenarios

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| **Database Full** | `QuotaExceededError` | Offer data export + cleanup wizard |
| **Version Mismatch** | `VersionError` on open | Attempt migration, fallback to reset |
| **Corruption** | Invalid data on read | Restore from backup, or offer reset |
| **Quota Exceeded** | Write operation fails | Warning modal + export option |
| **Transaction Timeout** | `TransactionInactiveError` | Retry with smaller batch size |
| **Object Store Missing** | `NotFoundError` | Recreate schema, migrate if possible |

### 3.2 Database Recovery Manager

```typescript
interface DatabaseRecoveryOptions {
  attemptMigration: boolean;
  preserveData: boolean;
  autoBackup: boolean;
}

class DatabaseRecoveryManager {
  private db: IDBDatabase | null = null;
  private backupData: Map<string, unknown> = new Map();
  
  async initializeWithRecovery(
    options: DatabaseRecoveryOptions = {
      attemptMigration: true,
      preserveData: true,
      autoBackup: true
    }
  ): Promise<IDBDatabase> {
    try {
      this.db = await this.openDatabase();
      await this.runIntegrityCheck();
      return this.db;
      
    } catch (error) {
      const errorName = (error as Error).name;
      
      switch (errorName) {
        case 'VersionError':
          if (options.attemptMigration) {
            return await this.handleVersionError(error as Error);
          }
          break;
          
        case 'QuotaExceededError':
          return await this.handleQuotaExceeded();
          
        case 'InvalidStateError':
        case 'UnknownError':
          // Possible corruption
          return await this.handlePossibleCorruption(options);
          
        default:
          throw error;
      }
    }
    
    throw new Error('Database recovery failed');
  }
  
  private async handleVersionError(error: Error): Promise<IDBDatabase> {
    // Attempt to migrate data before resetting
    const oldVersion = this.extractVersionFromError(error);
    
    if (oldVersion) {
      const oldDb = await this.openDatabaseAtVersion(oldVersion);
      await this.backupAllData(oldDb);
      oldDb.close();
    }
    
    // Delete and recreate
    await this.deleteDatabase();
    this.db = await this.openDatabase();
    
    // Restore data if possible
    await this.restoreFromBackup();
    
    return this.db;
  }
  
  private async handleQuotaExceeded(): Promise<IDBDatabase> {
    // Trigger UI warning
    this.emitStorageWarning();
    
    // Attempt to free space by cleaning old data
    const freedSpace = await this.cleanupOldData();
    
    if (freedSpace > 0) {
      // Retry
      return await this.openDatabase();
    }
    
    throw new Error('Storage quota exceeded and cannot be freed');
  }
  
  private async handlePossibleCorruption(
    options: DatabaseRecoveryOptions
  ): Promise<IDBDatabase> {
    if (options.autoBackup) {
      // Try to salvage data
      try {
        const salvaged = await this.attemptDataSalvage();
        this.backupData = salvaged;
      } catch {
        // Salvage failed, continue with reset
      }
    }
    
    // Nuclear option: delete and recreate
    await this.deleteDatabase();
    this.db = await this.openDatabase();
    
    if (options.preserveData && this.backupData.size > 0) {
      await this.restoreValidData();
    }
    
    return this.db;
  }
  
  private async runIntegrityCheck(): Promise<void> {
    const stores = Array.from(this.db!.objectStoreNames);
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      try {
        // Try to get all keys - will throw if corrupted
        await store.getAllKeys();
      } catch (error) {
        throw new Error(`Integrity check failed for store: ${storeName}`);
      }
    }
  }
}
```

### 3.3 Data Integrity Checks

```typescript
interface SchemaValidator {
  version: number;
  tables: TableSchema[];
}

interface TableSchema {
  name: string;
  primaryKey: string;
  indexes: string[];
  requiredFields: string[];
  foreignKeys?: ForeignKeyConstraint[];
}

interface ForeignKeyConstraint {
  field: string;
  references: {
    table: string;
    field: string;
  };
}

class DataIntegrityChecker {
  async validateDatabase(schema: SchemaValidator): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      valid: true,
      errors: [],
      warnings: [],
      orphanedRecords: [],
      checksums: new Map()
    };
    
    for (const table of schema.tables) {
      const tableReport = await this.validateTable(table);
      
      if (!tableReport.valid) {
        report.valid = false;
        report.errors.push(...tableReport.errors);
      }
      
      report.warnings.push(...tableReport.warnings);
      report.orphanedRecords.push(...tableReport.orphaned);
      report.checksums.set(table.name, tableReport.checksum);
    }
    
    return report;
  }
  
  private async validateTable(table: TableSchema): Promise<TableValidationResult> {
    const result: TableValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      orphaned: [],
      checksum: ''
    };
    
    const records = await this.getAllRecords(table.name);
    
    for (const record of records) {
      // Check required fields
      for (const field of table.requiredFields) {
        if (!(field in record) || record[field] === null || record[field] === undefined) {
          result.errors.push({
            table: table.name,
            record: record[table.primaryKey],
            field,
            issue: 'Missing required field'
          });
          result.valid = false;
        }
      }
      
      // Validate foreign keys
      if (table.foreignKeys) {
        for (const fk of table.foreignKeys) {
          const referencedExists = await this.checkRecordExists(
            fk.references.table,
            fk.references.field,
            record[fk.field]
          );
          
          if (!referencedExists) {
            result.orphaned.push({
              table: table.name,
              record: record[table.primaryKey],
              references: `${fk.references.table}.${fk.references.field}`
            });
          }
        }
      }
    }
    
    // Calculate checksum
    result.checksum = await this.calculateChecksum(records);
    
    return result;
  }
  
  private async calculateChecksum(data: unknown[]): Promise<string> {
    const json = JSON.stringify(data.sort());
    const encoder = new TextEncoder();
    const buffer = encoder.encode(json);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### 3.4 Backup Strategy

```typescript
interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  tables: string[];
  checksum: string;
}

class BackupManager {
  private readonly BACKUP_KEY_PREFIX = 'loom_backup_';
  private readonly MAX_BACKUPS = 5;
  
  async createBackup(): Promise<BackupMetadata> {
    const data = await this.exportAllData();
    const metadata: BackupMetadata = {
      id: `${this.BACKUP_KEY_PREFIX}${Date.now()}`,
      timestamp: Date.now(),
      version: APP_VERSION,
      size: JSON.stringify(data).length,
      tables: Object.keys(data),
      checksum: await this.calculateBackupChecksum(data)
    };
    
    // Store backup
    await this.saveBackup(metadata.id, data);
    await this.saveMetadata(metadata);
    
    // Cleanup old backups
    await this.cleanupOldBackups();
    
    return metadata;
  }
  
  async restoreFromBackup(backupId?: string): Promise<boolean> {
    const targetBackup = backupId || await this.getLatestBackupId();
    
    if (!targetBackup) {
      throw new Error('No backup available for restore');
    }
    
    const data = await this.loadBackup(targetBackup);
    const metadata = await this.loadMetadata(targetBackup);
    
    // Verify checksum
    const currentChecksum = await this.calculateBackupChecksum(data);
    if (currentChecksum !== metadata.checksum) {
      throw new Error('Backup integrity check failed');
    }
    
    // Restore data
    await this.importAllData(data);
    
    return true;
  }
  
  async autoBackupBeforeOperation(operationName: string): Promise<void> {
    // Create automatic backup before risky operations
    const backup = await this.createBackup();
    console.log(`Auto-backup created before ${operationName}: ${backup.id}`);
  }
  
  private async cleanupOldBackups(): Promise<void> {
    const allBackups = await this.listAllBackups();
    
    if (allBackups.length > this.MAX_BACKUPS) {
      // Sort by timestamp (oldest first)
      allBackups.sort((a, b) => a.timestamp - b.timestamp);
      
      // Delete oldest backups
      const toDelete = allBackups.slice(0, allBackups.length - this.MAX_BACKUPS);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }
}
```

---

## 4. Analysis Pipeline Recovery

### 4.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANALYSIS PIPELINE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────┐      ┌─────────────┐      ┌──────────┐      ┌────────┐
   │  UPLOAD │  →   │  PREPROCESS │  →   │ ANALYZE  │  →   │ PARSE  │
   └────┬────┘      └──────┬──────┘      └────┬─────┘      └───┬────┘
        │                  │                  │                │
        ▼                  ▼                  ▼                ▼
   ┌─────────┐      ┌─────────────┐      ┌──────────┐      ┌────────┐
   │ Resume  │      │   Retry     │      │  Retry   │      │ Repair │
   │ Partial │      │  w/ Lower   │      │ Per-Batch│      │  JSON  │
   │ Upload  │      │   Quality   │      │ + Checkpt│      │  Parse │
   └─────────┘      └─────────────┘      └──────────┘      └────────┘
                                                                 │
                                                                 ▼
                                                           ┌────────┐
                                                           │ MERGE  │
                                                           └───┬────┘
                                                               │
                                                               ▼
                                                          ┌─────────┐
                                                          │Rollback │
                                                          │Partial  │
                                                          │Save     │
                                                          └─────────┘
```

### 4.2 Stage-Based Recovery System

```typescript
interface PipelineStage<TInput, TOutput> {
  name: string;
  execute: (input: TInput, context: PipelineContext) => Promise<TOutput>;
  recover?: (error: Error, input: TInput, context: PipelineContext) => Promise<TOutput>;
  checkpoint?: (output: TOutput, context: PipelineContext) => Promise<void>;
}

interface PipelineContext {
  operationId: string;
  mangaId: string;
  startTime: number;
  checkpoints: Map<string, unknown>;
  retryCount: Map<string, number>;
  abortSignal: AbortSignal;
}

class ResilientPipeline {
  private stages: PipelineStage<unknown, unknown>[] = [];
  private checkpointManager: CheckpointManager;
  
  addStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this {
    this.stages.push(stage as PipelineStage<unknown, unknown>);
    return this;
  }
  
  async execute<TInput, TOutput>(
    input: TInput,
    context: PipelineContext
  ): Promise<TOutput> {
    let currentInput: unknown = input;
    
    for (const stage of this.stages) {
      try {
        // Check for checkpoint resume
        const checkpoint = await this.checkpointManager.resumeFromCheckpoint(
          `${context.operationId}-${stage.name}`
        );
        
        if (checkpoint && this.isValidCheckpoint(checkpoint, stage.name)) {
          console.log(`Resuming ${stage.name} from checkpoint`);
          currentInput = checkpoint.partialResults;
          continue;
        }
        
        // Execute stage
        const output = await this.executeStage(stage, currentInput, context);
        
        // Save checkpoint if supported
        if (stage.checkpoint) {
          await stage.checkpoint(output, context);
        }
        
        currentInput = output;
        
      } catch (error) {
        // Attempt recovery
        if (stage.recover) {
          console.log(`Attempting recovery for ${stage.name}`);
          const recovered = await stage.recover(error as Error, currentInput, context);
          currentInput = recovered;
        } else {
          throw error;
        }
      }
    }
    
    // Cleanup checkpoints on success
    await this.checkpointManager.cleanupCheckpoint(context.operationId);
    
    return currentInput as TOutput;
  }
  
  private async executeStage<TInput, TOutput>(
    stage: PipelineStage<TInput, TOutput>,
    input: TInput,
    context: PipelineContext
  ): Promise<TOutput> {
    const maxRetries = 3;
    const retryCount = context.retryCount.get(stage.name) || 0;
    
    try {
      return await stage.execute(input, context);
    } catch (error) {
      if (retryCount < maxRetries) {
        context.retryCount.set(stage.name, retryCount + 1);
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.executeStage(stage, input, context);
      }
      throw error;
    }
  }
}
```

### 4.3 Per-Stage Recovery Implementations

#### Upload Stage Recovery

```typescript
const uploadStage: PipelineStage<File[], UploadedFile[]> = {
  name: 'upload',
  
  async execute(files, context) {
    const uploaded: UploadedFile[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, context.abortSignal);
        uploaded.push(result);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw error; // Don't recover from abort
        }
        
        // Try alternative upload strategy
        const retryResult = await this.uploadWithChunking(file);
        uploaded.push(retryResult);
      }
    }
    
    return uploaded;
  },
  
  async recover(error, files, context) {
    // Check what was successfully uploaded
    const partialUploads = await this.getPartialUploads(context.operationId);
    
    // Retry remaining files
    const remainingFiles = files.filter(f => 
      !partialUploads.some(p => p.name === f.name)
    );
    
    if (remainingFiles.length === 0) {
      return partialUploads;
    }
    
    // Try with lower quality/compression
    const compressedFiles = await Promise.all(
      remainingFiles.map(f => this.compressFile(f, 0.8))
    );
    
    const newUploads = await this.uploadFiles(compressedFiles);
    return [...partialUploads, ...newUploads];
  },
  
  async checkpoint(output, context) {
    await this.savePartialUploads(context.operationId, output);
  }
};
```

#### Analysis Stage Recovery

```typescript
const analysisStage: PipelineStage<PreprocessedPage[], AnalysisResult[]> = {
  name: 'analyze',
  
  async execute(pages, context) {
    const results: AnalysisResult[] = [];
    const BATCH_SIZE = 5;
    
    // Process in batches with checkpointing
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      
      try {
        const batchResults = await this.analyzeBatch(batch, context);
        results.push(...batchResults);
        
        // Checkpoint every batch
        await this.saveCheckpoint({
          operationId: context.operationId,
          pagesProcessed: i + batch.length,
          partialResults: results
        });
        
      } catch (error) {
        // Retry individual pages in failed batch
        for (const page of batch) {
          try {
            const singleResult = await this.analyzePageWithFallback(page);
            results.push(singleResult);
          } catch (pageError) {
            // Mark as failed but continue
            results.push({
              pageId: page.id,
              status: 'failed',
              error: (pageError as Error).message
            });
          }
        }
      }
    }
    
    return results;
  },
  
  async recover(error, pages, context) {
    // Load checkpoint
    const checkpoint = await this.loadCheckpoint(context.operationId);
    
    if (checkpoint) {
      const processedIds = new Set(checkpoint.partialResults.map(r => r.pageId));
      const remainingPages = pages.filter(p => !processedIds.has(p.id));
      
      // Continue from checkpoint
      const remainingResults = await this.execute(remainingPages, context);
      return [...checkpoint.partialResults, ...remainingResults];
    }
    
    throw error;
  }
};
```

#### Parse Stage Recovery

```typescript
const parseStage: PipelineStage<string, ParsedStructure> = {
  name: 'parse',
  
  async execute(llmOutput, context) {
    try {
      // Try standard JSON parse
      return JSON.parse(llmOutput);
    } catch (parseError) {
      // Attempt LLM repair
      return await this.repairJsonWithLLM(llmOutput, context);
    }
  },
  
  async recover(error, llmOutput, context) {
    // Try multiple repair strategies
    const strategies = [
      () => this.extractJsonFromMarkdown(llmOutput),
      () => this.fixTrailingCommas(llmOutput),
      () => this.fixUnclosedBrackets(llmOutput),
      () => this.repairWithLLM(llmOutput, context),
      () => this.manualParseInterface(llmOutput)
    ];
    
    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (this.isValidStructure(result)) {
          return result;
        }
      } catch {
        continue;
      }
    }
    
    // Accept partial results with warnings
    return {
      nodes: [],
      edges: [],
      partial: true,
      rawOutput: llmOutput,
      error: 'Could not fully parse LLM output'
    };
  }
};
```

### 4.4 Merge Stage Transaction Management

```typescript
interface Transaction {
  id: string;
  operations: DatabaseOperation[];
  rollbackLog: RollbackOperation[];
}

class TransactionalMerge {
  private activeTransaction: Transaction | null = null;
  
  async executeMerge(
    parsedData: ParsedStructure,
    mangaId: string
  ): Promise<void> {
    this.activeTransaction = {
      id: `merge-${Date.now()}`,
      operations: [],
      rollbackLog: []
    };
    
    try {
      // Begin transaction
      await this.db.beginTransaction();
      
      // Save rollback state
      await this.saveRollbackState(mangaId);
      
      // Execute merge operations
      for (const node of parsedData.nodes) {
        await this.upsertNode(node, mangaId);
      }
      
      for (const edge of parsedData.edges) {
        await this.upsertEdge(edge, mangaId);
      }
      
      // Commit
      await this.db.commit();
      this.activeTransaction = null;
      
    } catch (error) {
      // Rollback
      await this.rollback();
      
      // Offer partial save
      await this.offerPartialSave(parsedData, mangaId);
      
      throw error;
    }
  }
  
  async rollback(): Promise<void> {
    if (!this.activeTransaction) return;
    
    // Execute rollback operations in reverse order
    const rollbackOps = [...this.activeTransaction.rollbackLog].reverse();
    
    for (const op of rollbackOps) {
      await this.executeRollbackOperation(op);
    }
    
    await this.db.rollback();
    this.activeTransaction = null;
  }
  
  private async offerPartialSave(
    parsedData: ParsedStructure,
    mangaId: string
  ): Promise<void> {
    // Save what we can with warnings
    const validNodes = parsedData.nodes.filter(n => this.validateNode(n));
    const validEdges = parsedData.edges.filter(e => 
      this.validateEdge(e) && 
      validNodes.some(n => n.id === e.source) &&
      validNodes.some(n => n.id === e.target)
    );
    
    if (validNodes.length > 0) {
      await this.savePartialResult({
        nodes: validNodes,
        edges: validEdges,
        mangaId,
        warnings: [`Saved ${validNodes.length}/${parsedData.nodes.length} nodes`]
      });
    }
  }
}
```

---

## 5. UI Error Boundaries

### 5.1 Error Boundary Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                   ERROR BOUNDARY HIERARCHY                       │
└─────────────────────────────────────────────────────────────────┘

<AppErrorBoundary>           ← Critical: App-wide recovery
  ├── Global error state
  ├── Full recovery mode UI
  └── [Export Data] [Reset App]
  │
  └── <Layout>
        │
        └── <PageErrorBoundary>    ← Page-level: Reset page
              ├── Page error state
              ├── Preserve navigation
              └── [Retry Page] [Go Back]
              │
              └── <ComponentBoundary>  ← Component: Graceful degradation
                    ├── Local error state
                    ├── Show placeholder
                    └── [Retry Component]
                    │
                    └── <Feature />
```

### 5.2 Error Boundary Implementation

```typescript
// React Error Boundary Components

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to error service
    errorService.captureException(error, {
      extra: { errorInfo }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <FullRecoveryMode 
        error={this.state.error}
        onReset={() => this.setState({ hasError: false })}
      />;
    }
    
    return this.props.children;
  }
}

class PageErrorBoundary extends Component<
  { pageId: string; children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Save page state for potential recovery
    pageRecoveryService.saveState(this.props.pageId);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false });
  };
  
  handleReset = () => {
    pageRecoveryService.clearState(this.props.pageId);
    this.setState({ hasError: false });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <PageErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          canRecover={pageRecoveryService.hasSavedState(this.props.pageId)}
        />
      );
    }
    
    return this.props.children;
  }
}

class ComponentErrorBoundary extends Component<
  { 
    fallback?: ReactNode;
    onError?: (error: Error) => void;
    children: ReactNode;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ComponentErrorPlaceholder 
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### 5.3 Recovery UI Components

```typescript
// Full Recovery Mode UI
const FullRecoveryMode: FC<{ error: Error | null; onReset: () => void }> = ({
  error,
  onReset
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await backupManager.exportAllData();
      await downloadJson(data, `loom-backup-${Date.now()}.json`);
      setExportComplete(true);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleReset = async () => {
    if (!exportComplete) {
      const confirmed = window.confirm(
        'You haven\'t exported your data. Are you sure you want to reset?'
      );
      if (!confirmed) return;
    }
    
    await databaseRecoveryManager.resetDatabase();
    onReset();
  };
  
  return (
    <div className="recovery-mode-container">
      <div className="recovery-mode-card">
        <div className="recovery-icon">⚠️</div>
        <h1>Something Went Wrong</h1>
        <p>
          We encountered a critical error that prevents the app from working properly.
        </p>
        
        {error && (
          <div className="error-details">
            <code>Error: {error.message}</code>
            <small>Error ID: {generateErrorId(error)}</small>
          </div>
        )}
        
        <div className="recovery-actions">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
          
          <button 
            onClick={handleReset}
            className="btn-danger"
          >
            Reset App
          </button>
        </div>
        
        {exportComplete && (
          <p className="success-message">
            ✓ Data exported successfully. You can now safely reset.
          </p>
        )}
      </div>
    </div>
  );
};

// Component Error Placeholder
const ComponentErrorPlaceholder: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="component-error-placeholder">
    <div className="placeholder-icon">⚡</div>
    <p>This feature is temporarily unavailable</p>
    <button onClick={onRetry} className="btn-secondary">
      Try Again
    </button>
  </div>
);
```

### 5.4 Graceful Degradation Patterns

```typescript
// Progressive Enhancement Wrapper
interface ProgressiveFeatureProps {
  feature: string;
  fallback: ReactNode;
  degraded: ReactNode;
  children: ReactNode;
}

const ProgressiveFeature: FC<ProgressiveFeatureProps> = ({
  feature,
  fallback,
  degraded,
  children
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'degraded' | 'failed'>('loading');
  
  useEffect(() => {
    featureCheck.check(feature)
      .then(available => {
        setStatus(available ? 'ready' : 'degraded');
      })
      .catch(() => setStatus('failed'));
  }, [feature]);
  
  if (status === 'loading') {
    return <FeatureSkeleton />;
  }
  
  if (status === 'failed') {
    return <>{fallback}</>;
  }
  
  if (status === 'degraded') {
    return (
      <>
        {degraded}
        <DegradedModeBanner feature={feature} />
      </>
    );
  }
  
  return <>{children}</>;
};

// Skeleton Loading State
const FeatureSkeleton: FC = () => (
  <div className="skeleton-container">
    <div className="skeleton-header" />
    <div className="skeleton-content">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  </div>
);
```

---

## 6. User Recovery Actions

### 6.1 Universal Recovery Options

| Action | Icon | When to Show | Behavior |
|--------|------|--------------|----------|
| **Retry** | 🔄 | Any retryable error | Attempt operation again with same params |
| **Skip** | ⏭️ | Non-critical step failed | Continue to next step, mark as incomplete |
| **Reset** | ↩️ | State corruption suspected | Clear local state, restart operation |
| **Export** | 💾 | Before destructive actions | Download current data as JSON |
| **Report** | 📝 | Unexpected errors | Capture logs, open GitHub issue |
| **Help** | ❓ | User confusion | Open documentation or chat support |

### 6.2 Contextual Action Matrix

| Scenario | Primary Action | Secondary Action | Tertiary Action |
|----------|----------------|------------------|-----------------|
| **Analysis Failed** | Retry Analysis | Skip to Results | Export & Reset |
| **LLM Unavailable** | Switch Provider | Try Again Later | Use Local Mode |
| **Storage Full** | Export & Cleanup | Delete Old Data | Upgrade Storage |
| **Parse Error** | Auto-Repair | Manual Edit | Skip This Page |
| **Upload Failed** | Resume Upload | Retry Upload | Compress & Retry |
| **Merge Conflict** | Auto-Resolve | Manual Merge | Discard Changes |

### 6.3 Recovery Action Components

```typescript
interface RecoveryActionBarProps {
  error: Error;
  context: ErrorContext;
  onAction: (action: RecoveryAction) => void;
}

const RecoveryActionBar: FC<RecoveryActionBarProps> = ({
  error,
  context,
  onAction
}) => {
  const actions = useMemo(() => {
    return recoveryActionResolver.resolve(error, context);
  }, [error, context]);
  
  return (
    <div className="recovery-action-bar">
      <div className="error-message">
        <Icon name={getErrorIcon(error)} />
        <span>{getUserFriendlyMessage(error)}</span>
      </div>
      
      <div className="action-buttons">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            className={index === 0 ? 'btn-primary' : 'btn-secondary'}
            disabled={action.disabled}
          >
            {action.icon && <Icon name={action.icon} />}
            {action.label}
          </button>
        ))}
      </div>
      
      {context.canReport && (
        <button 
          className="btn-link"
          onClick={() => openReportDialog(error, context)}
        >
          Report this issue
        </button>
      )}
    </div>
  );
};

// Recovery Action Resolver
class RecoveryActionResolver {
  resolve(error: Error, context: ErrorContext): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    
    // Always offer retry for transient errors
    if (this.isRetryable(error)) {
      actions.push({
        id: 'retry',
        label: context.retryCount > 0 ? `Retry (${context.retryCount})` : 'Retry',
        icon: 'refresh',
        handler: () => this.executeRetry(context)
      });
    }
    
    // Offer skip for non-critical operations
    if (context.operationType !== 'critical') {
      actions.push({
        id: 'skip',
        label: 'Skip This Step',
        icon: 'skip',
        handler: () => this.executeSkip(context)
      });
    }
    
    // Offer export before destructive operations
    if (context.hasUnsavedData) {
      actions.push({
        id: 'export',
        label: 'Export Data First',
        icon: 'download',
        handler: () => this.executeExport(context)
      });
    }
    
    // Offer reset for state issues
    if (this.isStateRelated(error)) {
      actions.push({
        id: 'reset',
        label: 'Reset & Restart',
        icon: 'reset',
        variant: 'danger',
        handler: () => this.executeReset(context)
      });
    }
    
    return actions;
  }
  
  private isRetryable(error: Error): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMIT',
      'SERVER_ERROR'
    ];
    return retryableCodes.some(code => 
      error.message.includes(code) || 
      (error as any).code === code
    );
  }
  
  private isStateRelated(error: Error): boolean {
    return error.message.includes('state') ||
           error.message.includes('corrupt') ||
           error.message.includes('invalid');
  }
}
```

---

## 7. Automatic Recovery

### 7.1 Self-Healing Behaviors

```typescript
interface SelfHealingRule {
  condition: (error: Error) => boolean;
  action: () => Promise<void>;
  maxAttempts: number;
  cooldownPeriod: number;
}

class SelfHealingSystem {
  private rules: Map<string, SelfHealingRule> = new Map();
  private attemptCounts: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();
  
  registerRule(id: string, rule: SelfHealingRule): void {
    this.rules.set(id, rule);
  }
  
  async attemptHeal(error: Error): Promise<boolean> {
    for (const [ruleId, rule] of this.rules) {
      if (rule.condition(error)) {
        if (await this.canAttempt(ruleId, rule)) {
          try {
            await rule.action();
            this.recordSuccess(ruleId);
            return true;
          } catch (healError) {
            this.recordFailure(ruleId);
            console.error(`Self-healing failed for ${ruleId}:`, healError);
          }
        }
      }
    }
    return false;
  }
  
  private async canAttempt(ruleId: string, rule: SelfHealingRule): Promise<boolean> {
    const attempts = this.attemptCounts.get(ruleId) || 0;
    const lastTry = this.lastAttempt.get(ruleId) || 0;
    const timeSinceLast = Date.now() - lastTry;
    
    return attempts < rule.maxAttempts && timeSinceLast > rule.cooldownPeriod;
  }
  
  private recordSuccess(ruleId: string): void {
    this.attemptCounts.delete(ruleId);
  }
  
  private recordFailure(ruleId: string): void {
    const current = this.attemptCounts.get(ruleId) || 0;
    this.attemptCounts.set(ruleId, current + 1);
    this.lastAttempt.set(ruleId, Date.now());
  }
}

// Register self-healing rules
const selfHealing = new SelfHealingSystem();

// Auto-retry on transient failures
selfHealing.registerRule('transient-retry', {
  condition: (error) => error.message.includes('NETWORK_ERROR'),
  action: async () => {
    await new Promise(r => setTimeout(r, 2000));
    // Retry will happen automatically on next operation
  },
  maxAttempts: 3,
  cooldownPeriod: 5000
});

// Auto-switch provider on persistent failures
selfHealing.registerRule('provider-switch', {
  condition: (error) => error.message.includes('LLM_UNAVAILABLE'),
  action: async () => {
    await llmManager.switchToFallbackProvider();
  },
  maxAttempts: 2,
  cooldownPeriod: 30000
});

// Quality reduction on resource constraints
selfHealing.registerRule('quality-reduction', {
  condition: (error) => error.message.includes('OUT_OF_MEMORY'),
  action: async () => {
    await configManager.reduceQuality('analysis', 0.75);
  },
  maxAttempts: 1,
  cooldownPeriod: 60000
});

// Cache invalidation on stale data
selfHealing.registerRule('cache-invalidation', {
  condition: (error) => error.message.includes('CACHE_MISS') || 
                        error.message.includes('STALE_DATA'),
  action: async () => {
    await cacheManager.clearStale();
  },
  maxAttempts: 5,
  cooldownPeriod: 1000
});
```

### 7.2 Health Checks

```typescript
interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus>;
  interval: number;
  critical: boolean;
}

interface HealthStatus {
  healthy: boolean;
  latency?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private statuses: Map<string, HealthStatus> = new Map();
  private intervals: Map<string, number> = new Map();
  
  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.startMonitoring(check);
  }
  
  private startMonitoring(check: HealthCheck): void {
    const runCheck = async () => {
      try {
        const status = await check.check();
        this.statuses.set(check.name, status);
        
        if (!status.healthy && check.critical) {
          this.handleCriticalFailure(check.name, status);
        }
      } catch (error) {
        this.statuses.set(check.name, {
          healthy: false,
          message: (error as Error).message
        });
      }
    };
    
    // Run immediately
    runCheck();
    
    // Schedule periodic checks
    const intervalId = window.setInterval(runCheck, check.interval);
    this.intervals.set(check.name, intervalId);
  }
  
  private handleCriticalFailure(checkName: string, status: HealthStatus): void {
    console.error(`Critical health check failed: ${checkName}`, status);
    
    // Trigger recovery
    eventBus.emit('health:critical', { check: checkName, status });
  }
  
  getStatus(checkName: string): HealthStatus | undefined {
    return this.statuses.get(checkName);
  }
  
  getAllStatuses(): Map<string, HealthStatus> {
    return new Map(this.statuses);
  }
  
  dispose(): void {
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
  }
}

// Register health checks
const healthMonitor = new HealthMonitor();

// LLM Provider Health
healthMonitor.registerCheck({
  name: 'llm-primary',
  check: async () => {
    const start = performance.now();
    const available = await llmManager.checkProvider('gemini');
    const latency = performance.now() - start;
    
    return {
      healthy: available,
      latency,
      message: available ? 'Primary LLM available' : 'Primary LLM unavailable'
    };
  },
  interval: 60000, // Check every minute
  critical: true
});

// Storage Quota Health
healthMonitor.registerCheck({
  name: 'storage-quota',
  check: async () => {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || Infinity;
    const percentage = (usage / quota) * 100;
    
    return {
      healthy: percentage < 80,
      message: `Storage ${percentage.toFixed(1)}% full`,
      metadata: { usage, quota, percentage }
    };
  },
  interval: 30000,
  critical: true
});

// Memory Usage Health
healthMonitor.registerCheck({
  name: 'memory-usage',
  check: async () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const percentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      return {
        healthy: percentage < 85,
        message: `Memory ${percentage.toFixed(1)}% used`,
        metadata: {
          used: memory.usedJSHeapSize,
          total: memory.jsHeapSizeLimit
        }
      };
    }
    
    return { healthy: true, message: 'Memory API not available' };
  },
  interval: 10000,
  critical: false
});
```

### 7.3 Circuit Breaker Pattern

```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutDuration: number;
  successThreshold: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;
  private lastFailure: number | null = null;
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerOpenError(
          `Circuit breaker '${this.name}' is OPEN. Try again in ${this.getRemainingTime()}ms`
        );
      }
      
      // Transition to HALF_OPEN
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      
      if (this.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successes = 0;
        console.log(`Circuit breaker '${this.name}' CLOSED`);
      }
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.timeoutDuration;
      this.successes = 0;
      
      console.warn(
        `Circuit breaker '${this.name}' OPENED until ${new Date(this.nextAttempt)}`
      );
    }
  }
  
  private getRemainingTime(): number {
    return Math.max(0, this.nextAttempt - Date.now());
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure
    };
  }
}

// Usage
const geminiCircuit = new CircuitBreaker('gemini-api', {
  failureThreshold: 5,
  timeoutDuration: 5 * 60 * 1000, // 5 minutes
  successThreshold: 2
});

// Wrap LLM calls
async function callGemini(prompt: string): Promise<string> {
  return geminiCircuit.execute(async () => {
    return await geminiApi.generate(prompt);
  });
}
```

---

## 8. Data Recovery Procedures

### 8.1 Corruption Recovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORRUPTION RECOVERY FLOW                      │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Detect  │
    │Corruption│
    └────┬─────┘
         │
         ▼
    ┌──────────┐     ┌──────────┐
    │ Validate │────▶│  Valid?  │────Yes────▶ [Continue]
    │   Data   │     └──────────┘
    └──────────┘          │
                          │ No
                          ▼
                   ┌──────────────┐
                   │ Auto-Repair  │
                   │   Attempt    │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐     ┌──────────┐
                   │   Repair     │────▶│ Success? │───Yes───▶ [Continue]
                   │  Successful? │     └──────────┘
                   └──────┬───────┘          │
                          │                   │ No
                          │ No                ▼
                          │            ┌──────────────┐
                          │            │ Load Last    │
                          │            │ Known Good   │
                          │            └──────┬───────┘
                          │                   │
                          │                   ▼
                          │            ┌──────────────┐
                          │            │  Available?  │───Yes───▶ [Restore]
                          │            └──────┬───────┘
                          │                   │ No
                          │                   ▼
                          │            ┌──────────────┐
                          └───────────▶│ Manual Repair│
                                       │   Interface  │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  User Fixed? │───Yes───▶ [Continue]
                                       └──────┬───────┘
                                              │ No
                                              ▼
                                       ┌──────────────┐
                                       │Nuclear Option│
                                       │ Export+Reset │
                                       └──────────────┘
```

### 8.2 Corruption Recovery Implementation

```typescript
class CorruptionRecoveryManager {
  private integrityChecker: DataIntegrityChecker;
  private backupManager: BackupManager;
  
  async recoverFromCorruption(): Promise<RecoveryResult> {
    // Step 1: Detect and validate
    const validation = await this.detectCorruption();
    
    if (validation.valid) {
      return { success: true, action: 'none', message: 'No corruption detected' };
    }
    
    // Step 2: Attempt automatic repair
    const repairResult = await this.attemptAutoRepair(validation);
    
    if (repairResult.success) {
      return {
        success: true,
        action: 'auto_repair',
        message: `Repaired ${repairResult.repairs.length} issues`
      };
    }
    
    // Step 3: Restore from backup
    const restoreResult = await this.attemptRestore();
    
    if (restoreResult.success) {
      return {
        success: true,
        action: 'restore_backup',
        message: `Restored from backup: ${restoreResult.backupId}`
      };
    }
    
    // Step 4: Offer manual repair
    const manualResult = await this.offerManualRepair(validation);
    
    if (manualResult.success) {
      return {
        success: true,
        action: 'manual_repair',
        message: 'User completed manual repair'
      };
    }
    
    // Step 5: Nuclear option
    return {
      success: false,
      action: 'reset_required',
      message: 'Unable to recover automatically. Export data and reset required.',
      requiresUserAction: true
    };
  }
  
  private async detectCorruption(): Promise<ValidationReport> {
    return await this.integrityChecker.validateDatabase(currentSchema);
  }
  
  private async attemptAutoRepair(report: ValidationReport): Promise<RepairResult> {
    const repairs: RepairAction[] = [];
    
    for (const error of report.errors) {
      const repair = await this.attemptRepair(error);
      if (repair) {
        repairs.push(repair);
      }
    }
    
    // Re-validate after repairs
    const revalidation = await this.detectCorruption();
    
    return {
      success: revalidation.valid,
      repairs,
      remainingErrors: revalidation.errors
    };
  }
  
  private async attemptRepair(error: ValidationError): Promise<RepairAction | null> {
    switch (error.issue) {
      case 'Missing required field':
        return await this.repairMissingField(error);
        
      case 'Orphaned record':
        return await this.repairOrphanedRecord(error);
        
      case 'Invalid reference':
        return await this.repairInvalidReference(error);
        
      case 'Checksum mismatch':
        return await this.repairChecksumMismatch(error);
        
      default:
        return null;
    }
  }
  
  private async repairMissingField(error: ValidationError): Promise<RepairAction> {
    const defaultValues: Record<string, unknown> = {
      'title': 'Untitled',
      'createdAt': Date.now(),
      'updatedAt': Date.now(),
      'status': 'draft'
    };
    
    await db.update(error.table, error.record, {
      [error.field]: defaultValues[error.field] ?? null
    });
    
    return {
      type: 'set_default',
      table: error.table,
      record: error.record,
      field: error.field
    };
  }
  
  private async offerManualRepair(report: ValidationReport): Promise<ManualRepairResult> {
    // Open manual repair UI
    const repairSession = await manualRepairUI.open({
      errors: report.errors,
      warnings: report.warnings,
      data: await db.exportAll()
    });
    
    return new Promise((resolve) => {
      repairSession.onComplete((result) => {
        resolve(result);
      });
    });
  }
}
```

### 8.3 Partial Data Recovery

```typescript
interface PartialRecoveryOptions {
  extractValid: boolean;
  markInvalid: boolean;
  allowContinue: boolean;
}

class PartialDataRecovery {
  async recoverPartialData<T>(
    data: T[],
    validator: (item: T) => ValidationResult,
    options: PartialRecoveryOptions
  ): Promise<PartialRecoveryResult<T>> {
    const result: PartialRecoveryResult<T> = {
      valid: [],
      invalid: [],
      repaired: [],
      canContinue: false
    };
    
    for (const item of data) {
      const validation = validator(item);
      
      if (validation.valid) {
        result.valid.push(item);
      } else if (validation.repairable) {
        const repaired = await this.attemptRepairItem(item, validation);
        if (repaired) {
          result.repaired.push(repaired);
        } else {
          result.invalid.push({ item, error: validation.error });
        }
      } else {
        result.invalid.push({ item, error: validation.error });
      }
    }
    
    // Determine if we can continue
    const totalValid = result.valid.length + result.repaired.length;
    const totalItems = data.length;
    const validityRatio = totalValid / totalItems;
    
    result.canContinue = options.allowContinue && validityRatio >= 0.5;
    
    // Mark invalid items if requested
    if (options.markInvalid) {
      for (const invalid of result.invalid) {
        await this.markItemInvalid(invalid.item, invalid.error);
      }
    }
    
    return result;
  }
  
  private async attemptRepairItem<T>(
    item: T,
    validation: ValidationResult
  ): Promise<T | null> {
    // Apply repair strategies based on error type
    const strategies = this.getRepairStrategies(validation.error);
    
    for (const strategy of strategies) {
      try {
        const repaired = await strategy(item);
        if (repaired && (await this.validate(repaired)).valid) {
          return repaired;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }
  
  private async markItemInvalid<T>(item: T, error: string): Promise<void> {
    const marked = {
      ...item,
      _meta: {
        ...(item as any)._meta,
        invalid: true,
        invalidReason: error,
        markedAt: Date.now()
      }
    };
    
    await db.update(marked);
  }
}
```

---

## 9. Error Logging & Debugging

### 9.1 Log Levels & Categories

| Level | Use Case | Destination | Retention |
|-------|----------|-------------|-----------|
| **ERROR** | User-facing failures, data loss risk | Persistent + Console | 30 days |
| **WARN** | Recoverable issues, degraded performance | Persistent + Console | 14 days |
| **INFO** | Significant events, state changes | In-memory + Console | Session only |
| **DEBUG** | Detailed tracing, dev diagnostics | Console only | N/A |
| **TRACE** | Verbose operation details | Dev mode only | N/A |

### 9.2 Logger Implementation

```typescript
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId: string;
}

class ErrorLogger {
  private logBuffer: LogEntry[] = [];
  private readonly BUFFER_SIZE = 100;
  private level: LogLevel = LogLevel.INFO;
  
  constructor(private storage: LogStorage) {}
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  trace(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, category, message, context);
  }
  
  debug(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, category, message, context);
  }
  
  info(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, category, message, context);
  }
  
  warn(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, category, message, context);
  }
  
  error(
    category: string, 
    message: string, 
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, category, message, context, error);
  }
  
  private log(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (level < this.level) return;
    
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      context: this.sanitizeContext(context),
      error: error ? this.sanitizeError(error) : undefined,
      sessionId: this.getSessionId()
    };
    
    // Add to buffer
    this.logBuffer.push(entry);
    
    // Flush if buffer full or high severity
    if (this.logBuffer.length >= this.BUFFER_SIZE || level >= LogLevel.WARN) {
      this.flush();
    }
    
    // Console output
    this.consoleOutput(entry);
  }
  
  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;
    
    const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'key'];
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...[truncated]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  private sanitizeError(error: Error): Error {
    // Create new error with sanitized message
    const sanitized = new Error(
      this.sanitizeString(error.message)
    );
    sanitized.stack = error.stack ? this.sanitizeStack(error.stack) : undefined;
    sanitized.name = error.name;
    
    return sanitized;
  }
  
  private sanitizeString(str: string): string {
    // Remove potential API keys from error messages
    return str
      .replace(/[a-zA-Z0-9_-]{32,}/g, '[REDACTED_KEY]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]');
  }
  
  private sanitizeStack(stack: string): string {
    // Remove file paths that might contain personal info
    return stack
      .split('\n')
      .map(line => line.replace(/\/[\w\/]+\//g, '/.../'))
      .join('\n');
  }
  
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const entries = [...this.logBuffer];
    this.logBuffer = [];
    
    // Separate by severity
    const persistent = entries.filter(e => e.level >= LogLevel.WARN);
    
    if (persistent.length > 0) {
      await this.storage.save(persistent);
    }
  }
  
  async exportLogs(): Promise<string> {
    await this.flush();
    return await this.storage.export();
  }
}
```

### 9.3 Log Storage

```typescript
interface LogStorage {
  save(entries: LogEntry[]): Promise<void>;
  query(filters: LogQuery): Promise<LogEntry[]>;
  export(): Promise<string>;
  clear(before?: number): Promise<void>;
}

class IndexedDBLogStorage implements LogStorage {
  private readonly DB_NAME = 'LoomLogs';
  private readonly STORE_NAME = 'logs';
  private readonly MAX_ENTRIES = 1000;
  
  async save(entries: LogEntry[]): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(this.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    for (const entry of entries) {
      await store.add(entry);
    }
    
    // Cleanup old entries
    await this.cleanupOldEntries(store);
    
    db.close();
  }
  
  private async cleanupOldEntries(store: IDBObjectStore): Promise<void> {
    const count = await store.count();
    
    if (count > this.MAX_ENTRIES) {
      const toDelete = count - this.MAX_ENTRIES;
      const index = store.index('timestamp');
      
      let deleted = 0;
      const cursor = await index.openCursor();
      
      while (cursor && deleted < toDelete) {
        await store.delete(cursor.primaryKey);
        deleted++;
        await cursor.continue();
      }
    }
  }
  
  async export(): Promise<string> {
    const entries = await this.query({});
    return JSON.stringify(entries, null, 2);
  }
}
```

---

## 10. Testing Error Scenarios

### 10.1 Simulated Failure Injection

```typescript
interface FailureScenario {
  name: string;
  description: string;
  inject: () => void;
  cleanup: () => void;
}

class FailureInjectionFramework {
  private activeScenarios: Map<string, FailureScenario> = new Map();
  
  registerScenario(scenario: FailureScenario): void {
    this.activeScenarios.set(scenario.name, scenario);
  }
  
  activate(name: string): void {
    const scenario = this.activeScenarios.get(name);
    if (scenario) {
      console.log(`[FAILURE INJECTION] Activating: ${name}`);
      scenario.inject();
    }
  }
  
  deactivate(name: string): void {
    const scenario = this.activeScenarios.get(name);
    if (scenario) {
      console.log(`[FAILURE INJECTION] Deactivating: ${name}`);
      scenario.cleanup();
    }
  }
  
  deactivateAll(): void {
    for (const [name] of this.activeScenarios) {
      this.deactivate(name);
    }
  }
}

// Register failure scenarios
const failureInjection = new FailureInjectionFramework();

// Network timeout simulation
failureInjection.registerScenario({
  name: 'network-timeout',
  description: 'Simulate network timeout on API calls',
  inject: () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      await new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Simulated timeout')), 100)
      );
      return originalFetch(...args);
    };
  },
  cleanup: () => {
    // Restore original fetch
    location.reload();
  }
});

// Storage quota simulation
failureInjection.registerScenario({
  name: 'storage-full',
  description: 'Simulate storage quota exceeded',
  inject: () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function() {
      throw new Error('QuotaExceededError: Storage quota exceeded');
    };
  },
  cleanup: () => location.reload()
});

// LLM error response mocking
failureInjection.registerScenario({
  name: 'llm-rate-limit',
  description: 'Simulate LLM rate limiting',
  inject: () => {
    // Override LLM manager to return rate limit errors
    const originalCall = LLMManager.prototype.generate;
    LLMManager.prototype.generate = async function() {
      const error = new Error('Rate limit exceeded');
      (error as any).code = 'RATE_LIMIT';
      (error as any).retryAfter = 60;
      throw error;
    };
  },
  cleanup: () => location.reload()
});

// Corruption injection
failureInjection.registerScenario({
  name: 'data-corruption',
  description: 'Inject data corruption',
  inject: async () => {
    const db = await openDB('LoomDB');
    const transaction = db.transaction('mangas', 'readwrite');
    const store = transaction.objectStore('mangas');
    
    // Corrupt first record
    const all = await store.getAll();
    if (all.length > 0) {
      const corrupted = { ...all[0], title: undefined, nodes: 'invalid' };
      await store.put(corrupted);
    }
    
    db.close();
  },
  cleanup: async () => {
    // Restore from backup or reset
    await backupManager.restoreFromBackup();
  }
});
```

### 10.2 Recovery Testing Suite

```typescript
describe('Error Recovery', () => {
  let failureInjection: FailureInjectionFramework;
  
  beforeEach(() => {
    failureInjection = new FailureInjectionFramework();
  });
  
  afterEach(() => {
    failureInjection.deactivateAll();
  });
  
  describe('Retry Logic', () => {
    it('should retry transient failures up to 3 times', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('TRANSIENT_ERROR');
        }
        return 'success';
      };
      
      const retryManager = new RetryManager();
      const result = await retryManager.executeWithRetry(operation);
      
      expect(attempts).toBe(3);
      expect(result).toBe('success');
    });
    
    it('should use exponential backoff between retries', async () => {
      const delays: number[] = [];
      let lastAttempt = Date.now();
      
      const operation = async () => {
        const now = Date.now();
        delays.push(now - lastAttempt);
        lastAttempt = now;
        throw new Error('RETRY_ME');
      };
      
      const retryManager = new RetryManager();
      await expect(retryManager.executeWithRetry(operation)).rejects.toThrow();
      
      // Verify exponential growth (with jitter tolerance)
      expect(delays[1]).toBeGreaterThan(delays[0] * 1.5);
      expect(delays[2]).toBeGreaterThan(delays[1] * 1.5);
    });
  });
  
  describe('Fallback Providers', () => {
    it('should switch to fallback when primary fails', async () => {
      failureInjection.activate('llm-primary-fail');
      
      const llmManager = new LLMFallbackManager();
      llmManager.registerProvider({ name: 'primary', priority: 1 });
      llmManager.registerProvider({ name: 'fallback', priority: 2 });
      
      const result = await llmManager.generateWithFallback('test');
      
      expect(result.provider).toBe('fallback');
    });
  });
  
  describe('Data Integrity', () => {
    it('should detect and report corruption', async () => {
      failureInjection.activate('data-corruption');
      
      const checker = new DataIntegrityChecker();
      const report = await checker.validateDatabase(schema);
      
      expect(report.valid).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });
    
    it('should recover from checkpoint after failure', async () => {
      const checkpointManager = new CheckpointManager();
      const pipeline = new ResilientPipeline();
      
      // Simulate failure at analysis stage
      failureInjection.activate('analysis-fail');
      
      await expect(pipeline.execute(input, context)).rejects.toThrow();
      
      // Deactivate failure and retry
      failureInjection.deactivate('analysis-fail');
      
      const result = await pipeline.execute(input, context);
      
      expect(result).toBeDefined();
    });
  });
  
  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        timeoutDuration: 60000,
        successThreshold: 2
      });
      
      // Cause failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }
      
      expect(breaker.getState()).toBe('OPEN');
      
      // Next call should fail immediately
      await expect(breaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow(CircuitBreakerOpenError);
    });
  });
  
  describe('User Experience', () => {
    it('should show appropriate UI for each error type', async () => {
      const scenarios = [
        { error: new NetworkError(), expected: 'retry-button' },
        { error: new ValidationError(), expected: 'correction-form' },
        { error: new CriticalError(), expected: 'recovery-mode' }
      ];
      
      for (const { error, expected } of scenarios) {
        const ui = errorUIRenderer.render(error);
        expect(ui).toContain(expected);
      }
    });
  });
});
```

---

## 11. Implementation Guidelines

### 11.1 Error Handling Pattern

```typescript
// Standard error handling pattern for all async operations
async function robustOperation<T>(
  operation: () => Promise<T>,
  options: RobustOperationOptions<T>
): Promise<OperationResult<T>> {
  const startTime = performance.now();
  
  try {
    // Pre-operation checks
    await options.preCheck?.();
    
    // Execute with potential retry
    const result = await executeWithRetry(operation, options.retry);
    
    // Post-operation validation
    const validated = await options.validate?.(result);
    
    return {
      success: true,
      data: validated ?? result,
      duration: performance.now() - startTime
    };
    
  } catch (error) {
    const categorized = categorizeError(error);
    
    // Log error
    logger.error(
      options.category || 'operation',
      `Operation failed: ${options.operationName}`,
      categorized.original
    );
    
    // Determine recovery strategy
    const recovery = await determineRecovery(categorized, options);
    
    if (recovery.canRetry) {
      return retryWithBackoff(operation, recovery.options);
    }
    
    if (recovery.canFallback) {
      return fallbackOperation(recovery.fallback, options);
    }
    
    // Return user-facing error
    return {
      success: false,
      error: createUserFacingError(categorized),
      actions: recovery.actions,
      duration: performance.now() - startTime
    };
  }
}

// Usage example
const result = await robustOperation(
  () => analyzeMangaPages(pages),
  {
    operationName: 'manga-analysis',
    category: 'analysis',
    retry: {
      maxRetries: 3,
      onRetry: (attempt) => showRetryNotification(attempt)
    },
    fallback: () => analyzeWithLocalModel(pages),
    preCheck: () => verifyStorageQuota(),
    validate: (result) => validateAnalysisResult(result)
  }
);

if (result.success) {
  displayResults(result.data);
} else {
  showErrorUI(result.error, result.actions);
}
```

### 11.2 State Recovery Pattern

```typescript
interface StateSnapshot<T> {
  id: string;
  timestamp: number;
  state: T;
  checksum: string;
}

class StateRecoveryManager<T> {
  private snapshots: Map<string, StateSnapshot<T>> = new Map();
  
  async saveBeforeOperation(
    operationId: string,
    state: T
  ): Promise<void> {
    const snapshot: StateSnapshot<T> = {
      id: operationId,
      timestamp: Date.now(),
      state: this.deepClone(state),
      checksum: await this.calculateChecksum(state)
    };
    
    this.snapshots.set(operationId, snapshot);
    await this.persistSnapshot(snapshot);
  }
  
  async rollback(operationId: string): Promise<T | null> {
    const snapshot = this.snapshots.get(operationId) || 
                     await this.loadPersistedSnapshot(operationId);
    
    if (!snapshot) return null;
    
    // Verify integrity
    const currentChecksum = await this.calculateChecksum(snapshot.state);
    if (currentChecksum !== snapshot.checksum) {
      throw new Error('Snapshot integrity check failed');
    }
    
    return this.deepClone(snapshot.state);
  }
  
  async commit(operationId: string): Promise<void> {
    this.snapshots.delete(operationId);
    await this.deletePersistedSnapshot(operationId);
  }
  
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  private async calculateChecksum(state: T): Promise<string> {
    const json = JSON.stringify(state);
    const buffer = new TextEncoder().encode(json);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

### 11.3 Atomic Transaction Pattern

```typescript
interface TransactionOperation<T> {
  execute: () => Promise<T>;
  rollback: (result: T) => Promise<void>;
  description: string;
}

async function executeTransaction<T>(
  operations: TransactionOperation<T>[],
  options: TransactionOptions
): Promise<TransactionResult<T>> {
  const results: T[] = [];
  const completed: TransactionOperation<T>[] = [];
  
  try {
    for (const operation of operations) {
      // Check for abort signal
      if (options.signal?.aborted) {
        throw new Error('Transaction aborted');
      }
      
      // Execute operation
      const result = await operation.execute();
      results.push(result);
      completed.push(operation);
      
      // Progress callback
      options.onProgress?.(completed.length, operations.length);
    }
    
    return {
      success: true,
      results,
      completed: completed.length
    };
    
  } catch (error) {
    // Rollback completed operations in reverse order
    for (let i = completed.length - 1; i >= 0; i--) {
      try {
        await completed[i].rollback(results[i]);
      } catch (rollbackError) {
        // Log but continue rollback
        logger.error('transaction', `Rollback failed for: ${completed[i].description}`, rollbackError as Error);
      }
    }
    
    return {
      success: false,
      error,
      completed: completed.length,
      rolledBack: completed.length
    };
  }
}
```

---

## 12. Implementation Effort Estimates

| Component | Effort (Days) | Complexity | Priority |
|-----------|---------------|------------|----------|
| **Error Classification System** | 1 | Low | P0 |
| **LLM Retry with Backoff** | 2 | Medium | P0 |
| **LLM Fallback Provider** | 2 | Medium | P0 |
| **Analysis Pipeline Checkpoints** | 3 | High | P0 |
| **Database Recovery Manager** | 3 | High | P1 |
| **Data Integrity Checker** | 2 | Medium | P1 |
| **Backup/Export System** | 2 | Medium | P1 |
| **App Error Boundary** | 1 | Low | P0 |
| **Page Error Boundaries** | 1 | Low | P0 |
| **Component Error Boundaries** | 2 | Low | P1 |
| **Recovery UI Components** | 2 | Medium | P1 |
| **Self-Healing System** | 2 | Medium | P2 |
| **Health Monitor** | 2 | Medium | P2 |
| **Circuit Breakers** | 1 | Low | P2 |
| **Error Logger** | 1 | Low | P1 |
| **Log Storage** | 1 | Low | P2 |
| **Failure Injection Framework** | 2 | Medium | P2 |
| **Recovery Test Suite** | 2 | Medium | P2 |
| **Documentation** | 1 | Low | P1 |
| **---** | **---** | **---** | **---** |
| **Total** | **34 days** | | |

### Phased Implementation

**Phase 1: Core Reliability (P0) - 12 days**
- Error Classification
- LLM Retry & Fallback
- Analysis Checkpoints
- Error Boundaries

**Phase 2: Data Safety (P1) - 12 days**
- Database Recovery
- Data Integrity
- Backup System
- Recovery UI

**Phase 3: Advanced Features (P2) - 10 days**
- Self-Healing
- Health Monitoring
- Circuit Breakers
- Testing Framework

---

## Appendix A: Error Codes Reference

| Code | Category | Description |
|------|----------|-------------|
| `NET_001` | Network | Connection timeout |
| `NET_002` | Network | DNS resolution failed |
| `NET_003` | Network | Rate limited (429) |
| `LLM_001` | LLM | API key invalid |
| `LLM_002` | LLM | Quota exceeded |
| `LLM_003` | LLM | Content filtered |
| `LLM_004` | LLM | Context length exceeded |
| `DB_001` | Database | Quota exceeded |
| `DB_002` | Database | Version mismatch |
| `DB_003` | Database | Corruption detected |
| `ANA_001` | Analysis | Preprocessing failed |
| `ANA_002` | Analysis | LLM parsing error |
| `ANA_003` | Analysis | Merge conflict |
| `UI_001` | UI | Render error |
| `UI_002` | UI | State inconsistency |

---

## Appendix B: State Diagrams

### Error Recovery State Machine

```
                    ┌─────────────┐
         ┌─────────▶│   NORMAL    │◀────────┐
         │          │  OPERATION  │         │
         │          └──────┬──────┘         │
         │                 │ Error          │ Success
         │                 ▼                │
         │          ┌─────────────┐         │
         │          │    ERROR    │         │
         │          │  DETECTED   │         │
         │          └──────┬──────┘         │
         │                 │                │
         │     ┌──────────┼──────────┐      │
         │     ▼          ▼          ▼      │
         │  ┌──────┐  ┌──────┐  ┌──────┐    │
         │  │Retry?│  │Skip? │  │Fatal?│    │
         │  └──┬───┘  └──┬───┘  └──┬───┘    │
         │     │Yes      │Yes      │Yes     │
         │     ▼          ▼          ▼      │
         │  ┌──────┐  ┌──────┐  ┌──────┐    │
         └──│RETRY │  │ SKIP │  │RECOVER│───┘
            └──┬───┘  └──────┘  └──┬───┘
               │                   │
               └───────────────────┘
```

### Circuit Breaker State Machine

```
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      │
   ┌─────────┐    Failure threshold      ┌───────────┐
   │  CLOSED │──────────────────────────▶│   OPEN    │
   │ (normal)│                           │ (blocked) │
   └────┬────┘                           └─────┬─────┘
        ▲                                      │
        │ Success                              │ Timeout
        │                                      ▼
   ┌────┴────┐    Success threshold      ┌───────────┐
   │  CLOSED │◀──────────────────────────│ HALF_OPEN │
   │ (normal)│                           │  (test)   │
   └─────────┘                           └───────────┘
                                              │
                                              │ Failure
                                              ▼
                                         ┌───────────┐
                                         │   OPEN    │
                                         │ (blocked) │
                                         └───────────┘
```

---

*Document Version: 1.0*  
*Last Updated: 2026-02-13*  
*Status: Draft - Ready for Review*
