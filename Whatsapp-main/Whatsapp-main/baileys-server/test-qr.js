#!/usr/bin/env node

const fetch = require('node-fetch').default;

const SERVER_URL = 'http://localhost:3005';

async function testQRValidation() {
  console.log('🧪 Testing QR Code Validation...\n');
  
  try {
    // 1. Create test account
    const accountId = `qr_test_${Date.now()}`;
    console.log(`📱 Creating test account: ${accountId}`);
    
    const createResponse = await fetch(`${SERVER_URL}/api/accounts/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accountId })
    });
    
    const createResult = await createResponse.json();
    console.log(`✅ Account created: ${JSON.stringify(createResult, null, 2)}\n`);
    
    // 2. Wait for QR generation
    console.log('⏳ Waiting for QR code generation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Get QR code
    const qrResponse = await fetch(`${SERVER_URL}/api/accounts/${accountId}/qr`);
    const qrResult = await qrResponse.json();
    
    if (qrResult.success && qrResult.data?.qrCode) {
      console.log('✅ QR Code generated successfully');
      console.log(`📏 QR Code length: ${qrResult.data.qrCode.length} characters`);
      console.log(`🎯 QR Code format: ${qrResult.data.qrCode.substring(0, 30)}...`);
      
      // Validate QR code format
      const isBase64PNG = qrResult.data.qrCode.startsWith('data:image/png;base64,');
      console.log(`✅ Valid base64 PNG format: ${isBase64PNG}`);
      
      if (isBase64PNG) {
        const base64Data = qrResult.data.qrCode.split(',')[1];
        const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data);
        console.log(`✅ Valid base64 encoding: ${isValidBase64}`);
      }
      
    } else {
      console.log('❌ QR Code not available');
      console.log(JSON.stringify(qrResult, null, 2));
    }
    
    // 4. Test account status
    const statusResponse = await fetch(`${SERVER_URL}/api/accounts/${accountId}/status`);
    const statusResult = await statusResponse.json();
    console.log(`📊 Account Status: ${statusResult.success ? statusResult.data.status : 'ERROR'}`);
    
    // 5. Cleanup
    console.log('\n🧹 Cleaning up test account...');
    const disconnectResponse = await fetch(`${SERVER_URL}/api/accounts/${accountId}/disconnect`, {
      method: 'DELETE'
    });
    const disconnectResult = await disconnectResponse.json();
    console.log(`✅ Cleanup: ${disconnectResult.success ? 'Success' : 'Failed'}`);
    
    console.log('\n🎉 QR Code validation test completed!');
    
  } catch (error) {
    console.error('❌ QR validation test failed:', error.message);
  }
}

// Run the test
testQRValidation();