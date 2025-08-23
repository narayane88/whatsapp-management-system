# WhatsApp Management System - Setup Guide

## 📋 Overview

This guide covers the complete setup process for the WhatsApp Management System, including the frontend Next.js application and backend Baileys server, with special focus on the automated cron job system for subscription management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- Gmail/SMTP account for email notifications

### Environment Variables

Create `.env.local` file in the frontend directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_db"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cron Job Security
CRON_SECRET="your-secure-cron-secret"
ADMIN_SECRET="your-admin-secret-for-manual-triggers"

# Dashboard URLs
NEXT_PUBLIC_DASHBOARD_URL="http://localhost:3000"

# WhatsApp Server
WHATSAPP_SERVER_URL="http://localhost:5000"
WHATSAPP_SERVER_SECRET="your-whatsapp-server-secret"

# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"

# Razorpay Payment Gateway (Optional)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
```

### Installation

```bash
# Frontend setup
cd whatsapp-frontend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Backend setup (separate terminal)
cd ../baileys-server
npm install
npm start
```

## 🤖 Automated Cron Job System

The system includes automated cron jobs for subscription management and system maintenance.

### 📧 Subscription Monitoring Cron Job

**Purpose**: Automatically monitor subscription expiration and send timely notifications to customers and subdealers.

**Schedule**: Runs daily at 9:00 AM
**Endpoint**: `/api/cron/subscription-monitor`

#### Features:
- **Expiry Notifications**: Sends emails 30, 15, 7, 3, and 1 days before expiration
- **Follow-up Notifications**: Sends reminders 1, 3, and 7 days after expiration
- **Role-based Targeting**: Notifies customers and their subdealers
- **Database Updates**: Automatically marks expired subscriptions as inactive

#### Email Templates Used:
- `subscription_expiring.json` - For pre-expiry warnings
- `subscription_activated.json` - For successful renewals

### 🔧 Daily Maintenance Cron Job

**Purpose**: Perform daily system maintenance tasks including cleanup and reporting.

**Schedule**: Runs daily at 2:00 AM
**Endpoint**: `/api/cron/daily-maintenance`

#### Tasks Performed:
- **File Cleanup**: Removes logs older than 30 days, temp files older than 1 day
- **Email History**: Trims email history to last 1000 entries
- **System Statistics**: Updates daily stats for dashboard
- **WhatsApp Monitoring**: Checks for inactive WhatsApp instances
- **Admin Reports**: Sends daily summary to administrators

## ⚙️ Cron Job Configuration

### Using GitHub Actions (Recommended for Production)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Automated Cron Jobs

on:
  schedule:
    # Subscription monitoring - Daily at 9:00 AM UTC
    - cron: '0 9 * * *'
    # Daily maintenance - Daily at 2:00 AM UTC  
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  subscription-monitor:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 9 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger Subscription Monitoring
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/subscription-monitor" \\
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \\
            -H "Content-Type: application/json"

  daily-maintenance:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger Daily Maintenance
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/daily-maintenance" \\
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \\
            -H "Content-Type: application/json"
```

### Using Vercel Cron (For Vercel Deployments)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-monitor",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/daily-maintenance", 
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Using External Cron Services

For external services like **cron-job.org** or **EasyCron**:

**Subscription Monitor:**
- URL: `https://your-domain.com/api/cron/subscription-monitor`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Daily at 9:00 AM

**Daily Maintenance:**
- URL: `https://your-domain.com/api/cron/daily-maintenance`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Daily at 2:00 AM

### Manual Testing

You can manually trigger cron jobs for testing:

```bash
# Test subscription monitoring
curl -X POST "http://localhost:3000/api/cron/subscription-monitor" \\
  -H "Authorization: Bearer your-cron-secret" \\
  -H "Content-Type: application/json"

# Test daily maintenance
curl -X POST "http://localhost:3000/api/cron/daily-maintenance" \\
  -H "Authorization: Bearer your-cron-secret" \\
  -H "Content-Type: application/json"

# Admin manual trigger with enhanced data
curl -X PUT "http://localhost:3000/api/cron/subscription-monitor" \\
  -H "Content-Type: application/json" \\
  -d '{"adminKey": "your-admin-secret"}'
```

## 📊 Monitoring and Logs

### Checking Cron Job Status

```bash
# Get subscription monitoring status
curl -X GET "http://localhost:3000/api/cron/subscription-monitor" \\
  -H "Authorization: Bearer your-cron-secret"

# Get maintenance status  
curl -X GET "http://localhost:3000/api/cron/daily-maintenance" \\
  -H "Authorization: Bearer your-cron-secret"
```

