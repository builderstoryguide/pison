// Ultra-fast performance monitoring and optimization
import React, { useEffect, useRef, useState } from 'react'
import { PerformanceMetrics, PerformanceEvent } from './types'

interface PerformanceConfig {
  enableMonitoring: boolean
  enableOptimization: boolean
  enableReporting: boolean
  sampleRate: number
  maxEvents: number
  reportInterval: number
}

interface PerformanceReport {
  timestamp: string
  duration: number
  events: PerformanceEvent[]
  metrics: PerformanceMetrics
  recommendations: string[]
}

class PerformanceMonitor {
  private config: PerformanceConfig
  private events: PerformanceEvent[] = []
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0,
    userInteractions: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  }
  private observers: Map<string, PerformanceObserver> = new Map()
  private reportInterval: NodeJS.Timeout | null = null
  private memoryInterval: NodeJS.Timeout | null = null
  private eventListeners: Array<{ type: string; handler: () => void }> = []

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMonitoring: true,
      enableOptimization: true,
      enableReporting: true,
      sampleRate: 1.0,
      maxEvents: 1000,
      reportInterval: 30000, // 30 seconds
      ...config
    }

    if (this.config.enableMonitoring) {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring() {
    // Monitor page load performance
    this.observePageLoad()
    
    // Monitor resource loading
    this.observeResourceLoading()
    
    // Monitor user interactions
    this.observeUserInteractions()
    
    // Monitor memory usage
    this.observeMemoryUsage()
    
    // Start periodic reporting
    if (this.config.enableReporting) {
      this.startReporting()
    }
  }

  private observePageLoad() {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.recordEvent({
            type: 'load',
            duration: entry.duration,
            metadata: {
              domContentLoaded: (entry as any).domContentLoadedEventEnd - (entry as any).domContentLoadedEventStart,
              loadComplete: (entry as any).loadEventEnd - (entry as any).loadEventStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint()
            },
            timestamp: new Date().toISOString()
          })
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })
    this.observers.set('navigation', observer)
  }

  private observeResourceLoading() {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.recordEvent({
            type: 'api',
            duration: entry.duration,
            metadata: {
              name: entry.name,
              size: (entry as any).transferSize || 0,
              type: (entry as any).initiatorType
            },
            timestamp: new Date().toISOString()
          })
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
    this.observers.set('resource', observer)
  }

  private observeUserInteractions() {
    if (typeof window === 'undefined') return

    let interactionCount = 0
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart']
    const eventListeners: Array<{ type: string; handler: () => void }> = []

    interactionTypes.forEach((type) => {
      const handler = () => {
        interactionCount++
        this.metrics.userInteractions = interactionCount
        
        this.recordEvent({
          type: 'user_interaction',
          duration: 0,
          metadata: {
            interactionType: type,
            totalInteractions: interactionCount
          },
          timestamp: new Date().toISOString()
        })
      }
      
      document.addEventListener(type, handler, { passive: true })
      eventListeners.push({ type, handler })
    })
    
    // Store event listeners for cleanup
    this.eventListeners = eventListeners
  }

  private observeMemoryUsage() {
    if (typeof window === 'undefined') return

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
        
        this.recordEvent({
          type: 'memory' as any,
          duration: 0,
          metadata: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Update memory usage every 5 seconds
    this.memoryInterval = setInterval(updateMemoryUsage, 5000)
    updateMemoryUsage()
  }

  private getFirstPaint(): number {
    if (typeof window === 'undefined') return 0

    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : 0
  }

  private getFirstContentfulPaint(): number {
    if (typeof window === 'undefined') return 0

    const paintEntries = performance.getEntriesByType('paint')
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0
  }

  recordEvent(event: PerformanceEvent) {
    if (!this.config.enableMonitoring) return

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return

    this.events.push(event)

    // Keep only recent events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents)
    }

    // Update metrics based on event type
    this.updateMetrics(event)
  }

  private updateMetrics(event: PerformanceEvent) {
    switch (event.type) {
      case 'load':
        this.metrics.loadTime = event.duration
        break
      case 'render':
        this.metrics.renderTime = event.duration
        break
      case 'api':
        this.metrics.apiResponseTime = event.duration
        break
      case 'cache': {
        // Update cache hit rate based on cache events
        const cacheEvents = this.events.filter(e => e.type === 'cache')
        const hits = cacheEvents.filter(e => e.metadata?.hit).length
        this.metrics.cacheHitRate = cacheEvents.length > 0 ? (hits / cacheEvents.length) * 100 : 0
        break
      }
    }
  }

  private startReporting() {
    this.reportInterval = setInterval(() => {
      this.generateReport()
    }, this.config.reportInterval)
  }

  private generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      duration: this.config.reportInterval,
      events: [...this.events],
      metrics: { ...this.metrics },
      recommendations: this.generateRecommendations()
    }

    // Send report to analytics service
    this.sendReport(report)

    return report
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // Load time recommendations
    if (this.metrics.loadTime > 2000) {
      recommendations.push('Consider optimizing initial page load - current load time exceeds 2 seconds')
    }

    // Cache hit rate recommendations
    if (this.metrics.cacheHitRate < 80) {
      recommendations.push('Cache hit rate is low - consider implementing more aggressive caching strategies')
    }

    // Memory usage recommendations
    if (this.metrics.memoryUsage > 100) {
      recommendations.push('High memory usage detected - consider implementing memory cleanup strategies')
    }

    // API response time recommendations
    if (this.metrics.apiResponseTime > 500) {
      recommendations.push('API response times are slow - consider optimizing backend queries or implementing caching')
    }

    // Render time recommendations
    if (this.metrics.renderTime > 16) {
      recommendations.push('Render times exceed 16ms - consider optimizing React components or implementing virtualization')
    }

    return recommendations
  }

  private sendReport(report: PerformanceReport) {
    // In a real implementation, this would send to an analytics service
    console.log('📊 Performance Report:', report)
    
    // Store locally for debugging
    if (typeof window !== 'undefined') {
      localStorage.setItem('performance_report', JSON.stringify(report))
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getEvents(): PerformanceEvent[] {
    return [...this.events]
  }

  getRecentEvents(limit: number = 50): PerformanceEvent[] {
    return this.events.slice(-limit)
  }

  clearEvents() {
    this.events = []
  }

  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.enableMonitoring && !this.observers.size) {
      this.initializeMonitoring()
    } else if (!newConfig.enableMonitoring) {
      this.cleanup()
    }
  }

  private cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval)
      this.reportInterval = null
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
      this.memoryInterval = null
    }
    
    this.eventListeners.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler)
    })
    this.eventListeners = []
  }

  destroy() {
    this.cleanup()
    this.events = []
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private optimizations: Map<string, () => void> = new Map()

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Memoize expensive calculations
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const result = func(...args)
      cache.set(key, result)
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        if (firstKey) {
          cache.delete(firstKey)
        }
      }
      
      return result
    }) as T
  }

  // Lazy load components
  lazyLoad(importFunc: () => Promise<any>) {
    return React.lazy(importFunc)
  }

  // Virtual scrolling for large lists
  createVirtualScroller(
    items: any[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: any, index: number) => React.ReactNode
  ) {
    return {
      items,
      itemHeight,
      containerHeight,
      renderItem,
      getVisibleRange: (scrollTop: number) => {
        const start = Math.floor(scrollTop / itemHeight)
        const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
        return { start, end }
      }
    }
  }

  // Image optimization
  optimizeImage(src: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}) {
    // In a real implementation, this would use an image optimization service
    const params = new URLSearchParams()
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (options.format) params.set('f', options.format)
    
    return `${src}?${params.toString()}`
  }

  // Bundle optimization
  async preloadRoute(route: string) {
    // Preload route components
    try {
      await import(route)
    } catch (error) {
      console.warn('Failed to preload route:', route, error)
    }
  }

  // Service worker optimization
  registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service worker registered:', registration)
        })
        .catch(error => {
          console.error('Service worker registration failed:', error)
        })
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor({
  enableMonitoring: true,
  enableOptimization: true,
  enableReporting: true,
  sampleRate: 0.1, // Sample 10% of events
  maxEvents: 500,
  reportInterval: 30000
})

