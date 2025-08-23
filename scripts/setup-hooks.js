const fs = require('fs');
const path = require('path');

/**
 * Setup Git Hooks for API Documentation
 */

const HOOKS_SOURCE_DIR = path.join(__dirname, '../.githooks');
const HOOKS_TARGET_DIR = path.join(__dirname, '../.git/hooks');

function setupHooks() {
    console.log('🔧 Setting up Git hooks for API documentation...');
    
    try {
        // Check if .git directory exists
        if (!fs.existsSync(path.join(__dirname, '../.git'))) {
            console.log('⚠️  No .git directory found. Skipping hook setup.');
            return;
        }
        
        // Ensure hooks directory exists
        if (!fs.existsSync(HOOKS_TARGET_DIR)) {
            fs.mkdirSync(HOOKS_TARGET_DIR, { recursive: true });
        }
        
        // Copy hooks
        const hookFiles = fs.readdirSync(HOOKS_SOURCE_DIR);
        
        for (const hookFile of hookFiles) {
            const sourcePath = path.join(HOOKS_SOURCE_DIR, hookFile);
            const targetPath = path.join(HOOKS_TARGET_DIR, hookFile);
            
            // Copy hook file
            fs.copyFileSync(sourcePath, targetPath);
            
            // Make executable (Unix-like systems)
            if (process.platform !== 'win32') {
                fs.chmodSync(targetPath, 0o755);
            }
            
            console.log(`✅ Installed ${hookFile} hook`);
        }
        
        console.log('🎉 Git hooks setup completed!');
        console.log('📝 API documentation will now auto-update on commits affecting API routes.');
        
    } catch (error) {
        console.error('❌ Error setting up Git hooks:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    setupHooks();
}

module.exports = { setupHooks };