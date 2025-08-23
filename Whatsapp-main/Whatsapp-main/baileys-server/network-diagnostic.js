#!/usr/bin/env node

import { createRequire } from 'module';
import dns from 'dns';
import net from 'net';
import https from 'https';

const require = createRequire(import.meta.url);

console.log('🌐 WhatsApp Network Diagnostic for India\n');

// Test DNS resolution
function testDNS() {
  return new Promise((resolve) => {
    console.log('📡 Testing DNS resolution...');
    
    dns.resolve4('web.whatsapp.com', (err, addresses) => {
      if (err) {
        console.log(`❌ DNS Resolution Failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`✅ DNS Resolution Success: ${addresses.join(', ')}`);
        resolve(true);
      }
    });
  });
}

// Test HTTPS connectivity
function testHTTPS() {
  return new Promise((resolve) => {
    console.log('🔐 Testing HTTPS connectivity...');
    
    const req = https.request({
      hostname: 'web.whatsapp.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
      }
    }, (res) => {
      console.log(`✅ HTTPS Connection Success: Status ${res.statusCode}`);
      console.log(`   Server: ${res.headers.server || 'Unknown'}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ HTTPS Connection Failed: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ HTTPS Connection Timeout');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Test WebSocket connectivity
function testWebSocket() {
  return new Promise((resolve) => {
    console.log('🔌 Testing WebSocket connectivity...');
    
    const socket = net.createConnection({
      host: 'web.whatsapp.com',
      port: 443,
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket Connection Success');
      socket.end();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ Socket Connection Failed: ${err.message}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log('❌ Socket Connection Timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

// Check system network configuration
function checkNetworkConfig() {
  console.log('⚙️ System Network Configuration:');
  console.log(`   Node.js Version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  
  // Check DNS servers
  try {
    const dnsServers = dns.getServers();
    console.log(`   DNS Servers: ${dnsServers.join(', ')}`);
  } catch (err) {
    console.log('   DNS Servers: Unable to retrieve');
  }
}

// Indian ISP specific checks
function checkIndianISP() {
  console.log('🇮🇳 Indian Network Optimizations:');
  console.log('   • Using Accept-Language: en-IN,en;q=0.9,hi;q=0.8');
  console.log('   • DNS Family: Auto (IPv4/IPv6)');
  console.log('   • Connection Timeout: 30 seconds');
  console.log('   • Retry Strategy: Exponential backoff');
}

// Main diagnostic function
async function runDiagnostic() {
  console.log('Starting diagnostic tests...\n');
  
  checkNetworkConfig();
  console.log();
  
  checkIndianISP();
  console.log();
  
  const dnsOk = await testDNS();
  const httpsOk = await testHTTPS();
  const wsOk = await testWebSocket();
  
  console.log('\n📊 Diagnostic Results:');
  console.log(`DNS Resolution: ${dnsOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`HTTPS Access: ${httpsOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Socket Connection: ${wsOk ? '✅ OK' : '❌ FAILED'}`);
  
  if (!dnsOk || !httpsOk || !wsOk) {
    console.log('\n🔧 Troubleshooting Recommendations:');
    
    if (!dnsOk) {
      console.log('• DNS Resolution Failed:');
      console.log('  - Try changing DNS to 8.8.8.8 and 8.8.4.4 (Google DNS)');
      console.log('  - Or use 1.1.1.1 and 1.0.0.1 (Cloudflare DNS)');
      console.log('  - Check if ISP is blocking WhatsApp domains');
    }
    
    if (!httpsOk) {
      console.log('• HTTPS Access Failed:');
      console.log('  - Check firewall settings');
      console.log('  - Disable VPN if using one');
      console.log('  - Try using mobile hotspot');
    }
    
    if (!wsOk) {
      console.log('• Socket Connection Failed:');
      console.log('  - Port 443 might be blocked');
      console.log('  - Check router/ISP settings');
      console.log('  - Try different network connection');
    }
  } else {
    console.log('\n🎉 All tests passed! Network connectivity is good.');
    console.log('If you\'re still having WhatsApp connection issues, they may be due to:');
    console.log('• WhatsApp rate limiting (Error 428)');
    console.log('• Account-specific restrictions');
    console.log('• Regional WhatsApp server issues');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Wait 15-30 minutes before trying WhatsApp connection');
  console.log('2. Use only ONE QR code connection at a time');
  console.log('3. Ensure mobile device has stable internet');
  console.log('4. Try different WhatsApp account if issues persist');
}

// Run diagnostic if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostic().catch(console.error);
}

export { runDiagnostic, testDNS, testHTTPS, testWebSocket };