# Scheduled Subscription Activation API Documentation

## Overview

The Scheduled Subscription Activation API provides endpoints to manage and automate the activation of scheduled subscriptions. This system allows subscriptions purchased with "Start After Current Plan Expires" to be automatically activated when the scheduled date arrives.

## Base URL
```
https://wa.bizflash.in/api
```

## Authentication

All endpoints require authentication via session cookies. Users must have appropriate permissions:
- `subscriptions.page.access` - Required for all scheduler operations

## API Endpoints

### 1. Get Scheduler Status

Get the current status of the subscription scheduler.

**Endpoint:** `GET /api/admin/scheduler`

**Response:**
```json
{
  "scheduler": {
    "isRunning": true,
    "intervalMinutes": 1,
    "nextCheck": "2025-08-26T10:01:00.000Z"
  },
  "message": "Scheduler is running"
}
```

**Response Fields:**
- `isRunning` (boolean): Whether the scheduler is currently active
- `intervalMinutes` (number): How often the scheduler checks for due subscriptions
- `nextCheck` (string|null): ISO timestamp of next scheduled check
- `message` (string): Human-readable status message

---

### 2. Control Scheduler

Start, stop, or get status of the subscription scheduler, or manually trigger activation.

**Endpoint:** `POST /api/admin/scheduler`

**Request Body:**
```json
{
  "action": "start|stop|status|activate_now"
}
```

#### Action: Start Scheduler
```json
{
  "action": "start"
}
```

**Response:**
```json
{
  "message": "Subscription scheduler started",
  "scheduler": {
    "isRunning": true,
    "intervalMinutes": 1,
    "nextCheck": "2025-08-26T10:01:00.000Z"
  }
}
```

#### Action: Stop Scheduler
```json
{
  "action": "stop"
}
```

**Response:**
```json
{
  "message": "Subscription scheduler stopped",
  "scheduler": {
    "isRunning": false,
    "intervalMinutes": 1,
    "nextCheck": null
  }
}
```

#### Action: Get Status
```json
{
  "action": "status"
}
```

**Response:**
```json
{
  "scheduler": {
    "isRunning": true,
    "intervalMinutes": 1,
    "nextCheck": "2025-08-26T10:01:00.000Z"
  }
}
```

#### Action: Manual Activation
```json
{
  "action": "activate_now"
}
```

**Response:**
```json
{
  "message": "Manually activated 3 subscription(s)",
  "result": {
    "activated": 3,
    "errors": []
  },
  "scheduler": {
    "isRunning": true,
    "intervalMinutes": 1,
    "nextCheck": "2025-08-26T10:01:00.000Z"
  }
}
```

---

### 3. Legacy Manual Activation (Deprecated)

**Note:** This endpoint is deprecated. Use `POST /api/admin/scheduler` with `action: "activate_now"` instead.

**Endpoint:** `POST /api/admin/subscriptions/scheduled`

**Request Body:**
```json
{
  "action": "activate_all"
}
```

**Response:**
```json
{
  "message": "Activated 2 scheduled subscription(s)",
  "result": {
    "activated": 2,
    "errors": []
  }
}
```

## Error Responses

All endpoints return standard HTTP error codes with detailed error messages:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid action"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Connection to database failed"
}
```

## Automatic Activation Process

The scheduler automatically performs the following steps when activating scheduled subscriptions:

1. **Find Due Subscriptions**
   - Query for subscriptions with `status = 'SCHEDULED'`
   - Filter by `scheduledStartDate <= NOW()`
   - Order by scheduled start date (oldest first)

2. **Activation Process** (for each subscription)
   - Start database transaction
   - Expire previous subscription (set `isActive = false`, `status = 'EXPIRED'`)
   - Activate scheduled subscription (set `isActive = true`, `status = 'ACTIVE'`, `startDate = NOW()`)
   - Commit transaction

3. **Error Handling**
   - Rollback transaction on any error
   - Continue processing other subscriptions
   - Log errors for monitoring

## Usage Examples

### JavaScript/Fetch

#### Start the Scheduler
```javascript
const response = await fetch('/api/admin/scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'start' })
});

