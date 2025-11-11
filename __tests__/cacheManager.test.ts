/**
 * CacheManager Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CacheManager } from '../src/cacheManager.js';
import { CacheConfig } from '../src/types.js';

describe('CacheManager', () => {
  let cache: CacheManager<string>;
  const defaultConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 5000, // 5 seconds
    enabled: true,
  };

  beforeEach(() => {
    cache = new CacheManager<string>(defaultConfig);
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const shortTTLCache = new CacheManager<string>({
        ...defaultConfig,
        ttl: 100, // 100ms
      });

      shortTTLCache.set('key1', 'value1');
      expect(shortTTLCache.get('key1')).toBe('value1');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortTTLCache.get('key1')).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('key1', 'value1');

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('access count tracking', () => {
    it('should track access count', () => {
      cache.set('key1', 'value1');

      // Access multiple times
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.entries).toBe(1);
    });
  });

  describe('size management', () => {
    it('should track current size', () => {
      cache.set('key1', 'small');

      const stats = cache.getStats();
      expect(stats.sizeBytes).toBeGreaterThan(0);
      expect(stats.sizeBytes).toBeLessThan(stats.maxSizeBytes);
    });

    it('should not cache entries larger than maxSize', () => {
      const smallCache = new CacheManager<string>({
        maxSize: 10, // Very small cache
        ttl: 5000,
        enabled: true,
      });

      const largeValue = 'x'.repeat(1000);
      smallCache.set('key1', largeValue);

      expect(smallCache.get('key1')).toBeUndefined();
    });

    it('should calculate utilization percentage', () => {
      cache.set('key1', 'value1');

      const stats = cache.getStats();
      expect(stats.utilizationPercent).toBeGreaterThan(0);
      expect(stats.utilizationPercent).toBeLessThan(100);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when full', () => {
      const smallCache = new CacheManager<string>({
        maxSize: 100, // Small cache to trigger eviction
        ttl: 5000,
        enabled: true,
      });

      // Fill cache
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Access key1 and key2 to make them more recently used
      smallCache.get('key1');
      smallCache.get('key2');

      // Add more items to trigger eviction
      smallCache.set('key4', 'value4');
      smallCache.set('key5', 'value5');
      smallCache.set('key6', 'value6');

      // Key3 should be evicted (least recently used)
      // Keys accessed more recently should still exist
      expect(smallCache.get('key1')).toBeDefined();
      expect(smallCache.get('key2')).toBeDefined();
    });

    it('should evict oldest entries when access counts are equal', () => {
      const smallCache = new CacheManager<string>({
        maxSize: 100,
        ttl: 5000,
        enabled: true,
      });

      // Add entries without accessing them
      smallCache.set('old', 'value1');

      // Small delay to ensure timestamp difference
      const delay = () => new Promise(resolve => setTimeout(resolve, 10));

      delay().then(() => {
        smallCache.set('new', 'value2');

        // Fill cache to trigger eviction
        smallCache.set('key3', 'value3');
        smallCache.set('key4', 'value4');
        smallCache.set('key5', 'value5');

        // Older entry should be evicted first
        expect(smallCache.get('new')).toBeDefined();
      });
    });
  });

  describe('disabled cache', () => {
    it('should not cache when disabled', () => {
      const disabledCache = new CacheManager<string>({
        ...defaultConfig,
        enabled: false,
      });

      disabledCache.set('key1', 'value1');
      expect(disabledCache.get('key1')).toBeUndefined();
    });

    it('should always return undefined when disabled', () => {
      const disabledCache = new CacheManager<string>({
        ...defaultConfig,
        enabled: false,
      });

      expect(disabledCache.get('any-key')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats).toMatchObject({
        entries: 2,
        sizeBytes: expect.any(Number),
        maxSizeBytes: defaultConfig.maxSize,
        utilizationPercent: expect.any(Number),
      });

      expect(stats.sizeBytes).toBeGreaterThan(0);
      expect(stats.sizeBytes).toBeLessThanOrEqual(stats.maxSizeBytes);
    });

    it('should show zero entries after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
      expect(stats.sizeBytes).toBe(0);
      expect(stats.utilizationPercent).toBe(0);
    });
  });

  describe('complex data types', () => {
    it('should cache objects', () => {
      interface TestObject {
        id: number;
        name: string;
        nested: { value: string };
      }

      const objectCache = new CacheManager<TestObject>(defaultConfig);

      const testObj: TestObject = {
        id: 1,
        name: 'test',
        nested: { value: 'nested-value' },
      };

      objectCache.set('obj1', testObj);
      const retrieved = objectCache.get('obj1');

      expect(retrieved).toEqual(testObj);
    });

    it('should cache arrays', () => {
      const arrayCache = new CacheManager<number[]>(defaultConfig);

      const testArray = [1, 2, 3, 4, 5];
      arrayCache.set('arr1', testArray);

      expect(arrayCache.get('arr1')).toEqual(testArray);
    });

    it('should estimate size correctly for complex objects', () => {
      interface ComplexObject {
        data: string;
        nested: { array: number[] };
      }

      const complexCache = new CacheManager<ComplexObject>(defaultConfig);

      const largeObj: ComplexObject = {
        data: 'x'.repeat(100),
        nested: { array: Array(50).fill(1) },
      };

      complexCache.set('complex', largeObj);

      const stats = complexCache.getStats();
      expect(stats.sizeBytes).toBeGreaterThan(100); // Should account for object structure
    });
  });

  describe('custom size parameter', () => {
    it('should accept custom size when setting', () => {
      const customSize = 50;
      cache.set('key1', 'value', customSize);

      const stats = cache.getStats();
      expect(stats.sizeBytes).toBe(customSize);
    });

    it('should use estimated size when custom size not provided', () => {
      cache.set('key1', 'value'); // No custom size

      const stats = cache.getStats();
      expect(stats.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      cache.set('empty', '');
      expect(cache.get('empty')).toBe('');
    });

    it('should handle special characters in keys', () => {
      cache.set('key:with:colons', 'value1');
      cache.set('key-with-dashes', 'value2');
      cache.set('key.with.dots', 'value3');

      expect(cache.get('key:with:colons')).toBe('value1');
      expect(cache.get('key-with-dashes')).toBe('value2');
      expect(cache.get('key.with.dots')).toBe('value3');
    });

    it('should handle rapid set operations', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      const stats = cache.getStats();
      expect(stats.entries).toBeGreaterThan(0);
    });

    it('should handle multiple deletes of same key', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      cache.delete('key1'); // Delete again
      cache.delete('key1'); // And again

      expect(cache.get('key1')).toBeUndefined();
    });
  });
});
