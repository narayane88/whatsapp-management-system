#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SESSIONS_DIR = './sessions';

function cleanupOldSessions() {
  console.log('🧹 Starting session cleanup...');
  
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.log('❌ Sessions directory not found');
    return;
  }

  const sessionDirs = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📂 Found ${sessionDirs.length} session directories`);

  let deletedCount = 0;
  const currentTime = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  sessionDirs.forEach(dirName => {
    const dirPath = path.join(SESSIONS_DIR, dirName);
    
    try {
      const stats = fs.statSync(dirPath);
      const lastModified = stats.mtime.getTime();
      const daysSinceModified = (currentTime - lastModified) / ONE_DAY;

      // Delete sessions older than 1 day or test accounts
      const isTestAccount = dirName.includes('test_') || 
                          dirName.includes('debug_') || 
                          dirName.includes('manual_') ||
                          dirName.includes('mobile_test') ||
                          dirName.includes('qr_test') ||
                          dirName.includes('demo');

      if (daysSinceModified > 1 || isTestAccount) {
        console.log(`🗑️  Deleting old session: ${dirName} (${daysSinceModified.toFixed(1)} days old)`);
        
        // Remove directory recursively
        fs.rmSync(dirPath, { recursive: true, force: true });
        deletedCount++;
      } else {
        console.log(`⏳ Keeping recent session: ${dirName} (${daysSinceModified.toFixed(1)} days old)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${dirName}:`, error.message);
    }
  });

  console.log(`✅ Cleanup complete! Deleted ${deletedCount} old sessions`);
  console.log(`📂 Remaining sessions: ${sessionDirs.length - deletedCount}`);
}

// Utility function to delete specific session
function deleteSession(accountId) {
  const sessionPath = path.join(SESSIONS_DIR, `account-${accountId}`);
  
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`🗑️  Deleted session: ${accountId}`);
    return true;
  }
  
  console.log(`❌ Session not found: ${accountId}`);
  return false;
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--delete' && args[1]) {
    deleteSession(args[1]);
  } else {
    cleanupOldSessions();
  }
}

export { cleanupOldSessions, deleteSession };