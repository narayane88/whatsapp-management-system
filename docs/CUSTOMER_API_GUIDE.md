# Customer API Guide

## Overview
The WhatsApp Management System provides a comprehensive RESTful API for customers to integrate WhatsApp messaging capabilities into their applications. This API supports both JSON and form-urlencoded requests, making it easy to integrate with any platform.

**Base URL:** `https://yourdomain.com/api/v1` (or `http://localhost:3100/api/v1` for development)

---

## Authentication

All API endpoints require authentication using API keys. Include your API key in the `Authorization` header:

```
Authorization: Bearer sk_live_your_api_key_here
```

### Getting Your API Key

1. Log into the customer portal at `http://localhost:3100/customer`
2. Navigate to "Manage API Keys"
3. Click "Create API Key"
4. Select permissions (or leave empty for default permissions)
5. Choose expiration settings (or select "Never Expires")
6. Copy and securely store your API key

### Default Permissions

When creating an API key without specifying permissions, the following default permissions are granted:
- `messages.send` - Send WhatsApp messages
- `messages.read` - Read message history
- `contacts.read` - Access contact information
- `instances.read` - View device/instance information

---

## Quick Start

### 1. Send Your First Message (JSON)

```bash
curl -X POST "http://localhost:3100/api/v1/messages/send" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "9960589622",
    "message": "Hello from WhatsApp API!",
    "deviceName": "bizflash.in-device-20250121123045"
  }'
```

### 2. Send Message with Form Data

```bash
curl -X POST "http://localhost:3100/api/v1/messages/send" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "to=9960589622&message=Hello from API&deviceName=bizflash.in-device-20250121123045"
```

### 3. Get Your Devices

```bash
curl -X GET "http://localhost:3100/api/v1/devices?format=table" \
  -H "Authorization: Bearer sk_live_your_api_key"
```

---

## API Endpoints

### Messages

#### Send Message
**POST** `/api/v1/messages/send`

Send a WhatsApp message to a recipient.

**Request Body (JSON or Form-urlencoded):**
```json
{
  "to": "9960589622",
  "message": "Your message content",
  "deviceName": "bizflash.in-device-20250121123045"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "1737538800000",
    "to": "9960589622",
    "message": "Your message content", 
    "deviceName": "bizflash.in-device-20250121123045",
    "status": "sent",
    "sentAt": "2025-01-21T15:30:00.000Z",
    "serverUsed": "Primary Server"
  },
  "message": "Message sent successfully"
}
```

### Devices

#### Get Devices (Hybrid Table Format)
**GET** `/api/v1/devices`

Get your WhatsApp devices in a table-compatible format.

**Query Parameters:**
- `format` - Response format: `table` (default) or `json`
- `status` - Filter by status: `CONNECTED`, `CONNECTING`, `DISCONNECTED`, etc.

**Response (Table Format):**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceName": "bizflash.in-device-20250121123045",
        "phoneNumber": "+1234567890",
        "status": "🟢 Connected",
        "messages": 245,
        "lastActivity": "1/21/2025, 3:30:00 PM",
        "serverName": "Primary Server",
        "actions": ["view", "edit", "delete", "relink"],
        "metadata": {
          "id": "cm7x8y9z0",
          "serverId": "server_001",
          "serverUrl": "http://localhost:3110",
          "createdAt": "2025-01-21T10:00:00.000Z",
          "rawStatus": "CONNECTED"
        }
      }
    ],
    "summary": {
      "total": 3,
      "connected": 2,
      "pending": 1,
      "disconnected": 0,
      "totalMessages": 1250
    },
    "format": "table"
  },
  "message": "Retrieved 3 devices in table format"
}
```

### Servers

#### Get Available Servers
**GET** `/api/v1/servers`

Get list of available WhatsApp servers for device connections.

**Query Parameters:**
- `status` - Filter by status: `active`, `inactive`, `maintenance`
- `includeHealth` - Include real-time health data: `true` (default) or `false`

**Response:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server_001",
        "name": "Primary Server",
        "url": "http://localhost:3110",
        "location": "Local Development",
        "status": "active",
        "capacity": {
          "max": 100,
          "current": 12,
          "available": 88,
          "percentage": 12
        },
        "performance": {
          "ping": 25,
          "uptime": 99.9,
          "version": "1.2.0",
          "lastSeen": "2025-01-21T15:29:45.000Z"
        },
        "recommended": true
      }
    ],
    "summary": {
      "total": 2,
      "active": 1,
      "inactive": 1,
      "maintenance": 0,
      "totalCapacity": 200,
      "availableCapacity": 188,
      "recommendedServer": "server_001"
    }
  },
  "message": "Retrieved 2 servers"
}
```

---

## Request Formats

