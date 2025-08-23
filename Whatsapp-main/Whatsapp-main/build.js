const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Baileys Executable...');
console.log('==============================');

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Step 2: Build Baileys library
console.log('\n🔨 Building Baileys library...');
try {
    execSync('cd Baileys && npm install && npm run build', { stdio: 'inherit' });
    console.log('✅ Baileys library built');
} catch (error) {
    console.error('❌ Failed to build Baileys:', error.message);
    process.exit(1);
}

// Step 3: Compile TypeScript
console.log('\n📝 Compiling TypeScript...');
try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('✅ TypeScript compiled');
} catch (error) {
    console.error('❌ Failed to compile TypeScript:', error.message);
    process.exit(1);
}

// Step 4: Create executables
console.log('\n📦 Creating executables...');
try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    // Build for Windows
    console.log('Building for Windows...');
    execSync('npx pkg dist/index.js --targets node18-win-x64 --output dist/baileys-windows.exe', { stdio: 'inherit' });
    
    // Build for Linux
    console.log('Building for Linux...');
    execSync('npx pkg dist/index.js --targets node18-linux-x64 --output dist/baileys-linux', { stdio: 'inherit' });
    
    // Build for macOS (optional)
    console.log('Building for macOS...');
    execSync('npx pkg dist/index.js --targets node18-macos-x64 --output dist/baileys-macos', { stdio: 'inherit' });
    
    console.log('✅ Executables created successfully!');
    
    // List created files
    console.log('\n📁 Created executables:');
    const distFiles = fs.readdirSync('dist').filter(file => 
        file.startsWith('baileys-') && (file.endsWith('.exe') || !file.includes('.'))
    );
    
    distFiles.forEach(file => {
        const filePath = path.join('dist', file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  - ${file} (${sizeInMB} MB)`);
    });
    
} catch (error) {
    console.error('❌ Failed to create executables:', error.message);
    process.exit(1);
}

console.log('\n🎉 Build completed successfully!');
console.log('\nUsage:');
console.log('  Windows: .\\dist\\baileys-windows.exe');
console.log('  Linux:   ./dist/baileys-linux');
console.log('  macOS:   ./dist/baileys-macos');
console.log('\nThe executable will create auth_session and downloads folders automatically.');