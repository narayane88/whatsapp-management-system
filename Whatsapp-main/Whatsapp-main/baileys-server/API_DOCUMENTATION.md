# Baileys WhatsApp Server - API Documentation

## Base URL
```
http://localhost:3005/api
```

## Authentication
No authentication required. All endpoints are publicly accessible.

## Content Type
All POST requests should use `Content-Type: application/json`

---

## Account Management Endpoints

### 1. Connect WhatsApp Account

Connect a new WhatsApp account to the server.

**Endpoint:** `POST /api/accounts/connect`

**Request Body:**
```json
{
  "id": "string (optional)",           // Custom account ID, auto-generated if not provided
  "phoneNumber": "string (optional)",   // Required for pairing code method
  "webhookUrl": "string (optional)",    // URL for webhook notifications
  "usePairingCode": "boolean (default: false)"  // Use pairing code instead of QR code
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3005/api/accounts/connect \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-whatsapp-account",
    "phoneNumber": "+1234567890",
    "webhookUrl": "https://myapp.com/webhook",
    "usePairingCode": false
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "my-whatsapp-account",
    "status": "connecting",
    "phoneNumber": "+1234567890",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "pairingCode": null
  },
  "message": "Account connection initiated"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error message"
}
```

---

### 2. Disconnect Account

Disconnect and remove a WhatsApp account from the server.

**Endpoint:** `DELETE /api/accounts/{id}/disconnect`

**Path Parameters:**
- `id` (string, required): Account ID

**Example Request:**
```bash
curl -X DELETE http://localhost:3005/api/accounts/my-whatsapp-account/disconnect
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account disconnected successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Account not found"
}
```

---

### 3. Get Account Status

Get the current status and information of a WhatsApp account.

**Endpoint:** `GET /api/accounts/{id}/status`

**Path Parameters:**
- `id` (string, required): Account ID

**Example Request:**
```bash
curl http://localhost:3005/api/accounts/my-whatsapp-account/status
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "my-whatsapp-account",
    "status": "connected",
    "phoneNumber": "+1234567890",
    "lastConnected": "2024-01-15T10:30:00.000Z",
    "qrCode": null,
    "pairingCode": null
  }
}
```

**Status Values:**
- `connecting` - Account is connecting to WhatsApp
- `connected` - Account is connected and ready
- `disconnected` - Account is disconnected
- `error` - Connection error occurred

---

### 4. Get QR Code

Get the QR code for account connection (if available).

**Endpoint:** `GET /api/accounts/{id}/qr`

**Path Parameters:**
- `id` (string, required): Account ID

**Example Request:**
```bash
curl http://localhost:3005/api/accounts/my-whatsapp-account/qr
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "QR code not available"
}
```

---

### 5. List All Accounts

Get a list of all WhatsApp accounts on the server.

**Endpoint:** `GET /api/accounts`

**Example Request:**
```bash
curl http://localhost:3005/api/accounts
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account-1",
        "status": "connected",
        "phoneNumber": "+1234567890",
        "lastSeen": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "account-2",
        "status": "connecting",
        "phoneNumber": "+0987654321",
        "qrCode": "data:image/png;base64,..."
      }
    ],
    "total": 2
  },
  "message": "Found 2 accounts"
}
```

---

## Messaging Endpoints

### 1. Send Message

Send various types of messages through a connected WhatsApp account.

**Endpoint:** `POST /api/accounts/{id}/send-message`

**Path Parameters:**
- `id` (string, required): Account ID

**Request Body:**
```json
{
  "to": "string (required)",    // Recipient JID (e.g., "1234567890@s.whatsapp.net")
  "message": {
    // ONE of the following message types
  }
}
```

#### Message Types:

##### Text Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "text": "Hello, World!"
  }
}
```

##### Image Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "image": {
      "url": "https://example.com/image.jpg",
      "caption": "Check out this image!"
    }
  }
}
```

##### Video Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "video": {
      "url": "https://example.com/video.mp4",
      "caption": "Amazing video!"
    }
  }
}
```

##### Audio Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "audio": {
      "url": "https://example.com/audio.mp3"
    }
  }
}
```

