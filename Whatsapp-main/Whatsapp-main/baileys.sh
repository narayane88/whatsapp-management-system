#!/bin/bash

# Baileys WhatsApp Bot - Linux/macOS Launcher
# This script runs the Baileys bot using Node.js

echo "Baileys WhatsApp Bot - Starting..."
echo "====================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not found in PATH"
    echo "Please install Node.js 18+ from your package manager or https://nodejs.org/"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create required directories
mkdir -p auth_session
mkdir -p downloads

# Run the application
echo "Starting Baileys WhatsApp Bot..."
node dist/index.js

# Check exit status
if [ $? -ne 0 ]; then
    echo ""
    echo "The application exited with an error."
    echo "Press Enter to exit..."
    read
fi