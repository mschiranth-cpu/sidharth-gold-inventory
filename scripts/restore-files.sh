#!/bin/bash
#===============================================================================
# Files Restore Script - Download and restore uploaded files backup
#===============================================================================

set -e

BACKUP_FILE=$1
ENVIRONMENT=${2:-production}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-files.sh <backup_file_or_cloud_path> [environment]"
  echo "Examples:"
  echo "  ./restore-files.sh /path/to/uploads.tar.gz production"
  echo "  ./restore-files.sh s3://bucket/path/uploads.tar.gz production"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="/tmp/gold-factory-restore"
UPLOADS_DIR="${UPLOADS_DIR:-/opt/gold-factory/uploads}"

[ -f "$SCRIPT_DIR/../backend/.env" ] && source "$SCRIPT_DIR/../backend/.env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

mkdir -p "$RESTORE_DIR"

log "Starting files restore..."

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
  log "ERROR: Backup file not found"
  exit 1
fi

log "Verifying archive..."
gzip -t "$LOCAL_FILE" || { log "ERROR: Archive corrupted"; exit 1; }

# Backup current uploads
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  log "Backing up current uploads..."
  mv "$UPLOADS_DIR" "${UPLOADS_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

log "Extracting files..."
mkdir -p "$(dirname "$UPLOADS_DIR")"
tar -xzf "$LOCAL_FILE" -C "$(dirname "$UPLOADS_DIR")"

# Set permissions
log "Setting permissions..."
chown -R www-data:www-data "$UPLOADS_DIR" 2>/dev/null || chown -R $(whoami) "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"

FILE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
log "✓ Restored $FILE_COUNT files to $UPLOADS_DIR"

rm -f "$LOCAL_FILE" 2>/dev/null || true
log "Files restore completed successfully"
