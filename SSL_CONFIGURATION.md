# SSL Configuration Guide

## Environment Variables

Add these to your `.env` and `.env.local` files:

```env
# Database SSL Configuration
DB_SSL_ENABLED=false
DB_SSL_REJECT_UNAUTHORIZED=false
```

## Configuration Options

### For Local Development (No SSL)
```env
DB_SSL_ENABLED=false
DB_SSL_REJECT_UNAUTHORIZED=false
```

### For Production with SSL
```env
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### For Production with Strict SSL
```env
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Files Updated

1. **src/lib/db-config.ts** - Centralized SSL configuration
2. **src/lib/auth.ts** - NextAuth database connection
3. **src/lib/database.ts** - Main database utilities
4. **src/middleware/pagePermissions.ts** - Middleware database connection
5. **src/lib/impersonation.ts** - Impersonation feature database connection

## Usage

All database connections now use the centralized configuration from `src/lib/db-config.ts`, which reads from environment variables.

To change SSL settings, simply update the environment variables and restart the application.

## Testing

```bash
# Test with SSL disabled (default)
DB_SSL_ENABLED=false npm run build && npm start

# Test with SSL enabled
DB_SSL_ENABLED=true npm run build && npm start
```