// Performance optimization instance
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Performance hooks for React components
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const renderCount = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = globalThis.performance.now()
    renderCount.current++

    return () => {
      const renderTime = globalThis.performance.now() - renderStartTime.current
      
      performanceMonitor.recordEvent({
        type: 'render',
        duration: renderTime,
        metadata: {
          component: componentName,
          renderCount: renderCount.current
        },
        timestamp: new Date().toISOString()
      })
    }
  })

  return {
    recordUserInteraction: (action: string) => {
      performanceMonitor.recordEvent({
        type: 'user_interaction',
        duration: 0,
        metadata: {
          component: componentName,
          action
        },
        timestamp: new Date().toISOString()
      })
    }
  }
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}

export function usePerformanceOptimization() {
  return {
    debounce: performanceOptimizer.debounce.bind(performanceOptimizer),
    throttle: performanceOptimizer.throttle.bind(performanceOptimizer),
    memoize: performanceOptimizer.memoize.bind(performanceOptimizer),
    lazyLoad: performanceOptimizer.lazyLoad.bind(performanceOptimizer),
    createVirtualScroller: performanceOptimizer.createVirtualScroller.bind(performanceOptimizer),
    optimizeImage: performanceOptimizer.optimizeImage.bind(performanceOptimizer)
  }
}
