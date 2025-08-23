#!/usr/bin/env node

/**
 * Test document attachment
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('📄 Testing WhatsApp Document Attachment...\n');

async function testDocumentAttachment() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('Testing document attachment...');
    
    const documentMessage = {
      to: '918983063144@s.whatsapp.net',
      message: {
        document: {
          url: 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf',
          filename: 'WhatsApp_Test_Sample.pdf',
          caption: '📄 Test Document Attachment\n\nThis is a sample PDF document sent via WhatsApp API!'
        }
      }
    };
    
    console.log('Sending document...');
    const result = await fetch('http://localhost:3005/api/accounts/device_1754872522409_7s9d6u/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(documentMessage)
    });
    
    const data = await result.json();
    
    if (data.success) {
      console.log('✅ Document attachment sent successfully!');
      console.log('Message ID:', data.data?.messageId);
      console.log('\\n📱 Check your WhatsApp at 8983063144 to see the PDF document!');
    } else {
      console.log('❌ Document attachment failed:', data.error);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testDocumentAttachment();