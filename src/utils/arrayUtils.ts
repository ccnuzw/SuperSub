/**
 * Array Utility - Common array operations and transformations
 * Provides comprehensive array manipulation functions with type safety
 */

/**
 * Grouping options
 */
export interface GroupByOptions<T> {
  keySelector: (item: T, index: number, array: T[]) => string | number | symbol;
  valueSelector?: (item: T, index: number, array: T[]) => any;
  sortKeys?: boolean;
}

/**
 * Sorting options
 */
export interface SortByOptions<T> {
  compareFn?: (a: T, b: T) => number;
  order?: 'asc' | 'desc';
  keySelector?: (item: T) => any;
  locale?: string;
  numeric?: boolean;
}

/**
 * Chunking options
 */
export interface ChunkOptions {
  size: number;
  fillLast?: any;
}

/**
 * Paging options
 */
export interface PagingOptions<T> {
  page: number;
  pageSize: number;
  totalItems?: number;
}

/**
 * Array paging result
 */
export interface PagingResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Array difference result
 */
export interface ArrayDiffResult<T> {
  added: T[];
  removed: T[];
  unchanged: T[];
  modified?: { old: T; new: T }[];
}

/**
 * Array utility class
 */
export class ArrayUtils {
  /**
   * Group array items by key
   *
   * @param array - Array to group
   * @param options - Grouping options
   * @returns Grouped object
   *
   * @example
   * ```typescript
   * const users = [
   *   { name: 'John', age: 30, department: 'IT' },
   *   { name: 'Jane', age: 25, department: 'HR' },
   *   { name: 'Bob', age: 35, department: 'IT' }
   * ];
   * const grouped = ArrayUtils.groupBy(users, {
   *   keySelector: item => item.department
   * });
   * // Returns: { IT: [{ name: 'John', ... }, { name: 'Bob', ... }], HR: [{ name: 'Jane', ... }] }
   * ```
   */
  static groupBy<T>(array: T[], options: GroupByOptions<T>): Record<string | number | symbol, T[]> {
    const { keySelector, sortKeys = false } = options;

    if (!Array.isArray(array)) {
      return {};
    }

    const grouped: Record<string | number | symbol, T[]> = {};

    array.forEach((item, index, arr) => {
      const key = keySelector(item, index, arr);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Sort keys if requested
    if (sortKeys) {
      const sortedKeys = Object.keys(grouped).sort();
      const sorted: Record<string | number | symbol, T[]> = {};
      sortedKeys.forEach(key => {
        sorted[key] = grouped[key];
      });
      return sorted;
    }

    return grouped;
  }

  /**
   * Group array items to Map
   *
   * @param array - Array to group
   * @param keySelector - Key selector function
   * @returns Map with grouped items
   *
   * @example
   * ```typescript
   * const users = [
   *   { name: 'John', department: 'IT' },
   *   { name: 'Jane', department: 'HR' }
   * ];
   * const grouped = ArrayUtils.groupToMap(users, item => item.department);
   * // Returns: Map { 'IT' => [{ name: 'John', ... }], 'HR' => [{ name: 'Jane', ... }] }
   * ```
   */
  static groupToMap<T, K>(array: T[], keySelector: (item: T, index: number, array: T[]) => K): Map<K, T[]> {
    if (!Array.isArray(array)) {
      return new Map();
    }

    const grouped = new Map<K, T[]>();

    array.forEach((item, index, arr) => {
      const key = keySelector(item, index, arr);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    return grouped;
  }

  /**
   * Sort array by criteria
   *
   * @param array - Array to sort
   * @param options - Sorting options
   * @returns New sorted array
   *
   * @example
   * ```typescript
   * const users = [
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 },
   *   { name: 'Bob', age: 35 }
   * ];
   * const sorted = ArrayUtils.sortBy(users, {
   *   keySelector: item => item.age,
   *   order: 'asc'
   * });
   * ```
   */
  static sortBy<T>(array: T[], options: SortByOptions<T> = {}): T[] {
    const { compareFn, order = 'asc', keySelector, locale, numeric } = options;

    if (!Array.isArray(array)) {
      return [];
    }

    const sorted = [...array];

    if (compareFn) {
      sorted.sort(compareFn);
    } else if (keySelector) {
      sorted.sort((a, b) => {
        const valueA = keySelector(a);
        const valueB = keySelector(b);

        // Handle locale-aware string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB, locale, { numeric });
        }

        // Handle numeric comparison
        if (numeric || typeof valueA === 'number' || typeof valueB === 'number') {
          const numA = Number(valueA) || 0;
          const numB = Number(valueB) || 0;
          return numA - numB;
        }

        // Default comparison
        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
      });
    } else {
      sorted.sort();
    }

    return order === 'desc' ? sorted.reverse() : sorted;
  }

  /**
   * Create chunks from array
   *
   * @param array - Array to chunk
   * @param size - Chunk size or options
   * @returns Array of chunks
   *
   * @example
   * ```typescript
   * const chunked = ArrayUtils.chunk([1, 2, 3, 4, 5, 6], 2);
   * // Returns: [[1, 2], [3, 4], [5, 6]]
   *
   * const chunkedWithOptions = ArrayUtils.chunk([1, 2, 3, 4, 5], { size: 2, fillLast: null });
   * // Returns: [[1, 2], [3, 4], [5, null]]
   * ```
   */
  static chunk<T>(array: T[], size: number | ChunkOptions): T[][] {
    if (!Array.isArray(array)) {
      return [];
    }

    const options = typeof size === 'number' ? { size } : size;
    const { size: chunkSize, fillLast } = options;

    if (chunkSize <= 0) {
      return [array];
    }

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      let chunk = array.slice(i, i + chunkSize);

      // Fill last chunk if needed
      if (fillLast !== undefined && chunk.length < chunkSize) {
        const fillCount = chunkSize - chunk.length;
        const fillArray = Array(fillCount).fill(fillLast);
        chunk = [...chunk, ...fillArray];
      }

      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Get unique items from array
   *
   * @param array - Array to deduplicate
   * @param keySelector - Optional key selector for object arrays
   * @returns Array with unique items
   *
   * @example
   * ```typescript
   * const unique = ArrayUtils.unique([1, 2, 2, 3, 1, 4]);
   * // Returns: [1, 2, 3, 4]
   *
   * const users = [
   *   { id: 1, name: 'John' },
   *   { id: 2, name: 'Jane' },
   *   { id: 1, name: 'John' }
   * ];
   * const uniqueUsers = ArrayUtils.unique(users, item => item.id);
   * // Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   * ```
   */
  static unique<T>(array: T[], keySelector?: (item: T) => any): T[] {
    if (!Array.isArray(array)) {
      return [];
    }

    if (!keySelector) {
      return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get unique items using Map for better performance with objects
   *
   * @param array - Array to deduplicate
   * @param keySelector - Key selector function
   * @returns Array with unique items
   */
  static uniqueBy<T, K>(array: T[], keySelector: (item: T) => K): T[] {
    if (!Array.isArray(array)) {
      return [];
    }

    const seen = new Map<K, T>();
    return array.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, item);
      return true;
    });
  }

  /**
   * Paginate array
   *
   * @param array - Array to paginate
   * @param options - Paging options
   * @returns Paging result
   *
   * @example
   * ```typescript
   * const data = Array.from({ length: 100 }, (_, i) => i);
   * const page = ArrayUtils.paginate(data, { page: 2, pageSize: 10 });
   * // Returns: {
   * //   items: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
   * //   currentPage: 2,
   * //   pageSize: 10,
   * //   totalPages: 10,
   * //   totalItems: 100,
   * //   hasNext: true,
   * //   hasPrevious: true,
   * //   startIndex: 10,
   * //   endIndex: 19
   * // }
   * ```
   */
  static paginate<T>(array: T[], options: PagingOptions<T>): PagingResult<T> {
    if (!Array.isArray(array)) {
      return {
        items: [],
        currentPage: options.page,
        pageSize: options.pageSize,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrevious: false,
        startIndex: 0,
        endIndex: 0
      };
    }

    const { page, pageSize } = options;
    const totalItems = options.totalItems ?? array.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    const items = array.slice(startIndex, startIndex + pageSize);

    return {
      items,
      currentPage: page,
      pageSize,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      startIndex,
      endIndex
    };
  }

  /**
   * Shuffle array
   *
   * @param array - Array to shuffle
   * @returns New shuffled array
   *
   * @example
   * ```typescript
   * const shuffled = ArrayUtils.shuffle([1, 2, 3, 4, 5]);
   * // Returns: [3, 1, 5, 2, 4] (or any other random order)
   * ```
   */
  static shuffle<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
      return [];
    }

    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random item(s) from array
   *
   * @param array - Array to get items from
   * @param count - Number of items to get (default: 1)
   * @param unique - Whether to get unique items (default: true)
   * @returns Random item(s)
   *
   * @example
   * ```typescript
   * const random = ArrayUtils.random([1, 2, 3, 4, 5]);
   * // Returns: 3 (or any other random number)
   *
   * const randomItems = ArrayUtils.random([1, 2, 3, 4, 5], 2);
   * // Returns: [3, 1] (or any other random combination)
   * ```
   */
  static random<T>(array: T[], count: number = 1, unique: boolean = true): T | T[] {
    if (!Array.isArray(array) || array.length === 0) {
      return count === 1 ? (undefined as any) : [];
    }

    if (count === 1) {
      const index = Math.floor(Math.random() * array.length);
      return array[index];
    }

    if (unique) {
      const shuffled = this.shuffle(array);
      return shuffled.slice(0, Math.min(count, array.length));
    } else {
      const items: T[] = [];
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * array.length);
        items.push(array[index]);
      }
      return items;
    }
  }

