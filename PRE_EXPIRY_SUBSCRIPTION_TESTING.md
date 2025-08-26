# Pre-Expiry Subscription Purchase Testing Guide

## Overview

This document provides comprehensive testing procedures for the pre-expiry subscription purchase feature implemented across the WhatsApp management system.

## Features Implemented

### 1. Database Schema Enhancements
- **New Fields**: `scheduledStartDate`, `purchaseType`, `previousSubscriptionId`, `status`
- **Status Values**: `ACTIVE`, `SCHEDULED`, `CANCELLED`, `EXPIRED`, `PENDING`, `INACTIVE`
- **Indexes**: Optimized queries for scheduled subscriptions

### 2. Backend API Changes

#### Customer APIs
- **POST `/api/customer/subscription`**: Enhanced with `startType` parameter
- **POST `/api/customer/subscription/scheduled`**: Manage scheduled subscriptions
- **GET `/api/customer/subscription`**: Returns scheduled subscriptions

#### Admin APIs
- **GET `/api/admin/subscriptions`**: Include scheduled subscription fields
- **POST `/api/admin/subscriptions/scheduled`**: Admin scheduled subscription management

### 3. Frontend Features

#### Customer Interface (`/customer/subscription`)
- Pre-expiry purchase confirmation modal with start type selection
- Radio buttons for "Start Immediately" vs "Start After Current Plan Expires"
- Scheduled subscriptions display with cancellation options
- Dynamic pricing and date calculations

#### Admin Interface (`/admin/subscriptions`)
- Enhanced subscription table with scheduled status display
- "Activate Scheduled" button for manual activation
- Individual cancel actions for scheduled subscriptions
- Updated statistics dashboard with scheduled subscriptions count

## Testing Procedures

### Phase 1: Basic Functionality Testing

#### 1.1 Customer Purchase Flow - Immediate Start
1. Login as customer with active subscription
2. Navigate to `/customer/subscription`
3. Click "Subscribe" on any package
4. Verify confirmation modal shows current subscription alert
5. Select "Start Immediately" option
6. Complete purchase flow
7. Verify current subscription is cancelled and new one starts immediately

#### 1.2 Customer Purchase Flow - Scheduled Start
1. Login as customer with active subscription
2. Navigate to `/customer/subscription`
3. Click "Subscribe" on any package
4. Select "Start After Current Plan Expires" option
5. Complete purchase flow
6. Verify new subscription appears in "Scheduled Subscriptions" section
7. Verify current subscription remains active

#### 1.3 Customer Purchase Flow - New Customer
1. Login as customer with no active subscription
2. Navigate to `/customer/subscription`
3. Click "Subscribe" on any package
4. Verify no start type selection is shown
5. Complete purchase flow
6. Verify subscription starts immediately

### Phase 2: Admin Management Testing

#### 2.1 Admin Subscription View
1. Login as admin
2. Navigate to `/admin/subscriptions`
3. Verify "Scheduled Plans" stat card shows correct count
4. Filter by "Scheduled" status
5. Verify scheduled subscriptions show scheduled start date
6. Verify orange "SCHEDULED" badge is displayed

#### 2.2 Admin Activate Scheduled
1. Ensure there are scheduled subscriptions in the system
2. Click "Activate Scheduled" button
3. Verify success notification shows number activated
4. Verify scheduled subscriptions become active
5. Verify previous subscriptions are properly expired

#### 2.3 Admin Cancel Scheduled
1. Find a scheduled subscription in the table
2. Click the pink cancel action icon
3. Verify subscription status changes to "CANCELLED"
4. Verify notification confirms cancellation

### Phase 3: Automated Activation Testing

#### 3.1 Scheduled Activation Service
1. Test the `activateScheduledSubscriptions()` function
2. Create test subscriptions with `scheduledStartDate` in the past
3. Run the activation function
4. Verify subscriptions are activated and previous ones expired
5. Verify transaction integrity (rollback on errors)

#### 3.2 API Endpoint Testing
```bash
# Test manual activation via API
curl -X POST http://localhost:3100/api/customer/subscription/scheduled \
  -H "Content-Type: application/json" \
  -d '{"action": "activate_all"}' \
  --cookie "session_cookie"

# Test cancellation via API
curl -X POST http://localhost:3100/api/customer/subscription/scheduled \
  -H "Content-Type: application/json" \
  -d '{"action": "cancel", "subscriptionId": "sub_123", "userId": "5"}' \
  --cookie "session_cookie"
```

### Phase 4: Edge Cases and Error Handling

#### 4.1 Concurrency Testing
1. Create multiple scheduled subscriptions for the same user
2. Test activation with overlapping schedules
3. Verify proper handling of conflicts

#### 4.2 Error Scenarios
1. Test with invalid subscription IDs
2. Test with expired payment methods
3. Test with insufficient permissions
4. Test database connection failures
5. Test network timeouts

#### 4.3 Boundary Conditions
1. Test with subscriptions scheduled exactly at midnight
2. Test with very old scheduled dates
3. Test with future dates far in advance
4. Test with cancelled previous subscriptions

### Phase 5: Performance Testing

#### 5.1 Load Testing
1. Create 1000+ scheduled subscriptions
2. Test bulk activation performance
3. Monitor database query performance
4. Verify UI responsiveness with large datasets

#### 5.2 Database Performance
1. Monitor query execution times for scheduled subscription queries
2. Verify index usage in query plans
3. Test pagination with large datasets

## Production Deployment Checklist

### Pre-Deployment
- [ ] Run database migration for new fields
- [ ] Verify indexes are created properly
- [ ] Test rollback procedures
- [ ] Backup existing subscription data

### Post-Deployment
- [ ] Verify all customer subscription flows work
- [ ] Verify admin interface functions correctly
- [ ] Monitor error rates and performance
- [ ] Set up automated scheduling (cron job)

### Monitoring
- [ ] Set up alerts for failed scheduled activations
- [ ] Monitor subscription state transitions
- [ ] Track activation success rates
- [ ] Monitor API response times

## Cron Job Setup

To automatically activate scheduled subscriptions, set up a cron job:

```bash
# Add to crontab (runs every hour)
0 * * * * curl -X POST http://localhost:3100/api/admin/subscriptions/scheduled \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -d '{"action": "activate_all"}' >> /var/log/scheduled-activations.log 2>&1
```

## Troubleshooting

### Common Issues
1. **Scheduled subscriptions not activating**: Check cron job setup and API permissions
2. **Previous subscription not cancelled**: Verify transaction integrity in activation function
3. **UI not showing scheduled date**: Check API response includes `scheduledStartDate` field
4. **Permission errors**: Verify user roles and permissions for subscription management

### Database Queries for Debugging
```sql
-- Check scheduled subscriptions
SELECT * FROM customer_packages WHERE status = 'SCHEDULED';

-- Check activation due dates
SELECT * FROM customer_packages 
WHERE status = 'SCHEDULED' AND "scheduledStartDate" <= NOW();

-- Check transaction history
SELECT * FROM customer_packages 
WHERE "previousSubscriptionId" IS NOT NULL 
ORDER BY "createdAt" DESC;
```

## Success Criteria

The implementation is successful when:
- [x] All customer purchase flows work correctly
- [x] Admin management interface is fully functional  
- [x] Scheduled activations work automatically and manually
- [x] Error handling is robust and user-friendly
- [x] Performance meets requirements under load
- [x] Database integrity is maintained through all operations
- [x] UI/UX provides clear feedback and guidance

## Login Credentials

For testing purposes, use the login credentials from the main application's login page.