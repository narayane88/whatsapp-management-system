# WhatsApp Multi-Tier System - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- SSL Certificate
- Domain name
- CDN (recommended)

### 1. Environment Configuration

Create production `.env` file:

```env
# Database
DATABASE_URL="postgresql://prod_user:secure_password@db_host:5432/whatsapp_prod?schema=public"

# NextAuth (Generate secure secrets)
NEXTAUTH_SECRET="super-secret-jwt-key-64-chars-minimum-for-production-security"
NEXTAUTH_URL="https://yourdomain.com"

# JWT Secret
JWT_SECRET="another-super-secure-jwt-secret-key-for-production-use-only"

# App Configuration
APP_NAME="WhatsApp Business Hub"
APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="app_password_here"

# External Services
REDIS_URL="redis://redis_host:6379"
S3_BUCKET="whatsapp-files"
S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
```

### 2. Database Setup

```sql
-- Create production database
CREATE DATABASE whatsapp_prod;
CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_prod TO whatsapp_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO whatsapp_user;
```

### 3. Build and Deploy

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start production server
npm run start
```

### 4. Process Manager (PM2)

Install and configure PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-system',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

Start with PM2:

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/whatsapp-system`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /path/to/dhparam.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        # ... same proxy headers as above
    }

    # Static file caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔄 Docker Deployment

### Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/whatsapp_prod
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=whatsapp_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Create `Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

Deploy with Docker:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Logging

### Application Monitoring

```javascript
// Add to next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
}

// Create instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

### Log Management

Create `winston.config.js`:

```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'whatsapp-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check other services
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        // Add other service checks
      }
    }
    
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
```

## 🔐 Security Hardening

### 1. Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chown app:app .env

# Secure database
sudo ufw allow from app_server_ip to any port 5432
```

### 2. Application Security

```typescript
// Add security headers middleware
import { NextResponse } from 'next/server'

export function middleware(request: Request) {
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}
```

### 3. Rate Limiting

```typescript
// Add to API routes
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Add database indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_messages_instance_id ON messages(instance_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### 2. Caching Strategy

```typescript
// Redis caching configuration
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache frequently accessed data
export async function getCachedData(key: string) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  // Fetch from database and cache
  const data = await fetchFromDatabase()
  await redis.setex(key, 300, JSON.stringify(data)) // 5 min cache
  return data
}
```

### 3. CDN Configuration

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL,
  images: {
    domains: ['cdn.yourdomain.com'],
  },
}
```

## 🔄 Backup Strategy

### Database Backup

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="whatsapp_prod"

pg_dump -U postgres -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### File Backup

```bash
#!/bin/bash
# file_backup.sh
tar -czf /backup/files_$(date +%Y%m%d).tar.gz /app/uploads /app/logs
aws s3 cp /backup/files_$(date +%Y%m%d).tar.gz s3://backup-bucket/
```

### Automated Backup

```bash
# Add to crontab
0 2 * * * /scripts/backup.sh
0 3 * * * /scripts/file_backup.sh
```

## 🚨 Disaster Recovery

### 1. Database Recovery

```bash
# Restore from backup
gunzip -c db_backup_20240120_020000.sql.gz | psql -U postgres -d whatsapp_prod
```

### 2. Application Recovery

```bash
# Quick rollback with PM2
pm2 list
pm2 restart whatsapp-system

# Full restore from backup
tar -xzf files_20240120.tar.gz -C /app/
pm2 restart whatsapp-system
```

### 3. Monitoring Alerts

```bash
# Setup monitoring with systemd
sudo systemctl enable pm2-whatsapp-system
sudo systemctl start pm2-whatsapp-system

# Health check monitoring
*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart pm2-whatsapp-system
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations tested
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Deployment
- [ ] Application built successfully
- [ ] Database connection verified
- [ ] All services running
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] CDN configured (if applicable)

### Post-deployment
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Backup jobs scheduled
- [ ] Disaster recovery tested
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Documentation updated

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -U whatsapp_user -d whatsapp_prod -h localhost
   ```

2. **High Memory Usage**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Restart application
   pm2 restart whatsapp-system
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in certificate.crt -text -noout
   
   # Renew certificate
   sudo certbot renew --dry-run
   ```

4. **Performance Issues**
   ```bash
   # Check application logs
   pm2 logs whatsapp-system
   
   # Monitor system resources
   htop
   iostat -x 1
   ```

### Emergency Contacts
- System Administrator: admin@yourdomain.com
- Development Team: dev@yourdomain.com
- Infrastructure Team: infra@yourdomain.com

---

This deployment guide ensures a production-ready, secure, and scalable WhatsApp Multi-Tier Management System.