  /**
   * Flatten nested arrays
   *
   * @param array - Array to flatten
   * @param depth - Maximum depth to flatten (default: Infinity)
   * @returns Flattened array
   *
   * @example
   * ```typescript
   * const flattened = ArrayUtils.flatten([1, [2, [3, [4]], 5]]);
   * // Returns: [1, 2, 3, 4, 5]
   *
   * const shallow = ArrayUtils.flatten([1, [2, [3, 4]], 5], 1);
   * // Returns: [1, 2, [3, 4], 5]
   * ```
   */
  static flatten<T>(array: (T | T[])[], depth: number = Infinity): T[] {
    if (!Array.isArray(array)) {
      return [];
    }

    return array.reduce<T[]>((flat, item) => {
      if (Array.isArray(item) && depth > 0) {
        return flat.concat(this.flatten(item, depth - 1));
      }
      return flat.concat(item as T);
    }, []);
  }

  /**
   * Deep flatten array
   *
   * @param array - Array to deep flatten
   * @returns Deeply flattened array
   */
  static deepFlatten<T>(array: (T | T[])[]): T[] {
    return this.flatten(array, Infinity);
  }

  /**
   * Find intersection of arrays
   *
   * @param arrays - Arrays to find intersection of
   * @param keySelector - Optional key selector for object arrays
   * @returns Array with items present in all arrays
   *
   * @example
   * ```typescript
   * const intersection = ArrayUtils.intersection([1, 2, 3], [2, 3, 4], [3, 2, 5]);
   * // Returns: [2, 3]
   *
   * const users1 = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
   * const users2 = [{ id: 1, name: 'John' }, { id: 3, name: 'Bob' }];
   * const commonUsers = ArrayUtils.intersection(users1, users2, item => item.id);
   * // Returns: [{ id: 1, name: 'John' }]
   * ```
   */
  static intersection<T>(...arrays: T[][]): T[];
  static intersection<T>(arrays: T[][], keySelector?: (item: T) => any): T[];
  static intersection<T>(...args: any[]): T[] {
    const arrays = Array.isArray(args[0]) ? args : [args[0], ...args.slice(1)];
    const keySelector = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;

    if (arrays.length === 0) {
      return [];
    }

    if (keySelector) {
      const [firstArray, ...restArrays] = arrays as T[][];
      return firstArray.filter(item => {
        const key = keySelector(item);
        return restArrays.every(arr => arr.some(i => keySelector(i) === key));
      });
    }

    const [firstArray, ...restArrays] = arrays as T[][];
    return firstArray.filter(item =>
      restArrays.every(arr => arr.includes(item))
    );
  }

