/**
 * Cache manager for frequently accessed file chunks and metadata
 */

import { CacheEntry, CacheConfig } from './types.js';

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private currentSize = 0;

  constructor(private config: CacheConfig) {}

  /**
   * Get cached value
   */
  get(key: string): T | undefined {
    if (!this.config.enabled) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.delete(key);
      return undefined;
    }

    // Update access count
    entry.accessCount++;
    return entry.data;
  }

  /**
   * Set cached value
   */
  set(key: string, data: T, size?: number): void {
    if (!this.config.enabled) return;

    const entrySize = size || this.estimateSize(data);

    // Evict if necessary
    while (this.currentSize + entrySize > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    // Don't cache if entry is larger than max size
    if (entrySize > this.config.maxSize) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      size: entrySize,
    });

    this.currentSize += entrySize;
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSize,
      maxSizeBytes: this.config.maxSize,
      utilizationPercent: (this.currentSize / this.config.maxSize) * 100,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    let leastAccessed = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime ||
          (entry.timestamp === oldestTime && entry.accessCount < leastAccessed)) {
        oldestTime = entry.timestamp;
        leastAccessed = entry.accessCount;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Estimate size of data
   */
  private estimateSize(data: T): number {
    const json = JSON.stringify(data);
    return Buffer.byteLength(json, 'utf-8');
  }
}
