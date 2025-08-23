#!/bin/bash

# WhatsApp Frontend Production Deployment Script
# Usage: ./deploy-prod.sh [start|stop|restart|status|logs]

set -e

# Configuration
APP_NAME="whatsapp-frontend"
APP_DIR="/var/www/Whatsapp/whatsapp-frontend"
NODE_ENV="production"
PORT=3100

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
    
    log_success "All dependencies are available"
}

setup_environment() {
    log_info "Setting up production environment..."
    
    # Check if .env.local exists (main production config)
    if [ ! -f "$APP_DIR/.env.local" ]; then
        log_error ".env.local file not found. This file should contain your production database and app configuration."
        log_error "Please create .env.local with your production settings before deploying."
        exit 1
    fi
    
    # Ensure .env.production exists for performance settings
    if [ ! -f "$APP_DIR/.env.production" ]; then
        log_info "Creating .env.production for performance settings..."
        cat > "$APP_DIR/.env.production" << EOF
NODE_ENV=production
PORT=$PORT
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_LOG_LEVEL=error
NODE_OPTIONS=--max-old-space-size=4096
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
EOF
        log_success ".env.production created"
    fi
    
    log_success "Production environment verified"
}

build_application() {
    log_info "Building application for production..."
    
    cd "$APP_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    if [ -f "package-lock.json" ]; then
        # Try npm ci first, fallback to npm install if lock file is out of sync
        npm ci --omit=dev || {
            log_warning "npm ci failed, running npm install instead..."
            npm install --omit=dev
        }
    else
        npm install --omit=dev
    fi
    
    # Build the application
    log_info "Building Next.js application..."
    npm run build
    
    log_success "Application built successfully"
}

start_application() {
    log_info "Starting application with PM2..."
    
    cd "$APP_DIR"
    
    # Check if app is already running
    if pm2 list | grep -q "$APP_NAME"; then
        log_warning "Application is already running. Use 'restart' to reload it."
        return 0
    fi
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    log_success "Application started successfully"
    log_info "Application is running on http://localhost:$PORT"
}

stop_application() {
    log_info "Stopping application..."
    
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop "$APP_NAME"
        pm2 delete "$APP_NAME"
        log_success "Application stopped"
    else
        log_warning "Application is not running"
    fi
}

restart_application() {
    log_info "Restarting application..."
    
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME"
        log_success "Application restarted"
    else
        log_warning "Application is not running. Starting it..."
        start_application
    fi
}

show_status() {
    log_info "Application status:"
    pm2 list | grep -E "(App name|$APP_NAME)" || log_warning "Application is not running"
    
    echo ""
    log_info "System resources:"
    pm2 monit
}

show_logs() {
    log_info "Showing application logs..."
    pm2 logs "$APP_NAME" --lines 50
}

deploy_full() {
    log_info "Starting full production deployment..."
    
    check_dependencies
    setup_environment
    
    # Stop existing instance
    if pm2 list | grep -q "$APP_NAME"; then
        stop_application
    fi
    
    build_application
    start_application
    
    log_success "Production deployment completed!"
    log_info "Application is running on http://localhost:$PORT"
    log_info "Use 'pm2 logs $APP_NAME' to view logs"
    log_info "Use 'pm2 monit' to monitor the application"
}

# Main script logic
case "$1" in
    start)
        check_dependencies
        setup_environment
        start_application
        ;;
    stop)
        stop_application
        ;;
    restart)
        restart_application
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        check_dependencies
        setup_environment
        build_application
        ;;
    deploy)
        deploy_full
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|build|deploy}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status"
        echo "  logs    - Show application logs"
        echo "  build   - Build the application for production"
        echo "  deploy  - Full deployment (build and start)"
        echo ""
        echo "Examples:"
        echo "  $0 deploy    # Full production deployment"
        echo "  $0 start     # Start the application"
        echo "  $0 logs      # View logs"
        exit 1
        ;;
esac