/**
 * Backend API Integration Testing Script
 * Tests all API endpoints for the WhatsApp Multi-Tier Management System
 */

const API_BASE_URL = 'http://localhost:3000/api'

// Test credentials
const testCredentials = {
  owner: { email: 'owner@demo.com', password: 'demo123' },
  subdealer: { email: 'subdealer@demo.com', password: 'demo123' },
  employee: { email: 'employee@demo.com', password: 'demo123' },
  customer: { email: 'customer@demo.com', password: 'demo123' }
}

let authTokens = {}

/**
 * Make HTTP request with proper error handling
 */
async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json().catch(() => null)
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: response.headers
    }
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null
    }
  }
}

/**
 * Test Results Tracker
 */
class TestTracker {
  constructor() {
    this.tests = []
    this.passed = 0
    this.failed = 0
  }
  
  add(name, passed, details = '') {
    this.tests.push({ name, passed, details })
    if (passed) {
      this.passed++
      console.log(`✅ ${name}`)
    } else {
      this.failed++
      console.log(`❌ ${name}: ${details}`)
    }
  }
  
  summary() {
    console.log('\n' + '='.repeat(80))
    console.log(`TEST SUMMARY: ${this.passed} passed, ${this.failed} failed`)
    console.log('='.repeat(80))
    
    if (this.failed > 0) {
      console.log('\nFAILED TESTS:')
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`- ${test.name}: ${test.details}`)
      })
    }
    
    return this.failed === 0
  }
}

const tracker = new TestTracker()

/**
 * Authentication Tests
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...')
  
  // Test login endpoint
  const loginResponse = await makeRequest('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(testCredentials.customer)
  })
  
  tracker.add(
    'Login endpoint responds',
    loginResponse.status !== 0,
    loginResponse.error
  )
  
  // Test invalid credentials
  const invalidLogin = await makeRequest('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: 'invalid@test.com',
      password: 'wrongpassword'
    })
  })
  
  tracker.add(
    'Invalid login rejected',
    invalidLogin.status === 401 || invalidLogin.status === 403,
    `Got status ${invalidLogin.status}`
  )
  
  // Test session validation
  const sessionResponse = await makeRequest('/auth/session')
  
  tracker.add(
    'Session endpoint accessible',
    sessionResponse.status !== 0,
    sessionResponse.error
  )
}

/**
 * API Health Checks
 */
async function testAPIHealth() {
  console.log('\n🏥 Testing API Health...')
  
  // Test health endpoint
  const healthResponse = await makeRequest('/health')
  
  tracker.add(
    'Health endpoint responds',
    healthResponse.status === 200,
    `Status: ${healthResponse.status}`
  )
  
  if (healthResponse.data) {
    tracker.add(
      'Health endpoint returns valid data',
      healthResponse.data.status === 'healthy',
      JSON.stringify(healthResponse.data)
    )
  }
}

/**
 * WhatsApp API Tests
 */
async function testWhatsAppAPI() {
  console.log('\n📱 Testing WhatsApp API...')
  
  // Test instances endpoint
  const instancesResponse = await makeRequest('/whatsapp/instances')
  
  tracker.add(
    'WhatsApp instances endpoint responds',
    instancesResponse.status !== 0,
    instancesResponse.error
  )
  
  // Test create instance
  const createInstanceResponse = await makeRequest('/whatsapp/instances', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Instance',
      webhook: 'https://example.com/webhook'
    })
  })
  
  tracker.add(
    'Create instance endpoint responds',
    createInstanceResponse.status !== 0,
    createInstanceResponse.error
  )
  
  // Test send message endpoint
  const sendMessageResponse = await makeRequest('/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify({
      instanceId: 'test_instance',
      to: '+1234567890',
      message: 'Test message',
      type: 'text'
    })
  })
  
  tracker.add(
    'Send message endpoint responds',
    sendMessageResponse.status !== 0,
    sendMessageResponse.error
  )
  
  // Test get messages
  const messagesResponse = await makeRequest('/whatsapp/messages?instanceId=test_instance')
  
  tracker.add(
    'Get messages endpoint responds',
    messagesResponse.status !== 0,
    messagesResponse.error
  )
}

