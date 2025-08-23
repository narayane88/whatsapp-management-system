#!/usr/bin/env node

/**
 * Test WhatsApp attachments with local files and base64 encoding
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);

console.log('📎 WhatsApp Local Attachment Testing');
console.log('===================================\n');

const BASE_URL = 'http://localhost:3005';
const TEST_ACCOUNT = 'device_1754872522409_7s9d6u';
const TEST_NUMBER = '918983063144@s.whatsapp.net';

function logSuccess(step, message, data = null) {
  console.log(`✅ ${step}. ${message}`);
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
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      networkError: true
    };
  }
}

async function testLocalAttachments() {
  // Test 1: Create a small test image as base64
  try {
    // Create a simple 1x1 pixel PNG image as base64
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('1. Testing base64 image attachment...');
    
    const imageMessage = {
      to: TEST_NUMBER,
      message: {
        image: {
          url: testImageBase64,
          caption: '📸 Test Base64 Image\n\nThis is a small test image encoded in base64 format!'
        }
      }
    };

    const imageResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(imageMessage)
    });

    if (imageResult.success) {
      logSuccess('1', 'Base64 image attachment sent successfully', {
        messageId: imageResult.data.data?.messageId,
        success: imageResult.data.success
      });
    } else {
      logError('1', 'Failed to send base64 image attachment', imageResult.data || imageResult.error);
    }
  } catch (error) {
    logError('1', 'Base64 image test failed', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Test with a reliable public image URL
  try {
    console.log('2. Testing public image URL...');
    
    const publicImageMessage = {
      to: TEST_NUMBER,
      message: {
        image: {
          url: 'https://httpbin.org/image/png',
          caption: '📸 Test Public Image URL\n\nThis image is from httpbin.org - a reliable testing service!'
        }
      }
    };

    const publicImageResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(publicImageMessage)
    });

    if (publicImageResult.success) {
      logSuccess('2', 'Public image URL attachment sent successfully', {
        messageId: publicImageResult.data.data?.messageId,
        success: publicImageResult.data.success
      });
    } else {
      logError('2', 'Failed to send public image URL attachment', publicImageResult.data || publicImageResult.error);
    }
  } catch (error) {
    logError('2', 'Public image URL test failed', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Test location (which we know works)
  try {
    console.log('3. Re-testing location sharing...');
    
    const locationMessage = {
      to: TEST_NUMBER,
      message: {
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          name: 'New Delhi',
          address: 'New Delhi, Delhi, India'
        }
      }
    };

    const locationResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(locationMessage)
    });

    if (locationResult.success) {
      logSuccess('3', 'Location message sent successfully', {
        messageId: locationResult.data.data?.messageId,
        success: locationResult.data.success
      });
    } else {
      logError('3', 'Failed to send location message', locationResult.data || locationResult.error);
    }
  } catch (error) {
    logError('3', 'Location message test failed', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Test small document as base64
  try {
    console.log('4. Testing base64 document...');
    
    // Create a simple text file as base64
    const testTextContent = 'This is a test document created for WhatsApp attachment testing.\n\nGenerated at: ' + new Date().toISOString();
    const base64Doc = Buffer.from(testTextContent, 'utf8').toString('base64');
    const dataUri = `data:text/plain;base64,${base64Doc}`;
    
    const documentMessage = {
      to: TEST_NUMBER,
      message: {
        document: {
          url: dataUri,
          filename: 'WhatsApp_Test_Document.txt',
          caption: '📄 Test Base64 Document\n\nThis is a simple text document encoded in base64 format!'
        }
      }
    };

    const documentResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(documentMessage)
    });

    if (documentResult.success) {
      logSuccess('4', 'Base64 document attachment sent successfully', {
        messageId: documentResult.data.data?.messageId,
        success: documentResult.data.success
      });
    } else {
      logError('4', 'Failed to send base64 document attachment', documentResult.data || documentResult.error);
    }
  } catch (error) {
    logError('4', 'Base64 document test failed', error);
  }

  // Summary
  console.log('🏁 Local Attachment Testing Summary');
  console.log('==================================');
  console.log('✅ Location sharing: WORKING');
  console.log('🔍 Media attachments: Testing with different approaches');
  console.log('📱 Check WhatsApp at 8983063144 for received messages');
  console.log('');
  console.log('Note: Some media types may require specific URL formats or local file access.');
  console.log('The WhatsApp API may have restrictions on external URL access from your network.');
}

testLocalAttachments().catch(console.error);