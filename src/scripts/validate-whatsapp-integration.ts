#!/usr/bin/env node
/**
 * WhatsApp Integration Validation Script
 * Validates that all components work together correctly
 */

async function validateIntegration() {
  console.log('🔍 Validating WhatsApp Integration...')
  console.log('=' .repeat(50))
  
  const baseUrl = 'http://localhost:3000'
  const tests = []
  
  // Test 1: Debug API Health
  console.log('1️⃣ Testing Debug API Health...')
  try {
    const response = await fetch(`${baseUrl}/api/debug/whatsapp?action=health`)
    const result = await response.json()
    
    if (result.success) {
      console.log('  ✅ Debug API Health: PASSED')
      console.log(`     Server Status: ${result.data?.data?.status}`)
      tests.push({ name: 'Debug API Health', passed: true })
    } else {
      console.log('  ❌ Debug API Health: FAILED')
      console.log(`     Error: ${result.error}`)
      tests.push({ name: 'Debug API Health', passed: false, error: result.error })
    }
  } catch (error) {
    console.log('  ❌ Debug API Health: ERROR')
    console.log(`     Error: ${error}`)
    tests.push({ name: 'Debug API Health', passed: false, error: String(error) })
  }
  
  // Test 2: Customer Host Servers API
  console.log('\n2️⃣ Testing Customer Host Servers API...')
  try {
    const response = await fetch(`${baseUrl}/api/customer/host/servers`)
    
    if (response.status === 401) {
      console.log('  ✅ Customer Servers API: PASSED (Requires Auth)')
      tests.push({ name: 'Customer Servers API', passed: true, note: 'Auth required' })
    } else if (response.ok) {
      const servers = await response.json()
      console.log('  ✅ Customer Servers API: PASSED')
      console.log(`     Found ${Array.isArray(servers) ? servers.length : 'N/A'} servers`)
      tests.push({ name: 'Customer Servers API', passed: true })
    } else {
      console.log('  ❌ Customer Servers API: FAILED')
      console.log(`     Status: ${response.status} ${response.statusText}`)
      tests.push({ name: 'Customer Servers API', passed: false, error: response.statusText })
    }
  } catch (error) {
    console.log('  ❌ Customer Servers API: ERROR')
    console.log(`     Error: ${error}`)
    tests.push({ name: 'Customer Servers API', passed: false, error: String(error) })
  }
  
  // Test 3: Customer Host Connections API
  console.log('\n3️⃣ Testing Customer Host Connections API...')
  try {
    const response = await fetch(`${baseUrl}/api/customer/host/connections`)
    
    if (response.status === 401) {
      console.log('  ✅ Customer Connections API: PASSED (Requires Auth)')
      tests.push({ name: 'Customer Connections API', passed: true, note: 'Auth required' })
    } else if (response.ok) {
      const connections = await response.json()
      console.log('  ✅ Customer Connections API: PASSED')
      console.log(`     Found ${Array.isArray(connections) ? connections.length : 'N/A'} connections`)
      tests.push({ name: 'Customer Connections API', passed: true })
    } else {
      console.log('  ❌ Customer Connections API: FAILED')
      console.log(`     Status: ${response.status} ${response.statusText}`)
      tests.push({ name: 'Customer Connections API', passed: false, error: response.statusText })
    }
  } catch (error) {
    console.log('  ❌ Customer Connections API: ERROR')
    console.log(`     Error: ${error}`)
    tests.push({ name: 'Customer Connections API', passed: false, error: String(error) })
  }
  
  // Test 4: Debug Page Accessibility
  console.log('\n4️⃣ Testing Debug Page Accessibility...')
  try {
    const response = await fetch(`${baseUrl}/debug/whatsapp`)
    
    if (response.ok) {
      console.log('  ✅ Debug Page: PASSED')
      console.log('     Debug page is accessible')
      tests.push({ name: 'Debug Page', passed: true })
    } else {
      console.log('  ❌ Debug Page: FAILED')
      console.log(`     Status: ${response.status} ${response.statusText}`)
      tests.push({ name: 'Debug Page', passed: false, error: response.statusText })
    }
  } catch (error) {
    console.log('  ❌ Debug Page: ERROR')
    console.log(`     Error: ${error}`)
    tests.push({ name: 'Debug Page', passed: false, error: String(error) })
  }
  
  // Test 5: WhatsApp Server Direct Connection
  console.log('\n5️⃣ Testing WhatsApp Server Direct Connection...')
  try {
    const response = await fetch('http://localhost:3005/api/health')
    
    if (response.ok) {
      const result = await response.json()
      console.log('  ✅ WhatsApp Server Direct: PASSED')
      console.log(`     Server Status: ${result.data?.status}`)
      console.log(`     Server Version: ${result.data?.version}`)
      tests.push({ name: 'WhatsApp Server Direct', passed: true })
    } else {
      console.log('  ❌ WhatsApp Server Direct: FAILED')
      console.log(`     Status: ${response.status} ${response.statusText}`)
      tests.push({ name: 'WhatsApp Server Direct', passed: false, error: response.statusText })
    }
  } catch (error) {
    console.log('  ❌ WhatsApp Server Direct: FAILED')
    console.log('     WhatsApp server not running on localhost:3005')
    tests.push({ name: 'WhatsApp Server Direct', passed: false, error: 'Server not running' })
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(50))
  
  const passed = tests.filter(t => t.passed).length
  const total = tests.length
  
  tests.forEach(test => {
    const status = test.passed ? '✅' : '❌'
    const note = test.note ? ` (${test.note})` : ''
    const error = test.error ? ` - ${test.error}` : ''
    console.log(`${status} ${test.name}${note}${error}`)
  })
  
  console.log('\n' + '-'.repeat(30))
  console.log(`📈 Overall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All validations passed! Integration is working correctly.')
    console.log('\n💡 Next steps:')
    console.log('   • Visit http://localhost:3000/debug/whatsapp for full testing')
    console.log('   • Visit http://localhost:3000/customer/host for customer portal')
    console.log('   • Run npm run test:whatsapp for comprehensive API tests')
  } else {
    console.log(`⚠️  ${total - passed} validation(s) failed.`)
    console.log('\n🔧 Troubleshooting:')
    
    if (!tests.find(t => t.name === 'WhatsApp Server Direct')?.passed) {
      console.log('   • Ensure WhatsApp server is running on localhost:3005')
      console.log('   • Check WhatsApp server logs for errors')
    }
    
    if (!tests.find(t => t.name === 'Debug API Health')?.passed) {
      console.log('   • Check Next.js server is running properly')
      console.log('   • Verify debug API route is accessible')
    }
    
    console.log('   • Check server logs for detailed error messages')
  }
  
  process.exit(passed === total ? 0 : 1)
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Validation interrupted by user')
  process.exit(0)
})

// Run validation
if (require.main === module) {
  validateIntegration().catch(console.error)
}

export { validateIntegration }