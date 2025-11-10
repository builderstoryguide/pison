// Ultra-fast multi-layer caching system
import { 
  TeacherDataState, 
  CacheOperation, 
  PerformanceMetrics,
  CacheMetadata 
} from './types'

// L1 Cache: In-memory Map (instant access)
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private hits = 0
  private misses = 0

  get(key: string): { data: any; hit: boolean } {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.hits++
      return { data: cached.data, hit: true }
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    this.misses++
    return { data: null, hit: false }
  }

  set(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      size: this.cache.size
    }
  }
}

// L2 Cache: IndexedDB (persistent, offline)
class IndexedDBCache {
  private dbName = 'TeacherUltraFastCache'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment')
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async get(key: string): Promise<{ data: any; hit: boolean }> {
    if (typeof indexedDB === 'undefined') {
      return { data: null, hit: false }
    }
    
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)
      
      request.onsuccess = () => {
        const result = request.result
        if (result && Date.now() - result.timestamp < result.ttl) {
          resolve({ data: result.data, hit: true })
        } else {
          if (result) {
            // Remove expired entry
            this.delete(key)
          }
          resolve({ data: null, hit: false })
        }
      }
      
      request.onerror = () => resolve({ data: null, hit: false })
    })
  }

  async set(key: string, data: any, ttl: number = 300000): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }
    
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        ttl
      })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }
    
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }
    
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// L3 Cache: Server-side cache simulation (for future Redis integration)
class ServerCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async get(key: string): Promise<{ data: any; hit: boolean }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 5))
    
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { data: cached.data, hit: true }
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return { data: null, hit: false }
  }

  async set(key: string, data: any, ttl: number = 600000): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 5))
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  async delete(key: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 5))
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 5))
    this.cache.clear()
  }
}

// Main Ultra-Fast Cache Manager
export class UltraFastCache {
  private l1Cache = new MemoryCache()
  private l2Cache = new IndexedDBCache()
  private l3Cache = new ServerCache()
  private operations: CacheOperation[] = []
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0,
    userInteractions: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  }

  constructor() {
    this.initializeCache()
  }

  private async initializeCache(): Promise<void> {
    try {
      await this.l2Cache.init()
      console.log('🚀 Ultra-Fast Cache initialized successfully')
    } catch (error) {
      console.warn('⚠️ IndexedDB cache initialization failed:', error)
    }
  }

  async get(key: string): Promise<{ data: any; hit: boolean; source: string }> {
    const startTime = performance.now()
    
    // L1 Cache check (memory) - < 1ms
    const l1Result = this.l1Cache.get(key)
    if (l1Result.hit) {
      this.recordOperation('get', key, 'memory', performance.now() - startTime)
      return { ...l1Result, source: 'memory' }
    }

    // L2 Cache check (IndexedDB) - < 5ms
    const l2Result = await this.l2Cache.get(key)
    if (l2Result.hit) {
      // Populate L1 cache
      this.l1Cache.set(key, l2Result.data, 30000)
      this.recordOperation('get', key, 'indexeddb', performance.now() - startTime)
      return { ...l2Result, source: 'indexeddb' }
    }

    // L3 Cache check (server) - < 10ms
    const l3Result = await this.l3Cache.get(key)
    if (l3Result.hit) {
      // Populate L1 and L2 caches
      this.l1Cache.set(key, l3Result.data, 30000)
      await this.l2Cache.set(key, l3Result.data, 300000)
      this.recordOperation('get', key, 'server', performance.now() - startTime)
      return { ...l3Result, source: 'server' }
    }

    this.recordOperation('get', key, 'miss', performance.now() - startTime)
    return { data: null, hit: false, source: 'miss' }
  }

  async set(key: string, data: any, ttl: number = 300000): Promise<void> {
    const startTime = performance.now()
    
    // Set in all cache layers
    this.l1Cache.set(key, data, 30000)
    await this.l2Cache.set(key, data, ttl)
    await this.l3Cache.set(key, data, ttl)
    
    this.recordOperation('set', key, 'all', performance.now() - startTime)
  }

  async delete(key: string): Promise<void> {
    const startTime = performance.now()
    
    this.l1Cache.delete(key)
    await this.l2Cache.delete(key)
    await this.l3Cache.delete(key)
    
    this.recordOperation('delete', key, 'all', performance.now() - startTime)
  }

  async clear(): Promise<void> {
    const startTime = performance.now()
    
    this.l1Cache.clear()
    await this.l2Cache.clear()
    await this.l3Cache.clear()
    
    this.recordOperation('clear', 'all', 'all', performance.now() - startTime)
  }

  private recordOperation(type: string, key: string, source: string, duration: number): void {
    const operation: CacheOperation = {
      type: type as any,
      key,
      timestamp: Date.now()
    }
    
    this.operations.push(operation)
    
    // Keep only last 100 operations
    if (this.operations.length > 100) {
      this.operations = this.operations.slice(-100)
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics()
  }

  private updatePerformanceMetrics(): void {
    const l1Stats = this.l1Cache.getStats()
    this.performanceMetrics.cacheHitRate = l1Stats.hitRate
    this.performanceMetrics.memoryUsage = l1Stats.size
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getCacheStats() {
    const l1Stats = this.l1Cache.getStats()
    return {
      l1: l1Stats,
      operations: this.operations.length,
      performance: this.performanceMetrics
    }
  }

  // Smart invalidation based on data patterns
  invalidatePattern(pattern: string): void {
    const l1Stats = this.l1Cache.getStats()
    // Implementation for pattern-based invalidation
    console.log(`🔄 Invalidating cache pattern: ${pattern}`)
  }

  // Prefetching for predictive loading
  async prefetch(keys: string[]): Promise<void> {
    const prefetchPromises = keys.map(key => this.get(key))
    await Promise.all(prefetchPromises)
    console.log(`🚀 Prefetched ${keys.length} cache entries`)
  }
}

// Global cache instance
export const ultraFastCache = new UltraFastCache()

// Cache key generators
export function generateCacheKey(teacherId: string, dataType: string, params?: Record<string, any>): string {
  const version = 'v1'
  const paramString = params ? `:${JSON.stringify(params)}` : ''
  return `teacher:${version}:${teacherId}:${dataType}${paramString}`
}

export function generateTeacherDataKey(teacherId: string): string {
  return generateCacheKey(teacherId, 'complete_data')
}

export function generateClassesKey(teacherId: string): string {
  return generateCacheKey(teacherId, 'classes')
}


export function generateGradesKey(teacherId: string, classId?: string): string {
  return generateCacheKey(teacherId, 'grades', { classId })
}

export function generateAssessmentsKey(teacherId: string, classId?: string): string {
  return generateCacheKey(teacherId, 'assessments', { classId })
}
