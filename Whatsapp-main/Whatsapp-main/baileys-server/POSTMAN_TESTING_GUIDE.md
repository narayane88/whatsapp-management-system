# 🚀 Baileys WhatsApp API - Postman Testing Guide

## 📋 Overview

This guide will help you set up and use the comprehensive Postman collection to test the Baileys WhatsApp Server API. The collection includes all endpoints, example requests, automated tests, and complete workflows.

---

## 🛠 Setup Instructions

### 1. Import the Postman Collection

1. **Download Files:**
   - `Baileys-WhatsApp-API.postman_collection.json` - Main collection
   - `Baileys-WhatsApp-API.postman_environment.json` - Environment variables

2. **Import to Postman:**
   - Open Postman
   - Click **Import** button
   - Drag both JSON files into the import dialog
   - Click **Import**

### 2. Configure Environment

1. **Select Environment:**
   - In Postman, select "Baileys WhatsApp API - Local Development" environment
   - Click the eye icon to view/edit variables

2. **Update Variables:**
   ```
   baseUrl: http://localhost:3005 (default)
   frontendUrl: http://localhost:3000 (default)
   testRecipientJID: YOUR_PHONE_NUMBER@s.whatsapp.net
   webhookUrl: https://webhook.site/YOUR_UNIQUE_URL
   ```

### 3. Set Up Webhook Testing (Optional)

1. **Get Webhook URL:**
   - Visit https://webhook.site
   - Copy your unique webhook URL
   - Update `webhookUrl` variable in environment

2. **Benefits:**
   - Monitor webhook deliveries in real-time
   - Test webhook events (connection updates, messages)
   - Debug webhook payloads

---

## 📁 Collection Structure

### 📋 Server Information
- **Get Server Info** - Basic server information and endpoints
- **Health Check** - Server health and status monitoring
- **Server Statistics** - Detailed server metrics and account stats

### 🔐 Account Management
- **Connect Account (QR Code)** - Connect using QR code authentication
- **Connect Account (Pairing Code)** - Connect using phone number + pairing code
- **List All Accounts** - Get all accounts with status
- **Get Account Status** - Check specific account status
- **Get QR Code** - Retrieve QR code for scanning
- **Disconnect Account** - Remove account and logout

### 💬 Messaging
- **Send Text Message** - Basic text messaging
- **Send Image Message** - Image with caption
- **Send Video Message** - Video with caption
- **Send Audio Message** - Audio files
- **Send Document Message** - Files with filename
- **Send Location Message** - GPS coordinates
- **Send Group Message** - Messages to WhatsApp groups

### 🔧 Debug & Testing
- **Frontend Debug Endpoints** - Test Next.js proxy APIs
- **Create Test Accounts** - Quick account creation for testing

### 🧪 Complete Test Workflows
- **Full Account Test Flow** - Complete 5-step testing workflow
- **Message Types Test Flow** - Test all message types systematically

---

## 🚦 Quick Start Guide

### Step 1: Start the Server
```bash
cd "D:\Whatsapp Programm\baileys-server"
npm run dev
```

### Step 2: Test Server Health
1. In Postman, run **📋 Server Information > Health Check**
2. Verify response shows `"status": "healthy"`

### Step 3: Connect Your First Account
1. Run **🔐 Account Management > Connect Account (QR Code)**
2. Check response for QR code (base64 PNG)
3. Use QR code to connect via WhatsApp mobile app

### Step 4: Send Test Message
1. Update `testRecipientJID` with your phone number
2. Wait for account status to show "connected"
3. Run **💬 Messaging > Send Text Message**

---

## 🔄 Testing Workflows

### Automated Full Test Flow

The collection includes automated workflows with built-in tests:

1. **Run Full Account Test Flow:**
   - Navigate to **🧪 Complete Test Workflows > 1️⃣ Full Account Test Flow**
   - Run the entire folder to execute all 5 steps automatically
   - Each step includes validation tests
   - Automatic cleanup at the end

2. **Steps Included:**
   - ✅ Connect Account
   - ✅ Check Status
   - ✅ Get QR Code
   - ✅ Send Test Message
   - ✅ Disconnect Account

### Manual Testing Scenarios

#### Scenario 1: QR Code Authentication
```
1. Connect Account (QR Code) → Get account ID
2. Get Account Status → Check "connecting"
3. Get QR Code → Scan with WhatsApp
4. Get Account Status → Verify "connected"
5. Send Text Message → Test messaging
6. Disconnect Account → Cleanup
```

#### Scenario 2: Pairing Code Authentication
```
1. Connect Account (Pairing Code) → Use your phone number
2. Get Account Status → Check for pairing code
3. Enter code in WhatsApp → Link Device > "Link with phone number instead"
4. Get Account Status → Verify "connected"
5. Send messages → Test functionality
```