  /**
   * Find difference between arrays
   *
   * @param arrays - Arrays to compare
   * @param keySelector - Optional key selector for object arrays
   * @returns Items present in first array but not in others
   *
   * @example
   * ```typescript
   * const difference = ArrayUtils.difference([1, 2, 3, 4], [2, 4, 6]);
   * // Returns: [1, 3]
   * ```
   */
  static difference<T>(...arrays: T[][]): T[];
  static difference<T>(arrays: T[][], keySelector?: (item: T) => any): T[];
  static difference<T>(...args: any[]): T[] {
    const arrays = Array.isArray(args[0]) ? args : [args[0], ...args.slice(1)];
    const keySelector = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;

    if (arrays.length === 0) {
      return [];
    }

    const [firstArray, ...restArrays] = arrays as T[][];

    if (keySelector) {
      return firstArray.filter(item => {
        const key = keySelector(item);
        return !restArrays.some(arr => arr.some(i => keySelector(i) === key));
      });
    }

    return firstArray.filter(item =>
      !restArrays.some(arr => arr.includes(item))
    );
  }

  /**
   * Find symmetric difference between arrays
   *
   * @param arrays - Arrays to compare
   * @returns Items present in exactly one array
   *
   * @example
   * ```typescript
   * const symDiff = ArrayUtils.symmetricDifference([1, 2, 3], [2, 4, 5]);
   * // Returns: [1, 3, 4, 5]
   * ```
   */
  static symmetricDifference<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) {
      return [];
    }

    const flattenArrays = arrays.flat();
    const counts = new Map<T, number>();

    flattenArrays.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .filter(([, count]) => count === 1)
      .map(([item]) => item);
  }

  /**
   * Find union of arrays
   *
   * @param arrays - Arrays to union
   * @param keySelector - Optional key selector for object arrays
   * @returns Array with unique items from all arrays
   *
   * @example
   * ```typescript
   * const union = ArrayUtils.union([1, 2, 3], [2, 4, 5], [3, 6]);
   * // Returns: [1, 2, 3, 4, 5, 6]
   * ```
   */
  static union<T>(...arrays: T[][]): T[];
  static union<T>(arrays: T[][], keySelector?: (item: T) => any): T[];
  static union<T>(...args: any[]): T[] {
    const arrays = Array.isArray(args[0]) ? args : [args[0], ...args.slice(1)];
    const keySelector = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;

    const flattened = arrays.flat();
    return keySelector ? this.unique(flattened, keySelector) : this.unique(flattened);
  }

  /**
   * Zip arrays together
   *
   * @param arrays - Arrays to zip
   * @returns Array of tuples
   *
   * @example
   * ```typescript
   * const zipped = ArrayUtils.zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true]);
   * // Returns: [[1, 'a', true], [2, 'b', false], [3, 'c', true]]
   * ```
   */
  static zip<T extends any[]>(...arrays: T[]): T[] {
    if (arrays.length === 0) {
      return [] as T[];
    }

    const minLength = Math.min(...arrays.map(arr => arr.length));
    const result: T[] = [];

    for (let i = 0; i < minLength; i++) {
      const tuple: any = [];
      for (const array of arrays) {
        tuple.push(array[i]);
      }
      result.push(tuple as T);
    }

    return result;
  }

  /**
   * Create array of ranges
   *
   * @param start - Start number
   * @param end - End number (exclusive)
   * @param step - Step size (default: 1)
   * @returns Array of numbers
   *
   * @example
   * ```typescript
   * const range = ArrayUtils.range(1, 5);
   * // Returns: [1, 2, 3, 4]
   *
   * const rangeWithStep = ArrayUtils.range(0, 10, 2);
   * // Returns: [0, 2, 4, 6, 8]
   * ```
   */
  static range(start: number, end?: number, step: number = 1): number[] {
    if (end === undefined) {
      end = start;
      start = 0;
    }

    const result: number[] = [];
    const actualStep = Math.sign(end - start) * Math.abs(step);

    if (actualStep === 0) {
      return result;
    }

    for (let i = start; (actualStep > 0 ? i < end : i > end); i += actualStep) {
      result.push(i);
    }

    return result;
  }

  /**
   * Partition array into two based on predicate
   *
   * @param array - Array to partition
   * @param predicate - Predicate function
   * @returns Tuple of [truthy, falsy] arrays
   *
   * @example
   * ```typescript
   * const [evens, odds] = ArrayUtils.partition([1, 2, 3, 4, 5, 6], x => x % 2 === 0);
   * // evens: [2, 4, 6], odds: [1, 3, 5]
   * ```
   */
  static partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]] {
    if (!Array.isArray(array)) {
      return [[], []];
    }

    const truthy: T[] = [];
    const falsy: T[] = [];

    array.forEach((item, index, arr) => {
      if (predicate(item, index, arr)) {
        truthy.push(item);
      } else {
        falsy.push(item);
      }
    });

    return [truthy, falsy];
  }

  /**
   * Group array items into chunks of specified size
   *
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   * @deprecated Use chunk instead
   */
  static chunkBySize<T>(array: T[], size: number): T[][] {
    return this.chunk(array, size);
  }

  /**
   * Find the first item matching predicate
   *
   * @param array - Array to search
   * @param predicate - Predicate function
   * @param fromIndex - Starting index (default: 0)
   * @returns First matching item or undefined
   *
   * @example
   * ```typescript
   * const found = ArrayUtils.findFirst(
   *   [{ id: 1 }, { id: 2 }, { id: 3 }],
   *   item => item.id > 1
   * ); // Returns: { id: 2 }
   * ```
   */
  static findFirst<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean, fromIndex: number = 0): T | undefined {
    if (!Array.isArray(array)) {
      return undefined;
    }

    for (let i = fromIndex; i < array.length; i++) {
      if (predicate(array[i], i, array)) {
        return array[i];
      }
    }

    return undefined;
  }

  /**
   * Find the last item matching predicate
   *
   * @param array - Array to search
   * @param predicate - Predicate function
   * @param fromIndex - Starting index from end (default: array.length - 1)
   * @returns Last matching item or undefined
   *
   * @example
   * ```typescript
   * const found = ArrayUtils.findLast(
   *   [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 2 }],
   *   item => item.id === 2
   * ); // Returns: { id: 2 } (the last one)
   * ```
   */
  static findLast<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean, fromIndex: number = array.length - 1): T | undefined {
    if (!Array.isArray(array)) {
      return undefined;
    }

    for (let i = Math.min(fromIndex, array.length - 1); i >= 0; i--) {
      if (predicate(array[i], i, array)) {
        return array[i];
      }
    }

    return undefined;
  }

  /**
   * Count items matching predicate
   *
   * @param array - Array to count in
   * @param predicate - Predicate function
   * @returns Count of matching items
   *
   * @example
   * ```typescript
   * const count = ArrayUtils.count([1, 2, 3, 4, 5], x => x % 2 === 0);
   * // Returns: 2
   * ```
   */
  static count<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): number {
    if (!Array.isArray(array)) {
      return 0;
    }

    return array.reduce((count, item, index, arr) => {
      return predicate(item, index, arr) ? count + 1 : count;
    }, 0);
  }

  /**
   * Calculate difference between two arrays
   *
   * @param oldArray - Original array
   * @param newArray - New array
   * @param keySelector - Optional key selector for object arrays
   * @returns Difference result
   *
   * @example
   * ```typescript
   * const old = [1, 2, 3];
   * const newArray = [2, 3, 4];
   * const diff = ArrayUtils.diff(old, newArray);
   * // Returns: { added: [4], removed: [1], unchanged: [2, 3] }
   * ```
   */
  static diff<T>(oldArray: T[], newArray: T[], keySelector?: (item: T) => any): ArrayDiffResult<T> {
    if (!Array.isArray(oldArray) || !Array.isArray(newArray)) {
      return {
        added: [],
        removed: [],
        unchanged: [],
        modified: []
      };
    }

    if (keySelector) {
      const oldMap = new Map(oldArray.map(item => [keySelector(item), item]));
      const newMap = new Map(newArray.map(item => [keySelector(item), item]));

      const added: T[] = [];
      const removed: T[] = [];
      const unchanged: T[] = [];
      const modified: { old: T; new: T }[] = [];

      // Find added and modified
      for (const [key, newItem] of newMap) {
        const oldItem = oldMap.get(key);
        if (!oldItem) {
          added.push(newItem);
        } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          modified.push({ old: oldItem, new: newItem });
        } else {
          unchanged.push(newItem);
        }
      }

      // Find removed
      for (const [key, oldItem] of oldMap) {
        if (!newMap.has(key)) {
          removed.push(oldItem);
        }
      }

      return { added, removed, unchanged, modified };
    }

    // Simple array comparison
    const added = newArray.filter(item => !oldArray.includes(item));
    const removed = oldArray.filter(item => !newArray.includes(item));
    const unchanged = oldArray.filter(item => newArray.includes(item));

    return { added, removed, unchanged };
  }

  /**
   * Create array with repeated values
   *
   * @param value - Value to repeat
   * @param count - Number of repetitions
   * @returns Array with repeated values
   *
   * @example
   * ```typescript
   * const repeated = ArrayUtils.repeat('hello', 3);
   * // Returns: ['hello', 'hello', 'hello']
   * ```
   */
  static repeat<T>(value: T, count: number): T[] {
    if (count <= 0) {
      return [];
    }

    return Array(count).fill(value);
  }

  /**
   * Create array with numbers 1 to n
   *
   * @param n - Number of items
   * @returns Array with numbers 1 to n
   *
   * @example
   * ```typescript
   * const numbers = ArrayUtils.n(5);
   * // Returns: [1, 2, 3, 4, 5]
   * ```
   */
  static n(n: number): number[] {
    return this.range(1, n + 1);
  }

  /**
   * Create array with numbers 0 to n-1
   *
   * @param n - Number of items
   * @returns Array with numbers 0 to n-1
   *
   * @example
   * ```typescript
   * const indices = ArrayUtils.zeroToN(5);
   * // Returns: [0, 1, 2, 3, 4]
   * ```
   */
  static zeroToN(n: number): number[] {
    return this.range(0, n);
  }

  /**
   * Check if array is empty
   *
   * @param array - Array to check
   * @returns True if array is empty or not an array
   */
  static isEmpty<T>(array: T[]): boolean {
    return !Array.isArray(array) || array.length === 0;
  }

  /**
   * Check if array is not empty
   *
   * @param array - Array to check
   * @returns True if array is not empty
   */
  static isNotEmpty<T>(array: T[]): boolean {
    return Array.isArray(array) && array.length > 0;
  }
}

