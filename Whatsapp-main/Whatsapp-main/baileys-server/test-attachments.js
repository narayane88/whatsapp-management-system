#!/usr/bin/env node

/**
 * Comprehensive test for WhatsApp attachment sending functionality
 * This script will test:
 * 1. Image attachments
 * 2. Document attachments  
 * 3. Video attachments
 * 4. Audio attachments
 * 5. Location sharing
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('📎 WhatsApp Attachment Testing Suite');
console.log('====================================\n');

const BASE_URL = 'http://localhost:3005';
const TEST_ACCOUNT = 'device_1754872522409_7s9d6u';
const TEST_NUMBER = '918983063144@s.whatsapp.net';

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

async function runAttachmentTests() {
  // Test 1: Verify account is connected
  try {
    const accountResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/status`);
    if (accountResult.success && accountResult.data.data?.status === 'connected') {
      logSuccess('1', `Account ${TEST_ACCOUNT} is connected and ready for testing`);
    } else {
      logError('1', 'Account not connected or not found', accountResult);
      return;
    }
  } catch (error) {
    logError('1', 'Failed to check account status', error);
    return;
  }

  // Test 2: Send Image Message
  try {
    const imageMessage = {
      to: TEST_NUMBER,
      message: {
        image: {
          url: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Test+Image',
          caption: '📸 Test Image Attachment - WhatsApp Integration Test\n\nThis is a test image sent via our WhatsApp API!'
        }
      }
    };

    log('2', 'Testing image attachment...', imageMessage);

    const imageResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(imageMessage)
    });

    if (imageResult.success) {
      logSuccess('2', 'Image attachment sent successfully', {
        messageId: imageResult.data.data?.messageId,
        success: imageResult.data.success
      });
    } else {
      logError('2', 'Failed to send image attachment', imageResult);
    }
  } catch (error) {
    logError('2', 'Image attachment test failed', error);
  }

  // Wait 2 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Send Document Message
  try {
    const documentMessage = {
      to: TEST_NUMBER,
      message: {
        document: {
          url: 'https://www.w3.org/WAI/WCAG21/working-examples/colour-contrast/link-contrast.pdf',
          filename: 'WhatsApp_API_Test_Document.pdf',
          caption: '📄 Test Document Attachment\n\nThis is a sample PDF document sent via WhatsApp API for testing purposes.'
        }
      }
    };

    log('3', 'Testing document attachment...', documentMessage);

    const documentResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(documentMessage)
    });

    if (documentResult.success) {
      logSuccess('3', 'Document attachment sent successfully', {
        messageId: documentResult.data.data?.messageId,
        success: documentResult.data.success
      });
    } else {
      logError('3', 'Failed to send document attachment', documentResult);
    }
  } catch (error) {
    logError('3', 'Document attachment test failed', error);
  }

  // Wait 2 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Send Video Message
  try {
    const videoMessage = {
      to: TEST_NUMBER,
      message: {
        video: {
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          caption: '🎥 Test Video Attachment\n\nThis is a sample video sent via WhatsApp API for testing media functionality.'
        }
      }
    };

    log('4', 'Testing video attachment...', videoMessage);

    const videoResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(videoMessage)
    });

    if (videoResult.success) {
      logSuccess('4', 'Video attachment sent successfully', {
        messageId: videoResult.data.data?.messageId,
        success: videoResult.data.success
      });
    } else {
      logError('4', 'Failed to send video attachment', videoResult);
    }
  } catch (error) {
    logError('4', 'Video attachment test failed', error);
  }

  // Wait 2 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: Send Audio Message
  try {
    const audioMessage = {
      to: TEST_NUMBER,
      message: {
        audio: {
          url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
        }
      }
    };

    log('5', 'Testing audio attachment...', audioMessage);

    const audioResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(audioMessage)
    });

    if (audioResult.success) {
      logSuccess('5', 'Audio attachment sent successfully', {
        messageId: audioResult.data.data?.messageId,
        success: audioResult.data.success
      });
    } else {
      logError('5', 'Failed to send audio attachment', audioResult);
    }
  } catch (error) {
    logError('5', 'Audio attachment test failed', error);
  }

  // Wait 2 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 6: Send Location Message
  try {
    const locationMessage = {
      to: TEST_NUMBER,
      message: {
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          name: 'Mumbai, Maharashtra',
          address: 'Mumbai, Maharashtra, India'
        }
      }
    };

    log('6', 'Testing location sharing...', locationMessage);

    const locationResult = await makeRequest(`${BASE_URL}/api/accounts/${TEST_ACCOUNT}/send-message`, {
      method: 'POST',
      body: JSON.stringify(locationMessage)
    });

    if (locationResult.success) {
      logSuccess('6', 'Location message sent successfully', {
        messageId: locationResult.data.data?.messageId,
        success: locationResult.data.success
      });
    } else {
      logError('6', 'Failed to send location message', locationResult);
    }
  } catch (error) {
    logError('6', 'Location message test failed', error);
  }

  // Summary
  console.log('🏁 Attachment Testing Summary');
  console.log('============================');
  console.log(`✅ Tested multiple attachment types with account ${TEST_ACCOUNT}`);
  console.log(`📱 Messages sent to test number: ${TEST_NUMBER.replace('@s.whatsapp.net', '')}`);
  console.log(`⏰ Test completed at: ${new Date().toISOString()}`);
  console.log('');
  console.log('📋 Check your WhatsApp at 8983063144 to verify:');
  console.log('1. 📸 Image with caption');
  console.log('2. 📄 PDF document with caption');
  console.log('3. 🎥 Video with caption'); 
  console.log('4. 🔊 Audio file');
  console.log('5. 📍 Location pin (Mumbai)');
  console.log('');
  console.log('🎯 All attachment types should be received and properly formatted!');
}

// Run the tests
runAttachmentTests().catch(console.error);