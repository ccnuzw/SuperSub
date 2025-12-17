/**
 * Storage Utility - Unified localStorage/sessionStorage management with error handling
 * Provides a consistent API for browser storage operations with serialization and error recovery
 */

/**
 * Storage types
 */
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage'
}

/**
 * Storage item interface
 */
export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expires?: number;
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Storage options
 */
export interface StorageOptions {
  serialize?: boolean;
  encrypt?: boolean;
  compress?: boolean;
  expires?: number; // TTL in milliseconds
  version?: string;
  metadata?: Record<string, any>;
  fallback?: any;
}

/**
 * Storage event data
 */
export interface StorageEventData<T = any> {
  key: string;
  value: T;
  oldValue?: T;
  action: 'set' | 'remove' | 'clear';
  type: StorageType;
  source: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  prefix?: string;
  defaultExpires?: number;
  enableEvents?: boolean;
  enableEncryption?: boolean;
  enableCompression?: boolean;
  errorHandler?: (error: Error, operation: string, key: string) => void;
}

/**
 * Storage utility class
 */
export class StorageUtils {
  private config: StorageConfig;
  private static instance: StorageUtils;
  private eventListeners: Map<string, Array<(data: StorageEventData) => void>> = new Map();
  private encryptionKey?: string;

  constructor(config: StorageConfig = {}) {
    this.config = {
      prefix: 'app_',
      defaultExpires: 24 * 60 * 60 * 1000, // 24 hours
      enableEvents: true,
      enableEncryption: false,
      enableCompression: false,
      errorHandler: this.defaultErrorHandler,
      ...config
    };

    // Setup storage event listeners for cross-tab communication
    if (typeof window !== 'undefined') {
      this.setupStorageEvents();
    }
  }

  /**
   * Get singleton instance
   *
   * @param config - Optional configuration
   * @returns StorageUtils instance
   *
   * @example
   * ```typescript
   * const storage = StorageUtils.getInstance();
   * storage.set('user', userData);
   *
   * const customStorage = StorageUtils.getInstance({
   *   prefix: 'myapp_',
   *   defaultExpires: 7 * 24 * 60 * 60 * 1000 // 7 days
   * });
   * ```
   */
  static getInstance(config?: StorageConfig): StorageUtils {
    if (!StorageUtils.instance) {
      StorageUtils.instance = new StorageUtils(config);
    }
    return StorageUtils.instance;
  }

  /**
   * Set encryption key for encrypted storage
   *
   * @param key - Encryption key
   */
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  /**
   * Store data in localStorage
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   * @returns Promise<boolean> Success status
   *
   * @example
   * ```typescript
   * await storage.set('user', userData, {
   *   expires: 7 * 24 * 60 * 60 * 1000, // 7 days
   *   version: '1.0',
   *   metadata: { source: 'registration' }
   * });
   * ```
   */
  async set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<boolean> {
    return this.setItem(StorageType.LOCAL, key, value, options);
  }

  /**
   * Store data in sessionStorage
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   * @returns Promise<boolean> Success status
   */
  async setSession<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<boolean> {
    return this.setItem(StorageType.SESSION, key, value, options);
  }

  /**
   * Get data from localStorage
   *
   * @param key - Storage key
   * @param options - Storage options
   * @returns Promise<T | null> Stored value or null
   *
   * @example
   * ```typescript
   * const user = await storage.get('user');
   * if (user) {
   *   console.log('User data:', user);
   * }
   * ```
   */
  async get<T>(
    key: string,
    options: StorageOptions = {}
  ): Promise<T | null> {
    return this.getItem<T>(StorageType.LOCAL, key, options);
  }

  /**
   * Get data from sessionStorage
   *
   * @param key - Storage key
   * @param options - Storage options
   * @returns Promise<T | null> Stored value or null
   */
  async getSession<T>(
    key: string,
    options: StorageOptions = {}
  ): Promise<T | null> {
    return this.getItem<T>(StorageType.SESSION, key, options);
  }

  /**
   * Remove data from localStorage
   *
   * @param key - Storage key
   * @returns Promise<boolean> Success status
   */
  async remove(key: string): Promise<boolean> {
    return this.removeItem(StorageType.LOCAL, key);
  }

  /**
   * Remove data from sessionStorage
   *
   * @param key - Storage key
   * @returns Promise<boolean> Success status
   */
  async removeSession(key: string): Promise<boolean> {
    return this.removeItem(StorageType.SESSION, key);
  }

  /**
   * Clear all localStorage data
   *
   * @param pattern - Optional key pattern to match
   * @returns Promise<boolean> Success status
   */
  async clear(pattern?: string): Promise<boolean> {
    return this.clearStorage(StorageType.LOCAL, pattern);
  }

