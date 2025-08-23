#!/usr/bin/env node
/**
 * WhatsApp API Test Script
 * Run this script to test the WhatsApp server at localhost:3005
 * 
 * Usage:
 * npm run test:whatsapp
 * or
 * npx ts-node src/scripts/test-whatsapp-api.ts
 */

import WhatsAppTestRunner from '../__tests__/utils/whatsapp-test-runner'

async function main() {
  console.log('🚀 WhatsApp API Test Runner')
  console.log('=' .repeat(50))
  
  const args = process.argv.slice(2)
  const serverUrl = args[0] || 'http://localhost:3005'
  
  console.log(`🌐 Testing WhatsApp server at: ${serverUrl}`)
  console.log('')
  
  const runner = new WhatsAppTestRunner(serverUrl)
  
  try {
    const results = await runner.runFullTestSuite()
    
    console.log('\n' + '='.repeat(50))
    
    if (results.failed === 0) {
      console.log('🎉 All tests passed! WhatsApp API is working correctly.')
      process.exit(0)
    } else {
      console.log(`⚠️  ${results.failed} test(s) failed. Please check the WhatsApp server.`)
      
      // Show detailed error information
      const failedTests = results.results.filter(r => !r.passed)
      console.log('\n❌ Failed Tests:')
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`)
      })
      
      process.exit(1)
    }
    
  } catch (error) {
    console.error('💥 Test runner crashed:', error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test execution interrupted by user')
  process.exit(0)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

if (require.main === module) {
  main().catch(console.error)
}

export { main as runWhatsAppTests }