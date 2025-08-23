@echo off
REM Baileys WhatsApp Bot - Windows Launcher
REM This script runs the Baileys bot using the bundled Node.js

echo Baileys WhatsApp Bot - Starting...
echo =====================================

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is required but not found in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Change to script directory
cd /d "%~dp0"

REM Create required directories
if not exist "auth_session" mkdir auth_session
if not exist "downloads" mkdir downloads

REM Run the application
echo Starting Baileys WhatsApp Bot...
node dist/index.js

REM Keep window open if there was an error
if errorlevel 1 (
    echo.
    echo The application exited with an error.
    pause
)