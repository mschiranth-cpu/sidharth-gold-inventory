#!/bin/bash
#===============================================================================
# Database Restore Script - Download and restore PostgreSQL backup
#===============================================================================

set -e

BACKUP_FILE=$1
ENVIRONMENT=${2:-production}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup_file_or_s3_path> [environment]"
  echo "Examples:"
  echo "  ./restore-db.sh /path/to/backup.sql.gz production"
  echo "  ./restore-db.sh s3://bucket/path/backup.sql.gz production"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="/tmp/gold-factory-restore"
DATE=$(date +%Y-%m-%d_%H%M%S)

[ -f "$SCRIPT_DIR/../backend/.env" ] && source "$SCRIPT_DIR/../backend/.env"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gold_factory}"
DB_USER="${DB_USER:-postgres}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

log "Starting database restore..."

# Download if remote
LOCAL_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == s3://* ]]; then
  log "Downloading from S3..."
  LOCAL_FILE="$RESTORE_DIR/$(basename "$BACKUP_FILE")"
  aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
elif [[ "$BACKUP_FILE" == gs://* ]]; then
  log "Downloading from GCS..."
  LOCAL_FILE="$RESTORE_DIR/$(basename "$BACKUP_FILE")"
  gsutil cp "$BACKUP_FILE" "$LOCAL_FILE"
fi

if [ ! -f "$LOCAL_FILE" ]; then
  log "ERROR: Backup file not found: $LOCAL_FILE"
  exit 1
fi

log "Verifying backup integrity..."
gzip -t "$LOCAL_FILE" || { log "ERROR: Backup corrupted"; exit 1; }

log "Creating pre-restore backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null | gzip > "$RESTORE_DIR/pre_restore_$DATE.sql.gz" || true

log "Restoring database..."
gunzip -c "$LOCAL_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q

log "Verifying restore..."
RECORD_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"Order\"" 2>/dev/null | tr -d ' ')

if [ -n "$RECORD_COUNT" ] && [ "$RECORD_COUNT" -gt 0 ]; then
  log "✓ Restore verified: $RECORD_COUNT orders found"
else
  log "WARNING: Could not verify data, please check manually"
fi

log "Cleaning up..."
rm -f "$RESTORE_DIR/$(basename "$BACKUP_FILE")" 2>/dev/null || true

log "Database restore completed successfully"
