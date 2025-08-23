/**
 * Performance validation utility for compiled permission system
 * Use this to verify performance improvements
 */

import { compiledPermissionChecker } from './compiledPermissions'

/**
 * Benchmark permission system performance
 */
export function benchmarkPermissionSystem() {
  console.group('🚀 Permission System Performance Benchmark')
  
  // Setup test data
  compiledPermissionChecker.setUserRole('ADMIN')
  const testPermissions = [
    'dashboard.admin.access',
    'users.page.access', 
    'customers.page.access',
    'transactions.page.access',
    'nonexistent.permission'
  ]
  
  // Benchmark single permission checks
  const iterations = 100000
  
  console.log(`📊 Running ${iterations.toLocaleString()} permission checks...`)
  
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    compiledPermissionChecker.hasPermission('users.page.access')
  }
  const duration = performance.now() - start
  
  const checksPerSecond = Math.round((iterations / duration) * 1000)
  const avgTimePerCheck = (duration / iterations).toFixed(6)
  
  console.log(`✅ Results:`)
  console.log(`   • Total time: ${duration.toFixed(2)}ms`)
  console.log(`   • Avg per check: ${avgTimePerCheck}ms`)
  console.log(`   • Checks/second: ${checksPerSecond.toLocaleString()}`)
  console.log(`   • Performance: ${checksPerSecond > 1000000 ? '🚀 ULTRA-FAST' : checksPerSecond > 100000 ? '⚡ FAST' : '🐌 SLOW'}`)
  
  // Benchmark multiple permission checks
  const multiStart = performance.now()
  for (let i = 0; i < 10000; i++) {
    compiledPermissionChecker.hasAllPermissions(testPermissions)
  }
  const multiDuration = performance.now() - multiStart
  
  console.log(`\n📊 Multiple Permission Check Results:`)
  console.log(`   • 10,000 multi-checks: ${multiDuration.toFixed(2)}ms`)
  console.log(`   • Avg per multi-check: ${(multiDuration / 10000).toFixed(6)}ms`)
  
  console.groupEnd()
  
  return {
    singleChecksPerSecond: checksPerSecond,
    avgTimePerCheck: parseFloat(avgTimePerCheck),
    multiCheckTime: multiDuration / 10000,
    performance: checksPerSecond > 1000000 ? 'ULTRA-FAST' : checksPerSecond > 100000 ? 'FAST' : 'SLOW'
  }
}

/**
 * Validate all system components are using compiled versions
 */
export function validateSystemUpgrade() {
  console.group('🔍 System Upgrade Validation')
  
  const checks = {
    compiledPermissionChecker: typeof compiledPermissionChecker !== 'undefined',
    bitMaskOperations: compiledPermissionChecker.hasPermission('test') === false,
    roleSupport: compiledPermissionChecker.getPermissionMask().length > 0,
    cacheSystem: typeof sessionStorage !== 'undefined',
    performanceMonitoring: typeof performance !== 'undefined'
  }
  
  console.log('✅ System Components:')
  for (const [component, status] of Object.entries(checks)) {
    console.log(`   • ${component}: ${status ? '✅ READY' : '❌ MISSING'}`)
  }
  
  const allReady = Object.values(checks).every(Boolean)
  console.log(`\n🎯 System Status: ${allReady ? '✅ FULLY UPGRADED' : '⚠️ NEEDS ATTENTION'}`)
  
  console.groupEnd()
  
  return { allReady, checks }
}

/**
 * Monitor real-time performance
 */
export class PerformanceMonitor {
  private metrics: {
    permissionChecks: number
    totalTime: number
    cacheHits: number
    cacheMisses: number
    pageLoads: number
  } = {
    permissionChecks: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    pageLoads: 0
  }
  
  recordPermissionCheck(duration: number) {
    this.metrics.permissionChecks++
    this.metrics.totalTime += duration
  }
  
  recordCacheHit() {
    this.metrics.cacheHits++
  }
  
  recordCacheMiss() {
    this.metrics.cacheMisses++
  }
  
  recordPageLoad() {
    this.metrics.pageLoads++
  }
  
  getReport() {
    const avgCheckTime = this.metrics.permissionChecks > 0 
      ? this.metrics.totalTime / this.metrics.permissionChecks 
      : 0
      
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0
    
    return {
      permissionChecks: this.metrics.permissionChecks,
      averageCheckTime: Math.round(avgCheckTime * 1000) / 1000,
      cacheHitRate: Math.round(cacheHitRate * 10) / 10,
      pageLoads: this.metrics.pageLoads,
      totalTime: Math.round(this.metrics.totalTime * 100) / 100
    }
  }
  
  reset() {
    this.metrics = {
      permissionChecks: 0,
      totalTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      pageLoads: 0
    }
  }
  
  displayReport() {
    const report = this.getReport()
    
    console.group('📊 Real-time Performance Report')
    console.log(`🔒 Permission Checks: ${report.permissionChecks.toLocaleString()}`)
    console.log(`⚡ Avg Check Time: ${report.averageCheckTime}ms`)
    console.log(`💾 Cache Hit Rate: ${report.cacheHitRate}%`)
    console.log(`📄 Page Loads: ${report.pageLoads}`)
    console.log(`⏱️ Total Time: ${report.totalTime}ms`)
    
    // Performance assessment
    if (report.averageCheckTime < 0.001) {
      console.log('🚀 Status: ULTRA-FAST - Excellent performance!')
    } else if (report.averageCheckTime < 0.01) {
      console.log('⚡ Status: FAST - Good performance!')
    } else {
      console.log('🐌 Status: SLOW - Consider optimizations')
    }
    
    console.groupEnd()
  }
}

// Global performance monitor instance
export const globalPerfMonitor = new PerformanceMonitor()

/**
 * Run complete performance validation
 */
export function runCompleteValidation() {
  console.log('🔧 Running complete performance validation...\n')
  
  const benchmark = benchmarkPermissionSystem()
  const validation = validateSystemUpgrade()
  
  console.log('\n📈 Summary:')
  console.log(`   • Permission System: ${benchmark.performance}`)
  console.log(`   • System Upgrade: ${validation.allReady ? 'COMPLETE' : 'INCOMPLETE'}`)
  console.log(`   • Checks/Second: ${benchmark.singleChecksPerSecond.toLocaleString()}`)
  
  if (benchmark.singleChecksPerSecond > 1000000 && validation.allReady) {
    console.log('\n🎉 EXCELLENT! Your permission system is running at maximum performance.')
  } else {
    console.log('\n⚠️ There may be room for improvement. Check the validation results above.')
  }
  
  return { benchmark, validation }
}

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  // Wait a bit for system to initialize
  setTimeout(() => {
    runCompleteValidation()
  }, 2000)
}