  /**
   * Clear all sessionStorage data
   *
   * @param pattern - Optional key pattern to match
   * @returns Promise<boolean> Success status
   */
  async clearSession(pattern?: string): Promise<boolean> {
    return this.clearStorage(StorageType.SESSION, pattern);
  }

  /**
   * Get all keys from localStorage
   *
   * @param pattern - Optional key pattern to match
   * @returns Array of keys
   */
  getKeys(pattern?: string): string[] {
    return this.getStorageKeys(StorageType.LOCAL, pattern);
  }

  /**
   * Get all keys from sessionStorage
   *
   * @param pattern - Optional key pattern to match
   * @returns Array of keys
   */
  getSessionKeys(pattern?: string): string[] {
    return this.getStorageKeys(StorageType.SESSION, pattern);
  }

  /**
   * Check if key exists in localStorage
   *
   * @param key - Storage key
   * @returns Boolean indicating existence
   */
  has(key: string): boolean {
    return this.hasKey(StorageType.LOCAL, key);
  }

  /**
   * Check if key exists in sessionStorage
   *
   * @param key - Storage key
   * @returns Boolean indicating existence
   */
  hasSession(key: string): boolean {
    return this.hasKey(StorageType.SESSION, key);
  }

  /**
   * Get storage size in bytes
   *
   * @param type - Storage type
   * @returns Size in bytes
   */
  getStorageSize(type: StorageType = StorageType.LOCAL): number {
    try {
      const storage = this.getStorage(type);
      let totalSize = 0;

      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          totalSize += (storage[key].length + key.length) * 2; // UTF-16 characters
        }
      }