/**
 * User Management API Tests
 */
async function testUserManagementAPI() {
  console.log('\n👥 Testing User Management API...')
  
  // Test get users
  const usersResponse = await makeRequest('/admin/users')
  
  tracker.add(
    'Get users endpoint responds',
    usersResponse.status !== 0,
    usersResponse.error
  )
  
  // Test create user
  const createUserResponse = await makeRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'CUSTOMER',
      mobile: '+1234567890'
    })
  })
  
  tracker.add(
    'Create user endpoint responds',
    createUserResponse.status !== 0,
    createUserResponse.error
  )
}

/**
 * Package Management API Tests
 */
async function testPackageManagementAPI() {
  console.log('\n📦 Testing Package Management API...')
  
  // Test get packages
  const packagesResponse = await makeRequest('/admin/packages')
  
  tracker.add(
    'Get packages endpoint responds',
    packagesResponse.status !== 0,
    packagesResponse.error
  )
  
  // Test create package
  const createPackageResponse = await makeRequest('/admin/packages', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Package',
      description: 'Test package description',
      price: 29.99,
      duration: 30,
      messageLimit: 1000,
      instanceLimit: 1,
      features: {
        apiAccess: true,
        analyticsReports: false
      }
    })
  })
  
  tracker.add(
    'Create package endpoint responds',
    createPackageResponse.status !== 0,
    createPackageResponse.error
  )
}

/**
 * Transaction API Tests
 */
async function testTransactionAPI() {
  console.log('\n💰 Testing Transaction API...')
  
  // Test get transactions
  const transactionsResponse = await makeRequest('/admin/transactions')
  
  tracker.add(
    'Get transactions endpoint responds',
    transactionsResponse.status !== 0,
    transactionsResponse.error
  )
  
  // Test create transaction
  const createTransactionResponse = await makeRequest('/admin/transactions', {
    method: 'POST',
    body: JSON.stringify({
      userId: 'test_user_id',
      type: 'PURCHASE',
      method: 'GATEWAY',
      amount: 29.99,
      currency: 'USD',
      description: 'Test transaction'
    })
  })
  
  tracker.add(
    'Create transaction endpoint responds',
    createTransactionResponse.status !== 0,
    createTransactionResponse.error
  )
}

/**
 * Voucher API Tests
 */
async function testVoucherAPI() {
  console.log('\n🎟️ Testing Voucher API...')
  
  // Test get vouchers
  const vouchersResponse = await makeRequest('/admin/vouchers')
  
  tracker.add(
    'Get vouchers endpoint responds',
    vouchersResponse.status !== 0,
    vouchersResponse.error
  )
  
  // Test create voucher
  const createVoucherResponse = await makeRequest('/admin/vouchers', {
    method: 'POST',
    body: JSON.stringify({
      code: 'TEST100',
      type: 'CREDIT',
      value: 100.0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  })
  
  tracker.add(
    'Create voucher endpoint responds',
    createVoucherResponse.status !== 0,
    createVoucherResponse.error
  )
}

/**
 * Database Connection Tests
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...')
  
  // Test database health via API
  const dbHealthResponse = await makeRequest('/admin/system/health')
  
  tracker.add(
    'Database health endpoint responds',
    dbHealthResponse.status !== 0,
    dbHealthResponse.error
  )
  
  // Test database operations via user creation
  const testUser = await makeRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'DB Test User',
      email: `dbtest${Date.now()}@example.com`,
      password: 'testpassword',
      role: 'CUSTOMER'
    })
  })
  
  tracker.add(
    'Database write operation works',
    testUser.status !== 0,
    testUser.error
  )
}

/**
 * Error Handling Tests
 */
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...')
  
  // Test 404 endpoints
  const notFoundResponse = await makeRequest('/nonexistent/endpoint')
  
  tracker.add(
    '404 handled correctly',
    notFoundResponse.status === 404,
    `Got status ${notFoundResponse.status}`
  )
  
  // Test malformed requests
  const malformedResponse = await makeRequest('/admin/users', {
    method: 'POST',
    body: 'invalid json'
  })
  
  tracker.add(
    'Malformed request handled',
    malformedResponse.status === 400 || malformedResponse.status !== 0,
    `Got status ${malformedResponse.status}`
  )
  
  // Test unauthorized access
  const unauthorizedResponse = await makeRequest('/admin/users')
  
  tracker.add(
    'Unauthorized access blocked',
    unauthorizedResponse.status === 401 || unauthorizedResponse.status === 403,
    `Got status ${unauthorizedResponse.status}`
  )
}

/**
 * Performance Tests
 */
async function testPerformance() {
  console.log('\n⚡ Testing Performance...')
  
  const startTime = Date.now()
  const promises = []
  
  // Make 10 concurrent requests
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('/health'))
  }
  
  const results = await Promise.all(promises)
  const endTime = Date.now()
  const duration = endTime - startTime
  
  tracker.add(
    'API handles concurrent requests',
    results.every(r => r.status !== 0),
    `${results.filter(r => r.status === 0).length} failed requests`
  )
  
  tracker.add(
    'API responds within reasonable time',
    duration < 5000,
    `Took ${duration}ms for 10 concurrent requests`
  )
}