### Log Files

- **System Stats**: `config/system-stats.json`
- **Email History**: `config/email-history.json`
- **Application Logs**: `logs/` directory

### Email Notifications

The system automatically sends email notifications for:
- ✅ Successful cron job executions
- ❌ Failed cron job executions  
- 📊 Daily admin summaries
- ⚠️ System alerts and errors

## 🔐 Security Considerations

### Cron Job Security

1. **Authorization**: All cron endpoints require secure tokens
2. **Rate Limiting**: Built-in protection against abuse
3. **Environment Variables**: Sensitive data stored securely
4. **Audit Logging**: All cron executions are logged

### Recommended Security Headers

```bash
# In your reverse proxy (nginx/apache)
X-Cron-Secret: your-cron-secret
Authorization: Bearer your-cron-secret
User-Agent: YourApp-CronJob/1.0
```

## 🛠️ Troubleshooting

### Common Issues

**Cron Jobs Not Running:**
- Verify `CRON_SECRET` environment variable
- Check external service configuration
- Review application logs

**Email Notifications Failing:**
- Verify SMTP configuration in `config/email-settings.json`
- Check email template validity
- Review email history logs

**Database Connection Issues:**
- Verify `DATABASE_URL` configuration
- Check PostgreSQL service status
- Review Prisma schema migrations

### Debug Commands

```bash
# Check system health
curl "http://localhost:3000/api/health"

# Debug email configuration
curl "http://localhost:3000/api/admin/email/settings-noauth"

# Check subscription stats
curl -X GET "http://localhost:3000/api/cron/subscription-monitor" \\
  -H "Authorization: Bearer your-cron-secret"
```

## 📈 Performance Optimization

### Database Indexes

Ensure these indexes exist for optimal cron performance:

```sql
-- Subscription monitoring indexes
CREATE INDEX idx_customer_packages_expiry ON customer_packages(expiry_date, is_active);
CREATE INDEX idx_customer_packages_user ON customer_packages(user_id);

-- Email system indexes  
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_id);

-- WhatsApp monitoring indexes
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status, last_seen);
```

### Memory Usage

- **Subscription Monitor**: ~50-100MB per execution
- **Daily Maintenance**: ~20-50MB per execution
- **Email Processing**: ~10MB per email sent

## 🔄 Backup and Recovery

### Database Backups

```bash
# Daily backup (include in cron)
pg_dump whatsapp_db > backups/db_$(date +%Y%m%d).sql

# Weekly cleanup of old backups
find backups/ -name "*.sql" -mtime +30 -delete
```

### Configuration Backups

Critical files to backup:
- `config/email-settings.json`
- `config/email-templates/`
- `.env.local` (encrypted)
- `config/system-stats.json`

## 📞 Support

For issues related to cron jobs or system setup:

1. Check logs in `logs/` directory
2. Review GitHub Issues
3. Contact development team
4. Use manual trigger endpoints for immediate testing

---

## 🎯 Production Deployment Checklist

- [ ] Set secure `CRON_SECRET` and `ADMIN_SECRET`
- [ ] Configure external cron service or GitHub Actions
- [ ] Set up database indexes for performance
- [ ] Configure email SMTP settings
- [ ] Test manual cron triggers
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Review security headers and authentication
- [ ] Test email notification delivery

**Note**: Always test cron jobs in staging environment before production deployment.

---

## 💳 Razorpay Payment Integration

The system includes comprehensive Razorpay payment gateway integration for handling subscription purchases and transactions.

### 🚀 Payment Features

#### **✅ Complete Payment Infrastructure**
- **Razorpay SDK Integration**: Full payment processing capabilities
- **Secure Webhooks**: HMAC SHA256 signature verification
- **Multi-format Support**: Order creation, payment verification, refunds
- **Auto-activation**: Automatic subscription activation on successful payments
- **Transaction Recording**: Automatic transaction and subscription record creation

#### **✅ Admin Payment Management**
- **Payment Integration Tab**: Located at `/admin/settings` → Payment Integration
- **Method Configuration**: Setup Razorpay credentials (Key ID, Secret, Webhook Secret)
- **Test/Live Mode Toggle**: Switch between test and production environments
- **Connection Testing**: Real-time API connection validation
- **Webhook Configuration**: Built-in setup guides and URL generation