      return totalSize;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'getStorageSize', type);
      return 0;
    }
  }

  /**
   * Get available storage space
   *
   * @param type - Storage type
   * @returns Available space in bytes (approximate)
   */
  getAvailableSpace(type: StorageType = StorageType.LOCAL): number {
    try {
      const storage = this.getStorage(type);
      const testKey = `__storage_test_${Date.now()}`;
      let testData = '';
      let size = 0;

      // Try to determine available space by gradually increasing test data
      for (let i = 0; i < 1000; i++) {
        try {
          testData += 'x';
          storage.setItem(testKey, testData);
          size = testData.length * 2; // UTF-16
        } catch (e) {
          break;
        }
      }

      storage.removeItem(testKey);
      return size;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'getAvailableSpace', type);
      return 0;
    }
  }

  /**
   * Add event listener for storage changes
   *
   * @param key - Storage key (or '*' for all keys)
   * @param listener - Event listener function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = storage.addEventListener('user', (event) => {
   *   console.log('User data changed:', event.value);
   * });
   *
   * // Later remove the listener
   * unsubscribe();
   * ```
   */
  addEventListener(
    key: string,
    listener: (data: StorageEventData) => void
  ): () => void {
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }

    const listeners = this.eventListeners.get(key)!;
    listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove event listener
   *
   * @param key - Storage key
   * @param listener - Event listener function
   */
  removeEventListener(
    key: string,
    listener: (data: StorageEventData) => void
  ): void {
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Migrate storage data to new version
   *
   * @param migrationKey - Migration identifier
   * @param migrator - Migration function
   * @returns Promise<boolean> Migration success
   *
   * @example
   * ```typescript
   * await storage.migrate('v1_to_v2', (key, value) => {
   *   if (key === 'user') {
   *     return { ...value, version: '2.0' };
   *   }
   *   return value;
   * });
   * ```
   */
  async migrate(
    migrationKey: string,
    migrator: (key: string, value: any) => any
  ): Promise<boolean> {
    const migrationStatusKey = `${this.config.prefix}migration_${migrationKey}`;

    try {
      // Check if migration already ran
      if (this.has(migrationStatusKey)) {
        return true;
      }

      const keys = this.getKeys();
      let migrated = false;

      for (const key of keys) {
        const value = await this.get(key);
        if (value !== null) {
          const migratedValue = migrator(key, value);
          if (migratedValue !== value) {
            await this.set(key, migratedValue);
            migrated = true;
          }
        }
      }

      // Mark migration as complete
      await this.set(migrationStatusKey, new Date().toISOString());
      return migrated;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'migrate', migrationKey);
      return false;
    }
  }

  /**
   * Cleanup expired items
   *
   * @param type - Storage type
   * @returns Number of items cleaned up
   */
  async cleanupExpired(type: StorageType = StorageType.LOCAL): Promise<number> {
    const keys = this.getStorageKeys(type);
    let cleaned = 0;

    for (const key of keys) {
      try {
        const item = await this.getItem(type, key);
        if (item && (item as any).expires && Date.now() > (item as any).expires) {
          await this.removeItem(type, key);
          cleaned++;
        }
      } catch (error) {
        this.config.errorHandler?.(error as Error, 'cleanupExpired', key);
      }
    }

    return cleaned;
  }

  /**
   * Export storage data
   *
   * @param type - Storage type
   * @param pattern - Optional key pattern
   * @returns Object with exported data
   */
  async export(type: StorageType = StorageType.LOCAL, pattern?: string): Promise<Record<string, any>> {
    const keys = this.getStorageKeys(type, pattern);
    const data: Record<string, any> = {};

    for (const key of keys) {
      try {
        const item = await this.getItem(type, key);
        if (item) {
          data[key] = item;
        }
      } catch (error) {
        this.config.errorHandler?.(error as Error, 'export', key);
      }
    }

    return data;
  }

  /**
   * Import storage data
   *
   * @param data - Data to import
   * @param type - Storage type
   * @param overwrite - Whether to overwrite existing keys
   * @returns Promise<boolean> Import success
   */
  async import(
    data: Record<string, any>,
    type: StorageType = StorageType.LOCAL,
    overwrite: boolean = false
  ): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(data)) {
        if (!overwrite && this.hasKey(type, key)) {
          continue;
        }

        if (value && typeof value === 'object' && 'value' in value) {
          // Handle StorageItem format
          await this.setItem(type, key, value.value, {
            expires: value.expires ? value.expires - Date.now() : undefined,
            version: value.version,
            metadata: value.metadata
          });
        } else {
          // Direct value
          await this.setItem(type, key, value);
        }
      }

      return true;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'import', type);
      return false;
    }
  }

  /**
   * Set item in storage
   */
  private async setItem<T>(
    type: StorageType,
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<boolean> {
    try {
      const storage = this.getStorage(type);
      const fullKey = this.getFullKey(key);

      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expires: options.expires ? Date.now() + options.expires : undefined,
        version: options.version,
        metadata: options.metadata
      };

      let serialized = JSON.stringify(item);

      // Apply encryption if enabled
      if (options.encrypt || this.config.enableEncryption) {
        serialized = await this.encrypt(serialized);
      }

      // Apply compression if enabled
      if (options.compress || this.config.enableCompression) {
        serialized = await this.compress(serialized);
      }

      storage.setItem(fullKey, serialized);

      // Emit events
      if (this.config.enableEvents) {
        this.emitEvent({
          key,
          value,
          oldValue: await this.getItem(type, key),
          action: 'set',
          type,
          source: this.getSourceId()
        });
      }

      return true;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'setItem', key);
      return false;
    }
  }

  /**
   * Get item from storage
   */
  private async getItem<T>(
    type: StorageType,
    key: string,
    options: StorageOptions = {}
  ): Promise<T | null> {
    try {
      const storage = this.getStorage(type);
      const fullKey = this.getFullKey(key);

      let serialized = storage.getItem(fullKey);
      if (!serialized) {
        return options.fallback || null;
      }

      // Apply decompression if needed
      if (options.compress || this.config.enableCompression) {
        serialized = await this.decompress(serialized);
      }

      // Apply decryption if needed
      if (options.encrypt || this.config.enableEncryption) {
        serialized = await this.decrypt(serialized);
      }

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        storage.removeItem(fullKey);
        return options.fallback || null;
      }

      return item.value;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'getItem', key);
      return options.fallback || null;
    }
  }

  /**
   * Remove item from storage
   */
  private async removeItem(type: StorageType, key: string): Promise<boolean> {
    try {
      const storage = this.getStorage(type);
      const fullKey = this.getFullKey(key);

      const oldValue = await this.getItem(type, key);
      storage.removeItem(fullKey);

      // Emit events
      if (this.config.enableEvents) {
        this.emitEvent({
          key,
          value: null,
          oldValue,
          action: 'remove',
          type,
          source: this.getSourceId()
        });
      }

      return true;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'removeItem', key);
      return false;
    }
  }

  /**
   * Clear storage
   */
  private async clearStorage(type: StorageType, pattern?: string): Promise<boolean> {
    try {
      const keys = this.getStorageKeys(type, pattern);
      const storage = this.getStorage(type);

      for (const fullKey of keys) {
        storage.removeItem(fullKey);
      }

      // Emit events
      if (this.config.enableEvents) {
        this.emitEvent({
          key: pattern || '*',
          value: null,
          action: 'clear',
          type,
          source: this.getSourceId()
        });
      }

      return true;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'clearStorage', type);
      return false;
    }
  }

  /**
   * Get storage keys
   */
  private getStorageKeys(type: StorageType, pattern?: string): string[] {
    try {
      const storage = this.getStorage(type);
      const keys: string[] = [];

      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          // Filter by prefix
          if (!this.config.prefix || key.startsWith(this.config.prefix)) {
            // Filter by pattern if provided
            if (!pattern || key.includes(pattern)) {
              keys.push(key);
            }
          }
        }
      }

      return keys;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'getStorageKeys', type);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  private hasKey(type: StorageType, key: string): boolean {
    try {
      const storage = this.getStorage(type);
      const fullKey = this.getFullKey(key);
      return storage.getItem(fullKey) !== null;
    } catch (error) {
      this.config.errorHandler?.(error as Error, 'hasKey', key);
      return false;
    }
  }

  /**
   * Get storage instance
   */
  private getStorage(type: StorageType): Storage {
    if (typeof window === 'undefined') {
      throw new Error('Storage is not available in this environment');
    }

    switch (type) {
      case StorageType.LOCAL:
        return window.localStorage;
      case StorageType.SESSION:
        return window.sessionStorage;
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return this.config.prefix ? `${this.config.prefix}${key}` : key;
  }

  /**
   * Emit storage event
   */
  private emitEvent(data: StorageEventData): void {
    // Notify specific key listeners
    const keyListeners = this.eventListeners.get(data.key);
    if (keyListeners) {
      keyListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Storage event listener error:', error);
        }
      });
    }

    // Notify wildcard listeners
    const wildcardListeners = this.eventListeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Storage event listener error:', error);
        }
      });
    }
  }

  /**
   * Setup cross-tab storage events
   */
  private setupStorageEvents(): void {
    window.addEventListener('storage', (event) => {
      if (!event.key || !this.config.prefix || !event.key.startsWith(this.config.prefix)) {
        return;
      }

      const key = event.key.substring(this.config.prefix.length);
      const action = event.newValue === null ? 'remove' : 'set';

      this.emitEvent({
        key,
        value: event.newValue ? JSON.parse(event.newValue) : null,
        oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
        action,
        type: StorageType.LOCAL,
        source: 'cross-tab'
      });
    });
  }

  /**
   * Get source identifier
   */
  private getSourceId(): string {
    return typeof window !== 'undefined' ? window.location.origin : 'unknown';
  }

  /**
   * Default error handler
   */
  private defaultErrorHandler(error: Error, operation: string, key: string): void {
    console.warn(`Storage ${operation} failed for key "${key}":`, error);
  }

  /**
   * Simple encryption (for demo purposes - use proper encryption in production)
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) return data;
    // In production, use proper encryption libraries
    return btoa(data); // Base64 encoding (not encryption!)
  }

  /**
   * Simple decryption
   */
  private async decrypt(data: string): Promise<string> {
    if (!this.encryptionKey) return data;
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  /**
   * Simple compression
   */
  private async compress(data: string): Promise<string> {
    // In production, use proper compression libraries
    return data;
  }

  /**
   * Simple decompression
   */
  private async decompress(data: string): Promise<string> {
    return data;
  }
}

