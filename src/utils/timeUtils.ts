/**
 * Time Utility - Time-related functions, debouncing, throttling, and performance utilities
 * Provides comprehensive time manipulation and performance optimization utilities
 */

/**
 * Debounce options
 */
export interface DebounceOptions {
  immediate?: boolean;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Delay options
 */
export interface DelayOptions {
  signal?: AbortSignal;
}

/**
 * Retry options
 */
export interface RetryOptions {
  times?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential' | 'fixed';
  maxDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Rate limiter options
 */
export interface RateLimiterOptions {
  interval: number;
  maxInInterval?: number;
  delayFirst?: boolean;
}

/**
 * Cache options
 */
export interface CacheOptions<K, V> {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: K, value: V) => void;
}

/**
 * Time utility class
 */
export class TimeUtils {
  /**
   * Debounce function calls
   *
   * @param func - Function to debounce
   * @param wait - Wait time in milliseconds
   * @param options - Debounce options
   * @returns Debounced function
   *
   * @example
   * ```typescript
   * const debouncedSearch = TimeUtils.debounce(
   *   (query: string) => console.log('Searching:', query),
   *   300
   * );
   * debouncedSearch('hello'); // Will only execute after 300ms of no calls
   * ```
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: DebounceOptions = {}
  ): (...args: Parameters<T>) => void {
    const { immediate = false, maxWait, leading = false, trailing = true } = options;

    let timeoutId: NodeJS.Timeout | undefined;
    let maxTimeoutId: NodeJS.Timeout | undefined;
    let lastCallTime: number | undefined;
    let lastInvokeTime: number = 0;
    let lastArgs: Parameters<T> | undefined;

    const invokeFunc = (time: number) => {
      const args = lastArgs!;
      lastArgs = undefined;
      lastInvokeTime = time;
      return func.apply(undefined, args);
    };

    const startTimer = (pendingFunc: () => void, wait: number) => {
      return setTimeout(pendingFunc, wait);
    };

    const cancelTimer = (timerId: NodeJS.Timeout) => {
      clearTimeout(timerId);
    };

    const remainingWait = (time: number) => {
      const timeSinceLastCall = lastCallTime !== undefined ? time - lastCallTime : 0;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;

      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    };

    const shouldInvoke = (time: number) => {
      const timeSinceLastCall = lastCallTime !== undefined ? time - lastCallTime : 0;
      const timeSinceLastInvoke = time - lastInvokeTime;

      return (lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0) ||
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait);
    };

    const trailingEdge = (time: number) => {
      timeoutId = undefined;

      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = undefined;
      return undefined;
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      if (timeoutId) {
        const remaining = remainingWait(time);
        timeoutId = startTimer(timerExpired, remaining);
      }
    };

    const debounced = (...args: Parameters<T>) => {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastCallTime = time;

      if (isInvoking) {
        if (timeoutId === undefined) {
          if (leading) {
            lastInvokeTime = time;
            timeoutId = startTimer(timerExpired, wait);
            return func.apply(undefined, args);
          }
          if (maxWait !== undefined) {
            timeoutId = startTimer(timerExpired, wait);
            maxTimeoutId = startTimer(() => {
              if (lastArgs) {
                invokeFunc(Date.now());
              }
            }, maxWait);
          }
        }
      }

      if (timeoutId === undefined) {
        timeoutId = startTimer(timerExpired, wait);
      }

      return undefined;
    };

    debounced.cancel = () => {
      if (timeoutId !== undefined) {
        cancelTimer(timeoutId);
      }
      if (maxTimeoutId !== undefined) {
        cancelTimer(maxTimeoutId);
      }
      lastInvokeTime = 0;
      lastArgs = undefined;
      lastCallTime = undefined;
      timeoutId = undefined;
      maxTimeoutId = undefined;
    };

    debounced.flush = () => {
      return timeoutId === undefined ? undefined : trailingEdge(Date.now());
    };

    return debounced;
  }

  /**
   * Throttle function calls
   *
   * @param func - Function to throttle
   * @param wait - Wait time in milliseconds
   * @param options - Throttle options
   * @returns Throttled function
   *
   * @example
   * ```typescript
   * const throttledScroll = TimeUtils.throttle(
   *   () => console.log('Scrolling'),
   *   100
   * );
   * window.addEventListener('scroll', throttledScroll);
   * ```
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: ThrottleOptions = {}
  ): (...args: Parameters<T>) => void {
    const { leading = true, trailing = true } = options;

    return this.debounce(func, wait, {
      leading,
      trailing,
      maxWait: wait
    });
  }

  /**
   * Delay execution with Promise
   *
   * @param ms - Delay in milliseconds
   * @param options - Delay options
   * @returns Promise that resolves after delay
   *
   * @example
   * ```typescript
   * await TimeUtils.delay(1000); // Wait 1 second
   * await TimeUtils.delay(1000, { signal: abortController.signal }); // Cancellable delay
   * ```
   */
  static delay(ms: number, options: DelayOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (options.signal?.aborted) {
        reject(new DOMException('Delay aborted', 'AbortError'));
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve();
      }, ms);

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Delay aborted', 'AbortError'));
        }, { once: true });
      }
    });
  }

  /**
   * Retry function with exponential backoff
   *
   * @param func - Function to retry
   * @param options - Retry options
   * @returns Promise with result
   *
   * @example
   * ```typescript
   * await TimeUtils.retry(
   *   () => fetch('/api/data'),
   *   { times: 3, delay: 1000, backoff: 'exponential' }
   * );
   * ```
   */
  static async retry<T>(
    func: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      times = 3,
      delay: initialDelay = 1000,
      backoff = 'exponential',
      maxDelay = 30000,
      shouldRetry = () => true
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= times; attempt++) {
      try {
        return await func();
      } catch (error) {
        lastError = error;

        if (attempt === times || !shouldRetry(error, attempt)) {
          throw error;
        }

        const nextDelay = backoff === 'exponential'
          ? Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
          : backoff === 'linear'
          ? Math.min(initialDelay * attempt, maxDelay)
          : initialDelay;

        await this.delay(nextDelay);
      }
    }

    throw lastError;
  }

  /**
   * Create rate limiter
   *
   * @param options - Rate limiter options
   * @returns Rate limiter object with throttle method
   *
   * @example
   * ```typescript
   * const limiter = TimeUtils.createRateLimiter({
   *   interval: 60000, // 1 minute
   *   maxInInterval: 100 // Max 100 requests per minute
   * });
   *
   * await limiter.throttle(); // Will wait if rate limit exceeded
   * ```
   */
  static createRateLimiter(options: RateLimiterOptions) {
    const { interval, maxInInterval = 1, delayFirst = false } = options;
    const queue: Array<{ resolve: () => void; reject: (error: any) => void }> = [];
    let currentCount = 0;
    let intervalStart = Date.now();

    const processQueue = () => {
      const now = Date.now();
      if (now - intervalStart >= interval) {
        currentCount = 0;
        intervalStart = now;
      }

      if (currentCount < maxInInterval && queue.length > 0) {
        currentCount++;
        const { resolve } = queue.shift()!;
        resolve();

        // Process next item immediately if still under limit
        if (currentCount < maxInInterval) {
          setImmediate(processQueue);
        }
      }
    };

    const resetInterval = () => {
      if (currentCount < maxInInterval) return;

      const timeUntilReset = interval - (Date.now() - intervalStart);
      if (timeUntilReset > 0) {
        setTimeout(() => {
          currentCount = 0;
          intervalStart = Date.now();
          processQueue();
        }, timeUntilReset);
      } else {
        currentCount = 0;
        intervalStart = Date.now();
        processQueue();
      }
    };

    return {
      throttle: () => {
        return new Promise<void>((resolve, reject) => {
          queue.push({ resolve, reject });

          if (!delayFirst || currentCount > 0) {
            processQueue();
            resetInterval();
          } else {
            currentCount++;
            resolve();
          }
        });
      },
      getStatus: () => ({
        currentCount,
        maxInInterval,
        queueLength: queue.length,
        timeUntilReset: Math.max(0, interval - (Date.now() - intervalStart))
      })
    };
  }

  /**
   * Create simple LRU cache
   *
   * @param options - Cache options
   * @returns Cache object with get, set, has, delete methods
   *
   * @example
   * ```typescript
   * const cache = TimeUtils.createCache({ maxSize: 100, ttl: 60000 });
   * cache.set('key', 'value');
   * const value = cache.get('key');
   * ```
   */
  static createCache<K = any, V = any>(options: CacheOptions<K, V> = {}) {
    const { maxSize = 100, ttl, onEvict } = options;
    const cache = new Map<K, { value: V; timestamp: number }>();

    const evictOldest = () => {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        const oldestEntry = cache.get(oldestKey)!;
        cache.delete(oldestKey);
        onEvict?.(oldestKey, oldestEntry.value);
      }
    };

    const cleanExpired = () => {
      if (!ttl) return;

      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > ttl) {
          cache.delete(key);
          onEvict?.(key, entry.value);
        }
      }
    };

    return {
      get: (key: K): V | undefined => {
        const entry = cache.get(key);
        if (!entry) return undefined;

        if (ttl && Date.now() - entry.timestamp > ttl) {
          cache.delete(key);
          onEvict?.(key, entry.value);
          return undefined;
        }

        return entry.value;
      },
      set: (key: K, value: V): void => {
        cleanExpired();

        if (cache.has(key)) {
          cache.set(key, { value, timestamp: Date.now() });
        } else {
          evictOldest();
          cache.set(key, { value, timestamp: Date.now() });
        }
      },
      has: (key: K): boolean => {
        const entry = cache.get(key);
        if (!entry) return false;

        if (ttl && Date.now() - entry.timestamp > ttl) {
          cache.delete(key);
          onEvict?.(key, entry.value);
          return false;
        }

        return true;
      },
      delete: (key: K): boolean => {
        const entry = cache.get(key);
        if (entry) {
          cache.delete(key);
          onEvict?.(key, entry.value);
          return true;
        }
        return false;
      },
      clear: (): void => {
        for (const [key, entry] of cache.entries()) {
          onEvict?.(key, entry.value);
        }
        cache.clear();
      },
      size: (): number => cache.size,
      keys: (): K[] => Array.from(cache.keys()),
      values: (): V[] => Array.from(cache.values(), entry => entry.value),
      entries: (): Array<[K, V]> => Array.from(cache.entries(), ([key, entry]) => [key, entry.value])
    };
  }

  /**
   * Measure execution time of a function
   *
   * @param func - Function to measure
   * @returns Object with result and execution time
   *
   * @example
   * ```typescript
   * const { result, duration } = await TimeUtils.measureTime(async () => {
   *   return await expensiveOperation();
   * });
   * console.log(`Operation took ${duration}ms`);
   * ```
   */
  static async measureTime<T>(func: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await func();
    const endTime = performance.now();
    const duration = endTime - startTime;

    return { result, duration };
  }

  /**
   * Create a time measurement utility
   *
   * @returns Time measurement object
   *
   * @example
   * ```typescript
   * const timer = TimeUtils.createTimer();
   * // ... do some work
   * timer.lap('First operation');
   * // ... do more work
   * timer.lap('Second operation');
   * const totalTime = timer.getTotal();
   * ```
   */
  static createTimer() {
    const startTime = performance.now();
    const laps: Array<{ label: string; time: number }> = [];

    return {
      lap: (label: string) => {
        const currentTime = performance.now();
        laps.push({ label, time: currentTime - startTime });
        return currentTime - startTime;
      },
      getTotal: () => performance.now() - startTime,
      getLaps: () => [...laps],
      getAverageLapTime: () => {
        if (laps.length === 0) return 0;
        const totalTime = laps[laps.length - 1].time;
        return totalTime / laps.length;
      },
      reset: () => {
        laps.length = 0;
      }
    };
  }

  /**
   * Format duration in human-readable format
   *
   * @param milliseconds - Duration in milliseconds
   * @param options - Formatting options
   * @returns Formatted duration string
   *
   * @example
   * ```typescript
   * TimeUtils.formatDuration(90000); // '1m 30s'
   * TimeUtils.formatDuration(90000, { style: 'long' }); // '1 minute, 30 seconds'
   * ```
   */
  static formatDuration(
    milliseconds: number,
    options: {
      style?: 'short' | 'long' | 'full';
      maxUnits?: number;
      showMs?: boolean;
    } = {}
  ): string {
    const { style = 'short', maxUnits = 2, showMs = false } = options;

    if (milliseconds < 0) return '0s';

    const units = [
      { label: 'day', short: 'd', ms: 24 * 60 * 60 * 1000 },
      { label: 'hour', short: 'h', ms: 60 * 60 * 1000 },
      { label: 'minute', short: 'm', ms: 60 * 1000 },
      { label: 'second', short: 's', ms: 1000 }
    ];

    if (showMs) {
      units.push({ label: 'millisecond', short: 'ms', ms: 1 });
    }

    const parts: string[] = [];
    let remaining = milliseconds;

    for (const unit of units) {
      if (remaining >= unit.ms) {
        const value = Math.floor(remaining / unit.ms);
        remaining = remaining % unit.ms;

        if (style === 'long') {
          parts.push(`${value} ${unit.label}${value !== 1 ? 's' : ''}`);
        } else {
          parts.push(`${value}${unit.short}`);
        }

        if (parts.length >= maxUnits) break;
      }
    }

    if (parts.length === 0) {
      return showMs ? '0ms' : '0s';
    }

    if (style === 'full') {
      return parts.join(', ');
    }

    return parts.join(' ');
  }

  /**
   * Parse duration string to milliseconds
   *
   * @param durationString - Duration string (e.g., '1h 30m', '1d 12h', '30s')
   * @returns Duration in milliseconds
   *
   * @example
   * ```typescript
   * TimeUtils.parseDuration('1h 30m'); // 5400000
   * TimeUtils.parseDuration('1.5 days'); // 129600000
   * ```
   */
  static parseDuration(durationString: string): number {
    if (!durationString || typeof durationString !== 'string') {
      return 0;
    }

    const units: Record<string, number> = {
      ms: 1,
      millisecond: 1,
      milliseconds: 1,
      s: 1000,
      sec: 1000,
      second: 1000,
      seconds: 1000,
      m: 60 * 1000,
      min: 60 * 1000,
      minute: 60 * 1000,
      minutes: 60 * 1000,
      h: 60 * 60 * 1000,
      hour: 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      mo: 30 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000,
      y: 365 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      years: 365 * 24 * 60 * 60 * 1000
    };

    // Handle decimal numbers like "1.5 days"
    const decimalPattern = /(\d+\.?\d*)\s*([a-zA-Z]+)/g;
    const simplePattern = /(\d+)\s*([a-zA-Z]+)/g;
    let total = 0;
    let match;

    // Try decimal pattern first
    const decimalRegex = new RegExp(decimalPattern);
    if (decimalRegex.test(durationString)) {
      decimalPattern.lastIndex = 0;
      while ((match = decimalPattern.exec(durationString)) !== null) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const multiplier = units[unit];
        if (multiplier !== undefined) {
          total += value * multiplier;
        }
      }
    } else {
      // Fall back to simple pattern
      while ((match = simplePattern.exec(durationString)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const multiplier = units[unit];
        if (multiplier !== undefined) {
          total += value * multiplier;
        }
      }
    }

    return Math.round(total);
  }

  /**
   * Create a timeout promise that rejects after specified time
   *
   * @param ms - Timeout in milliseconds
   * @param message - Optional rejection message
   * @returns Promise that rejects after timeout
   *
   * @example
   * ```typescript
   * try {
   *   await Promise.race([
   *     fetchData(),
   *     TimeUtils.timeout(5000, 'Request timed out')
   *   ]);
   * } catch (error) {
   *   console.error(error.message);
   * }
   * ```
   */
  static timeout(ms: number, message: string = 'Operation timed out'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Create an interval utility
   *
   * @param callback - Callback function
   * @param interval - Interval in milliseconds
   * @param options - Interval options
   * @returns Interval control object
   *
   * @example
   * ```typescript
   * const interval = TimeUtils.createInterval(
   *   () => console.log('Tick'),
   *   1000,
   *   { immediate: true }
   * );
   *
   * // Later
   * interval.pause();
   * interval.resume();
   * interval.stop();
   * ```
   */
  static createInterval(
    callback: () => void,
    interval: number,
    options: { immediate?: boolean; maxTimes?: number } = {}
  ) {
    const { immediate = false, maxTimes } = options;
    let timeoutId: NodeJS.Timeout | undefined;
    let count = 0;
    let isPaused = false;
    let isStopped = false;

    const schedule = () => {
      if (isStopped || isPaused) return;

      if (maxTimes && count >= maxTimes) {
        return;
      }

      timeoutId = setTimeout(() => {
        if (!isPaused && !isStopped) {
          callback();
          count++;
          schedule();
        }
      }, interval);
    };

    if (immediate) {
      callback();
      count++;
    }

    schedule();

    return {
      pause: () => {
        isPaused = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      },
      resume: () => {
        if (!isPaused || isStopped) return;
        isPaused = false;
        schedule();
      },
      stop: () => {
        isStopped = true;
        isPaused = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      },
      getCount: () => count,
      isPaused: () => isPaused,
      isStopped: () => isStopped
    };
  }

  /**
   * Get current timestamp in seconds
   *
   * @returns Current timestamp in seconds
   *
   * @example
   * ```typescript
   * const now = TimeUtils.timestamp(); // e.g., 1702857600
   * ```
   */
  static timestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Get current high-resolution timestamp
   *
   * @returns High-resolution timestamp in milliseconds
   *
   * @example
   * ```typescript
   * const start = TimeUtils.now();
   * const duration = TimeUtils.now() - start;
   * ```
   */
  static now(): number {
    return performance.now();
  }

  /**
   * Check if a date is in the past
   *
   * @param date - Date to check
   * @param referenceDate - Reference date (default: now)
   * @returns True if date is in the past
   *
   * @example
   * ```typescript
   * TimeUtils.isPast(new Date('2023-01-01')); // true (assuming current date is later)
   * ```
   */
  static isPast(date: Date, referenceDate: Date = new Date()): boolean {
    return date < referenceDate;
  }

  /**
   * Check if a date is in the future
   *
   * @param date - Date to check
   * @param referenceDate - Reference date (default: now)
   * @returns True if date is in the future
   *
   * @example
   * ```typescript
   * TimeUtils.isFuture(new Date('2030-01-01')); // true
   * ```
   */
  static isFuture(date: Date, referenceDate: Date = new Date()): boolean {
    return date > referenceDate;
  }

  /**
   * Get time ago string
   *
   * @param date - Date to compare
   * @param referenceDate - Reference date (default: now)
   * @returns Time ago string
   *
   * @example
   * ```typescript
   * const ago = TimeUtils.timeAgo(new Date(Date.now() - 3600000)); // '1 hour ago'
   * ```
   */
  static timeAgo(date: Date, referenceDate: Date = new Date()): string {
    const diff = referenceDate.getTime() - date.getTime();
    const absDiff = Math.abs(diff);

    if (absDiff < 1000) {
      return 'just now';
    }

    const units = [
      { label: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
      { label: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
      { label: 'day', ms: 24 * 60 * 60 * 1000 },
      { label: 'hour', ms: 60 * 60 * 1000 },
      { label: 'minute', ms: 60 * 1000 },
      { label: 'second', ms: 1000 }
    ];

    for (const unit of units) {
      if (absDiff >= unit.ms) {
        const value = Math.floor(absDiff / unit.ms);
        const suffix = diff < 0 ? 'from now' : 'ago';
        return `${value} ${unit.label}${value !== 1 ? 's' : ''} ${suffix}`;
      }
    }

    return 'just now';
  }

  /**
   * Sleep for specified time (alias for delay)
   *
   * @param ms - Time to sleep in milliseconds
   * @returns Promise that resolves after sleep
   *
   * @example
   * ```typescript
   * await TimeUtils.sleep(1000); // Sleep for 1 second
   * ```
   */
  static sleep(ms: number): Promise<void> {
    return this.delay(ms);
  }
}

// Create convenience exports
export const time = {
  debounce: TimeUtils.debounce,
  throttle: TimeUtils.throttle,
  delay: TimeUtils.delay,
  retry: TimeUtils.retry,
  createRateLimiter: TimeUtils.createRateLimiter,
  createCache: TimeUtils.createCache,
  measureTime: TimeUtils.measureTime,
  createTimer: TimeUtils.createTimer,
  formatDuration: TimeUtils.formatDuration,
  parseDuration: TimeUtils.parseDuration,
  timeout: TimeUtils.timeout,
  createInterval: TimeUtils.createInterval,
  timestamp: TimeUtils.timestamp,
  now: TimeUtils.now,
  isPast: TimeUtils.isPast,
  isFuture: TimeUtils.isFuture,
  timeAgo: TimeUtils.timeAgo,
  sleep: TimeUtils.sleep
};

// Export default
export default TimeUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { TimeUtils, time } from '@/utils/time';
 *
 * // Debounce and throttle
 * const debouncedSearch = time.debounce(searchFunction, 300);
 * const throttledScroll = time.throttle(scrollHandler, 100);
 *
 * // Timing and delays
 * await time.delay(1000);
 * const { result, duration } = await time.measureTime(expensiveOperation);
 *
 * // Retry and rate limiting
 * await time.retry(apiCall, { times: 3, backoff: 'exponential' });
 * const limiter = time.createRateLimiter({ interval: 60000, maxInInterval: 100 });
 * await limiter.throttle();
 *
 * // Caching
 * const cache = time.createCache({ maxSize: 100, ttl: 300000 });
 * cache.set('key', 'value');
 *
 * // Time utilities
 * const timestamp = time.timestamp();
 * const ago = time.timeAgo(new Date(Date.now() - 3600000));
 * const duration = time.formatDuration(90000);
 * ```
 */