@echo off
REM Enhanced Baileys WhatsApp Bot - Windows Launcher with Server Details
REM This script runs the Baileys bot and displays comprehensive server information

echo ========================================================
echo           Enhanced Baileys WhatsApp Server
echo ========================================================
echo.

REM Display System Information
echo [SYSTEM INFO]
echo Date/Time: %DATE% %TIME%
echo Computer Name: %COMPUTERNAME%
echo Username: %USERNAME%
echo OS: %OS%
echo.

REM Display Network Information
echo [NETWORK CONFIGURATION]
echo Checking network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    setlocal enabledelayedexpansion
    echo Local IP Address: !ip!
    endlocal
)

REM Get public IP (if available)
echo Checking public IP...
for /f %%a in ('curl -s ifconfig.me 2^>nul') do echo Public IP Address: %%a
echo.

REM Display Server Configuration
echo [SERVER CONFIGURATION]
echo Application: Baileys WhatsApp Bot
echo Default Port: 3001
echo Protocol: HTTP/HTTPS + WebSocket
echo Environment: %NODE_ENV%
echo.

REM Display Domain/Host Information
echo [HOST INFORMATION]
echo Hostname: %COMPUTERNAME%.local
echo Domain: wa-server-%COMPUTERNAME%.company.com
echo Listening on: http://localhost:3001
echo External Access: http://%COMPUTERNAME%.local:3001
echo.

REM Check if Node.js is available
echo [DEPENDENCY CHECK]
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is required but not found in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js: 
    node --version
)

REM Check npm
npm --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ NPM: 
    npm --version
)
echo.

REM Change to script directory
cd /d "%~dp0"

REM Display Directory Information
echo [APPLICATION PATHS]
echo Working Directory: %CD%
echo Auth Session: %CD%\auth_session
echo Downloads: %CD%\downloads
echo Application: %CD%\dist\index.js
echo.

REM Create required directories
if not exist "auth_session" (
    echo Creating auth_session directory...
    mkdir auth_session
)
if not exist "downloads" (
    echo Creating downloads directory...
    mkdir downloads
)

REM Display Port Information
echo [PORT CONFIGURATION]
echo Checking port availability...
netstat -an | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  WARNING: Port 3001 is already in use
) else (
    echo ✅ Port 3001 is available
)

netstat -an | findstr :3000 >nul
if not errorlevel 1 (
    echo ℹ️  INFO: Port 3000 (Frontend) is in use
) else (
    echo ℹ️  INFO: Port 3000 (Frontend) is available
)
echo.

REM Display WhatsApp Connection Details
echo [WHATSAPP CONNECTION INFO]
echo Browser: Ubuntu (Baileys Executable)
echo Auth Method: Multi-file Auth State
echo QR Code: Will be displayed in terminal
echo Session: Persistent (saved in auth_session folder)
echo.

REM Display Server Endpoints
echo [API ENDPOINTS]
echo Health Check: http://localhost:3001/health
echo WebSocket: ws://localhost:3001/ws
echo Webhook: http://localhost:3001/webhook
echo Admin Panel: http://localhost:3000/admin/servers
echo.

echo ========================================================
echo                Starting Baileys Server...
echo ========================================================
echo.

REM Display Database Connection Test
echo [DATABASE CONNECTION TEST]
echo Testing PostgreSQL connection...
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432
});
pool.query('SELECT NOW() as current_time, version() as pg_version')
  .then(res => {
    console.log('✅ Database connected successfully');
    console.log('📅 Server Time:', res.rows[0].current_time);
    console.log('📊 PostgreSQL Version:', res.rows[0].pg_version.split(' ')[0]);
    return pool.query('SELECT COUNT(*) as server_count FROM servers WHERE is_active = true');
  })
  .then(res => {
    console.log('🖥️  Active Servers in DB:', res.rows[0].server_count);
    pool.end();
  })
  .catch(err => {
    console.log('❌ Database connection failed:', err.message);
    pool.end();
  });
" 2>nul
echo.

REM Display Real Server Information
echo [REAL SERVER INTEGRATION]
echo Initializing server monitoring...
node server-monitor.js
echo.

REM Run the enhanced application
echo 🚀 Starting Enhanced Baileys WhatsApp Bot with Real Server Integration...
echo 📡 Server will be available at: http://localhost:3001
echo 🌐 Frontend dashboard: http://localhost:3000
echo 📱 Real-time server monitoring: ENABLED
echo 💾 Database integration: ACTIVE
echo.
echo [ENHANCED LOG OUTPUT]
node dist/index-enhanced.js

REM Keep window open if there was an error
if errorlevel 1 (
    echo.
    echo ========================================================
    echo                   ERROR OCCURRED
    echo ========================================================
    echo The application exited with an error code: %errorlevel%
    echo.
    echo [TROUBLESHOOTING]
    echo 1. Check if all dependencies are installed
    echo 2. Verify database connection
    echo 3. Ensure ports 3000-3001 are not blocked
    echo 4. Check network connectivity
    echo.
    pause
)