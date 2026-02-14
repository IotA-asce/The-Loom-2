/**
 * Error Logging System
 * 
 * Centralized logging with multiple log levels, storage, and retrieval.
 * Supports both error objects and log messages.
 */

import { AppError, type SerializedError } from './base-error';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log level names
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * Log entry
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: Record<string, unknown>;
  error?: SerializedError;
  source?: string;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  minLevel: LogLevel;
  maxEntries: number;
  persistToStorage: boolean;
  includeStackTrace: boolean;
  consoleOutput: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  maxEntries: 1000,
  persistToStorage: false, // Could be enabled for production
  includeStackTrace: true,
  consoleOutput: true,
};

/**
 * Error Logger class
 */
class ErrorLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    error?: Error | AppError,
    context?: Record<string, unknown>,
    source?: string
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      source: source ?? this.detectSource(),
    };

    if (error) {
      entry.error = error instanceof AppError
        ? error.serialize()
        : {
            name: error.name,
            message: error.message,
            code: 'UNKNOWN',
            severity: level >= LogLevel.ERROR ? 'error' : 'warning',
            stack: this.config.includeStackTrace ? error.stack : undefined,
            context: { timestamp: Date.now() },
            recoverable: level < LogLevel.FATAL,
          };
    }

    if (context) {
      entry.context = context;
    }

    return entry;
  }

  /**
   * Detect the source of the log (from stack trace)
   */
  private detectSource(): string | undefined {
    try {
      const stack = new Error().stack;
      if (!stack) return undefined;

      // Parse stack trace to find caller
      const lines = stack.split('\n');
      // Line 4 typically contains the caller (skip ErrorLogger methods)
      const callerLine = lines[4];
      if (callerLine) {
        const match = callerLine.match(/at\s+(.+?)\s*\(/);
        return match?.[1] ?? undefined;
      }
    } catch {
      // Ignore detection errors
    }
    return undefined;
  }

  /**
   * Add log entry
   */
  private add(entry: LogEntry): void {
    // Check min level
    if (entry.level < this.config.minLevel) {
      return;
    }

    // Add to logs
    this.logs.push(entry);

    // Trim if exceeds max
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Persist if enabled
    if (this.config.persistToStorage) {
      this.persist();
    }

    // Console output
    if (this.config.consoleOutput) {
      this.outputToConsole(entry);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));
  }

  /**
   * Output entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.levelName}]${entry.source ? ` [${entry.source}]` : ''}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context ?? '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context ?? '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context ?? '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.error ?? '', entry.context ?? '');
        break;
    }
  }

  /**
   * Persist logs to storage
   */
  private persist(): void {
    try {
      localStorage.setItem('loom2-logs', JSON.stringify(this.logs));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load logs from storage
   */
  load(): void {
    try {
      const stored = localStorage.getItem('loom2-logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      // Ignore load errors
    }
  }

  // ============================================================================
  // Public Logging Methods
  // ============================================================================

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.add(this.createEntry(LogLevel.DEBUG, message, undefined, context));
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.add(this.createEntry(LogLevel.INFO, message, undefined, context));
  }

  /**
   * Log warning
   */
  warn(
    message: string,
    error?: Error | AppError,
    context?: Record<string, unknown>
  ): void {
    this.add(this.createEntry(LogLevel.WARN, message, error, context));
  }

  /**
   * Log error
   */
  error(
    message: string | Error | AppError,
    context?: Record<string, unknown>
  ): void {
    if (message instanceof Error) {
      this.add(this.createEntry(LogLevel.ERROR, message.message, message, context));
    } else {
      this.add(this.createEntry(LogLevel.ERROR, message, undefined, context));
    }
  }

  /**
   * Log fatal error
   */
  fatal(
    message: string | Error | AppError,
    context?: Record<string, unknown>
  ): void {
    if (message instanceof Error) {
      this.add(this.createEntry(LogLevel.FATAL, message.message, message, context));
    } else {
      this.add(this.createEntry(LogLevel.FATAL, message, undefined, context));
    }
  }

  // ============================================================================
  // Log Management
  // ============================================================================

  /**
   * Get all logs
   */
  getAll(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs by minimum level
   */
  getByMinLevel(minLevel: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level >= minLevel);
  }

  /**
   * Get recent logs
   */
  getRecent(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Search logs
   */
  search(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerQuery) ||
        log.source?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    if (this.config.persistToStorage) {
      localStorage.removeItem('loom2-logs');
    }
  }

  /**
   * Subscribe to log events
   */
  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    timeRange: { start: number; end: number } | null;
  } {
    const byLevel: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    };

    for (const log of this.logs) {
      byLevel[log.levelName]++;
    }

    const timestamps = this.logs.map((l) => l.timestamp);
    const timeRange = timestamps.length > 0
      ? { start: Math.min(...timestamps), end: Math.max(...timestamps) }
      : null;

    return {
      total: this.logs.length,
      byLevel,
      timeRange,
    };
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Set minimum log level
 */
export const setLogLevel = (level: LogLevel): void => {
  errorLogger.configure({ minLevel: level });
};

/**
 * Get current log level
 */
export const getLogLevel = (): LogLevel => {
  // Access private config - for internal use
  return (errorLogger as unknown as { config: LoggerConfig }).config.minLevel;
};