##### Document Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "document": {
      "url": "https://example.com/document.pdf",
      "filename": "important-document.pdf",
      "caption": "Please review this document"
    }
  }
}
```

##### Location Message
```json
{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "name": "San Francisco",
      "address": "San Francisco, CA, USA"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3005/api/accounts/my-whatsapp-account/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890@s.whatsapp.net",
    "message": {
      "text": "Hello from Baileys Server!"
    }
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "3EB0C431C5E2A9A89"
  },
  "message": "Message sent successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Account is connecting, cannot send message"
}
```

---

### 2. Get Chats

Get the chat list for an account (not implemented yet).

**Endpoint:** `GET /api/accounts/{id}/chats`

**Response (501 Not Implemented):**
```json
{
  "success": false,
  "error": "Chat retrieval not implemented yet"
}
```

---

## Server Status Endpoints

### 1. Health Check

Check if the server is running and healthy.

**Endpoint:** `GET /api/health`

**Example Request:**
```bash
curl http://localhost:3005/api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "accounts": {
      "total": 3
    },
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576,
      "arrayBuffers": 131072
    },
    "version": "v18.17.0",
    "platform": "win32"
  },
  "message": "Server is running"
}
```

---

### 2. Server Statistics

Get detailed server statistics and account information.

**Endpoint:** `GET /api/stats`

**Example Request:**
```bash
curl http://localhost:3005/api/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accounts": {
      "total": 3,
      "byStatus": {
        "connected": 2,
        "connecting": 1,
        "disconnected": 0
      },
      "list": [
        {
          "id": "account-1",
          "status": "connected",
          "phoneNumber": "+1234567890",
          "lastSeen": "2024-01-15T10:30:00.000Z"
        },
        {
          "id": "account-2",
          "status": "connected",
          "phoneNumber": "+0987654321",
          "lastSeen": "2024-01-15T10:25:00.000Z"
        },
        {
          "id": "account-3",
          "status": "connecting",
          "phoneNumber": "+1122334455",
          "lastSeen": null
        }
      ]
    },
    "server": {
      "uptime": 3600,
      "memory": {
        "rss": 50331648,
        "heapTotal": 20971520,
        "heapUsed": 15728640,
        "external": 1048576,
        "arrayBuffers": 131072
      },
      "version": "v18.17.0",
      "platform": "win32",
      "nodeVersion": "v18.17.0"
    }
  }
}
```

---

## Root Endpoint

### Server Information

Get basic server information and available endpoints.

**Endpoint:** `GET /`

**Example Request:**
```bash
curl http://localhost:3005/
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "name": "Baileys WhatsApp Server",
    "version": "1.0.0",
    "description": "Standalone server for managing multiple WhatsApp accounts using Baileys",
    "endpoints": {
      "accounts": {
        "POST /api/accounts/connect": "Connect new WhatsApp account",
        "DELETE /api/accounts/:id/disconnect": "Disconnect account",
        "GET /api/accounts/:id/status": "Get account status",
        "GET /api/accounts/:id/qr": "Get QR code",
        "GET /api/accounts": "List all accounts"
      },
      "messages": {
        "POST /api/accounts/:id/send-message": "Send message",
        "GET /api/accounts/:id/chats": "Get chats (not implemented)"
      },
      "status": {
        "GET /api/health": "Server health check",
        "GET /api/stats": "Server statistics"
      }
    }
  },
  "message": "Baileys WhatsApp Server is running"
}
```

---

## Webhook Events

The server sends HTTP POST requests to configured webhook URLs for the following events:

### 1. Connection Update

Sent when an account's connection status changes.

**Webhook Payload:**
```json
{
  "event": "connection.update",
  "accountId": "my-whatsapp-account",
  "timestamp": 1705315800000,
  "data": {
    "connection": "open",
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "pairingCode": "12345678"
  }
}
```

**Connection Status Values:**
- `connecting` - Account is connecting
- `open` - Account is connected successfully
- `close` - Connection was closed

---

### 2. Message Received

Sent when the account receives a new message.

**Webhook Payload:**
```json
{
  "event": "message.received",
  "accountId": "my-whatsapp-account",
  "timestamp": 1705315800000,
  "data": {
    "messageId": "3EB0C431C5E2A9A89",
    "from": "1234567890@s.whatsapp.net",
    "timestamp": 1705315800000,
    "message": {
      "type": "text",
      "text": "Hello there!"
    }
  }
}
```

**Message Types in Webhooks:**
- `text` - Text message with `text` field
- `image` - Image message with `caption` and `mediaUrl` fields
- `video` - Video message with `caption` and `mediaUrl` fields
- `audio` - Audio message with `mediaUrl` field
- `document` - Document message with `caption`, `mediaUrl`, and `filename` fields
- `location` - Location message with `location` object containing `latitude` and `longitude`

---

### 3. Message Status Update

Sent when a message status changes (delivered, read, etc.).

**Webhook Payload:**
```json
{
  "event": "message.status",
  "accountId": "my-whatsapp-account",
  "timestamp": 1705315800000,
  "data": {
    "key": {
      "remoteJid": "1234567890@s.whatsapp.net",
      "fromMe": true,
      "id": "3EB0C431C5E2A9A89"
    },
    "update": {
      "status": "READ"
    }
  }
}
```

---

### 4. Account Disconnected

Sent when an account is disconnected.

**Webhook Payload:**
```json
{
  "event": "account.disconnected",
  "accountId": "my-whatsapp-account",
  "timestamp": 1705315800000,
  "data": {
    "reason": "logged_out"
  }
}
```

---

## Error Responses

All endpoints return consistent error response format:

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "error": "\"phoneNumber\" is required when usePairingCode is true"
}
```

