#!/usr/bin/env node

/**
 * Simple test for WhatsApp image attachments
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('📸 Testing WhatsApp Image Attachment...\n');

async function testImageAttachment() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Send a simple text message first to verify connection
    console.log('1. Testing basic text message...');
    const textResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '918983063144@s.whatsapp.net',
        message: {
          text: '📋 Attachment Test Starting...\n\n✅ Text messages: WORKING\n📸 Testing image attachment next...'
        }
      })
    });
    
    const textData = await textResult.json();
    console.log('Text result:', textData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (!textData.success) {
      console.log('Error:', textData.error);
      return;
    }
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Try image with a very reliable URL
    console.log('\\n2. Testing image attachment with reliable URL...');
    
    const imageMessage = {
      to: '918983063144@s.whatsapp.net',
      message: {
        image: {
          url: 'https://picsum.photos/300/200?random=1',
          caption: '📸 Test Image Attachment\\n\\nThis is a test image from Picsum (reliable image service)!'
        }
      }
    };
    
    console.log('Sending image message...');
    const imageResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imageMessage)
    });
    
    const imageData = await imageResult.json();
    
    if (imageData.success) {
      console.log('✅ Image attachment sent successfully!');
      console.log('Message ID:', imageData.data?.messageId);
      console.log('\\n📱 Check your WhatsApp at 8983063144 to see the image!');
    } else {
      console.log('❌ Image attachment failed:', imageData.error);
      
      // Try location as backup test
      console.log('\\n3. Testing location message as backup...');
      const locationResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '918983063144@s.whatsapp.net',
          message: {
            location: {
              latitude: 22.5726,
              longitude: 88.3639,
              name: 'Kolkata, West Bengal',
              address: 'Kolkata, West Bengal, India'
            }
          }
        })
      });
      
      const locationData = await locationResult.json();
      console.log('Location result:', locationData.success ? '✅ SUCCESS' : '❌ FAILED');
    }
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error.message);
  }
}

testImageAttachment();