import { LRUCache } from 'lru-cache';

// Create a simple in-memory LRU cache
// Cache entries expire after longer periods to reduce API calls and respect rate limits
const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes (increased from 5 to reduce API calls)
});

export function getCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function clearCache(): void {
  cache.clear();
}
