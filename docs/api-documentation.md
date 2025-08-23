# WhatsApp System API Documentation

*Generated on: 2025-08-15T07:07:35.433Z*

This documentation is automatically generated from the API route files.

## Table of Contents

- [API-DOCS](#api-docs)
- [BIZPOINTS](#bizpoints)
- [DASHBOARD](#dashboard)
- [EMAIL](#email)
- [PACKAGES](#packages)
- [PAYMENT-METHODS](#payment-methods)
- [PAYMENT-SETTINGS](#payment-settings)
- [SECURITY](#security)
- [SERVERS](#servers)
- [SUBSCRIPTIONS](#subscriptions)
- [SYSTEM](#system)
- [TRANSACTIONS](#transactions)
- [USERS](#users)
- [CHECK-PERMISSION](#check-permission)
- [DEBUG-SESSION](#debug-session)
- [HEALTH](#health)
- [USER-PERMISSIONS](#user-permissions)
- [[...NEXTAUTH]](#[...nextauth])
- [PROFILE](#profile)
- [DAILY-MAINTENANCE](#daily-maintenance)
- [SUBSCRIPTION-MONITOR](#subscription-monitor)
- [API-KEYS](#api-keys)
- [BIZCOINS](#bizcoins)
- [DOCS](#docs)
- [HOST](#host)
- [SUBSCRIPTION](#subscription)
- [WHATSAPP](#whatsapp)
- [EXPORT](#export)
- [IMPERSONATE](#impersonate)
- [REDEEM-VOUCHER](#redeem-voucher)
- [ROUTE.TS](#route.ts)
- [STATS](#stats)
- [ADD-PERMISSION](#add-permission)
- [COMMISSION-CHECK](#commission-check)
- [COMPARE-PERMISSIONS](#compare-permissions)
- [CURRENT-USER](#current-user)
- [DIRECT-COMMISSION-TEST](#direct-commission-test)
- [END-TO-END-TEST](#end-to-end-test)
- [PAYMENT-COMMISSION-TEST](#payment-commission-test)
- [PAYMENT-FLOW-CHECK](#payment-flow-check)
- [PERMISSION-CHECK](#permission-check)
- [PERMISSIONS](#permissions)
- [ROLE-PERMISSIONS](#role-permissions)
- [TEST-TEMPLATE-MODES](#test-template-modes)
- [USER-DATA](#user-data)
- [USER-ROLE-CHECK](#user-role-check)
- [CREATE-IFRAME-SESSION](#create-iframe-session)
- [CREATE-ORDER](#create-order)
- [ORDER-DETAILS](#order-details)
- [VERIFY](#verify)
- [AVATAR](#avatar)
- [APPLY-TEMPLATE](#apply-template)
- [CURRENT](#current)
- [CURRENT-DEBUG](#current-debug)
- [[ID]](#[id])
- [MESSAGES](#messages)
- [REDEEM](#redeem)
- [RAZORPAY](#razorpay)
- [WHATSAPP-STATUS](#whatsapp-status)

---

## API-DOCS

### GET `admin/api-docs/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 500

**File:** `admin\api-docs\route.ts`

---

## BIZPOINTS

### POST, GET `admin/bizpoints/commission/route.ts`

**Methods:** POST, GET

**Authentication:** Required 🔒

**Parameters:**
- `customerId`
- `transactionAmount`
- `transactionReference`

**Response Codes:** 201, 400, 401, 404, 500

**File:** `admin\bizpoints\commission\route.ts`

---

### POST `admin/bizpoints/purchase/create-iframe-session/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Required Permissions:**
- `bizpoints.purchase.button`

**Parameters:**
- `amount`
- `description`
- `sessionId`
- `returnUrl`
- `cancelUrl`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `admin\bizpoints\purchase\create-iframe-session\route.ts`

---

### POST `admin/bizpoints/purchase/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Required Permissions:**
- `bizpoints.purchase.button`

**Parameters:**
- `amount`
- `description`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `admin\bizpoints\purchase\route.ts`

---

### POST `admin/bizpoints/purchase/verify/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`
- `purchase_details`

**Response Codes:** 400, 401, 500

**File:** `admin\bizpoints\purchase\verify\route.ts`

---

### POST, GET `admin/bizpoints/route.ts`

**Methods:** POST, GET

**Authentication:** Required 🔒

**Required Permissions:**
- `bizpoints.add.button`
- `bizpoints.page.access`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `admin\bizpoints\route.ts`

---

## DASHBOARD

### GET `admin/dashboard/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Required Permissions:**
- `dashboard.admin.access`

**Response Codes:** 401, 403, 404, 500

**File:** `admin\dashboard\route.ts`

---

### GET `customer/dashboard/route.ts`

**Description:** @swagger

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 404, 500

**File:** `customer\dashboard\route.ts`

---

## EMAIL

### GET, POST, PUT `admin/email/events/route.ts`

**Methods:** GET, POST, PUT

**Parameters:**
- `events`

**Response Codes:** 400, 500

**File:** `admin\email\events\route.ts`

---

### GET, POST `admin/email/settings-noauth/route.ts`

**Methods:** GET, POST

**Parameters:**
- `provider`
- `smtp`
- `from`

**Response Codes:** 400, 500

**File:** `admin\email\settings-noauth\route.ts`

---

### GET, POST `admin/email/settings/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `provider`
- `smtp`
- `from`

**Response Codes:** 400, 401, 500

**File:** `admin\email\settings\route.ts`

---

### GET, POST, PUT, DELETE `admin/email/templates/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Parameters:**
- `name`
- `subject`
- `content`
- `type`

**Response Codes:** 400, 401, 404, 500

**File:** `admin\email\templates\route.ts`

---

### POST `admin/email/test-noauth/route.ts`

**Methods:** POST

**Parameters:**
- `testEmail`
- `subject`
- `content`
- `templateName`

**Response Codes:** 400, 500

**File:** `admin\email\test-noauth\route.ts`

---

### POST `admin/email/test/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `testEmail`
- `subject`
- `content`

**Response Codes:** 400, 401, 500

**File:** `admin\email\test\route.ts`

---

## PACKAGES

### GET, POST `admin/packages/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `name`
- `description`
- `price`
- `duration`
- `messageLimit`
- `instanceLimit`
- `features`

**Response Codes:** 201, 400, 401, 403, 500

**File:** `admin\packages\route.ts`

---

## PAYMENT-METHODS

### POST `admin/payment-methods/[id]/test/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Response Codes:** 400, 401, 500

**File:** `admin\payment-methods\[id]\test\route.ts`

---

### GET, POST, DELETE `admin/payment-methods/route.ts`

**Methods:** GET, POST, DELETE

**Authentication:** Required 🔒

**Response Codes:** 400, 401, 404, 500

**File:** `admin\payment-methods\route.ts`

---

## PAYMENT-SETTINGS

### GET, POST `admin/payment-settings/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Response Codes:** 400, 401, 500

**File:** `admin\payment-settings\route.ts`

---

## SECURITY

### GET, POST `admin/security/events/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Required Permissions:**
- `system.logs.read`

**Parameters:**
- `eventType`
- `severity`
- `details`
- `metadata`

**Response Codes:** 400, 401, 403, 500

**File:** `admin\security\events\route.ts`

---

### GET, POST, DELETE `admin/security/ip-restrictions/route.ts`

**Methods:** GET, POST, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `system.settings.read`
- `system.settings.update`
- `system.settings.update`

**Parameters:**
- `role_id`
- `user_id`
- `ip_address`
- `description`
- `is_whitelist`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `admin\security\ip-restrictions\route.ts`

---

### GET, PUT `admin/security/settings/route.ts`

**Methods:** GET, PUT

**Authentication:** Required 🔒

**Required Permissions:**
- `system.settings.read`
- `system.settings.update`

**Parameters:**
- `settings`

**Response Codes:** 400, 401, 403, 500

**File:** `admin\security\settings\route.ts`

---

## SERVERS

### POST, GET `admin/servers/actions/route.ts`

**Methods:** POST, GET

**Authentication:** Required 🔒

**Parameters:**
- `serverId`
- `action`
- `accountId`

**Response Codes:** 400, 401, 500, 503

**File:** `admin\servers\actions\route.ts`

---

### GET, POST `admin/servers/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `name`

**Response Codes:** 201, 400, 401, 500, 503

**File:** `admin\servers\route.ts`

---

## SUBSCRIPTIONS

### GET, POST, PUT, DELETE `admin/subscriptions/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `subscriptions.page.access`
- `subscriptions.create.button`
- `subscriptions.edit.button`
- `subscriptions.page.access`

**Parameters:**
- `userId`
- `packageId`
- `duration`
- `startDate`
- `paymentMethod`

**Response Codes:** 200, 201, 400, 401, 403, 404, 500

**File:** `admin\subscriptions\route.ts`

---

## SYSTEM

### GET `admin/system/health/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 403, 500

**File:** `admin\system\health\route.ts`

---

## TRANSACTIONS

### GET, POST, DELETE, PUT `admin/transactions/route.ts`

**Methods:** GET, POST, DELETE, PUT

**Authentication:** Required 🔒

**Parameters:**
- `userId`
- `type`
- `method`
- `amount`
- `currency`
- `description`
- `reference`
- `status`
- `gatewayData`

**Response Codes:** 200, 201, 400, 401, 403, 404, 500

**File:** `admin\transactions\route.ts`

---

### GET `admin/transactions/test/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `admin\transactions\test\route.ts`

---

## USERS

### GET `admin/users/[id]/bizpoints/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 404, 500

**File:** `admin\users\[id]\bizpoints\route.ts`

---

### GET `admin/users/[id]/credit/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 400, 403, 404, 500

**File:** `admin\users\[id]\credit\route.ts`

---

### GET `admin/users/commission-rate/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 404, 500

**File:** `admin\users\commission-rate\route.ts`

---

### GET `admin/users/creators/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 403, 500

**File:** `admin\users\creators\route.ts`

---

### GET `admin/users/permissions/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 500

**File:** `admin\users\permissions\route.ts`

---

### GET, POST `admin/users/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Required Permissions:**
- `users.page.access`

**Parameters:**
- `name`
- `email`
- `password`
- `role`
- `mobile`
- `parentId`
- `dealer_code`
- `commissionRate`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `admin\users\route.ts`

---

## CHECK-PERMISSION

### POST `auth/check-permission/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `permission`

**Response Codes:** 400, 401, 500

**File:** `auth\check-permission\route.ts`

---

## DEBUG-SESSION

### POST, GET `auth/debug-session/route.ts`

**Methods:** POST, GET

**Response Codes:** 400, 404, 500

**File:** `auth\debug-session\route.ts`

---

## HEALTH

### GET `auth/health/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `auth\health\route.ts`

---

## USER-PERMISSIONS

### GET `auth/user-permissions/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 500

**File:** `auth\user-permissions\route.ts`

---

## [...NEXTAUTH]

###  `auth/[...nextauth]/route.ts`

**Methods:** 

**File:** `auth\[...nextauth]\route.ts`

---

## PROFILE

### GET, PUT `company/profile/route.ts`

**Methods:** GET, PUT

**Authentication:** Required 🔒

**Parameters:**
- `company_name`
- `address`
- `city`
- `state`
- `country`
- `postal_code`
- `mobile_number`
- `phone_number`
- `email`
- `website`
- `gstin_number`
- `pan_number`
- `favicon_url`
- `light_logo_url`
- `dark_logo_url`
- `established_year`
- `business_type`
- `description`
- `social_media`
- `bank_details`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `company\profile\route.ts`

---

### GET, PUT `customer/profile/route.ts`

**Description:** @swagger

**Methods:** GET, PUT

**Authentication:** Required 🔒

**Parameters:**
- `name`
- `mobile`
- `phone`
- `avatar`
- `language`
- `address`
- `notes`

**Response Codes:** 401, 403, 404, 500

**File:** `customer\profile\route.ts`

---

## DAILY-MAINTENANCE

### POST, GET `cron/daily-maintenance/route.ts`

**Methods:** POST, GET

**Response Codes:** 401, 500

**File:** `cron\daily-maintenance\route.ts`

---

## SUBSCRIPTION-MONITOR

### GET, POST, PUT `cron/subscription-monitor/route.ts`

**Methods:** GET, POST, PUT

**Parameters:**
- `adminKey`

**Response Codes:** 401, 403, 500

**File:** `cron\subscription-monitor\route.ts`

---

## API-KEYS

### GET, POST `customer/api-keys/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `name`
- `permissions`
- `expiresAt`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `customer\api-keys\route.ts`

---

## BIZCOINS

### GET, POST `customer/bizcoins/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `amount`
- `type`
- `description`
- `reference`
- `metadata`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `customer\bizcoins\route.ts`

---

## DOCS

### GET `customer/docs/route.ts`

**Description:** @swagger

**Methods:** GET

**File:** `customer\docs\route.ts`

---

## HOST

### POST `customer/host/connections/[id]/qr/route.ts`

**Description:** @swagger

**Methods:** POST

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 404, 500

**File:** `customer\host\connections\[id]\qr\route.ts`

---

### POST `customer/host/connections/[id]/refresh/route.ts`

**Description:** @swagger

**Methods:** POST

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 404, 500

**File:** `customer\host\connections\[id]\refresh\route.ts`

---

### DELETE `customer/host/connections/[id]/route.ts`

**Description:** @swagger

**Methods:** DELETE

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 404, 500

**File:** `customer\host\connections\[id]\route.ts`

---

### GET, POST `customer/host/connections/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `serverId`
- `accountName`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `customer\host\connections\route.ts`

---

### GET `customer/host/servers/route.ts`

**Description:** @swagger

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 500, 503

**File:** `customer\host\servers\route.ts`

---

## SUBSCRIPTION

### GET `customer/subscription/check/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 403, 404, 500

**File:** `customer\subscription\check\route.ts`

---

### GET, POST `customer/subscription/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `packageId`
- `paymentMethod`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `customer\subscription\route.ts`

---

## WHATSAPP

### POST, PUT `customer/whatsapp/contacts/route.ts`

**Methods:** POST, PUT

**Authentication:** Required 🔒

**Parameters:**
- `recipientNumber`
- `deviceName`
- `messageId`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `customer\whatsapp\contacts\route.ts`

---

### GET, POST, PUT, DELETE `customer/whatsapp/queue/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Parameters:**
- `action`

**Response Codes:** 201, 400, 404, 500

**File:** `customer\whatsapp\queue\route.ts`

---

### GET, POST `customer/whatsapp/sent/route.ts`

**Methods:** GET, POST

**Authentication:** Required 🔒

**Parameters:**
- `recipientNumber`
- `recipientName`
- `message`
- `messageType`
- `deviceName`
- `status`
- `attachmentUrl`
- `metadata`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `customer\whatsapp\sent\route.ts`

---

### GET, POST `debug/whatsapp/route.ts`

**Description:** WhatsApp API Debug/Test Endpoint

**Methods:** GET, POST

**Parameters:**
- `action`
- `accountId`
- `accountName`

**Response Codes:** 400, 500

**File:** `debug\whatsapp\route.ts`

---

## EXPORT

### GET `customers/export/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Required Permissions:**
- `customers.export`

**Response Codes:** 400, 401, 403, 500

**File:** `customers\export\route.ts`

---

## IMPERSONATE

### POST, DELETE `customers/impersonate/route.ts`

**Methods:** POST, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `customers.impersonate`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `customers\impersonate\route.ts`

---

## REDEEM-VOUCHER

### POST, GET `customers/redeem-voucher/route.ts`

**Methods:** POST, GET

**Authentication:** Required 🔒

**Required Permissions:**
- `customer.voucher.redeem`
- `customers.update`
- `customers.read`

**Response Codes:** 400, 401, 403, 404, 409, 500

**File:** `customers\redeem-voucher\route.ts`

---

## ROUTE.TS

### GET `customers-debug/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `customers-debug\route.ts`

---

### GET, POST, PUT, DELETE `customers/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `customers.read`
- `customers.create`
- `customers.update`
- `customers.delete`

**Parameters:**
- `name`
- `email`
- `password`
- `phone`
- `mobile`
- `address`
- `notes`
- `dealerId`
- `packageId`
- `registrationSource`
- `avatar`
- `language`

**Response Codes:** 400, 401, 403, 404, 409, 500

**File:** `customers\route.ts`

---

### GET, POST, PUT, DELETE `dealer-customers/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `dealers.customers.assign`
- `dealers.customers.assign`
- `dealers.commission.manage`
- `dealers.customers.assign`

**Parameters:**
- `dealerId`
- `customerIds`
- `commissionRate`
- `territory`
- `notes`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `dealer-customers\route.ts`

---

### GET, POST, PUT `dealers/route.ts`

**Methods:** GET, POST, PUT

**Authentication:** Required 🔒

**Required Permissions:**
- `users.read`
- `users.update`
- `dealers.commission.manage`

**Parameters:**
- `userId`
- `dealerType`
- `commission`
- `territory`
- `status`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `dealers\route.ts`

---

### GET `health/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `health\route.ts`

---

### GET, POST, PUT, DELETE `packages/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `packages.read`
- `packages.create`
- `packages.update`
- `packages.delete`

**Parameters:**
- `id`
- `name`
- `description`
- `price`
- `offer_price`
- `offer_enabled`
- `duration`
- `messageLimit`
- `instanceLimit`
- `features`
- `isActive`
- `mobile_accounts_limit`
- `contact_limit`
- `api_key_limit`
- `receive_msg_limit`
- `webhook_limit`
- `footmark_enabled`
- `footmark_text`
- `package_color`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `packages\route.ts`

---

### GET, POST, PUT, DELETE `permission-templates/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `permissions.view`
- `permissions.create`
- `permissions.edit`
- `permissions.delete`

**Parameters:**
- `name`
- `description`
- `permissions`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `permission-templates\route.ts`

---

### GET, POST, PUT, DELETE `permissions/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `permissions.view`
- `permissions.create`
- `permissions.edit`
- `permissions.delete`

**Parameters:**
- `name`
- `description`
- `category`
- `resource`
- `action`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `permissions\route.ts`

---

### GET, POST, PUT, DELETE `roles/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `roles.read`
- `roles.create`
- `roles.update`
- `roles.delete`

**Parameters:**
- `name`
- `description`
- `level`
- `permissions`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `roles\route.ts`

---

### GET, POST, DELETE `user-permissions/route.ts`

**Methods:** GET, POST, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `permissions.view`
- `permissions.assign`
- `permissions.assign`

**Parameters:**
- `userId`
- `permissionId`
- `granted`
- `reason`
- `expiresAt`

**Response Codes:** 201, 400, 401, 403, 404, 500

**File:** `user-permissions\route.ts`

---

### GET, POST, PUT, DELETE `users/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `users.read`
- `users.create`
- `users.update`
- `users.delete`

**Parameters:**
- `name`
- `email`
- `password`
- `parentId`
- `phone`
- `address`
- `dealer_code`
- `notes`
- `language`
- `profile_image`
- `roles`
- `permissions`
- `commissionRate`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `users\route.ts`

---

### GET `vouchers-debug/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `vouchers-debug\route.ts`

---

### GET, POST, PUT, DELETE `vouchers/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Required Permissions:**
- `vouchers.read`
- `vouchers.create`
- `vouchers.update`
- `vouchers.delete`

**Parameters:**
- `code`
- `description`
- `type`
- `value`
- `usage_limit`
- `expires_at`
- `package_id`
- `min_purchase_amount`
- `max_discount_amount`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `vouchers\route.ts`

---

## STATS

### GET `customers/stats/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 404, 500

**File:** `customers\stats\route.ts`

---

## ADD-PERMISSION

### POST `debug/add-permission/route.ts`

**Methods:** POST

**Response Codes:** 404, 500

**File:** `debug\add-permission\route.ts`

---

## COMMISSION-CHECK

### GET `debug/commission-check/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\commission-check\route.ts`

---

## COMPARE-PERMISSIONS

### GET `debug/compare-permissions/route.ts`

**Methods:** GET

**Response Codes:** 404, 500

**File:** `debug\compare-permissions\route.ts`

---

## CURRENT-USER

### GET `debug/current-user/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 404, 500

**File:** `debug\current-user\route.ts`

---

## DIRECT-COMMISSION-TEST

### POST, GET `debug/direct-commission-test/route.ts`

**Methods:** POST, GET

**Response Codes:** 201, 400, 404, 500

**File:** `debug\direct-commission-test\route.ts`

---

## END-TO-END-TEST

### GET `debug/end-to-end-test/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\end-to-end-test\route.ts`

---

## PAYMENT-COMMISSION-TEST

### POST, GET `debug/payment-commission-test/route.ts`

**Methods:** POST, GET

**Response Codes:** 404, 500

**File:** `debug\payment-commission-test\route.ts`

---

## PAYMENT-FLOW-CHECK

### GET `debug/payment-flow-check/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\payment-flow-check\route.ts`

---

## PERMISSION-CHECK

### GET `debug/permission-check/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\permission-check\route.ts`

---

## PERMISSIONS

### GET `debug/permissions/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 500

**File:** `debug\permissions\route.ts`

---

## ROLE-PERMISSIONS

### GET `debug/role-permissions/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\role-permissions\route.ts`

---

## TEST-TEMPLATE-MODES

### GET `debug/test-template-modes/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\test-template-modes\route.ts`

---

## USER-DATA

### GET `debug/user-data/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\user-data\route.ts`

---

## USER-ROLE-CHECK

### GET `debug/user-role-check/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `debug\user-role-check\route.ts`

---

## CREATE-IFRAME-SESSION

### POST `payments/create-iframe-session/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `packageId`
- `customerId`
- `customerEmail`
- `customerPhone`
- `paymentMethodId`
- `sessionId`
- `returnUrl`
- `cancelUrl`

**Response Codes:** 400, 401, 404, 500

**File:** `payments\create-iframe-session\route.ts`

---

## CREATE-ORDER

### POST `payments/create-order/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `packageId`
- `customerId`
- `customerEmail`
- `customerPhone`
- `paymentMethodId`

**Response Codes:** 400, 401, 404, 500

**File:** `payments\create-order\route.ts`

---

## ORDER-DETAILS

### GET `payments/order-details/[orderId]/route.ts`

**Methods:** GET

**Response Codes:** 400, 401, 404, 500

**File:** `payments\order-details\[orderId]\route.ts`

---

## VERIFY

### POST `payments/verify/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Parameters:**
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`
- `customer_id`
- `package_id`

**Response Codes:** 400, 401, 500

**File:** `payments\verify\route.ts`

---

## AVATAR

### POST `upload/avatar/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Response Codes:** 400, 401, 500

**File:** `upload\avatar\route.ts`

---

## APPLY-TEMPLATE

### POST `user-permissions/apply-template/route.ts`

**Methods:** POST

**Authentication:** Required 🔒

**Required Permissions:**
- `permissions.assign`

**Parameters:**
- `userId`
- `templateId`
- `mode`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `user-permissions\apply-template\route.ts`

---

## CURRENT

### GET `users/current/route.ts`

**Methods:** GET

**Authentication:** Required 🔒

**Response Codes:** 401, 404, 500

**File:** `users\current\route.ts`

---

## CURRENT-DEBUG

### GET `users/current-debug/route.ts`

**Methods:** GET

**Response Codes:** 500

**File:** `users\current-debug\route.ts`

---

## [ID]

### GET, POST, PUT, DELETE `users/[id]/roles/route.ts`

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required 🔒

**Parameters:**
- `role_id`
- `is_primary`
- `expires_at`

**Response Codes:** 201, 400, 401, 403, 404, 409, 500

**File:** `users\[id]\roles\route.ts`

---

## MESSAGES

### POST `v1/messages/send/route.ts`

**Description:** @swagger

**Methods:** POST

**Parameters:**
- `to`
- `message`
- `instanceId`
- `priority`
- `scheduledAt`
- `mediaUrl`

**Response Codes:** 400, 401, 403, 404, 500

**File:** `v1\messages\send\route.ts`

---

## REDEEM

### POST, GET `vouchers/redeem/route.ts`

**Methods:** POST, GET

**Authentication:** Required 🔒

**Parameters:**
- `code`

**Response Codes:** 200, 400, 401, 403, 404, 409, 500

**File:** `vouchers\redeem\route.ts`

---

## RAZORPAY

### POST, GET `webhooks/razorpay/route.ts`

**Methods:** POST, GET

**Response Codes:** 400, 401, 500

**File:** `webhooks\razorpay\route.ts`

---

## WHATSAPP-STATUS

### POST, GET `webhooks/whatsapp-status/route.ts`

**Methods:** POST, GET

**Response Codes:** 400, 500

**File:** `webhooks\whatsapp-status\route.ts`

---

## API Usage Examples

### Authentication
Most API endpoints require authentication via NextAuth session:

```javascript
// Include session in your requests
const session = await getServerSession(authOptions)
```

### Error Handling
All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Response Format
All responses follow this general structure:

```json
{
  "data": { ... },
  "message": "Success message",
  "error": "Error message (if any)",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Contributing

When adding new API routes, please ensure:

1. **Documentation Comments**: Add JSDoc comments at the top of your route handlers
2. **Error Handling**: Implement proper error responses
3. **Authentication**: Add authentication checks where needed
4. **Permissions**: Implement permission checks using `checkCurrentUserPermission`
5. **Validation**: Validate input parameters
6. **Run Documentation Update**: Execute `npm run docs:generate` after adding new routes

---

*This documentation is automatically generated. Do not edit manually.*