### JSON Format
```bash
curl -X POST "http://localhost:3100/api/v1/messages/send" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"to":"9960589622","message":"Hello API","deviceName":"device_name"}'
```

### Form-Urlencoded Format
```bash
curl -X POST "http://localhost:3100/api/v1/messages/send" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "to=9960589622&message=Hello API&deviceName=device_name"
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Common Errors

#### Invalid API Key
```json
{
  "success": false,
  "error": "Invalid or inactive API key"
}
```

#### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions for sending messages"
}
```

#### Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields",
  "required": ["to", "message", "deviceName"],
  "provided": ["to", "message"]
}
```

#### Device Not Found
```json
{
  "success": false,
  "error": "Device not found or does not belong to your account",
  "deviceName": "invalid_device"
}
```

---

## Testing Environment

### Test Phone Numbers
Use these numbers for testing (they won't send actual messages):
- **Primary:** `9960589622`
- **Secondary:** `8983063144`

### Testing Your API Key

1. **Test Authentication:**
```bash
curl -X GET "http://localhost:3100/api/v1/devices" \
  -H "Authorization: Bearer sk_live_your_api_key"
```

2. **Test Message Sending:**
```bash
curl -X POST "http://localhost:3100/api/v1/messages/send" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "9960589622",
    "message": "Test message from API",
    "deviceName": "your_device_name"
  }'
```

### Interactive Testing
- **Swagger UI:** `http://localhost:3005` (when Baileys server is running)
- **API Documentation:** Available in customer portal under "API Keys → Documentation"

---

## Rate Limits

- **API Requests:** 100 requests per minute per API key
- **Message Sending:** Based on your subscription plan
- **Burst Limit:** 10 requests per second

---

## Best Practices

### Security
- ✅ Store API keys securely (environment variables, secure vault)
- ✅ Use HTTPS in production
- ✅ Implement request signing for sensitive operations
- ❌ Never include API keys in client-side code
- ❌ Never commit API keys to version control

### Performance
- ✅ Implement exponential backoff for failed requests
- ✅ Use appropriate timeout values
- ✅ Cache device and server information
- ✅ Handle rate limiting gracefully

### Error Handling
- ✅ Always check the `success` field in responses
- ✅ Implement retry logic for transient errors
- ✅ Log all API interactions for debugging
- ✅ Handle network timeouts gracefully

---

## Code Examples

### Node.js (JavaScript)
```javascript
const axios = require('axios');

const apiKey = 'sk_live_your_api_key';
const baseUrl = 'http://localhost:3100/api/v1';

async function sendMessage(to, message, deviceName) {
  try {
    const response = await axios.post(`${baseUrl}/messages/send`, {
      to,
      message,
      deviceName
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
sendMessage('9960589622', 'Hello from Node.js!', 'your_device_name');
```

### PHP
```php
<?php
function sendWhatsAppMessage($to, $message, $deviceName) {
    $apiKey = 'sk_live_your_api_key';
    $url = 'http://localhost:3100/api/v1/messages/send';
    
    $data = [
        'to' => $to,
        'message' => $message,
        'deviceName' => $deviceName
    ];
    
    $options = [
        'http' => [
            'header'  => [
                "Content-Type: application/json",
                "Authorization: Bearer " . $apiKey
            ],
            'method'  => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Failed to send message');
    }
    
    return json_decode($result, true);
}

// Usage
$response = sendWhatsAppMessage('9960589622', 'Hello from PHP!', 'your_device_name');
echo json_encode($response, JSON_PRETTY_PRINT);
?>
```

### Python
```python
import requests
import json

API_KEY = 'sk_live_your_api_key'
BASE_URL = 'http://localhost:3100/api/v1'

def send_message(to, message, device_name):
    url = f'{BASE_URL}/messages/send'
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'to': to,
        'message': message,
        'deviceName': device_name
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f'API Error: {response.status_code} - {response.text}')

# Usage
try:
    result = send_message('9960589622', 'Hello from Python!', 'your_device_name')
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f'Error: {e}')
```

---

## Webhook Support (Coming Soon)

Future versions will support webhooks for real-time notifications:
- Message delivery status
- Device connection status changes
- Incoming message notifications
- API usage alerts

---

## Support

### Documentation
- **Full API Reference:** Available in customer portal
- **Interactive Testing:** Swagger UI at `http://localhost:3005`
- **Status Page:** Check server status in real-time

### Getting Help
- **Customer Portal:** Technical support section
- **Email:** support@yourdomain.com
- **Documentation:** This guide and inline API documentation

### Troubleshooting
1. **API Key Issues:** Verify key is active and has correct permissions
2. **Device Issues:** Check device status in customer portal
3. **Rate Limiting:** Implement exponential backoff
4. **Server Issues:** Check server status at `/api/v1/servers`

---

*Last Updated: January 21, 2025*  
*API Version: v1.0*