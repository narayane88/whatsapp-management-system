// Performance monitoring utilities

interface PerformanceMark {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map()

  // Start timing an operation
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      this.marks.set(name, {
        name,
        startTime: performance.now()
      })
    }
  }

  // End timing and log results
  measure(name: string, threshold: number = 100): number | null {
    if (typeof window === 'undefined' || !window.performance) return null

    const mark = this.marks.get(name)
    if (!mark) return null

    const endTime = performance.now()
    const duration = endTime - mark.startTime

    mark.endTime = endTime
    mark.duration = duration

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > threshold) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  // Get performance report
  getReport(): PerformanceMark[] {
    return Array.from(this.marks.values()).filter(mark => mark.duration !== undefined)
  }

  // Clear all marks
  clear(): void {
    this.marks.clear()
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor()

// Permission system performance monitoring
export const monitorPermissionCheck = <T>(operationName: string, fn: () => T): T => {
  perfMonitor.mark(operationName)
  const result = fn()
  perfMonitor.measure(operationName, 10) // Warn if permission check > 10ms
  return result
}

// Page load performance monitoring
export const monitorPageLoad = (pageName: string) => {
  if (typeof window === 'undefined') return

  // Monitor React hydration
  perfMonitor.mark(`${pageName}-load`)
  
  // Use requestAnimationFrame to measure after render
  requestAnimationFrame(() => {
    perfMonitor.measure(`${pageName}-load`, 500) // Warn if page load > 500ms
  })
}

// Permission API call monitoring
export const monitorApiCall = async <T>(url: string, fetchFn: () => Promise<T>): Promise<T> => {
  const operationName = `api-${url.replace(/\//g, '-')}`
  perfMonitor.mark(operationName)
  
  try {
    const result = await fetchFn()
    perfMonitor.measure(operationName, 200) // Warn if API call > 200ms
    return result
  } catch (error) {
    perfMonitor.measure(operationName, 200)
    throw error
  }
}

// Cache hit rate monitoring
class CacheMonitor {
  private hits: number = 0
  private misses: number = 0

  hit(): void {
    this.hits++
  }

  miss(): void {
    this.misses++
  }

  getHitRate(): number {
    const total = this.hits + this.misses
    return total > 0 ? (this.hits / total) * 100 : 0
  }

  getStats(): { hits: number; misses: number; hitRate: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate()
    }
  }

  reset(): void {
    this.hits = 0
    this.misses = 0
  }
}

export const permissionCacheMonitor = new CacheMonitor()

// Performance debugging in development
if (process.env.NODE_ENV === 'development') {
  // Log performance report every 30 seconds
  setInterval(() => {
    const report = perfMonitor.getReport()
    const cacheStats = permissionCacheMonitor.getStats()
    
    if (report.length > 0) {
      console.group('🔍 Performance Report')
      console.table(report.map(mark => ({
        Operation: mark.name,
        Duration: `${mark.duration?.toFixed(2)}ms`
      })))
      console.log('📊 Cache Stats:', cacheStats)
      console.groupEnd()
      
      // Clear old marks
      perfMonitor.clear()
      permissionCacheMonitor.reset()
    }
  }, 30000)
}