// Create convenience exports
export const array = {
  groupBy: ArrayUtils.groupBy,
  groupToMap: ArrayUtils.groupToMap,
  sortBy: ArrayUtils.sortBy,
  chunk: ArrayUtils.chunk,
  unique: ArrayUtils.unique,
  uniqueBy: ArrayUtils.uniqueBy,
  paginate: ArrayUtils.paginate,
  shuffle: ArrayUtils.shuffle,
  random: ArrayUtils.random,
  flatten: ArrayUtils.flatten,
  deepFlatten: ArrayUtils.deepFlatten,
  intersection: ArrayUtils.intersection,
  difference: ArrayUtils.difference,
  symmetricDifference: ArrayUtils.symmetricDifference,
  union: ArrayUtils.union,
  zip: ArrayUtils.zip,
  range: ArrayUtils.range,
  partition: ArrayUtils.partition,
  findFirst: ArrayUtils.findFirst,
  findLast: ArrayUtils.findLast,
  count: ArrayUtils.count,
  diff: ArrayUtils.diff,
  repeat: ArrayUtils.repeat,
  n: ArrayUtils.n,
  zeroToN: ArrayUtils.zeroToN,
  isEmpty: ArrayUtils.isEmpty,
  isNotEmpty: ArrayUtils.isNotEmpty
};

// Export default
export default ArrayUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { ArrayUtils, array } from '@/utils/array';
 *
 * // Group and sort
 * const grouped = array.groupBy(users, { keySelector: user => user.department });
 * const sorted = array.sortBy(users, { keySelector: user => user.name });
 *
 * // Chunk and paginate
 * const chunked = array.chunk([1, 2, 3, 4, 5], 2);
 * const page = array.paginate(data, { page: 1, pageSize: 10 });
 *
 * // Set operations
 * const unique = array.unique([1, 2, 2, 3]);
 * const intersection = array.intersection([1, 2, 3], [2, 3, 4]);
 * const union = array.union([1, 2], [2, 3], [3, 4]);
 *
 * // Advanced operations
 * const partitioned = array.partition([1, 2, 3, 4], x => x % 2 === 0);
 * const flattened = array.flatten([1, [2, [3, 4]], 5]);
 * const zipped = array.zip([1, 2, 3], ['a', 'b', 'c']);
 * ```
 */