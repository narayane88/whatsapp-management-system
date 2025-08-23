/**
 * WhatsApp API Test Runner
 * Utility to test real WhatsApp server functionality
 */

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: unknown
  duration: number
}

export class WhatsAppTestRunner {
  private baseUrl: string
  private results: TestResult[] = []
  
  constructor(baseUrl = 'http://localhost:3005') {
    this.baseUrl = baseUrl
  }
  
  private async runTest<T>(
    name: string, 
    testFn: () => Promise<T>
  ): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const data = await testFn()
      const duration = Date.now() - startTime
      
      const result: TestResult = {
        name,
        passed: true,
        data,
        duration
      }
      
      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      const result: TestResult = {
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      }
      
      this.results.push(result)
      return result
    }
  }
  
  async testHealthCheck(): Promise<TestResult> {
    return this.runTest('Health Check', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.data || !data.data.status) {
        throw new Error('Invalid health response format')
      }
      
      if (data.data.status !== 'healthy') {
        throw new Error(`Server unhealthy: ${data.data.status}`)
      }
      
      return {
        status: data.data.status,
        uptime: data.data.uptime,
        version: data.data.version,
        timestamp: data.data.timestamp
      }
    })
  }
  
  async testServerStats(): Promise<TestResult> {
    return this.runTest('Server Statistics', async () => {
      const response = await fetch(`${this.baseUrl}/api/stats`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Stats failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.data || !data.data.accounts) {
        throw new Error('Invalid stats response format')
      }
      
      return {
        totalAccounts: data.data.accounts.total,
        connectedAccounts: data.data.accounts.connected,
        disconnectedAccounts: data.data.accounts.disconnected
      }
    })
  }
  
  async testAccountCreation(accountId: string, _accountName: string): Promise<TestResult> {
    return this.runTest('Account Creation', async () => {
      const response = await fetch(`${this.baseUrl}/api/accounts/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: accountId
          // Note: 'name' field is not accepted by this API
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Account creation failed: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (!data.data || !data.data.id) {
        throw new Error('Invalid account creation response')
      }
      
      return {
        id: data.data.id,
        status: data.data.status,
        message: data.message || 'Account created'
      }
    })
  }
  
  async testQRCodeGeneration(accountId: string): Promise<TestResult> {
    return this.runTest('QR Code Generation', async () => {
      // Wait for QR code generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch(`${this.baseUrl}/api/accounts/${accountId}/qr`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('QR code not available yet')
        }
        throw new Error(`QR request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle different response formats
      const qrCode = data.data?.qr || data.qr || data.data?.qrCode || data.qrCode || data.qrCode
      
      if (!qrCode) {
        console.log('QR Response data:', JSON.stringify(data, null, 2))
        throw new Error('No QR code in response')
      }
      
      if (!qrCode.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid QR code format')
      }
      
      return {
        hasQR: true,
        qrLength: qrCode.length,
        format: 'base64 PNG'
      }
    })
  }
  
  async testAccountStatus(accountId: string): Promise<TestResult> {
    return this.runTest('Account Status', async () => {
      const response = await fetch(`${this.baseUrl}/api/accounts/${accountId}/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Status request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.data) {
        throw new Error('Invalid status response')
      }
      
      const validStatuses = ['CONNECTING', 'CONNECTED', 'DISCONNECTED', 'AUTHENTICATING', 'ERROR', 'connecting', 'connected', 'disconnected', 'authenticating', 'error']
      if (!validStatuses.includes(data.data.status)) {
        throw new Error(`Invalid status: ${data.data.status}`)
      }
      
      return {
        id: data.data.id,
        status: data.data.status,
        lastActivity: data.data.lastActivity
      }
    })
  }
  
  async testAccountDisconnection(accountId: string): Promise<TestResult> {
    return this.runTest('Account Disconnection', async () => {
      const response = await fetch(`${this.baseUrl}/api/accounts/${accountId}/disconnect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Disconnect failed: ${response.status} ${response.statusText}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        return {
          disconnected: true,
          id: data.data?.id || accountId
        }
      } else {
        return {
          disconnected: false,
          reason: 'Account not found'
        }
      }
    })
  }
  
  async runFullTestSuite(): Promise<{
    passed: number
    failed: number
    total: number
    results: TestResult[]
    summary: string
  }> {
    console.log('🧪 Starting WhatsApp API Test Suite...')
    
    this.results = [] // Reset results
    const testAccountId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const testAccountName = `Test Account ${new Date().toISOString()}`
    
    // Run all tests
    await this.testHealthCheck()
    await this.testServerStats()
    await this.testAccountCreation(testAccountId, testAccountName)
    await this.testQRCodeGeneration(testAccountId)
    await this.testAccountStatus(testAccountId)
    await this.testAccountDisconnection(testAccountId)
    
    // Calculate summary
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length
    
    const summary = `
📊 Test Results Summary:
✅ Passed: ${passed}/${total}
❌ Failed: ${failed}/${total}
⏱️  Total Duration: ${this.results.reduce((sum, r) => sum + r.duration, 0)}ms

${this.results.map(r => 
  r.passed 
    ? `✅ ${r.name} (${r.duration}ms)`
    : `❌ ${r.name} (${r.duration}ms): ${r.error}`
).join('\n')}
    `.trim()
    
    console.log(summary)
    
    return {
      passed,
      failed,
      total,
      results: this.results,
      summary
    }
  }
  
  getResults(): TestResult[] {
    return this.results
  }
  
  clearResults(): void {
    this.results = []
  }
}

// Convenience function for quick testing
export async function quickTest(): Promise<void> {
  const runner = new WhatsAppTestRunner()
  await runner.runFullTestSuite()
}

// Export for use in other files
export default WhatsAppTestRunner