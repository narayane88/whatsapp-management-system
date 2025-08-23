# Payment Integration Setup Guide

## Razorpay API Configuration

### Step 1: Set up API Credentials

1. Create a Razorpay account at https://razorpay.com
2. Go to Settings > API Keys
3. Generate your Test API keys (Key ID and Secret)
4. Note down your webhook secret from Settings > Webhooks

### Step 2: Configure the CSV File

Update the `api-key.csv` file in the project root with your actual Razorpay credentials:

```csv
service,key_id,key_secret,webhook_secret
razorpay,rzp_test_your_actual_key_id,your_actual_key_secret,your_actual_webhook_secret
```

**Important:** Replace the placeholder values with your actual Razorpay test credentials:
- `rzp_test_your_key_id_here` → Your actual Razorpay Key ID (starts with `rzp_test_`)
- `your_key_secret_here` → Your actual Razorpay Key Secret
- `your_webhook_secret_here` → Your actual webhook secret

### Step 3: Test the Integration

1. Start the development server: `npm run dev`
2. Go to http://localhost:3000/test-payment
3. Click "Test Payment Order API" to verify API connectivity
4. Click "Open Payment Modal" to test the complete payment flow

### Current Status

- ✅ **Mock Mode**: The system currently runs in mock/demo mode with placeholder credentials
- ✅ **CSV Reading**: The system automatically reads credentials from `api-key.csv`
- ✅ **Smart Detection**: Placeholder values are detected and mock mode is used automatically
- ✅ **Real Mode**: When you add real credentials, the system will automatically switch to live Razorpay integration

### Files Modified

- `api-key.csv` - Contains your API credentials
- `src/lib/utils/csv-reader.ts` - Utility for reading CSV credentials
- `src/app/api/payments/create-order/route.ts` - Updated to use CSV credentials
- `config/payment-methods.json` - Payment method configuration

### Security Notes

- Keep your `api-key.csv` file secure and never commit real credentials to version control
- Add `api-key.csv` to `.gitignore` to prevent accidental commits
- Use test credentials during development
- Only use live credentials in production

### Troubleshooting

1. **"Mock mode active"** - This means placeholder credentials were detected
2. **"Invalid API credentials"** - Check that your Key ID and Secret are correct
3. **"Payment gateway loading"** - Razorpay script is still loading, wait a moment

### Testing with Real Credentials

Once you add real test credentials to the CSV file:

1. The system will automatically detect them
2. Mock mode will be disabled
3. Real Razorpay payment gateway will be used
4. You can test with Razorpay's test payment methods

For Razorpay test cards and payment methods, visit: https://razorpay.com/docs/payments/test-card-upi-details/