const data = await response.json();
console.log(data.message); // "Subscription scheduler started"
```

#### Check Scheduler Status
```javascript
const response = await fetch('/api/admin/scheduler');
const data = await response.json();
console.log(`Scheduler running: ${data.scheduler.isRunning}`);
```

#### Manual Activation
```javascript
const response = await fetch('/api/admin/scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'activate_now' })
});

const data = await response.json();
console.log(`Activated ${data.result.activated} subscriptions`);
```

### cURL

#### Start Scheduler
```bash
curl -X POST https://wa.bizflash.in/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}' \
  --cookie "session_cookie_here"
```

#### Get Status
```bash
curl https://wa.bizflash.in/api/admin/scheduler \
  --cookie "session_cookie_here"
```

#### Manual Activation
```bash
curl -X POST https://wa.bizflash.in/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "activate_now"}' \
  --cookie "session_cookie_here"
```

## Monitoring and Logging

The scheduler provides detailed logging:

### Successful Activation
```
🕒 Starting scheduled subscription activation check...
📅 Found 2 scheduled subscriptions to activate
🔄 Activating scheduled subscription cs_123 for user customer@demo.com
   ✅ Expired previous subscription cs_old
   ✅ Activated subscription cs_123 (Premium Plan) for customer@demo.com
🎉 Scheduled subscription activation completed: 2 activated, 0 errors
🎯 Automatically activated 2 scheduled subscription(s)
```

### No Activations Needed
```
🕒 Starting scheduled subscription activation check...
✅ No scheduled subscriptions to activate
```

### Error Handling
```
🔄 Activating scheduled subscription cs_456 for user user@example.com
   ❌ Failed to activate subscription cs_456: Connection timeout
❌ Auto-activation errors: 1 ["Failed to activate subscription cs_456: Connection timeout"]
```

## Environment Configuration

### Development
Set environment variable to enable scheduler in development:
```bash
ENABLE_SUBSCRIPTION_SCHEDULER=true
```

### Production
The scheduler automatically starts in production environments.

## Best Practices

1. **Monitor Logs**: Regular monitoring of scheduler logs for errors
2. **Database Performance**: Ensure indexes on `status` and `scheduledStartDate` columns
3. **Error Alerts**: Set up alerts for activation failures
4. **Backup Strategy**: Regular backups before bulk activations
5. **Testing**: Test activation logic thoroughly in staging environment

## Security Considerations

1. **Authentication**: All endpoints require valid session authentication
2. **Permissions**: Proper role-based access control enforced
3. **Rate Limiting**: Consider implementing rate limits for manual activation
4. **Audit Logging**: All scheduler actions are logged with timestamps
5. **Transaction Safety**: Database transactions ensure data consistency

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check environment variable `ENABLE_SUBSCRIPTION_SCHEDULER=true`
   - Verify database connection
   - Check server logs for initialization errors

2. **Subscriptions Not Activating**
   - Verify scheduled subscriptions exist with `status = 'SCHEDULED'`
   - Check `scheduledStartDate` is in the past
   - Review database permissions
   - Check transaction logs for errors

3. **Permission Errors**
   - Verify user has `subscriptions.page.access` permission
   - Check user role and permissions in database
   - Validate session authentication

### Debug Commands

```bash
# Check scheduled subscriptions in database
SELECT * FROM customer_packages WHERE status = 'SCHEDULED';

# Check activation due dates
SELECT * FROM customer_packages 
WHERE status = 'SCHEDULED' AND "scheduledStartDate" <= NOW();

# Check recent activations
SELECT * FROM customer_packages 
WHERE "previousSubscriptionId" IS NOT NULL 
ORDER BY "createdAt" DESC;
```

## Change Log

### Version 1.0.0 (Current)
- Initial implementation of scheduler API
- Automatic background activation every 1 minute
- Manual activation trigger support
- Comprehensive error handling and logging
- Transaction-safe activation process

---

**Last Updated:** August 26, 2025  
**API Version:** 1.0.0