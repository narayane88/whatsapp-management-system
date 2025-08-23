# Baileys WhatsApp Library - Executable Distribution

This project creates standalone executable files from the Baileys WhatsApp library without modifying the original code.

## Features

- ✅ Standalone executables for Windows, Linux, and macOS
- ✅ No Node.js installation required on target machines
- ✅ Original Baileys code preserved (no modifications)
- ✅ QR Code authentication support
- ✅ Automatic media download
- ✅ Session persistence
- ✅ Cross-platform compatibility

## Quick Start

### Build Executables

1. **Clone and Build:**
   ```bash
   node build.js
   ```

   This will:
   - Install all dependencies
   - Build the Baileys library
   - Compile TypeScript
   - Create executables for Windows, Linux, and macOS

2. **Run the Executable:**

   **Windows:**
   ```cmd
   .\dist\baileys-windows.exe
   ```

   **Linux:**
   ```bash
   ./dist/baileys-linux
   ```

   **macOS:**
   ```bash
   ./dist/baileys-macos
   ```

### First Run

1. Run the executable
2. Scan the QR code with your WhatsApp app
3. The bot will automatically:
   - Create `auth_session` folder for credentials
   - Create `downloads` folder for media files
   - Start listening for messages

## Project Structure

```
├── Baileys/                    # Original Baileys library (unmodified)
├── src/
│   └── index.ts               # Main application code
├── dist/                      # Built files and executables
├── package.json               # Project configuration
├── tsconfig.json             # TypeScript configuration
├── build.js                  # Build script
└── README.md                 # This file
```

## Files Created at Runtime

- `auth_session/` - WhatsApp authentication data
- `downloads/` - Downloaded media files
- Logs are printed to console

## Configuration

The executable includes:
- QR code terminal display
- Automatic reconnection
- Media download functionality
- Message logging
- Group event handling

## Customization

To customize the bot behavior, edit `src/index.ts` and rebuild:

```typescript
// Example: Enable auto-reply
sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
        if (!message.key.fromMe && message.message?.conversation) {
            await sock.sendMessage(message.key.remoteJid!, { 
                text: `Echo: ${message.message.conversation}` 
            })
        }
    }
})
```

Then run `node build.js` again to create new executables.

## System Requirements

### For Building
- Node.js 18+
- npm or yarn

### For Running Executables
- No dependencies required
- Works on Windows 10+, Linux (most distributions), macOS 10.15+

## Executable Sizes

Typical executable sizes:
- Windows (.exe): ~50-70 MB
- Linux: ~50-70 MB
- macOS: ~50-70 MB

## Troubleshooting

### Build Issues

1. **Dependencies fail to install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Baileys build fails:**
   ```bash
   cd Baileys
   rm -rf node_modules
   npm install
   npm run build
   ```

3. **TypeScript compilation fails:**
   ```bash
   npx tsc --noEmit  # Check for errors
   npx tsc           # Force compile
   ```

### Runtime Issues

1. **"Cannot find module" errors:**
   - The executable includes all required modules
   - Try rebuilding with `node build.js`

2. **QR code not showing:**
   - Ensure terminal supports UTF-8
   - Try running in different terminal

3. **Authentication fails:**
   - Delete `auth_session` folder
   - Restart the executable
   - Scan QR code again

4. **Permission denied (Linux/macOS):**
   ```bash
   chmod +x dist/baileys-linux    # Linux
   chmod +x dist/baileys-macos    # macOS
   ```

## Advanced Usage

### Environment Variables

Set these before running the executable:

```bash
# Enable debug logging
export DEBUG=baileys*

# Custom auth directory
export AUTH_DIR=./custom_auth

# Custom downloads directory  
export DOWNLOADS_DIR=./custom_downloads
```

### Running as Service

**Linux (systemd):**
```ini
[Unit]
Description=Baileys WhatsApp Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/baileys
ExecStart=/path/to/baileys/dist/baileys-linux
Restart=always

[Install]
WantedBy=multi-user.target
```

**Windows (as Service with NSSM):**
```cmd
nssm install BaileysBot "C:\path\to\baileys-windows.exe"
nssm set BaileysBot AppDirectory "C:\path\to\project"
nssm start BaileysBot
```

## API Documentation

Complete Baileys API documentation is available in `BAILEYS_API_DOCUMENTATION.md`.

## Security Notes

- Keep `auth_session` folder secure and private
- Don't share authentication files
- Use environment variables for sensitive configuration
- Run with minimal required permissions

## License

This project uses the same MIT license as the original Baileys library.

## Support

For issues related to:
- Baileys functionality: [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- Build/executable issues: Check troubleshooting section above

## Contributing

1. Fork the repository
2. Make changes to `src/index.ts` 
3. Test with `npm run dev`
4. Build with `node build.js`
5. Submit pull request

---

**Note:** This project packages the original Baileys library without modifications, creating standalone executables for easier deployment and distribution.