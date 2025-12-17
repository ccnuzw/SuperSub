/**
 * Array Utility Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { ArrayUtils, array } from '@/utils/arrayUtils';

describe('ArrayUtils', () => {
  describe('groupBy', () => {
    it('should group array items by key', () => {
      const data = [
        { name: 'John', department: 'IT', age: 30 },
        { name: 'Jane', department: 'HR', age: 25 },
        { name: 'Bob', department: 'IT', age: 35 }
      ];

      const result = ArrayUtils.groupBy(data, {
        keySelector: item => item.department
      });

      expect(result).toEqual({
        IT: [
          { name: 'John', department: 'IT', age: 30 },
          { name: 'Bob', department: 'IT', age: 35 }
        ],
        HR: [
          { name: 'Jane', department: 'HR', age: 25 }
        ]
      });
    });

    it('should sort keys when requested', () => {
      const data = [
        { name: 'John', department: 'IT' },
        { name: 'Jane', department: 'HR' },
        { name: 'Bob', department: 'Finance' }
      ];

      const result = ArrayUtils.groupBy(data, {
        keySelector: item => item.department,
        sortKeys: true
      });

      const keys = Object.keys(result);
      expect(keys).toEqual(['Finance', 'HR', 'IT']);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.groupBy([], {
        keySelector: item => item.department
      });
      expect(result).toEqual({});
    });
  });

  describe('groupToMap', () => {
    it('should group array items into Map', () => {
      const data = [
        { name: 'John', department: 'IT' },
        { name: 'Jane', department: 'HR' },
        { name: 'Bob', department: 'IT' }
      ];

      const result = ArrayUtils.groupToMap(data, item => item.department);

      expect(result.get('IT')).toHaveLength(2);
      expect(result.get('HR')).toHaveLength(1);
      expect(result.get('IT')).toEqual([
        { name: 'John', department: 'IT' },
        { name: 'Bob', department: 'IT' }
      ]);
    });
  });

  describe('sortBy', () => {
    it('should sort numbers', () => {
      const result = ArrayUtils.sortBy([3, 1, 4, 1, 5, 9, 2, 6]);
      expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it('should sort in descending order', () => {
      const result = ArrayUtils.sortBy([3, 1, 4, 1, 5, 9, 2, 6], {
        order: 'desc'
      });
      expect(result).toEqual([9, 6, 5, 4, 3, 1, 1, 2]);
    });

    it('should sort objects by key', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];

      const result = ArrayUtils.sortBy(data, {
        keySelector: item => item.age
      });

      expect(result.map(item => item.name)).toEqual(['Jane', 'John', 'Bob']);
    });

    it('should use custom compare function', () => {
      const data = ['apple', 'Banana', 'cherry'];

      const result = ArrayUtils.sortBy(data, {
        compareFn: (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
      });

      expect(result).toEqual(['apple', 'Banana', 'cherry']);
    });
  });

  describe('chunk', () => {
    it('should chunk array into specified size', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4, 5, 6], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle last chunk with remainder', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should fill last chunk when specified', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4, 5], {
        size: 2,
        fillLast: null
      });
      expect(result).toEqual([[1, 2], [3, 4], [5, null]]);
    });

    it('should handle chunk size larger than array', () => {
      const result = ArrayUtils.chunk([1, 2, 3], 5);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.chunk([], 2);
      expect(result).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates from primitive array', () => {
      const result = ArrayUtils.unique([1, 2, 2, 3, 1, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should remove duplicates from object array using key selector', () => {
      const data = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' }
      ];

      const result = ArrayUtils.unique(data, item => item.id);
      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]);
    });

    it('should preserve order', () => {
      const result = ArrayUtils.unique([3, 1, 2, 3, 1, 4]);
      expect(result).toEqual([3, 1, 2, 4]);
    });
  });

  describe('paginate', () => {
    it('should paginate array correctly', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const result = ArrayUtils.paginate(data, { page: 2, pageSize: 10 });

      expect(result.items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
      expect(result.currentPage).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.totalItems).toBe(100);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(true);
      expect(result.startIndex).toBe(10);
      expect(result.endIndex).toBe(19);
    });

    it('should handle first page', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.paginate(data, { page: 1, pageSize: 2 });

      expect(result.hasPrevious).toBe(false);
      expect(result.hasNext).toBe(true);
    });

    it('should handle last page', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.paginate(data, { page: 3, pageSize: 2 });

      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(false);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.paginate([], { page: 1, pageSize: 10 });
      expect(result.items).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array and maintain same elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = ArrayUtils.shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
      expect(shuffled).not.toEqual(original); // Most likely different order
    });

    it('should return new array', () => {
      const original = [1, 2, 3];
      const shuffled = ArrayUtils.shuffle(original);
      expect(shuffled).not.toBe(original);
    });
  });

  describe('random', () => {
    it('should return single random item', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.random(array);

      expect(array).toContain(result);
    });

    it('should return multiple random items', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = ArrayUtils.random(array, 3);

      expect(result).toHaveLength(3);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return unique items when unique is true', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.random(array, 3, true) as number[];

      expect(result).toHaveLength(3);
      expect(new Set(result).size).toBe(3); // All unique
    });

    it('should handle count larger than array', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.random(array, 5, true) as number[];

      expect(result).toHaveLength(3); // Can't get more than available
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      const result = ArrayUtils.flatten([1, [2, [3, [4]], 5]]);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should respect depth parameter', () => {
      const result = ArrayUtils.flatten([1, [2, [3, 4]], 5], 1);
      expect(result).toEqual([1, 2, [3, 4], 5]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.flatten([])).toEqual([]);
      expect(ArrayUtils.flatten([[], [], []])).toEqual([]);
    });
  });

  describe('intersection', () => {
    it('should find intersection of arrays', () => {
      const result = ArrayUtils.intersection([1, 2, 3], [2, 3, 4], [3, 2, 5]);
      expect(result).toEqual([2, 3]);
    });

    it('should work with key selector for objects', () => {
      const users1 = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      const users2 = [{ id: 1, name: 'John' }, { id: 3, name: 'Bob' }];

      const result = ArrayUtils.intersection(users1, users2, item => item.id);
      expect(result).toEqual([{ id: 1, name: 'John' }]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.intersection([], [1, 2, 3])).toEqual([]);
      expect(ArrayUtils.intersection([1, 2, 3], [])).toEqual([]);
    });
  });

  describe('difference', () => {
    it('should find difference of arrays', () => {
      const result = ArrayUtils.difference([1, 2, 3, 4], [2, 4, 6]);
      expect(result).toEqual([1, 3]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.difference([], [1, 2, 3])).toEqual([]);
      expect(ArrayUtils.difference([1, 2, 3], [])).toEqual([1, 2, 3]);
    });
  });

  describe('symmetricDifference', () => {
    it('should find symmetric difference of arrays', () => {
      const result = ArrayUtils.symmetricDifference([1, 2, 3], [2, 4, 5]);
      expect(result.sort()).toEqual([1, 3, 4, 5]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.symmetricDifference([], [1, 2, 3])).toEqual([1, 2, 3]);
      expect(ArrayUtils.symmetricDifference([1, 2, 3], [])).toEqual([1, 2, 3]);
    });
  });

  describe('union', () => {
    it('should find union of arrays', () => {
      const result = ArrayUtils.union([1, 2, 3], [2, 4, 5], [3, 6]);
      expect(result.sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should work with key selector for objects', () => {
      const users1 = [{ id: 1, name: 'John' }];
      const users2 = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];

      const result = ArrayUtils.union(users1, users2, item => item.id);
      expect(result).toHaveLength(2);
      expect(result.map(u => u.id).sort()).toEqual([1, 2]);
    });
  });

  describe('zip', () => {
    it('should zip arrays together', () => {
      const result = ArrayUtils.zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true]);
      expect(result).toEqual([
        [1, 'a', true],
        [2, 'b', false],
        [3, 'c', true]
      ]);
    });

    it('should handle arrays of different lengths', () => {
      const result = ArrayUtils.zip([1, 2], ['a', 'b', 'c'], [true]);
      expect(result).toEqual([[1, 'a', true]]);
    });
  });

  describe('range', () => {
    it('should create range of numbers', () => {
      expect(ArrayUtils.range(1, 5)).toEqual([1, 2, 3, 4]);
      expect(ArrayUtils.range(0, 3)).toEqual([0, 1, 2]);
    });

    it('should use custom step', () => {
      expect(ArrayUtils.range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
      expect(ArrayUtils.range(10, 0, -2)).toEqual([10, 8, 6, 4, 2]);
    });

    it('should handle single parameter', () => {
      expect(ArrayUtils.range(5)).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle negative step', () => {
      expect(ArrayUtils.range(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
    });
  });

  describe('partition', () => {
    it('should partition array by predicate', () => {
      const [evens, odds] = ArrayUtils.partition([1, 2, 3, 4, 5, 6], x => x % 2 === 0);
      expect(evens).toEqual([2, 4, 6]);
      expect(odds).toEqual([1, 3, 5]);
    });

    it('should handle empty array', () => {
      const [truthy, falsy] = ArrayUtils.partition([], x => Boolean(x));
      expect(truthy).toEqual([]);
      expect(falsy).toEqual([]);
    });
  });

  describe('findFirst', () => {
    it('should find first matching item', () => {
      const result = ArrayUtils.findFirst(
        [{ id: 1 }, { id: 2 }, { id: 3 }],
        item => item.id > 1
      );
      expect(result).toEqual({ id: 2 });
    });

    it('should return undefined when no match', () => {
      const result = ArrayUtils.findFirst(
        [{ id: 1 }, { id: 2 }, { id: 3 }],
        item => item.id > 5
      );
      expect(result).toBeUndefined();
    });

    it('should support fromIndex', () => {
      const result = ArrayUtils.findFirst(
        [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }],
        item => item.id === 1,
        1
      );
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findLast', () => {
    it('should find last matching item', () => {
      const result = ArrayUtils.findLast(
        [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 2 }],
        item => item.id === 2
      );
      expect(result).toEqual({ id: 2 });
    });

    it('should return undefined when no match', () => {
      const result = ArrayUtils.findLast(
        [{ id: 1 }, { id: 2 }, { id: 3 }],
        item => item.id > 5
      );
      expect(result).toBeUndefined();
    });
  });

  describe('count', () => {
    it('should count items matching predicate', () => {
      const result = ArrayUtils.count([1, 2, 3, 4, 5, 6], x => x % 2 === 0);
      expect(result).toBe(3);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.count([], x => Boolean(x));
      expect(result).toBe(0);
    });
  });

  describe('diff', () => {
    it('should compute array difference', () => {
      const old = [1, 2, 3];
      const newArray = [2, 3, 4];

      const result = ArrayUtils.diff(old, newArray);
      expect(result).toEqual({
        added: [4],
        removed: [1],
        unchanged: [2, 3],
        modified: []
      });
    });

    it('should work with key selector for objects', () => {
      const old = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      const newArray = [{ id: 1, name: 'John Doe' }, { id: 3, name: 'Bob' }];

      const result = ArrayUtils.diff(old, newArray, item => item.id);
      expect(result.added).toEqual([{ id: 3, name: 'Bob' }]);
      expect(result.removed).toEqual([{ id: 2, name: 'Jane' }]);
      expect(result.modified).toEqual([
        { old: { id: 1, name: 'John' }, new: { id: 1, name: 'John Doe' } }
      ]);
    });
  });

  describe('utility methods', () => {
    it('should check if array is empty', () => {
      expect(ArrayUtils.isEmpty([])).toBe(true);
      expect(ArrayUtils.isEmpty([1, 2, 3])).toBe(false);
      expect(ArrayUtils.isEmpty(null as any)).toBe(true);
    });

    it('should check if array is not empty', () => {
      expect(ArrayUtils.isNotEmpty([1, 2, 3])).toBe(true);
      expect(ArrayUtils.isNotEmpty([])).toBe(false);
      expect(ArrayUtils.isNotEmpty(null as any)).toBe(false);
    });

    it('should repeat value', () => {
      const result = ArrayUtils.repeat('hello', 3);
      expect(result).toEqual(['hello', 'hello', 'hello']);
    });

    it('should create number arrays', () => {
      expect(ArrayUtils.n(5)).toEqual([1, 2, 3, 4, 5]);
      expect(ArrayUtils.zeroToN(5)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('convenience exports', () => {
    it('should work with convenience exports', () => {
      expect(array.unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
      expect(array.chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(array.sortBy([3, 1, 2])).toEqual([1, 2, 3]);
      expect(array.isEmpty([])).toBe(true);
    });
  });
});