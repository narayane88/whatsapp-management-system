/**
 * Database SSL Configuration Helper
 * Centralizes SSL configuration based on environment variables
 */

export function getSSLConfig() {
  const sslEnabled = process.env.DB_SSL_ENABLED === 'true';
  
  if (!sslEnabled) {
    return false;
  }
  
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  };
}

export function getDatabaseConfig() {
  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'whatsapp_business',
    password: process.env.DB_PASSWORD || 'Nitin@123',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: getSSLConfig(),
  };
}

// For Prisma connection URL
export function getDatabaseUrl() {
  const sslMode = process.env.DB_SSL_ENABLED === 'true' ? 'require' : 'disable';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'Nitin@123';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'whatsapp_business';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public&sslmode=${sslMode}`;
}