### Not Found Error (404 Not Found)
```json
{
  "success": false,
  "error": "Account not found"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

### Endpoint Not Found (404 Not Found)
```json
{
  "success": false,
  "error": "Endpoint not found",
  "message": "GET /api/nonexistent does not exist"
}
```

---

## JID Format

WhatsApp JIDs (Jabber IDs) follow these formats:

- **Individual Chat:** `1234567890@s.whatsapp.net`
- **Group Chat:** `1234567890-1234567890@g.us`
- **Broadcast List:** `1234567890@broadcast`

When sending messages, always use the complete JID format.

---

## Rate Limits

No rate limits are currently implemented, but it's recommended to:
- Send messages at reasonable intervals (1-2 seconds between messages)
- Avoid sending too many messages to the same recipient quickly
- Monitor webhook delivery to avoid overwhelming your endpoint

---

## Testing Examples

### Complete Flow Example

1. **Connect an account:**
```bash
curl -X POST http://localhost:3005/api/accounts/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "test-account", "webhookUrl": "https://webhook.site/your-unique-url"}'
```

2. **Check status and get QR code:**
```bash
curl http://localhost:3005/api/accounts/test-account/status
```

3. **Send a test message (after connection):**
```bash
curl -X POST http://localhost:3005/api/accounts/test-account/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890@s.whatsapp.net",
    "message": {"text": "Hello from API!"}
  }'
```

4. **Check server health:**
```bash
curl http://localhost:3005/api/health
```

5. **Disconnect account:**
```bash
curl -X DELETE http://localhost:3005/api/accounts/test-account/disconnect
```

---

## Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3005
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
SESSIONS_DIR=./sessions
```

---

## Security Considerations

- The server runs without authentication - implement authentication in production
- Webhook URLs receive sensitive message data - use HTTPS
- Session files contain authentication credentials - secure the sessions directory
- Monitor log files for sensitive information exposure
- Consider implementing rate limiting for production use

---

## Troubleshooting

### Common Issues:

1. **Account stuck in "connecting" status:**
   - Check if QR code was scanned or pairing code was entered
   - Verify phone number format for pairing code method

2. **Messages not sending:**
   - Ensure account status is "connected"
   - Verify recipient JID format
   - Check webhook logs for error details

3. **Webhook not receiving events:**
   - Verify webhook URL is accessible
   - Check webhook endpoint logs for delivery failures
   - Webhooks retry 3 times with exponential backoff

4. **Session lost after restart:**
   - Ensure sessions directory is writable
   - Check file permissions on session files
   - Verify session directory path in configuration