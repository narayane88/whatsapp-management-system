#!/bin/bash

# Database restore script for WhatsApp Management System
# This script restores the PostgreSQL database from a backup

# Configuration
DB_NAME="whatsapp_mmp"
DB_USER="postgres"
BACKUP_DIR="./backups"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: ./restore_db.sh <backup_filename>"
    echo "Example: ./restore_db.sh whatsapp_business_backup_20240827_140218.sql"
    echo ""
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.sql 2>/dev/null
    ls -la $BACKUP_DIR/*.dump 2>/dev/null
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Determine backup type
if [[ "$BACKUP_FILE" == *.sql ]]; then
    echo "Restoring from SQL dump: $BACKUP_FILE"
    psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
elif [[ "$BACKUP_FILE" == *.dump ]]; then
    echo "Restoring from binary dump: $BACKUP_FILE"
    pg_restore -U $DB_USER -d $DB_NAME -c "$BACKUP_FILE"
else
    echo "Error: Unknown backup format. Use .sql or .dump files"
    exit 1
fi

echo "Restore completed successfully!"