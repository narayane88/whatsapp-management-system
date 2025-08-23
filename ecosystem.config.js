module.exports = {
  apps: [
    {
      // Application configuration
      name: 'whatsapp-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3100',
      cwd: '/var/www/Whatsapp/whatsapp-frontend',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        NEXT_TELEMETRY_DISABLED: 1,
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      
      // Performance settings
      instances: 1, // Can be increased based on server capacity
      exec_mode: 'cluster', // Use cluster mode for better performance
      
      // Process management
      autorestart: true,
      watch: false, // Disable watch in production
      max_memory_restart: '2G',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Source map support (optional)
      source_map_support: false,
      
      // Environment variables for different stages
      env_production: {
        NODE_ENV: 'production',
        PORT: 3100,
        NEXT_TELEMETRY_DISABLED: 1,
        NODE_OPTIONS: '--max-old-space-size=4096',
        DATABASE_POOL_MIN: 5,
        DATABASE_POOL_MAX: 20
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3101,
        NEXT_TELEMETRY_DISABLED: 1,
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/whatsapp-frontend.git', // Update with your repo
      path: '/var/www/Whatsapp',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/Whatsapp/whatsapp-frontend/logs'
    }
  }
}