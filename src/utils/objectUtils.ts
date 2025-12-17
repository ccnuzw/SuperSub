/**
 * Object Utility - Common object operations and transformations
 * Provides comprehensive object manipulation functions with deep operations support
 */

/**
 * Object path options
 */
export interface PathOptions {
  delimiter?: string;
  createPath?: boolean;
}

/**
 * Deep merge options
 */
export interface DeepMergeOptions {
  arrayMerge?: (target: any[], source: any[]) => any[];
  clone?: boolean;
}

/**
 * Object comparison options
 */
export interface CompareOptions {
  deep?: boolean;
  strict?: boolean;
  ignoreCase?: boolean;
  ignoreKeys?: string[];
  ignoreUndefined?: boolean;
}

/**
 * Object property descriptor
 */
export interface PropertyDescriptor {
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
  value?: any;
  get?: () => any;
  set?: (value: any) => void;
}

/**
 * Object utility class
 */
export class ObjectUtils {
  /**
   * Deep clone object
   *
   * @param obj - Object to clone
   * @returns Deep cloned object
   *
   * @example
   * ```typescript
   * const original = { a: 1, b: { c: 2 } };
   * const cloned = ObjectUtils.deepClone(original);
   * cloned.b.c = 3; // Doesn't affect original
   * ```
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle special objects
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as T;
    }

    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of obj) {
        cloned.set(key, this.deepClone(value));
      }
      return cloned as T;
    }

    if (obj instanceof Set) {
      const cloned = new Set();
      for (const value of obj) {
        cloned.add(this.deepClone(value));
      }
      return cloned as T;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as T;
    }

    // Handle plain objects
    if (this.isPlainObject(obj)) {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    // For other objects, try to create a copy
    try {
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const newObj: any = {};
        const objAsAny = obj as any;
        for (const key in objAsAny) {
          if (objAsAny.hasOwnProperty(key)) {
            newObj[key] = objAsAny[key];
          }
        }
        return newObj;
      }
      return obj;
    } catch {
      return obj;
    }
  }

  /**
   * Deep merge objects
   *
   * @param target - Target object
   * @param sources - Source objects to merge
   * @param options - Merge options
   * @returns Merged object
   *
   * @example
   * ```typescript
   * const merged = ObjectUtils.deepMerge(
   *   { a: 1, b: { c: 2 } },
   *   { b: { d: 3 }, e: 4 }
   * );
   * // Returns: { a: 1, b: { c: 2, d: 3 }, e: 4 }
   * ```
   */
  static deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T;
  static deepMerge<T extends Record<string, any>>(target: T, options: DeepMergeOptions, ...sources: Partial<T>[]): T;
  static deepMerge<T extends Record<string, any>>(
    target: T,
    ...args: any[]
  ): T {
    const options: DeepMergeOptions = typeof args[0] === 'object' && !Array.isArray(args[0])
      ? args.shift() || {}
      : {};
    const sources = args as Partial<T>[];

    const result = options.clone ? this.deepClone(target) : { ...target };

    for (const source of sources) {
      if (!source || typeof source !== 'object') {
        continue;
      }

      for (const key in source) {
        if (!source.hasOwnProperty(key)) {
          continue;
        }

        const sourceValue = source[key];
        const targetValue = result[key] as any;

        if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          // Handle arrays
          result[key] = options.arrayMerge
            ? options.arrayMerge(targetValue, sourceValue)
            : [...targetValue, ...sourceValue] as any;
        } else if (
          this.isPlainObject(sourceValue) &&
          this.isPlainObject(targetValue)
        ) {
          // Recursively merge plain objects
          result[key] = this.deepMerge(targetValue, options, sourceValue) as any;
        } else {
          // Assign primitive values or non-plain objects
          result[key] = sourceValue as any;
        }
      }
    }

