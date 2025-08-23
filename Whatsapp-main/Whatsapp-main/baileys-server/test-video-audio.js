#!/usr/bin/env node

/**
 * Test video and audio attachments
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🎥🔊 Testing WhatsApp Video & Audio Attachments...\n');

async function testVideoAudioAttachments() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Video attachment
    console.log('1. Testing video attachment...');
    
    const videoMessage = {
      to: '918983063144@s.whatsapp.net',
      message: {
        video: {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          caption: '🎥 Test Video Attachment\n\nThis is a sample video (Big Buck Bunny) sent via WhatsApp API!'
        }
      }
    };
    
    console.log('Sending video...');
    const videoResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoMessage)
    });
    
    const videoData = await videoResult.json();
    
    if (videoData.success) {
      console.log('✅ Video attachment sent successfully!');
      console.log('Message ID:', videoData.data?.messageId);
    } else {
      console.log('❌ Video attachment failed:', videoData.error);
    }
    
    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Audio attachment
    console.log('\\n2. Testing audio attachment...');
    
    const audioMessage = {
      to: '918983063144@s.whatsapp.net',
      message: {
        audio: {
          url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3'
        }
      }
    };
    
    console.log('Sending audio...');
    const audioResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioMessage)
    });
    
    const audioData = await audioResult.json();
    
    if (audioData.success) {
      console.log('✅ Audio attachment sent successfully!');
      console.log('Message ID:', audioData.data?.messageId);
    } else {
      console.log('❌ Audio attachment failed:', audioData.error);
    }
    
    // Test 3: Another location to confirm everything still works
    console.log('\\n3. Testing location (final confirmation)...');
    
    const locationMessage = {
      to: '918983063144@s.whatsapp.net',
      message: {
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          name: 'Bangalore, Karnataka',
          address: 'Bangalore, Karnataka, India'
        }
      }
    };
    
    const locationResult = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationMessage)
    });
    
    const locationData = await locationResult.json();
    
    if (locationData.success) {
      console.log('✅ Location sent successfully!');
      console.log('Message ID:', locationData.data?.messageId);
    } else {
      console.log('❌ Location failed:', locationData.error);
    }
    
    console.log('\\n🏁 Attachment Testing Complete!');
    console.log('📱 Check your WhatsApp at 8983063144 for all attachments:');
    console.log('   📸 Image attachment');
    console.log('   📄 PDF document');
    console.log('   🎥 Video attachment');
    console.log('   🔊 Audio attachment');
    console.log('   📍 Location pins');
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testVideoAudioAttachments();