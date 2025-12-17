/**
 * Logging Utility - A comprehensive logging system for the application
 * Replaces scattered console.log/error/warn usage with proper logging
 */

/**
 * Log level enumeration
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  tags?: string[];
  stack?: string;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  storageKey?: string;
  maxStorageEntries?: number;
  enableTimestamp: boolean;
  enableColors: boolean;
  prefix?: string;
  format?: 'simple' | 'detailed' | 'json';
  context?: string;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: false,
  storageKey: 'app_logs',
  maxStorageEntries: 1000,
  enableTimestamp: true,
  enableColors: true,
  format: 'detailed'
};

/**
 * Logger class providing comprehensive logging functionality
 */
export class Logger {
  private config: LoggerConfig;
  private static instance: Logger;
  private storage: LogEntry[] = [];
  private context?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  /**
   * Get singleton logger instance
   *
   * @param config - Optional configuration override
   * @returns Logger instance
   *
   * @example
   * ```typescript
   * const logger = Logger.getInstance();
   * logger.info('Application started');
   *
   * const customLogger = Logger.getInstance({ level: LogLevel.DEBUG });
   * customLogger.debug('Debug information');
   * ```
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    if (config) {
      Logger.instance.updateConfig(config);
    }
    return Logger.instance;
  }

  /**
   * Create a new logger instance with specific context
   *
   * @param context - Context name for the logger
   * @param config - Optional configuration
   * @returns New logger instance
   *
   * @example
   * ```typescript
   * const userLogger = Logger.createContext('UserService');
   * userLogger.info('User logged in', { userId: '123' });
   * ```
   */
  static createContext(context: string, config?: Partial<LoggerConfig>): Logger {
    const logger = new Logger({ ...config, context });
    return logger;
  }

