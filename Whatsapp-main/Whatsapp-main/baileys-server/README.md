# Baileys WhatsApp Server

A standalone Express.js server that manages multiple WhatsApp accounts using the unofficial Baileys WhatsApp Web API library. This server provides REST APIs for connecting/disconnecting accounts, sending messages, and webhook notifications for consumer systems.

## Features

- 🔥 **Multi-Account Support**: Handle unlimited WhatsApp accounts simultaneously
- 📁 **File-Based Sessions**: Persistent session storage using folders and files
- 🔗 **REST API**: Clean RESTful endpoints for all operations
- 📬 **Webhook Integration**: Real-time notifications to consumer systems
- 🔐 **QR Code & Pairing Code**: Both authentication methods supported
- 📱 **Message Types**: Support for text, image, video, audio, document, location
- 🛡️ **Error Handling**: Comprehensive error handling and logging
- 🔄 **Auto-Reconnection**: Automatic reconnection on connection loss

## Installation

1. Clone or create the project:
```bash
mkdir baileys-server
cd baileys-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Build the project:
```bash
npm run build
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Account Management

#### Connect Account
```http
POST /api/accounts/connect
Content-Type: application/json

{
  "id": "optional-account-id",
  "phoneNumber": "+1234567890",
  "webhookUrl": "https://your-app.com/webhook",
  "usePairingCode": false
}
```

#### Disconnect Account
```http
DELETE /api/accounts/{id}/disconnect
```

#### Get Account Status
```http
GET /api/accounts/{id}/status
```

#### Get QR Code
```http
GET /api/accounts/{id}/qr
```

#### List All Accounts
```http
GET /api/accounts
```

### Messaging

#### Send Message
```http
POST /api/accounts/{id}/send-message
Content-Type: application/json

{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "text": "Hello World!"
  }
}
```

#### Send Image
```http
POST /api/accounts/{id}/send-message
Content-Type: application/json

{
  "to": "1234567890@s.whatsapp.net",
  "message": {
    "image": {
      "url": "https://example.com/image.jpg",
      "caption": "Check this out!"
    }
  }
}
```

#### Send Location
```http
POST /api/accounts/{id}/send-message
Content-Type: application/json

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

### Server Status

#### Health Check
```http
GET /api/health
```

#### Server Statistics
```http
GET /api/stats
```

## Webhook Events

The server sends webhook notifications for the following events:

### Connection Update
```json
{
  "event": "connection.update",
  "accountId": "account-123",
  "timestamp": 1640995200000,
  "data": {
    "connection": "open",
    "qr": "data:image/png;base64,...",
    "pairingCode": "12345678"
  }
}
```

### Message Received
```json
{
  "event": "message.received",
  "accountId": "account-123",
  "timestamp": 1640995200000,
  "data": {
    "messageId": "msg-123",
    "from": "1234567890@s.whatsapp.net",
    "timestamp": 1640995200000,
    "message": {
      "type": "text",
      "text": "Hello!"
    }
  }
}
```

### Account Disconnected
```json
{
  "event": "account.disconnected",
  "accountId": "account-123",
  "timestamp": 1640995200000,
  "data": {
    "reason": "logged_out"
  }
}
```

## Session Management

Each WhatsApp account creates its own session folder:

```
sessions/
├── account-123/
│   ├── creds.json
│   ├── app-state-sync-key-*.json
│   └── session-*.json
└── account-456/
    ├── creds.json
    └── ...
```

Sessions persist across server restarts, allowing accounts to reconnect automatically.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `SESSIONS_DIR` | Sessions directory | `./sessions` |

## Error Handling

The server includes comprehensive error handling:

- **Validation Errors**: 400 Bad Request with detailed validation messages
- **Not Found**: 404 for non-existent accounts or endpoints  
- **Server Errors**: 500 with proper logging for debugging
- **WebSocket Errors**: Automatic reconnection with exponential backoff
- **Webhook Failures**: Retry mechanism with exponential backoff

## Security Features

- **Helmet**: Security headers for HTTP responses
- **CORS**: Configurable cross-origin request handling
- **Request Validation**: Input validation using Joi
- **Error Logging**: Structured logging without exposing sensitive data

## Development

### Scripts
- `npm run dev`: Development with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm run lint`: Lint TypeScript code
- `npm run format`: Format code with Prettier

### Project Structure
```
src/
├── managers/
│   ├── SessionManager.ts    # WhatsApp session management
│   └── WebhookManager.ts    # Webhook notifications
├── routes/
│   ├── accounts.ts          # Account management endpoints
│   ├── messages.ts          # Message sending endpoints
│   └── status.ts            # Server status endpoints
├── utils/
│   ├── logger.ts            # Logging utility
│   └── validation.ts        # Request validation
├── types.ts                 # TypeScript interfaces
└── server.ts                # Main Express server
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This project uses the unofficial Baileys WhatsApp Web API. Use at your own risk and ensure compliance with WhatsApp's Terms of Service.