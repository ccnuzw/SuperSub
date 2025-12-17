/**
 * Async Utility - Async helpers for retry, timeout, parallel execution, and queuing
 * Provides comprehensive async operation management utilities
 */

/**
 * Task queue options
 */
export interface QueueOptions {
  concurrency?: number;
  autoStart?: boolean;
  pauseOnError?: boolean;
  timeout?: number;
  onTaskStart?: (task: any) => void;
  onTaskComplete?: (task: any, result: any) => void;
  onTaskError?: (task: any, error: any) => void;
  onQueueEmpty?: () => void;
}

/**
 * Queue task interface
 */
export interface QueueTask<T = any, R = any> {
  id?: string;
  task: () => Promise<R>;
  priority?: number;
  timeout?: number;
  retries?: number;
  onResolve?: (result: R) => void;
  onReject?: (error: any) => void;
  metadata?: T;
}

/**
 * Parallel execution options
 */
export interface ParallelOptions {
  concurrency?: number;
  stopOnError?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  progress?: (completed: number, total: number) => void;
}

/**
 * Batch processing options
 */
export interface BatchOptions<T> {
  batchSize: number;
  concurrency?: number;
  delay?: number;
  progress?: (completed: number, total: number, current: T[]) => void;
  onError?: (error: any, items: T[]) => void;
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  onStateChange?: (state: 'closed' | 'open' | 'half-open') => void;
}

/**
 * Async utility class
 */
export class AsyncUtils {
  /**
   * Create a task queue
   *
   * @param options - Queue options
   * @returns Queue object with add, pause, resume, start methods
   *
   * @example
   * ```typescript
   * const queue = AsyncUtils.createQueue({
   *   concurrency: 3,
   *   autoStart: true
   * });
   *
   * queue.add(() => fetch('/api/data'));
   * queue.add(() => fetch('/api/more'));
   * ```
   */
  static createQueue<T = any, R = any>(options: QueueOptions = {}) {
    const {
      concurrency = 1,
      autoStart = true,
      pauseOnError = false,
      timeout = 0,
      onTaskStart,
      onTaskComplete,
      onTaskError,
      onQueueEmpty: initialOnQueueEmpty
    } = options;

    let onQueueEmpty = initialOnQueueEmpty;

    const tasks: QueueTask<T, R>[] = [];
    const running = new Set<string>();
    const completed = new Set<string>();
    const failed = new Set<string>();
    let isPaused = false;
    let isStarted = autoStart;

    const processNext = async () => {
      if (!isStarted || isPaused || running.size >= concurrency || tasks.length === 0) {
        return;
      }

      const task = tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0)).shift();
      if (!task) return;

      const taskId = task.id || Math.random().toString(36);
      task.id = taskId;
      running.add(taskId);

      onTaskStart?.(task);

      try {
        const taskTimeout = task.timeout || timeout;
        const promise = task.task();

        let result: R;
        if (taskTimeout > 0) {
          result = await Promise.race([
            promise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Task timeout')), taskTimeout)
            )
          ]);
        } else {
          result = await promise;
        }