// Create default instance
export const storage = StorageUtils.getInstance();

// Export convenience methods
export const store = {
  set: storage.set.bind(storage),
  get: storage.get.bind(storage),
  remove: storage.remove.bind(storage),
  clear: storage.clear.bind(storage),
  has: storage.has.bind(storage),
  keys: storage.getKeys.bind(storage),

  // Session storage methods
  setSession: storage.setSession.bind(storage),
  getSession: storage.getSession.bind(storage),
  removeSession: storage.removeSession.bind(storage),
  clearSession: storage.clearSession.bind(storage),
  hasSession: storage.hasSession.bind(storage),
  sessionKeys: storage.getSessionKeys.bind(storage),

  // Utility methods
  size: storage.getStorageSize.bind(storage),
  cleanup: storage.cleanupExpired.bind(storage),
  export: storage.export.bind(storage),
  import: storage.import.bind(storage),
  migrate: storage.migrate.bind(storage),

  // Events
  on: storage.addEventListener.bind(storage),
  off: storage.removeEventListener.bind(storage)
};

// Export default
export default StorageUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { StorageUtils, storage, store, StorageType } from '@/utils/storage';
 *
 * // Basic usage
 * await store.set('user', { name: 'John', age: 30 });
 * const user = await store.get('user');
 *
 * // With options
 * await store.set('session', token, {
 *   expires: 60 * 60 * 1000, // 1 hour
 *   version: '1.0',
 *   metadata: { source: 'login' }
 * });
 *
 * // Session storage
 * await store.setSession('tempData', tempValue);
 *
 * // Listen for changes
 * const unsubscribe = store.on('user', (event) => {
 *   console.log('User data changed:', event.value);
 * });
 *
 * // Cleanup expired items
 * const cleaned = await store.cleanup();
 *
 * // Export/Import data
 * const data = await store.export();
 * await store.import(data);
 * ```
 */