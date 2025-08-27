#!/bin/bash

# Database backup script for WhatsApp Management System
# This script creates backups of the PostgreSQL database

# Configuration
DB_NAME="whatsapp_mmp"
DB_USER="postgres"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create SQL dump
echo "Creating SQL dump..."
pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/whatsapp_business_backup_${DATE}.sql"

# Create binary dump
echo "Creating binary dump..."
pg_dump -U $DB_USER -d $DB_NAME -Fc > "$BACKUP_DIR/whatsapp_business_backup_${DATE}.dump"

echo "Backup completed: $BACKUP_DIR/whatsapp_business_backup_${DATE}"
echo "Files created:"
echo "  - SQL dump: whatsapp_business_backup_${DATE}.sql"
echo "  - Binary dump: whatsapp_business_backup_${DATE}.dump"