        completed.add(taskId);
        onTaskComplete?.(task, result);
        task.onResolve?.(result);
      } catch (error) {
        failed.add(taskId);
        onTaskError?.(task, error);

        if (task.retries && task.retries > 0) {
          task.retries--;
          tasks.push(task); // Re-queue for retry
        } else {
          task.onReject?.(error);
          if (pauseOnError) {
            isPaused = true;
          }
        }
      } finally {
        running.delete(taskId);
        processNext();
      }

      if (tasks.length === 0 && running.size === 0) {
        onQueueEmpty?.();
      }
    };

    return {
      add: (taskFn: () => Promise<R>, options: Partial<QueueTask<T, R>> = {}) => {
        const task: QueueTask<T, R> = {
          task: taskFn,
          priority: 0,
          retries: 0,
          ...options
        };
        tasks.push(task);
        processNext();
        return task;
      },
      pause: () => {
        isPaused = true;
      },
      resume: () => {
        isPaused = false;
        processNext();
      },
      start: () => {
        isStarted = true;
        processNext();
      },
      stop: () => {
        isStarted = false;
        isPaused = true;
      },
      clear: () => {
        tasks.length = 0;
      },
      getStatus: () => ({
        pending: tasks.length,
        running: running.size,
        completed: completed.size,
        failed: failed.size,
        isPaused,
        isStarted
      }),
      getTasks: () => [...tasks],
      onEmpty: (callback: () => void) => {
        onQueueEmpty = callback;
      }
    };
  }

  /**
   * Execute multiple promises in parallel with concurrency control
   *
   * @param tasks - Array of task functions
   * @param options - Parallel execution options
   * @returns Promise with results array
   *
   * @example
   * ```typescript
   * const results = await AsyncUtils.parallel(
   *   [fetchData1, fetchData2, fetchData3],
   *   { concurrency: 2, progress: (done, total) => console.log(`${done}/${total}`) }
   * );
   * ```
   */
  static async parallel<T>(
    tasks: Array<() => Promise<T>>,
    options: ParallelOptions = {}
  ): Promise<T[]> {
    const {
      concurrency = Infinity,
      stopOnError = true,
      timeout = 0,
      retries = 0,
      retryDelay = 1000,
      progress
    } = options;

    if (tasks.length === 0) return [];

    const results: (T | Error)[] = new Array(tasks.length);
    const errors: Error[] = [];
    let completed = 0;

    const executeTask = async (task: () => Promise<T>, index: number): Promise<T> => {
      let attempt = 0;
      let lastError: any;

      while (attempt <= retries) {
        try {
          const promise = task();
          const result = timeout > 0
            ? await Promise.race([
                promise,
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Task timeout')), timeout)
                )
              ])
            : await promise;

          results[index] = result;
          completed++;
          progress?.(completed, tasks.length);
          return result;
        } catch (error) {
          lastError = error;
          attempt++;
          if (attempt <= retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      if (stopOnError) {
        throw lastError;
      }

      results[index] = lastError;
      completed++;
      progress?.(completed, tasks.length);
      throw lastError;
    };

    const concurrentTasks = Math.min(concurrency, tasks.length);
    const chunks: Array<[() => Promise<T>, number][]> = [];

    for (let i = 0; i < tasks.length; i += concurrentTasks) {
      chunks.push(tasks.slice(i, i + concurrentTasks).map((task, idx) => [task, i + idx]));
    }

    try {
      for (const chunk of chunks) {
        const promises = chunk.map(([task, index]) => executeTask(task, index));
        await Promise.all(promises);
      }
    } catch (error) {
      if (stopOnError) {
        throw error;
      }
    }

    // Filter out errors and return only successful results
    return results.filter(result => !(result instanceof Error)) as T[];
  }

  /**
   * Process items in batches
   *
   * @param items - Array of items to process
   * @param processor - Function to process each item
   * @param options - Batch processing options
   * @returns Promise with results
   *
   * @example
   * ```typescript
   * const results = await AsyncUtils.batch(
   *   [1, 2, 3, 4, 5, 6],
   *   async (item) => item * 2,
   *   { batchSize: 2, concurrency: 2 }
   * );
   * ```
   */
  static async batch<T, R>(
    items: T[],
    processor: (item: T, batch: T[]) => Promise<R>,
    options: BatchOptions<T>
  ): Promise<R[]> {
    const { batchSize, concurrency = 1, delay = 0, progress, onError } = options;
    const results: R[] = [];

    // Split items into batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    let completed = 0;

    const processBatch = async (batch: T[]): Promise<R[]> => {
      try {
        const batchResults = await Promise.all(
          batch.map(item => processor(item, batch))
        );
        return batchResults;
      } catch (error) {
        onError?.(error, batch);
        throw error;
      }
    };

    // Process batches with concurrency control
    for (let i = 0; i < batches.length; i += concurrency) {
      const concurrentBatches = batches.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        concurrentBatches.map(batch => processBatch(batch))
      );

      results.push(...batchResults.flat());
      completed += concurrentBatches.length;
      progress?.(completed, batches.length, concurrentBatches.flat());

      // Add delay between batch groups if specified
      if (delay > 0 && i + concurrency < batches.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * Create a circuit breaker
   *
   * @param options - Circuit breaker options
   * @returns Circuit breaker object with execute method
   *
   * @example
   * ```typescript
   * const breaker = AsyncUtils.createCircuitBreaker({
   *   failureThreshold: 5,
   *   resetTimeout: 60000
   * });
   *
   * try {
   *   const result = await breaker.execute(() => apiCall());
   * } catch (error) {
   *   // Handle error or circuit open state
   * }
   * ```
   */
  static createCircuitBreaker(options: CircuitBreakerOptions = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitoringPeriod = 10000,
      onStateChange
    } = options;

    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failures = 0;
    let lastFailureTime = 0;
    let successCount = 0;

    const reset = () => {
      state = 'closed';
      failures = 0;
      successCount = 0;
      onStateChange?.(state);
    };

    const trip = () => {
      state = 'open';
      lastFailureTime = Date.now();
      onStateChange?.(state);
    };

    const canAttempt = () => {
      if (state === 'closed') return true;
      if (state === 'open') {
        return Date.now() - lastFailureTime >= resetTimeout;
      }
      return state === 'half-open';
    };

    const onSuccess = () => {
      failures = 0;
      successCount++;

      if (state === 'half-open' && successCount >= 3) {
        reset();
      }
    };

    const onFailure = () => {
      failures++;

      if (failures >= failureThreshold) {
        trip();
      } else if (state === 'half-open') {
        trip();
      }
    };

    return {
      execute: async <T>(fn: () => Promise<T>): Promise<T> => {
        if (!canAttempt()) {
          throw new Error('Circuit breaker is open');
        }

        if (state === 'open' && canAttempt()) {
          state = 'half-open';
          onStateChange?.(state);
        }

        try {
          const result = await fn();
          onSuccess();
          return result;
        } catch (error) {
          onFailure();
          throw error;
        }
      },
      getState: () => state,
      getFailures: () => failures,
      reset,
      forceOpen: () => {
        state = 'open';
        onStateChange?.(state);
      },
      forceClose: () => {
        reset();
      }
    };
  }

  /**
   * Create a memoized async function
   *
   * @param fn - Function to memoize
   * @param options - Memoization options
   * @returns Memoized function
   *
   * @example
   * ```typescript
   * const memoizedFetch = AsyncUtils.memoize(
   *   (url: string) => fetch(url).then(r => r.json()),
   *   { ttl: 300000, maxSize: 100 }
   * );
   * ```
   */
  static memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: {
      ttl?: number;
      maxSize?: number;
      keyGenerator?: (...args: Parameters<T>) => string;
    } = {}
  ): T {
    const { ttl = 0, maxSize = 100, keyGenerator } = options;
    const cache = new Map<string, { value: any; timestamp: number; promise?: Promise<any> }>();

    const generateKey = (...args: Parameters<T>): string => {
      if (keyGenerator) return keyGenerator(...args);
      return JSON.stringify(args);
    };

    const cleanExpired = () => {
      if (ttl === 0) return;
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > ttl) {
          cache.delete(key);
        }
      }
    };

    const evictOldest = () => {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
    };

    return (async (...args: Parameters<T>) => {
      cleanExpired();

      const key = generateKey(...args);
      const cached = cache.get(key);

      if (cached) {
        if (ttl === 0 || Date.now() - cached.timestamp < ttl) {
          if (cached.promise) {
            return cached.promise;
          }
          return cached.value;
        }
        cache.delete(key);
      }

      evictOldest();

      const promise = fn(...args);
      cache.set(key, { value: undefined, promise, timestamp: Date.now() });

      try {
        const result = await promise;
        cache.set(key, { value: result, timestamp: Date.now() });
        return result;
      } catch (error) {
        cache.delete(key);
        throw error;
      }
    }) as T;
  }

  /**
   * Race multiple promises with timeout and fallback
   *
   * @param promises - Array of promises or functions returning promises
   * @param options - Race options
   * @returns Promise with first resolved result
   *
   * @example
   * ```typescript
   * const result = await AsyncUtils.race([
   *   () => fetch('/fast'),
   *   () => fetch('/slow'),
   *   () => fetch('/backup')
   * ], { timeout: 5000, fallback: 'default value' });
   * ```
   */
  static async race<T>(
    promises: Array<Promise<T> | (() => Promise<T>)>,
    options: {
      timeout?: number;
      fallback?: T;
      rejectOnTimeout?: boolean;
    } = {}
  ): Promise<T> {
    const { timeout: timeoutMs, fallback, rejectOnTimeout = false } = options;

    const actualPromises = promises.map(p =>
      typeof p === 'function' ? p() : p
    );

    if (timeoutMs && fallback !== undefined) {
      try {
        return await Promise.race([
          Promise.race(actualPromises),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
      } catch (error) {
        if (rejectOnTimeout) {
          throw error;
        }
        return fallback;
      }
    }

    if (timeoutMs) {
      return Promise.race([
        Promise.race(actualPromises),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    }

    return Promise.race(actualPromises);
  }

  /**
   * Create a retry mechanism with custom conditions
   *
   * @param options - Retry options
   * @returns Retry function
   *
   * @example
   * ```typescript
   * const retry = AsyncUtils.createRetry({
   *   times: 3,
   *   condition: (error) => error.status >= 500,
   *   backoff: (attempt) => Math.pow(2, attempt) * 1000
   * });
   *
   * await retry(() => apiCall());
   * ```
   */
  static createRetry(options: {
    times?: number;
    delay?: number;
    condition?: (error: any, attempt: number) => boolean;
    backoff?: (attempt: number) => number;
    maxDelay?: number;
  }) {
    const {
      times = 3,
      delay = 1000,
      condition = () => true,
      backoff = (attempt) => delay * attempt,
      maxDelay = 30000
    } = options;

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      let lastError: any;

      for (let attempt = 1; attempt <= times; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;

          if (attempt === times || !condition(error, attempt)) {
            throw error;
          }

          const waitTime = Math.min(backoff(attempt), maxDelay);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      throw lastError;
    };
  }

  /**
   * Create a generator-based async iterator
   *
   * @param fn - Async function that yields values
   * @param options - Iterator options
   * @returns Async generator
   *
   * @example
   * ```typescript
   * const generator = AsyncUtils.createGenerator(async function* () {
   *   for (let i = 0; i < 10; i++) {
   *     yield await fetchData(i);
   *   }
   * });
   *
   * for await (const item of generator) {
   *   console.log(item);
   * }
   * ```
   */
  static createGenerator<T>(
    fn: () => AsyncGenerator<T, void, unknown>,
    options: {
      bufferSize?: number;
      autoStart?: boolean;
    } = {}
  ): AsyncIterable<T> & {
    start: () => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
  } {
    const { bufferSize = 1, autoStart = true } = options;
    let generator: AsyncGenerator<T> | undefined;
    let buffer: T[] = [];
    let isRunning = false;
    let isPaused = false;
    let resolveNext: ((value: IteratorResult<T>) => void) | undefined;
    let isDone = false;

    const process = async () => {
      if (!generator || isPaused || isDone) return;

      isRunning = true;
      try {
        for await (const value of generator) {
          if (buffer.length < bufferSize) {
            buffer.push(value);
          }

          if (resolveNext) {
            const resolve = resolveNext;
            resolveNext = undefined;
            resolve({ value, done: false });
          }

          while (isPaused) {
            await new Promise(resolve => {
              const checkPause = () => {
                if (!isPaused) resolve(undefined);
                else setTimeout(checkPause, 10);
              };
              checkPause();
            });
          }
        }

        isDone = true;
        if (resolveNext) {
          resolveNext({ value: undefined, done: true });
        }
      } catch (error) {
        isDone = true;
        if (resolveNext) {
          resolveNext({ value: undefined, done: true });
        }
      } finally {
        isRunning = false;
      }
    };

    const start = () => {
      if (!generator) {
        generator = fn();
      }
      if (!isRunning) {
        process();
      }
    };

    const iterator: AsyncIterable<T> & {
      start: () => void;
      stop: () => void;
      pause: () => void;
      resume: () => void;
    } = {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<T>> {
            if (buffer.length > 0) {
              return { value: buffer.shift()!, done: false };
            }

            if (isDone) {
              return { value: undefined, done: true };
            }

            return new Promise(resolve => {
              resolveNext = resolve;
            });
          }
        };
      },
      start,
      stop: () => {
        isDone = true;
        isPaused = true;
      },
      pause: () => {
        isPaused = true;
      },
      resume: () => {
        isPaused = false;
      }
    };

    if (autoStart) {
      start();
    }

    return iterator;
  }

  /**
   * Create a pipeline for processing values through multiple async steps
   *
   * @param steps - Array of processing functions
   * @returns Pipeline function
   *
   * @example
   * ```typescript
   * const pipeline = AsyncUtils.createPipeline([
   *   async (data) => validate(data),
   *   async (data) => transform(data),
   *   async (data) => save(data)
   * ]);
   *
   * const result = await pipeline(inputData);
   * ```
   */
  static createPipeline<T>(steps: Array<(data: any) => Promise<any>>) {
    return async (initialData: T): Promise<any> => {
      let currentData: any = initialData;

      for (const step of steps) {
        currentData = await step(currentData);
      }

      return currentData;
    };
  }

  /**
   * Wait for condition to be true with timeout
   *
   * @param condition - Condition function
   * @param options - Wait options
   * @returns Promise that resolves when condition is true
   *
   * @example
   * ```typescript
   * await AsyncUtils.waitFor(
   *   () => document.getElementById('element') !== null,
   *   { timeout: 5000, interval: 100 }
   * );
   * ```
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: {
      timeout?: number;
      interval?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<void> {
    const { timeout = 30000, interval = 100, timeoutMessage = 'Wait condition timeout' } = options;

    const startTime = Date.now();

    while (true) {
      if (await condition()) {
        return;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(timeoutMessage);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  /**
   * Create a timeout wrapper for any promise
   *
   * @param promise - Promise to wrap
   * @param timeoutMs - Timeout in milliseconds
   * @param timeoutError - Custom timeout error
   * @returns Promise with timeout
   *
   * @example
   * ```typescript
   * const result = await AsyncUtils.withTimeout(
   *   fetchData(),
   *   5000,
   *   new Error('Data fetch timeout')
   * );
   * ```
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError: Error = new Error('Operation timeout')
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(timeoutError), timeoutMs)
      )
    ]);
  }
}

// Create convenience exports
export const async = {
  createQueue: AsyncUtils.createQueue,
  parallel: AsyncUtils.parallel,
  batch: AsyncUtils.batch,
  createCircuitBreaker: AsyncUtils.createCircuitBreaker,
  memoize: AsyncUtils.memoize,
  race: AsyncUtils.race,
  createRetry: AsyncUtils.createRetry,
  createGenerator: AsyncUtils.createGenerator,
  createPipeline: AsyncUtils.createPipeline,
  waitFor: AsyncUtils.waitFor,
  withTimeout: AsyncUtils.withTimeout
};

// Export default
export default AsyncUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { AsyncUtils, async } from '@/utils/async';
 *
 * // Queue management
 * const queue = async.createQueue({ concurrency: 3 });
 * queue.add(() => apiCall());
 * queue.pause();
 * queue.resume();
 *
 * // Parallel execution
 * const results = await async.parallel(tasks, {
 *   concurrency: 5,
 *   progress: (done, total) => console.log(`${done}/${total}`)
 * });
 *
 * // Batch processing
 * const batchResults = await async.batch(items, processor, {
 *   batchSize: 10,
 *   concurrency: 2
 * });
 *
 * // Circuit breaker
 * const breaker = async.createCircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000
 * });
 * const result = await breaker.execute(() => apiCall());
 *
 * // Memoization
 * const memoized = async.memoize(expensiveFunction, { ttl: 300000 });
 *
 * // Retry logic
 * const retry = async.createRetry({
 *   times: 3,
 *   backoff: (attempt) => Math.pow(2, attempt) * 1000
 * });
 * await retry(() => unreliableApiCall());
 * ```
 */