#### **✅ Customer Payment Experience**
- **Package Selection**: Beautiful marketplace at `/customer/packages`
- **Secure Checkout**: Integrated Razorpay payment modal
- **Real-time Processing**: Instant payment verification and activation
- **Multiple Payment Methods**: Credit cards, debit cards, UPI, wallets, net banking

### 🔧 Payment Setup Process

#### **1. Razorpay Account Setup**
```bash
1. Create account at https://razorpay.com
2. Navigate to Settings → API Keys
3. Generate API keys for your account
4. Copy Key ID and Key Secret
5. Set up webhook URL in Razorpay dashboard
```

#### **2. Admin Configuration**
```bash
1. Go to http://localhost:3000/admin/settings
2. Click "Payment Integration" tab
3. Click "Configure Razorpay" button
4. Enter your Razorpay credentials:
   - Key ID: rzp_test_xxxxxxxxxxxxxxxx
   - Key Secret: xxxxxxxxxxxxxxxxxxxxxxxx
   - Webhook Secret: xxxxxxxxxxxxxxxxxxxxxxxx
5. Toggle "Test Mode" as needed
6. Click "Save Configuration"
7. Test connection using the "Test" button
```

#### **3. Webhook Configuration**
```bash
Webhook URL: https://your-domain.com/api/webhooks/razorpay
Events to Subscribe:
- payment.captured
- payment.failed
- payment.authorized
- order.paid
```

### 🛠️ API Endpoints

#### **Payment Processing APIs**
```bash
# Create payment order
POST /api/payments/create-order
{
  "packageId": "starter",
  "customerId": "user123",
  "customerEmail": "user@example.com",
  "customerPhone": "+1234567890"
}

# Verify payment
POST /api/payments/verify
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "customer_id": "user123",
  "package_id": "starter"
}

# Webhook processing
POST /api/webhooks/razorpay
Headers: x-razorpay-signature: signature
```

#### **Admin Management APIs**
```bash
# Payment method management
GET/POST/DELETE /api/admin/payment-methods

# Payment settings
GET/POST /api/admin/payment-settings

# Connection testing
POST /api/admin/payment-methods/razorpay/test
```

### 💾 Database Integration

#### **Enhanced Payment Method Support**
```sql
-- PaymentMethod enum updated with RAZORPAY
enum PaymentMethod {
  CASH
  BANK
  UPI
  RAZORPAY        -- ✅ Added
  GATEWAY
  WALLET
  CREDIT
  BIZPOINTS
}

-- Transaction records include Razorpay data
transactions {
  method: RAZORPAY
  gatewayData: {
    razorpay_payment_id: "pay_xxx"
    razorpay_order_id: "order_xxx"
    webhook_processed_at: "2024-01-01T00:00:00Z"
  }
}

-- Subscription records track payment method
customer_packages {
  paymentMethod: "RAZORPAY"
  reference: "pay_xxx"
}
```

### 🔄 Automated Processing Flow

#### **Payment Webhook Flow**
```bash
1. Customer completes Razorpay payment
2. Razorpay sends webhook to /api/webhooks/razorpay
3. System verifies webhook signature
4. Extracts payment and package details
5. Creates transaction record automatically
6. Creates subscription record automatically
7. Activates customer subscription
8. Logs payment success
9. Returns success response to Razorpay
```

#### **Transaction & Subscription Integration**
```bash
# Transaction System Updates:
- ✅ Razorpay option in payment method dropdowns
- ✅ Razorpay color scheme (indigo) for consistency
- ✅ Webhook-based automatic transaction creation
- ✅ Gateway data storage for reference tracking

# Subscription System Updates:
- ✅ Razorpay payment method in all forms
- ✅ Filtering by Razorpay payment method
- ✅ Automatic subscription activation on payment
- ✅ Reference linking to payment transactions
```

### 🎨 UI Components

#### **PaymentModal Component**
```tsx
// Features:
- Real-time Razorpay checkout integration
- Package details display with pricing
- Discount calculations and offer support
- Customer billing information
- Payment success/failure handling
- Loading states and error management
```

#### **PaymentIntegrationTab Component**
```tsx
// Admin Interface Features:
- Payment method configuration forms
- Connection testing with real API calls
- Webhook URL generation and guides
- Test/Live mode switching
- Integration instructions and setup help
```

#### **Customer Package Selection**
```tsx
// Marketplace Features:
- Beautiful gradient package cards
- Pricing with discount calculations
- Feature comparison displays
- One-click purchase integration
- Responsive design for all devices
```