  /**
   * Update logger configuration
   *
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   *
   * @returns Current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Set context for this logger instance
   *
   * @param context - Context name
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log at TRACE level
   *
   * @param message - Log message
   * @param data - Optional data to log
   */
  trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, data);
  }

  /**
   * Log at DEBUG level
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * ```typescript
   * logger.debug('Processing request', { requestId: 'abc123' });
   * ```
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log at INFO level
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * ```typescript
   * logger.info('User action completed', { userId: '123', action: 'login' });
   * ```
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log at WARN level
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * ```typescript
   * logger.warn('API rate limit approaching', { current: 95, limit: 100 });
   * ```
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log at ERROR level
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * ```typescript
   * logger.error('API request failed', { error: 'Network timeout', url: '/api/users' });
   * ```
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Log at FATAL level
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * ```typescript
   * logger.fatal('Application crashed', { error: errorMessage, stack: errorStack });
   * ```
   */
  fatal(message: string, data?: any): void {
    this.log(LogLevel.FATAL, message, data);
  }

  /**
   * Core logging method
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional data to log
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.config.level || level === LogLevel.OFF) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context: this.context || this.config.context,
      tags: []
    };

    // Add stack trace for errors and fatal
    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    // Store in memory
    if (this.config.enableStorage) {
      this.addToStorage(entry);
    }

    // Output to console
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console
   *
   * @param entry - Log entry to output
   */
  private outputToConsole(entry: LogEntry): void {
    const { level, message, data, timestamp } = entry;
    const levelName = LogLevel[level];
    const timeStr = this.config.enableTimestamp
      ? `[${timestamp.toISOString()}] `
      : '';
    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    const context = entry.context ? `[${entry.context}] ` : '';

    const formattedMessage = `${timeStr}${prefix}${context}${levelName}: ${message}`;

    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, data);
        break;
      default:
        console.log(formattedMessage, data);
    }
  }

  /**
   * Add log entry to storage
   *
   * @param entry - Log entry to store
   */
  private addToStorage(entry: LogEntry): void {
    this.storage.push(entry);

    // Limit storage size
    if (this.config.maxStorageEntries && this.storage.length > this.config.maxStorageEntries) {
      this.storage = this.storage.slice(-this.config.maxStorageEntries);
    }

    // Persist to localStorage
    this.saveToStorage();
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.storageKey || typeof window === 'undefined') {
      return;
    }

    try {
      const serialized = JSON.stringify(this.storage);
      localStorage.setItem(this.config.storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.storageKey || typeof window === 'undefined') {
      return;
    }

    try {
      const serialized = localStorage.getItem(this.config.storageKey);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        this.storage = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
      this.storage = [];
    }
  }

  /**
   * Get stored log entries
   *
   * @param level - Optional minimum log level filter
   * @param context - Optional context filter
   * @returns Array of log entries
   *
   * @example
   * ```typescript
   * const errorLogs = logger.getLogs(LogLevel.ERROR);
   * const userLogs = logger.getLogs(undefined, 'UserService');
   * ```
   */
  getLogs(level?: LogLevel, context?: string): LogEntry[] {
    let logs = [...this.storage];

    if (level !== undefined) {
      logs = logs.filter(entry => entry.level >= level);
    }

    if (context) {
      logs = logs.filter(entry => entry.context === context);
    }

    return logs;
  }

  /**
   * Clear stored logs
   *
   * @param beforeDate - Optional date to clear logs before
   */
  clearLogs(beforeDate?: Date): void {
    if (beforeDate) {
      this.storage = this.storage.filter(entry => entry.timestamp >= beforeDate);
    } else {
      this.storage = [];
    }
    this.saveToStorage();
  }

  /**
   * Export logs as JSON string
   *
   * @param level - Optional minimum log level filter
   * @param context - Optional context filter
   * @returns JSON string of logs
   *
   * @example
   * ```typescript
   * const jsonLogs = logger.exportLogs(LogLevel.WARN);
   * // Download or send logs
   * ```
   */
  exportLogs(level?: LogLevel, context?: string): string {
    const logs = this.getLogs(level, context);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Create child logger with additional context
   *
   * @param context - Additional context
   * @param data - Additional default data
   * @returns New logger instance
   *
   * @example
   * ```typescript
   * const apiLogger = logger.child('API', { version: 'v1' });
   * apiLogger.info('Request received'); // Will include API context and version
   * ```
   */
  child(context: string, data?: any): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setContext(context);
    return childLogger;
  }

  /**
   * Measure execution time of a function
   *
   * @param fn - Function to measure
   * @param label - Label for the timing log
   * @returns Function result
   *
   * @example
   * ```typescript
   * const result = await logger.time(async () => {
   *   return await expensiveOperation();
   * }, 'expensiveOperation');
   * ```
   */
  async time<T>(fn: () => Promise<T> | T, label?: string): Promise<T> {
    const start = performance.now();
    const operationLabel = label || 'operation';

    try {
      this.debug(`Starting ${operationLabel}`);
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`Completed ${operationLabel}`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Failed ${operationLabel}`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }
}

// Create default logger instance
export const logger = Logger.getInstance();

// Create context-specific loggers
export const authLogger = Logger.createContext('AuthService');
export const apiLogger = Logger.createContext('APIService');
export const storageLogger = Logger.createContext('StorageService');

/**
 * Convenience functions for quick logging
 */
export const log = {
  trace: (message: string, data?: any) => logger.trace(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => logger.error(message, data),
  fatal: (message: string, data?: any) => logger.fatal(message, data),
  time: <T>(fn: () => Promise<T> | T, label?: string) => logger.time(fn, label)
};

// Named exports
export { Logger as default };

/**
 * Example usage:
 *
 * ```typescript
 * import { logger, log, Logger, authLogger, LogLevel } from '@/utils/logger';
 *
 * // Basic usage
 * logger.info('Application started');
 * logger.error('Something went wrong', { error: errorMessage });
 *
 * // Using convenience functions
 * log.debug('Debug information', { data });
 *
 * // Using context-specific logger
 * authLogger.info('User logged in', { userId: '123' });
 *
 * // Creating custom logger
 * const customLogger = Logger.createContext('MyComponent', {
 *   level: LogLevel.DEBUG,
 *   enableStorage: true
 * });
 *
 * // Timing functions
 * const result = await logger.time(async () => {
 *   return await processData();
 * }, 'dataProcessing');
 *
 * // Getting logs for debugging
 * const errorLogs = logger.getLogs(LogLevel.ERROR);
 * const exportedLogs = logger.exportLogs();
 * ```
 */