#### Scenario 3: Group Messaging
```
1. Use connected account from previous tests
2. Update testGroupJID with real group ID
3. Send Group Message → Test group functionality
4. Monitor webhook for group message events
```

---

## 📊 Understanding Responses

### Successful Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error description"
}
```

### Account Status Values
- `connecting` - Account is connecting to WhatsApp
- `connected` - Ready to send/receive messages
- `disconnected` - Account is offline
- `error` - Connection error occurred

---

## 🏷 JID Formats for Messaging

### Individual Contacts
```
Format: PHONE_NUMBER@s.whatsapp.net
Example: 1234567890@s.whatsapp.net
```

### WhatsApp Groups
```
Format: GROUP_ID@g.us
Example: 1234567890-1234567890@g.us
```

### Broadcast Lists
```
Format: BROADCAST_ID@broadcast
Example: 1234567890@broadcast
```

---

## 🎯 Testing Best Practices

### 1. Environment Management
- Use separate environments for development/staging/production
- Keep sensitive data (phone numbers, webhook URLs) in environment variables
- Use meaningful variable names

### 2. Account Management
- Always disconnect test accounts when done
- Use descriptive account IDs for easier identification
- Monitor account status before sending messages

### 3. Message Testing
- Start with text messages before testing media
- Use publicly accessible URLs for media files
- Test with real phone numbers you own first

### 4. Webhook Testing
- Use webhook.site for easy webhook monitoring
- Test webhook events before production deployment
- Implement proper webhook signature validation

### 5. Error Handling
- Check response status codes
- Read error messages carefully
- Use automated tests to catch regressions

---

## 🔍 Debugging Common Issues

### Issue: Account Stuck in "connecting"
**Solutions:**
- Check if QR code was properly scanned
- Verify phone number format for pairing code
- Check server logs for connection errors
- Try disconnecting and reconnecting

### Issue: Messages Not Sending
**Solutions:**
- Verify account status is "connected"
- Check recipient JID format
- Ensure media URLs are publicly accessible
- Monitor webhook for delivery status

### Issue: QR Code Not Displaying
**Solutions:**
- Wait a few seconds after account creation
- Check if account is still in "connecting" state
- Try refreshing QR code endpoint
- Verify server is running properly

### Issue: Webhook Not Receiving Events
**Solutions:**
- Check webhook URL is accessible
- Verify webhook URL format in account creation
- Monitor webhook.site for delivery attempts
- Check server logs for webhook errors

---

## 📈 Performance Testing

### Load Testing Setup
1. Create multiple test accounts
2. Send concurrent messages
3. Monitor server resources
4. Check response times

### Metrics to Monitor
- Response times for each endpoint
- Memory usage during high load
- Connection stability
- Message delivery rates

---

## 🛡 Security Considerations

### API Security
- Server runs without authentication (development only)
- Implement authentication for production
- Use HTTPS for webhook URLs
- Secure session files directory

### Testing Security
- Use test phone numbers only
- Don't expose real user data
- Rotate webhook URLs regularly
- Monitor for suspicious activity

---

## 📝 Example Test Scripts

### Pre-request Script Example
```javascript
// Generate unique account ID
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(7);
pm.globals.set('testAccountId', `test_${timestamp}_${randomId}`);

// Set current timestamp
pm.globals.set('timestamp', timestamp);
```

### Test Script Example
```javascript
pm.test("Account created successfully", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data.id).to.exist;
    
    // Store account ID for subsequent requests
    pm.globals.set('createdAccountId', response.data.id);
});

pm.test("QR code is present", function () {
    const response = pm.response.json();
    if (response.data.qrCode) {
        pm.expect(response.data.qrCode).to.include('data:image/png;base64,');
    }
});
```

---

## 🎉 Advanced Features

### Dynamic Variables
The collection automatically generates:
- Unique account IDs using timestamps
- Random test data for realistic testing
- Environment-specific configurations

### Automated Cleanup
Workflows include automatic cleanup steps:
- Disconnect test accounts
- Clear temporary variables
- Reset environment state

### Comprehensive Testing
- HTTP status code validation
- Response structure validation
- Business logic verification
- Error handling testing

---

## 📞 Support & Resources

### Documentation Links
- [Baileys GitHub Repository](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Postman Learning Center](https://learning.postman.com/)

### Getting Help
1. Check server logs for detailed error information
2. Use webhook.site to monitor webhook deliveries
3. Test individual endpoints before running workflows
4. Verify environment variables are properly configured

---

## 🚀 Ready to Test!

1. ✅ Import collection and environment
2. ✅ Configure your environment variables
3. ✅ Start the Baileys server
4. ✅ Run the health check
5. ✅ Connect your first account
6. ✅ Start sending messages!

**Happy Testing! 🎯**