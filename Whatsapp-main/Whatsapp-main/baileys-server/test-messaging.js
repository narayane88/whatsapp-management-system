#!/usr/bin/env node

/**
 * Comprehensive unit test for WhatsApp message sending functionality
 * This script will test:
 * 1. Server connectivity
 * 2. Account listing
 * 3. Account status checking
 * 4. Message sending API
 * 5. Error handling
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🧪 WhatsApp Message Sending Unit Test');
console.log('====================================\n');

const BASE_URL = 'http://localhost:3005';

// Test utilities
function log(step, message, data = null) {
  console.log(`${step}. ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
}

function logError(step, message, error) {
  console.log(`❌ ${step}. ${message}`);
  console.log('Error:', error);
  console.log('');
}

function logSuccess(step, message, data = null) {
  console.log(`✅ ${step}. ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
}

async function makeRequest(url, options = {}) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { rawResponse: text };
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      networkError: true
    };
  }
}

async function runTests() {
  let testAccount = null;
  
  // Test 1: Server Health Check
  try {
    const healthResult = await makeRequest(`${BASE_URL}/api/health`);
    if (healthResult.success) {
      logSuccess('1', 'Server Health Check - OK', {
        status: healthResult.status,
        accounts: healthResult.data.data?.accounts || 0,
        uptime: healthResult.data.data?.uptime || 'unknown'
      });
    } else {
      logError('1', 'Server Health Check - FAILED', healthResult);
      return;
    }
  } catch (error) {
    logError('1', 'Server Health Check - ERROR', error);
    return;
  }

  // Test 2: List All Accounts
  try {
    const accountsResult = await makeRequest(`${BASE_URL}/api/accounts`);
    if (accountsResult.success) {
      const accounts = accountsResult.data.data?.accounts || [];
      logSuccess('2', `Found ${accounts.length} accounts`, accounts);
      
      if (accounts.length > 0) {
        // Find a connected account, prefer the one with most recent connection
        const connectedAccounts = accounts.filter(acc => acc.status === 'connected');
        // Use the most recent account first: device_1754872522409_7s9d6u
        testAccount = connectedAccounts.find(acc => acc.id === 'device_1754872522409_7s9d6u') || 
                     connectedAccounts.find(acc => acc.phoneNumber) || 
                     connectedAccounts[0];
        if (testAccount) {
          log('2a', `Found connected account: ${testAccount.id}`, {
            id: testAccount.id,
            status: testAccount.status,
            phoneNumber: testAccount.phoneNumber,
            userName: testAccount.userName
          });
        } else {
          log('2a', 'No connected accounts found. Available accounts:', accounts.map(acc => ({
            id: acc.id,
            status: acc.status
          })));
        }
      }
    } else {
      logError('2', 'List Accounts - FAILED', accountsResult);
    }
  } catch (error) {
    logError('2', 'List Accounts - ERROR', error);
  }

  // Test 3: Check Specific Account Status
  if (testAccount) {
    try {
      const statusResult = await makeRequest(`${BASE_URL}/api/accounts/${testAccount.id}/status`);
      if (statusResult.success) {
        logSuccess('3', `Account Status Check for ${testAccount.id}`, statusResult.data);
      } else {
        logError('3', `Account Status Check - FAILED`, statusResult);
      }
    } catch (error) {
      logError('3', 'Account Status Check - ERROR', error);
    }
  } else {
    log('3', 'SKIPPED - No test account available');
  }

  // Test 4: Test Message Sending API Validation
  if (testAccount) {
    // Test 4a: Send message with invalid data (should fail validation)
    try {
      const invalidResult = await makeRequest(`${BASE_URL}/api/accounts/${testAccount.id}/send-message`, {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      });
      
      if (!invalidResult.success) {
        logSuccess('4a', 'Validation Test - Correctly rejected invalid data', invalidResult.data);
      } else {
        logError('4a', 'Validation Test - Should have failed but passed', invalidResult);
      }
    } catch (error) {
      logError('4a', 'Validation Test - ERROR', error);
    }

    // Test 4b: Send message with valid data to test number
    try {
      const messageData = {
        to: '918983063144@s.whatsapp.net',
        message: {
          text: `🧪 Unit Test Message - ${new Date().toISOString()}\nThis is a test message from the automated unit test.`
        }
      };

      log('4b', `Attempting to send test message from account ${testAccount.id}`, messageData);

      const messageResult = await makeRequest(`${BASE_URL}/api/accounts/${testAccount.id}/send-message`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });

      if (messageResult.success) {
        logSuccess('4b', 'Message Send - SUCCESS', messageResult.data);
      } else {
        logError('4b', 'Message Send - FAILED', messageResult);
        
        // Additional debugging
        if (messageResult.status === 404) {
          log('4b-debug', 'Account not found - checking SessionManager state...');
          
          // Test direct account lookup
          const debugResult = await makeRequest(`${BASE_URL}/api/accounts/${testAccount.id}/status`);
          if (debugResult.success) {
            log('4b-debug', 'Account exists in status endpoint but not in message endpoint - SessionManager instance issue?');
          } else {
            log('4b-debug', 'Account not found in status endpoint either - account may have been lost');
          }
        }
      }
    } catch (error) {
      logError('4b', 'Message Send - ERROR', error);
    }
  } else {
    log('4', 'SKIPPED - No connected account available for message testing');
    log('4-info', 'To test messaging:');
    log('', '1. Connect a WhatsApp account first');
    log('', '2. Scan QR code to establish connection');
    log('', '3. Ensure account status shows "connected"');
    log('', '4. Re-run this test');
  }

  // Test 5: Test with non-existent account (should fail)
  try {
    const nonExistentResult = await makeRequest(`${BASE_URL}/api/accounts/non-existent-account/send-message`, {
      method: 'POST',
      body: JSON.stringify({
        to: '918983063144@s.whatsapp.net',
        message: { text: 'Test message' }
      })
    });

    if (!nonExistentResult.success && nonExistentResult.data?.error?.includes('not found')) {
      logSuccess('5', 'Non-existent Account Test - Correctly failed', nonExistentResult.data);
    } else {
      logError('5', 'Non-existent Account Test - Unexpected result', nonExistentResult);
    }
  } catch (error) {
    logError('5', 'Non-existent Account Test - ERROR', error);
  }

  // Summary
  console.log('🏁 Unit Test Summary');
  console.log('==================');
  
  if (testAccount) {
    console.log(`✅ Server is running and responsive`);
    console.log(`✅ Found ${testAccount ? 1 : 0} connected account(s)`);
    console.log(`📱 Test Account: ${testAccount.id} (${testAccount.status})`);
    console.log(`📞 Phone Number: ${testAccount.phoneNumber || 'Not detected'}`);
    console.log(`\n🔍 Next Steps:`);
    console.log(`1. Check the Raw Results tab in the frontend for detailed API responses`);
    console.log(`2. Monitor Baileys server logs for any error messages`);
    console.log(`3. Ensure the test account is actually connected and not just showing as connected`);
  } else {
    console.log(`⚠️  No connected accounts found`);
    console.log(`\n🔧 To fix:`);
    console.log(`1. Go to http://localhost:3000/debug/whatsapp`);
    console.log(`2. Create a test account`);
    console.log(`3. Scan the QR code with your WhatsApp mobile app`);
    console.log(`4. Wait for connection status to show "🟢 CONNECTED"`);
    console.log(`5. Re-run this test: node test-messaging.js`);
  }
}

// Run the tests
runTests().catch(console.error);