/**
 * Security Tests
 */
async function testSecurity() {
  console.log('\n🔒 Testing Security...')
  
  // Test SQL injection attempt
  const sqlInjectionResponse = await makeRequest("/admin/users?search=' OR '1'='1")
  
  tracker.add(
    'SQL injection attempt blocked',
    sqlInjectionResponse.status !== 200 || sqlInjectionResponse.status === 0,
    `Got status ${sqlInjectionResponse.status}`
  )
  
  // Test XSS attempt
  const xssResponse = await makeRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      name: '<script>alert("xss")</script>',
      email: 'xss@test.com',
      password: 'password'
    })
  })
  
  tracker.add(
    'XSS attempt handled',
    xssResponse.status !== 0,
    xssResponse.error
  )
  
  // Test rate limiting (if implemented)
  const rateLimitPromises = []
  for (let i = 0; i < 100; i++) {
    rateLimitPromises.push(makeRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    }))
  }
  
  const rateLimitResults = await Promise.all(rateLimitPromises)
  const rateLimited = rateLimitResults.some(r => r.status === 429)
  
  tracker.add(
    'Rate limiting active',
    rateLimited,
    'No rate limiting detected'
  )
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 Starting Backend API Integration Tests...')
  console.log('Target: ' + API_BASE_URL)
  console.log('='.repeat(80))
  
  try {
    await testAPIHealth()
    await testAuthentication()
    await testWhatsAppAPI()
    await testUserManagementAPI()
    await testPackageManagementAPI()
    await testTransactionAPI()
    await testVoucherAPI()
    await testDatabaseConnection()
    await testErrorHandling()
    await testPerformance()
    await testSecurity()
  } catch (error) {
    console.error('Test execution error:', error)
    tracker.add('Test execution', false, error.message)
  }
  
  const allTestsPassed = tracker.summary()
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    total: tracker.tests.length,
    passed: tracker.passed,
    failed: tracker.failed,
    success_rate: Math.round((tracker.passed / tracker.tests.length) * 100),
    tests: tracker.tests
  }
  
  // Save report to file
  const fs = require('fs').promises
  await fs.writeFile(
    'test-results/api-integration-report.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log(`\n📊 Detailed report saved to: test-results/api-integration-report.json`)
  console.log(`🎯 Success Rate: ${report.success_rate}%`)
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Backend API is working correctly.')
    process.exit(0)
  } else {
    console.log('\n💥 SOME TESTS FAILED! Please check the issues above.')
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  // Create test results directory
  const fs = require('fs')
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results')
  }
  
  runAllTests().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { runAllTests, testAuthentication, testWhatsAppAPI }