    return result;
  }

  /**
   * Pick properties from object
   *
   * @param obj - Source object
   * @param keys - Keys to pick
   * @returns Object with picked properties
   *
   * @example
   * ```typescript
   * const picked = ObjectUtils.pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
   * // Returns: { a: 1, c: 3 }
   * ```
   */
  static pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Pick properties from object using predicate
   *
   * @param obj - Source object
   * @param predicate - Function to determine if key should be picked
   * @returns Object with picked properties
   *
   * @example
   * ```typescript
   * const picked = ObjectUtils.pickBy(
   *   { a: 1, b: 'hello', c: 3 },
   *   (key, value) => typeof value === 'number'
   * );
   * // Returns: { a: 1, c: 3 }
   * ```
   */
  static pickBy<T extends Record<string, any>>(
    obj: T,
    predicate: (key: keyof T, value: T[keyof T]) => boolean
  ): Partial<T> {
    const result = {} as Partial<T>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && predicate(key, obj[key])) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Omit properties from object
   *
   * @param obj - Source object
   * @param keys - Keys to omit
   * @returns Object without omitted properties
   *
   * @example
   * ```typescript
   * const omitted = ObjectUtils.omit({ a: 1, b: 2, c: 3 }, ['b']);
   * // Returns: { a: 1, c: 3 }
   * ```
   */
  static omit<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj } as any;
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  /**
   * Omit properties from object using predicate
   *
   * @param obj - Source object
   * @param predicate - Function to determine if key should be omitted
   * @returns Object without omitted properties
   *
   * @example
   * ```typescript
   * const omitted = ObjectUtils.omitBy(
   *   { a: 1, b: 'hello', c: 3 },
   *   (key, value) => typeof value === 'string'
   * );
   * // Returns: { a: 1, c: 3 }
   * ```
   */
  static omitBy<T extends Record<string, any>>(
    obj: T,
    predicate: (key: keyof T, value: T[keyof T]) => boolean
  ): Partial<T> {
    const result = {} as Partial<T>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !predicate(key, obj[key])) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Get nested property value by path
   *
   * @param obj - Object to get value from
   * @param path - Path to property (string or array)
   * @param defaultValue - Default value if path doesn't exist
   * @param options - Path options
   * @returns Property value or default
   *
   * @example
   * ```typescript
   * const value = ObjectUtils.get(
   *   { a: { b: { c: 1 } } },
   *   'a.b.c',
   *   0
   * ); // Returns: 1
   *
   * const value2 = ObjectUtils.get(
   *   { 'a.b': { c: 1 } },
   *   ['a.b', 'c'],
   *   0
   * ); // Returns: 1
   * ```
   */
  static get<T = any>(
    obj: any,
    path: string | string[],
    defaultValue?: T,
    options: PathOptions = {}
  ): T {
    const { delimiter = '.', createPath = false } = options;

    if (!obj || typeof obj !== 'object') {
      return defaultValue as T;
    }

    const keys = Array.isArray(path) ? path : path.split(delimiter);
    let current = obj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (current === null || current === undefined) {
        return defaultValue as T;
      }

      if (!(key in current)) {
        return defaultValue as T;
      }

      current = current[key];
    }

    return current !== undefined ? current : (defaultValue as T);
  }

  /**
   * Set nested property value by path
   *
   * @param obj - Object to set value on
   * @param path - Path to property (string or array)
   * @param value - Value to set
   * @param options - Path options
   * @returns Modified object
   *
   * @example
   * ```typescript
   * const obj = { a: { b: { c: 1 } } };
   * ObjectUtils.set(obj, 'a.b.c', 2);
   * // obj becomes: { a: { b: { c: 2 } } }
   *
   * ObjectUtils.set(obj, 'a.b.d', 3, { createPath: true });
   * // obj becomes: { a: { b: { c: 2, d: 3 } } }
   * ```
   */
  static set<T extends Record<string, any>>(
    obj: T,
    path: string | string[],
    value: any,
    options: PathOptions = {}
  ): T {
    const { delimiter = '.', createPath = false } = options;

    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const keys = Array.isArray(path) ? path : path.split(delimiter);
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      if (!(key in current) || typeof current[key] !== 'object') {
        if (createPath) {
          (current as any)[key] = {};
        } else {
          return obj; // Path doesn't exist and createPath is false
        }
      }

      current = (current as any)[key];
    }

    const lastKey = keys[keys.length - 1];
    (current as any)[lastKey] = value;

    return obj;
  }

  /**
   * Check if object has property at path
   *
   * @param obj - Object to check
   * @param path - Path to check
   * @param options - Path options
   * @returns True if path exists
   *
   * @example
   * ```typescript
   * const has = ObjectUtils.has({ a: { b: { c: 1 } } }, 'a.b.c');
   * // Returns: true
   *
   * const hasNot = ObjectUtils.has({ a: { b: { c: 1 } } }, 'a.b.d');
   * // Returns: false
   * ```
   */
  static has(obj: any, path: string | string[], options: PathOptions = {}): boolean {
    const { delimiter = '.' } = options;

    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const keys = Array.isArray(path) ? path : path.split(delimiter);
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Remove property at path
   *
   * @param obj - Object to remove property from
   * @param path - Path to property
   * @param options - Path options
   * @returns Modified object
   *
   * @example
   * ```typescript
   * const obj = { a: { b: { c: 1, d: 2 } } };
   * ObjectUtils.unset(obj, 'a.b.c');
   * // obj becomes: { a: { b: { d: 2 } } }
   * ```
   */
  static unset<T extends Record<string, any>>(
    obj: T,
    path: string | string[],
    options: PathOptions = {}
  ): T {
    const { delimiter = '.' } = options;

    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const keys = Array.isArray(path) ? path : path.split(delimiter);
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        return obj; // Path doesn't exist
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey in current) {
      delete current[lastKey];
    }

    return obj;
  }

  /**
   * Compare two objects for equality
   *
   * @param obj1 - First object
   * @param obj2 - Second object
   * @param options - Comparison options
   * @returns True if objects are equal
   *
   * @example
   * ```typescript
   * const equal = ObjectUtils.isEqual(
   *   { a: 1, b: { c: 2 } },
   *   { a: 1, b: { c: 2 } }
   * ); // Returns: true
   *
   * const notEqual = ObjectUtils.isEqual(
   *   { a: 1, b: { c: 2 } },
   *   { a: 1, b: { c: 3 } }
   * ); // Returns: false
   * ```
   */
  static isEqual(obj1: any, obj2: any, options: CompareOptions = {}): boolean {
    const {
      deep = true,
      strict = true,
      ignoreCase = false,
      ignoreKeys = [],
      ignoreUndefined = false
    } = options;

    // Handle primitive values
    if (obj1 === obj2) {
      return true;
    }

    // Handle null/undefined
    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    // Handle different types
    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    // Handle string comparison with case ignore
    if (typeof obj1 === 'string' && ignoreCase) {
      return obj1.toLowerCase() === obj2.toLowerCase();
    }

    // Handle non-object types
    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.isEqual(obj1[i], obj2[i], options)) {
          return false;
        }
      }
      return true;
    }

    // Handle different array/object types
    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    // Handle special objects
    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime();
    }

    if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
      return obj1.source === obj2.source && obj1.flags === obj2.flags;
    }

    // Handle plain objects
    if (this.isPlainObject(obj1) && this.isPlainObject(obj2)) {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      // Filter ignored keys
      const filteredKeys1 = keys1.filter(key => !ignoreKeys.includes(key));
      const filteredKeys2 = keys2.filter(key => !ignoreKeys.includes(key));

      if (filteredKeys1.length !== filteredKeys2.length) {
        return false;
      }

      for (const key of filteredKeys1) {
        if (!filteredKeys2.includes(key)) {
          return false;
        }

        const value1 = obj1[key];
        const value2 = obj2[key];

        // Skip undefined values if requested
        if (ignoreUndefined && (value1 === undefined || value2 === undefined)) {
          continue;
        }

        if (deep) {
          if (!this.isEqual(value1, value2, options)) {
            return false;
          }
        } else {
          if (strict ? value1 !== value2 : value1 != value2) {
            return false;
          }
        }
      }

      return true;
    }

    // Fallback to reference equality for other objects
    return obj1 === obj2;
  }

  /**
   * Check if value is a plain object
   *
   * @param obj - Value to check
   * @returns True if value is a plain object
   *
   * @example
   * ```typescript
   * ObjectUtils.isPlainObject({}); // true
   * ObjectUtils.isPlainObject([]); // false
   * ObjectUtils.isPlainObject(new Date()); // false
   * ObjectUtils.isPlainObject(Object.create(null)); // true
   * ```
   */
  static isPlainObject(obj: any): obj is Record<string, any> {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    // Check if it's a plain object (created by {} or new Object())
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      return false;
    }

    // Check constructor
    const proto = Object.getPrototypeOf(obj);
    if (proto === null) {
      return true; // Object.create(null)
    }

    const constructor = proto.constructor;
    return typeof constructor === 'function' && constructor.toString() === Object.toString();
  }

  /**
   * Get all keys of object (including inherited and non-enumerable)
   *
   * @param obj - Object to get keys from
   * @param options - Key extraction options
   * @returns Array of keys
   *
   * @example
   * ```typescript
   * const keys = ObjectUtils.getAllKeys(obj);
   * const ownKeys = ObjectUtils.getAllKeys(obj, { own: true });
   * const enumerableKeys = ObjectUtils.getAllKeys(obj, { enumerable: true });
   * ```
   */
  static getAllKeys(obj: any, options: { own?: boolean; enumerable?: boolean } = {}): string[] {
    const { own = false, enumerable = false } = options;

    if (!obj || typeof obj !== 'object') {
      return [];
    }

    const keys = new Set<string>();

    if (own) {
      const ownKeys = Object.getOwnPropertyNames(obj);
      const ownSymbols = Object.getOwnPropertySymbols(obj);

      for (const key of ownKeys) {
        if (!enumerable || Object.prototype.propertyIsEnumerable.call(obj, key)) {
          keys.add(key);
        }
      }

      for (const symbol of ownSymbols) {
        if (!enumerable || Object.prototype.propertyIsEnumerable.call(obj, symbol)) {
          keys.add(symbol.toString());
        }
      }
    } else {
      let current = obj;
      while (current && current !== Object.prototype) {
        const currentKeys = Object.getOwnPropertyNames(current);
        const currentSymbols = Object.getOwnPropertySymbols(current);

        for (const key of currentKeys) {
          if (!enumerable || Object.prototype.propertyIsEnumerable.call(current, key)) {
            keys.add(key);
          }
        }

        for (const symbol of currentSymbols) {
          if (!enumerable || Object.prototype.propertyIsEnumerable.call(current, symbol)) {
            keys.add(symbol.toString());
          }
        }

        current = Object.getPrototypeOf(current);
      }
    }

    return Array.from(keys);
  }

  /**
   * Get all values from object
   *
   * @param obj - Object to get values from
   * @returns Array of values
   *
   * @example
   * ```typescript
   * const values = ObjectUtils.values({ a: 1, b: 2, c: 3 });
   * // Returns: [1, 2, 3]
   * ```
   */
  static values<T extends Record<string, any>>(obj: T): T[keyof T][] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    return Object.keys(obj).map(key => obj[key]);
  }

  /**
   * Get all entries from object
   *
   * @param obj - Object to get entries from
   * @returns Array of [key, value] pairs
   *
   * @example
   * ```typescript
   * const entries = ObjectUtils.entries({ a: 1, b: 2 });
   * // Returns: [['a', 1], ['b', 2]]
   * ```
   */
  static entries<T extends Record<string, any>>(obj: T): Array<[keyof T, T[keyof T]]> {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    return Object.keys(obj).map(key => [key, obj[key]] as [keyof T, T[keyof T]]);
  }

  /**
   * Create object from entries
   *
   * @param entries - Array of [key, value] pairs
   * @returns Created object
   *
   * @example
   * ```typescript
   * const obj = ObjectUtils.fromEntries([['a', 1], ['b', 2]]);
   * // Returns: { a: 1, b: 2 }
   * ```
   */
  static fromEntries<T extends readonly (readonly [string, any])[]>(
    entries: T
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of entries) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Map object values using transformation function
   *
   * @param obj - Object to map
   * @param transform - Transformation function
   * @returns Mapped object
   *
   * @example
   * ```typescript
   * const mapped = ObjectUtils.mapValues(
   *   { a: 1, b: 2, c: 3 },
   *   (value, key) => value * 2
   * );
   * // Returns: { a: 2, b: 4, c: 6 }
   * ```
   */
  static mapValues<T extends Record<string, any>, R>(
    obj: T,
    transform: (value: T[keyof T], key: keyof T, obj: T) => R
  ): Record<keyof T, R> {
    const result = {} as Record<keyof T, R>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = transform(obj[key], key, obj);
      }
    }
    return result;
  }

  /**
   * Map object keys using transformation function
   *
   * @param obj - Object to map
   * @param transform - Transformation function
   * @returns Mapped object
   *
   * @example
   * ```typescript
   * const mapped = ObjectUtils.mapKeys(
   *   { first_name: 'John', last_name: 'Doe' },
   *   (key) => key.replace(/_/g, ' ').toUpperCase()
   * );
   * // Returns: { 'FIRST NAME': 'John', 'LAST NAME': 'Doe' }
   * ```
   */
  static mapKeys<T extends Record<string, any>>(
    obj: T,
    transform: (key: keyof T, value: T[keyof T]) => string
  ): Record<string, T[keyof T]> {
    const result = {} as Record<string, T[keyof T]>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = transform(key, obj[key]);
        result[newKey] = obj[key];
      }
    }
    return result;
  }

  /**
   * Filter object keys/values using predicate
   *
   * @param obj - Object to filter
   * @param predicate - Predicate function
   * @returns Filtered object
   *
   * @example
   * ```typescript
   * const filtered = ObjectUtils.filter(
   *   { a: 1, b: 2, c: 3, d: 'hello' },
   *   (key, value) => typeof value === 'number'
   * );
   * // Returns: { a: 1, b: 2, c: 3 }
   * ```
   */
  static filter<T extends Record<string, any>>(
    obj: T,
    predicate: (key: keyof T, value: T[keyof T]) => boolean
  ): Partial<T> {
    const result = {} as Partial<T>;
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && predicate(key, obj[key])) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Check if object is empty
   *
   * @param obj - Object to check
   * @returns True if object has no own enumerable properties
   *
   * @example
   * ```typescript
   * ObjectUtils.isEmpty({}); // true
   * ObjectUtils.isEmpty({ a: 1 }); // false
   * ObjectUtils.isEmpty([]); // true
   * ```
   */
  static isEmpty(obj: any): boolean {
    if (obj == null) {
      return true;
    }

    if (Array.isArray(obj)) {
      return obj.length === 0;
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).length === 0;
    }

    return false;
  }

  /**
   * Invert object keys and values
   *
   * @param obj - Object to invert
   * @param multiValue - Whether to handle duplicate values (default: false)
   * @returns Inverted object
   *
   * @example
   * ```typescript
   * const inverted = ObjectUtils.invert({ a: 'x', b: 'y', c: 'z' });
   * // Returns: { x: 'a', y: 'b', z: 'c' }
   *
   * const invertedMulti = ObjectUtils.invert({ a: 'x', b: 'x' }, true);
   * // Returns: { x: ['a', 'b'] }
   * ```
   */
  static invert<T extends Record<string, any>>(
    obj: T,
    multiValue: boolean = false
  ): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const valueKey = String(value);

        if (multiValue) {
          if (result[valueKey]) {
            if (Array.isArray(result[valueKey])) {
              (result[valueKey] as string[]).push(key);
            } else {
              result[valueKey] = [result[valueKey] as string, key];
            }
          } else {
            result[valueKey] = [key];
          }
        } else {
          result[valueKey] = key;
        }
      }
    }

    return result;
  }

  /**
   * Create object with default values
   *
   * @param obj - Object to add defaults to
   * @param defaults - Default values
   * @returns Object with defaults applied
   *
   * @example
   * ```typescript
   * const withDefaults = ObjectUtils.defaults(
   *   { a: 1 },
   *   { a: 0, b: 2, c: 3 }
   * );
   * // Returns: { a: 1, b: 2, c: 3 }
   * ```
   */
  static defaults<T extends Record<string, any>>(
    obj: Partial<T>,
    defaults: T
  ): T {
    const result = { ...defaults };
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Create deep object with default values
   *
   * @param obj - Object to add defaults to
   * @param defaults - Default values
   * @returns Object with deep defaults applied
   *
   * @example
   * ```typescript
   * const withDefaults = ObjectUtils.deepDefaults(
   *   { a: { b: 1 } },
   *   { a: { b: 0, c: 2 }, d: 3 }
   * );
   * // Returns: { a: { b: 1, c: 2 }, d: 3 }
   * ```
   */
  static deepDefaults<T extends Record<string, any>>(
    obj: Partial<T>,
    defaults: T
  ): T {
    return this.deepMerge(defaults, obj);
  }

  /**
   * Flatten object to single level
   *
   * @param obj - Object to flatten
   * @param options - Flattening options
   * @returns Flattened object
   *
   * @example
   * ```typescript
   * const flattened = ObjectUtils.flatten(
   *   { a: { b: { c: 1 } }, d: 2 },
   *   { delimiter: '.' }
   * );
   * // Returns: { 'a.b.c': 1, 'd': 2 }
   * ```
   */
  static flatten<T extends Record<string, any>>(
    obj: T,
    options: { delimiter?: string; maxDepth?: number } = {}
  ): Record<string, any> {
    const { delimiter = '.', maxDepth = Infinity } = options;
    const result: Record<string, any> = {};

    const flatten = (current: any, prefix: string = '', depth: number = 0) => {
      if (depth >= maxDepth) {
        result[prefix] = current;
        return;
      }

      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          const value = current[key];
          const newKey = prefix ? `${prefix}${delimiter}${key}` : key;

          if (this.isPlainObject(value) && Object.keys(value).length > 0) {
            flatten(value, newKey, depth + 1);
          } else {
            result[newKey] = value;
          }
        }
      }
    };

    flatten(obj);
    return result;
  }

  /**
   * Unflatten object from flat to nested
   *
   * @param obj - Object to unflatten
   * @param options - Unflattening options
   * @returns Unflattened object
   *
   * @example
   * ```typescript
   * const unflattened = ObjectUtils.unflatten(
   *   { 'a.b.c': 1, 'd': 2 },
   *   { delimiter: '.' }
   * );
   * // Returns: { a: { b: { c: 1 } }, d: 2 }
   * ```
   */
  static unflatten(
    obj: Record<string, any>,
    options: { delimiter?: string } = {}
  ): Record<string, any> {
    const { delimiter = '.' } = options;
    const result: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const keys = key.split(delimiter);
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
          const subKey = keys[i];
          if (!current[subKey] || typeof current[subKey] !== 'object') {
            current[subKey] = {};
          }
          current = current[subKey];
        }

        current[keys[keys.length - 1]] = value;
      }
    }

    return result;
  }

  /**
   * Freeze object deeply (make it immutable)
   *
   * @param obj - Object to freeze
   * @returns Frozen object
   *
   * @example
   * ```typescript
   * const frozen = ObjectUtils.deepFreeze({ a: { b: 1 } });
   * frozen.a.b = 2; // Throws error in strict mode
   * ```
   */
  static deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    Object.freeze(obj);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'object' && !Object.isFrozen(value)) {
          this.deepFreeze(value);
        }
      }
    }

    return obj;
  }

  /**
   * Create object with read-only properties
   *
   * @param obj - Object to make read-only
   * @returns Object with read-only properties
   *
   * @example
   * ```typescript
   * const readOnly = ObjectUtils.readOnly({ a: 1, b: 2 });
   * readOnly.a = 3; // Fails silently
   * ```
   */
  static readOnly<T extends Record<string, any>>(obj: T): Readonly<T> {
    const result = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        Object.defineProperty(result, key, {
          value: obj[key],
          enumerable: true,
          writable: false,
          configurable: true
        });
      }
    }
    return result;
  }

  /**
   * Seal object (prevent new properties but allow modifications)
   *
   * @param obj - Object to seal
   * @returns Sealed object
   *
   * @example
   * ```typescript
   * const sealed = ObjectUtils.seal({ a: 1 });
   * sealed.a = 2; // Works
   * sealed.b = 3; // Fails
   * ```
   */
  static seal<T>(obj: T): T {
    return Object.seal(obj);
  }
}