### 🔐 Security Features

#### **Webhook Security**
```bash
# HMAC SHA256 Signature Verification
- Validates all incoming webhook requests
- Prevents fraudulent payment notifications
- Uses timing-safe comparison functions
- Logs all verification attempts

# Payment Verification
- Double verification of payment signatures
- Cross-reference with Razorpay API
- Automatic fraud detection
- Secure payment processing
```

#### **API Security**
```bash
# Authentication & Authorization
- NextAuth session management
- Role-based access control (OWNER only)
- Internal webhook authentication bypass
- Rate limiting protection

# Data Protection
- Encrypted credential storage
- Environment variable protection
- Secure API key management
- PCI-compliant payment processing
```

### 📊 Monitoring & Logging

#### **Payment Logs**
```bash
# Webhook Events
logs/payment-webhooks.log

# Successful Payments  
logs/successful-payments.log

# Subscription Activations
logs/subscription-activations.log

# Payment Configuration
config/payment-methods.json
config/payment-settings.json
```

#### **Admin Monitoring**
```bash
# Real-time payment status tracking
- Payment method connection status
- Webhook event processing
- Transaction success rates
- Subscription activation metrics

# Integration testing
- Connection validation
- API version checking
- Webhook endpoint verification
- Payment flow testing
```

### 🚀 Production Deployment

#### **Razorpay Production Checklist**
```bash
- [ ] Switch to live Razorpay account
- [ ] Update API keys to production keys
- [ ] Configure production webhook URL
- [ ] Set webhook secret in production
- [ ] Test production payment flow
- [ ] Verify SSL certificate for webhooks
- [ ] Monitor payment success rates
- [ ] Set up payment failure alerts
- [ ] Configure refund processing
- [ ] Test subscription activation
```

#### **Environment Variables for Production**
```bash
# Production Razorpay Configuration
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"

# Webhook URL (must be HTTPS)
NEXTAUTH_URL="https://your-domain.com"
```

### 🛠️ Troubleshooting Payment Issues

#### **Common Payment Problems**
```bash
# Webhook not receiving events:
1. Check webhook URL configuration in Razorpay dashboard
2. Verify HTTPS SSL certificate is valid
3. Ensure webhook secret matches configuration
4. Check server logs for webhook processing errors

# Payment verification failing:
1. Verify API keys are correct and active
2. Check if using test keys with live payments (or vice versa)
3. Validate webhook signature verification
4. Review Razorpay dashboard for payment status

# Subscription not activating:
1. Check webhook event processing logs
2. Verify payment success webhook received
3. Validate customer and package IDs in payment notes
4. Review subscription creation API logs
```

#### **Debug Commands**
```bash
# Test Razorpay connection
curl -X POST "http://localhost:3000/api/admin/payment-methods/razorpay/test" \
  -H "Authorization: Bearer your-token"

# Check payment method configuration
curl "http://localhost:3000/api/admin/payment-methods"

# Verify webhook endpoint health
curl "http://localhost:3000/api/webhooks/razorpay"

# Test payment order creation
curl -X POST "http://localhost:3000/api/payments/create-order" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"starter","customerId":"test","customerEmail":"test@example.com"}'
```

### 📈 Payment Analytics

The system provides comprehensive payment analytics:

- **Transaction Volume**: Total payments processed via Razorpay
- **Success Rates**: Payment completion and failure rates
- **Revenue Tracking**: Subscription revenue by payment method
- **Customer Insights**: Payment preferences and behavior
- **Webhook Performance**: Event processing success rates

### 💡 Integration Benefits

#### **For Administrators**
- **Streamlined Management**: Single interface for all payment methods
- **Real-time Monitoring**: Live payment status and webhook events
- **Automated Processing**: Hands-off subscription activation
- **Comprehensive Reporting**: Detailed payment and subscription analytics

#### **For Customers**
- **Seamless Experience**: One-click package purchases
- **Multiple Payment Options**: Cards, UPI, wallets, net banking
- **Instant Activation**: Immediate subscription activation
- **Secure Processing**: PCI-compliant payment handling

#### **For Developers**
- **Modular Architecture**: Easy to add more payment gateways
- **Webhook Automation**: Automatic record creation and processing
- **Comprehensive APIs**: Full payment lifecycle management
- **Security Best Practices**: Built-in fraud prevention and verification

**Note**: The Razorpay integration is production-ready and includes all necessary security measures for handling real payments.