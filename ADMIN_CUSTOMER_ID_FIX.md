# Admin Customer ID Fix Documentation

## Issue Description
When administrators created subscriptions for customers through the admin panel, all payment orders showed customer ID "1" regardless of which customer was selected. This caused subscriptions to be assigned to the wrong customer.

## Root Cause
The payment creation API (`/api/payments/create-iframe-session`) was designed for customer self-service and always used the session user's ID instead of respecting the customer ID passed in the request when an admin was creating payments for other customers.

### Code Location
`src/app/api/payments/create-iframe-session/route.ts` - Lines 148-173 (original)

### Problem Code
```typescript
// Original problematic code
if (session?.user?.email) {
  const user = userResult.rows[0]
  realUserId = user.id.toString()  // Always overrode with session user ID
  // This caused admin's ID to be used instead of target customer ID
}
```

## Solution Implemented

### Admin Context Detection
Added logic to detect when an admin is creating a payment for another customer by comparing the session user ID with the requested customer ID.

### Key Changes Made

1. **Admin Payment Detection** (Lines 148-208):
   ```typescript
   // Check if session user is different from requested customer
   if (customerId && customerId !== sessionUser.id.toString()) {
     // This is an admin creating payment for another customer
     isAdminPayment = true
     
     // Verify target customer exists and get their details
     const customerResult = await pool.query(
       'SELECT id, name, email FROM users WHERE id = $1',
       [parseInt(customerId)]
     )
     
     if (customerResult.rows.length > 0) {
       const customer = customerResult.rows[0]
       realUserId = customer.id.toString()      // Use target customer ID
       realUserEmail = customer.email
       realUserName = customer.name
     }
   }
   ```

2. **Session Data Enhancement** (Lines 221-224):
   ```typescript
   const sessionData = {
     // ... existing fields
     isAdminPayment,
     adminUserId: isAdminPayment ? adminUserId : null
   }
   ```

3. **Order Notes Enhancement** (Lines 293-295):
   ```typescript
   notes: {
     // ... existing fields
     isAdminPayment: isAdminPayment,
     adminUserId: isAdminPayment ? adminUserId : null
   }
   ```

4. **Improved Logging** (Lines 317-320):
   ```typescript
   console.log('Payment iframe session created:', {
     customerId: realUserId,        // Now shows correct customer ID
     customerName: realUserName,
     isAdminPayment: isAdminPayment
   })
   ```

## Testing Results

### Before Fix
- Admin selects customer ID 5
- Payment order shows customer ID "1"
- Subscription gets assigned to wrong customer

### After Fix
- Admin selects customer ID 5  
- Payment order shows customer ID "5" ✅
- Subscription gets assigned to correct customer ✅

## Files Modified
- `src/app/api/payments/create-iframe-session/route.ts`

## Commit Reference
This fix resolves the admin subscription customer ID override issue where all admin-created payments defaulted to customer ID "1".

## Impact
- ✅ Admins can now create subscriptions for specific customers correctly
- ✅ Payment orders show the correct target customer information
- ✅ Audit trail includes both admin and target customer context
- ✅ Backward compatibility maintained for customer self-payments

## Date
2025-08-28