// Create convenience exports
export const object = {
  deepClone: ObjectUtils.deepClone,
  deepMerge: ObjectUtils.deepMerge,
  pick: ObjectUtils.pick,
  pickBy: ObjectUtils.pickBy,
  omit: ObjectUtils.omit,
  omitBy: ObjectUtils.omitBy,
  get: ObjectUtils.get,
  set: ObjectUtils.set,
  has: ObjectUtils.has,
  unset: ObjectUtils.unset,
  isEqual: ObjectUtils.isEqual,
  isPlainObject: ObjectUtils.isPlainObject,
  getAllKeys: ObjectUtils.getAllKeys,
  values: ObjectUtils.values,
  entries: ObjectUtils.entries,
  fromEntries: ObjectUtils.fromEntries,
  mapValues: ObjectUtils.mapValues,
  mapKeys: ObjectUtils.mapKeys,
  filter: ObjectUtils.filter,
  isEmpty: ObjectUtils.isEmpty,
  invert: ObjectUtils.invert,
  defaults: ObjectUtils.defaults,
  deepDefaults: ObjectUtils.deepDefaults,
  flatten: ObjectUtils.flatten,
  unflatten: ObjectUtils.unflatten,
  deepFreeze: ObjectUtils.deepFreeze,
  readOnly: ObjectUtils.readOnly,
  seal: ObjectUtils.seal
};

// Export default
export default ObjectUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { ObjectUtils, object } from '@/utils/object';
 *
 * // Clone and merge
 * const cloned = object.deepClone(original);
 * const merged = object.deepMerge(target, source1, source2);
 *
 * // Pick and omit
 * const picked = object.pick(obj, ['a', 'b', 'c']);
 * const omitted = object.omit(obj, ['password', 'token']);
 *
 * // Path operations
 * const value = object.get(data, 'user.profile.name', 'Anonymous');
 * object.set(data, 'user.profile.email', 'user@example.com');
 *
 * // Object transformations
 * const filtered = object.filter(obj, (key, value) => value !== null);
 * const mapped = object.mapValues(obj, (value) => value * 2);
 * const inverted = object.invert(mapping);
 *
 * // Comparison and validation
 * const equal = object.isEqual(obj1, obj2, { deep: true });
 * const plain = object.isPlainObject(value);
 * ```
 */