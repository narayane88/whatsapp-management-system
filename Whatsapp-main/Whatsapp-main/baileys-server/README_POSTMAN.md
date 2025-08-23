# 📮 Postman Collection for Baileys WhatsApp API

## 📁 Files Overview

| File | Description | Purpose |
|------|-------------|---------|
| `Baileys-WhatsApp-API.postman_collection.json` | Main Postman collection | Complete API endpoint testing |
| `Baileys-WhatsApp-API.postman_environment.json` | Environment variables | Configuration and test data |
| `POSTMAN_TESTING_GUIDE.md` | Comprehensive guide | Setup and testing instructions |

## 🚀 Quick Import

### Import to Postman:
1. Open Postman
2. Click **Import**
3. Drag these files:
   - `Baileys-WhatsApp-API.postman_collection.json`
   - `Baileys-WhatsApp-API.postman_environment.json`
4. Click **Import**
5. Select "Baileys WhatsApp API - Local Development" environment

## 📊 Collection Contents

### 🏷 Request Categories (80+ Endpoints):

- **📋 Server Information** (3 endpoints)
  - Health checks and server status
- **🔐 Account Management** (6 endpoints) 
  - Connect, disconnect, and monitor accounts
- **💬 Messaging** (7 endpoints)
  - All message types (text, image, video, audio, document, location, group)
- **🔧 Debug & Testing** (4 endpoints)
  - Frontend API testing and debugging
- **🧪 Complete Workflows** (2 workflows)
  - Automated testing sequences with validation

### 🎯 Key Features:

- ✅ **Automated Testing** - Built-in test scripts for validation
- ✅ **Dynamic Variables** - Auto-generated account IDs and test data  
- ✅ **Environment Management** - Separate configs for different environments
- ✅ **Comprehensive Documentation** - Detailed descriptions for each endpoint
- ✅ **Error Handling** - Expected error responses and troubleshooting
- ✅ **Workflow Testing** - End-to-end testing scenarios
- ✅ **Webhook Integration** - Webhook.site integration for event testing

## 🔧 Prerequisites

1. **Baileys Server Running:**
   ```bash
   cd "D:\Whatsapp Programm\baileys-server"
   npm run dev
   ```

2. **Frontend Running (Optional):**
   ```bash
   cd "D:\Whatsapp Programm\whatsapp-frontend"  
   npm run dev
   ```

3. **Postman Installed:**
   - Desktop app or web version
   - Account for sync and collaboration

## ⚡ Quick Test

1. **Import Collection** (see above)
2. **Run Health Check:**
   - 📋 Server Information → Health Check
   - Should return `"status": "healthy"`
3. **Connect Account:**
   - 🔐 Account Management → Connect Account (QR Code)
   - Scan QR code with WhatsApp mobile app
4. **Send Test Message:**
   - Update environment variable `testRecipientJID` 
   - 💬 Messaging → Send Text Message

## 📖 Full Documentation

For complete setup instructions, testing workflows, and troubleshooting:
👉 **See `POSTMAN_TESTING_GUIDE.md`**

## 🎯 Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `baseUrl` | `http://localhost:3005` | Baileys server URL |
| `testRecipientJID` | `1234567890@s.whatsapp.net` | Your phone number for testing |
| `webhookUrl` | `https://webhook.site/abc123` | Webhook testing URL |

## 🔄 Testing Workflows

### Automated Full Test:
```
🧪 Complete Test Workflows → 1️⃣ Full Account Test Flow
```
Runs: Connect → Status → QR → Message → Disconnect

### Manual Testing:
```
1. Connect Account → Get QR code
2. Scan with WhatsApp → Connect
3. Send Messages → Test functionality  
4. Monitor Webhooks → Check events
5. Disconnect → Cleanup
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server not responding | Check if `npm run dev` is running on port 3005 |
| QR code not showing | Wait 3-5 seconds after account creation |
| Messages not sending | Verify account status is "connected" |
| Webhook not working | Check webhook.site URL is correct |

## 📞 Support

- **API Documentation**: `API_DOCUMENTATION.md`
- **Testing Guide**: `POSTMAN_TESTING_GUIDE.md`  
- **Server Logs**: Check terminal running `npm run dev`
- **Webhook Monitor**: Visit your webhook.site URL

---

**Ready to test! 🚀**