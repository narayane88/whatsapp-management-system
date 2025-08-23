/**
 * WhatsApp API Test Suite
 * 
 * Simple testing script for the Customer API endpoints
 * Usage: node tests/api-test.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:3100/api/v1',
  API_KEY: process.env.WHATSAPP_API_KEY || 'sk_live_your_api_key_here',
  TEST_NUMBERS: ['9960589622', '8983063144'],
  TEST_DEVICE: process.env.TEST_DEVICE || 'bizflash.in-device-20250121123045'
};

// Test Results
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// HTTP Client Setup
const client = axios.create({
  baseURL: CONFIG.BASE_URL,
  headers: {
    'Authorization': `Bearer ${CONFIG.API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Test Helper Functions
function logTest(name, status, message = '', data = null) {
  const result = {
    name,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${name}: ${message}`);
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  if (data) {
    console.log('   Response:', JSON.stringify(data, null, 2));
  }
}

async function runTest(name, testFn) {
  try {
    const result = await testFn();
    logTest(name, 'PASS', result.message || 'Test passed', result.data);
    return true;
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    logTest(name, 'FAIL', message, error.response?.data);
    return false;
  }
}

// Individual Tests
async function testAuthentication() {
  const response = await client.get('/devices');
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`API returned success: false`);
  }
  
  return {
    message: 'Authentication successful',
    data: { status: response.status, success: response.data.success }
  };
}

async function testDevicesList() {
  const response = await client.get('/devices?format=table');
  
  if (!response.data.success || !response.data.data) {
    throw new Error('Invalid response format');
  }
  
  const { devices, summary } = response.data.data;
  
  return {
    message: `Retrieved ${devices.length} devices`,
    data: { 
      deviceCount: devices.length,
      summary,
      sampleDevice: devices[0] ? {
        deviceName: devices[0].deviceName,
        status: devices[0].status,
        messages: devices[0].messages
      } : null
    }
  };
}

async function testServersList() {
  const response = await client.get('/servers');
  
  if (!response.data.success || !response.data.data) {
    throw new Error('Invalid response format');
  }
  
  const { servers, summary } = response.data.data;
  
  return {
    message: `Retrieved ${servers.length} servers`,
    data: {
      serverCount: servers.length,
      activeServers: summary.active,
      recommendedServer: summary.recommendedServer
    }
  };
}

async function testSendMessageJSON() {
  const response = await client.post('/messages/send', {
    to: CONFIG.TEST_NUMBERS[0],
    message: `Test message from API - JSON format - ${new Date().toISOString()}`,
    deviceName: CONFIG.TEST_DEVICE
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error('Message sending failed');
  }
  
  return {
    message: `Message sent via JSON to ${CONFIG.TEST_NUMBERS[0]}`,
    data: {
      messageId: response.data.data.messageId,
      status: response.data.data.status,
      serverUsed: response.data.data.serverUsed
    }
  };
}

async function testSendMessageFormData() {
  const formData = new URLSearchParams();
  formData.append('to', CONFIG.TEST_NUMBERS[1]);
  formData.append('message', `Test message from API - Form data - ${new Date().toISOString()}`);
  formData.append('deviceName', CONFIG.TEST_DEVICE);
  
  const response = await axios.post(`${CONFIG.BASE_URL}/messages/send`, formData, {
    headers: {
      'Authorization': `Bearer ${CONFIG.API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error('Form data message sending failed');
  }
  
  return {
    message: `Message sent via form-data to ${CONFIG.TEST_NUMBERS[1]}`,
    data: {
      messageId: response.data.data.messageId,
      status: response.data.data.status,
      serverUsed: response.data.data.serverUsed
    }
  };
}

async function testErrorHandling() {
  try {
    await client.post('/messages/send', {
      to: '123', // Invalid phone number
      message: 'Test error handling',
      deviceName: 'invalid_device'
    });
    throw new Error('Expected error but request succeeded');
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      return {
        message: `Error handling works correctly (${error.response.status})`,
        data: {
          status: error.response.status,
          error: error.response.data.error
        }
      };
    }
    throw error;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Starting WhatsApp API Test Suite\n');
  console.log('Configuration:');
  console.log(`  Base URL: ${CONFIG.BASE_URL}`);
  console.log(`  API Key: ${CONFIG.API_KEY.substring(0, 20)}...`);
  console.log(`  Test Device: ${CONFIG.TEST_DEVICE}`);
  console.log(`  Test Numbers: ${CONFIG.TEST_NUMBERS.join(', ')}\n`);
  
  const tests = [
    ['Authentication Test', testAuthentication],
    ['Devices List Test', testDevicesList],
    ['Servers List Test', testServersList],
    ['Send Message (JSON)', testSendMessageJSON],
    ['Send Message (Form Data)', testSendMessageFormData],
    ['Error Handling Test', testErrorHandling]
  ];
  
  for (const [name, testFn] of tests) {
    await runTest(name, testFn);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print Summary
  console.log('\n📊 Test Summary:');
  console.log(`  Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`  ✅ Passed: ${testResults.passed}`);
  console.log(`  ❌ Failed: ${testResults.failed}`);
  console.log(`  Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
  }
  
  // Generate Test Report
  const reportPath = './test-report.json';
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify({
    ...testResults,
    config: CONFIG,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n📄 Test report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('🔥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults,
  CONFIG
};