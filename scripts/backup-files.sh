#!/bin/bash
#===============================================================================
# Files Backup Script - Backup uploaded files to cloud storage
#===============================================================================

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Directories
UPLOADS_DIR="${UPLOADS_DIR:-/opt/gold-factory/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/opt/gold-factory/backups}"
LOCAL_BACKUP_DIR="$BACKUP_DIR/$ENVIRONMENT/files"
LOG_FILE="$BACKUP_DIR/logs/backup-files-$DATE.log"

# Load environment
[ -f "$SCRIPT_DIR/../backend/.env" ] && source "$SCRIPT_DIR/../backend/.env"

# Cloud config
CLOUD_PROVIDER="${CLOUD_PROVIDER:-s3}"
S3_BUCKET="${BACKUP_S3_BUCKET}"
GCS_BUCKET="${BACKUP_GCS_BUCKET}"
DO_SPACES_BUCKET="${BACKUP_DO_SPACES_BUCKET}"

RETENTION_DAYS=30
ALERT_SCRIPT="$SCRIPT_DIR/alert.sh"

mkdir -p "$LOCAL_BACKUP_DIR" "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "Starting files backup for $ENVIRONMENT..."

# Create archive
BACKUP_FILE="$LOCAL_BACKUP_DIR/uploads_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" 2>/dev/null || true

if [ ! -s "$BACKUP_FILE" ]; then
  log "ERROR: Backup archive empty or failed"
  [ -f "$ALERT_SCRIPT" ] && "$ALERT_SCRIPT" "CRITICAL" "Files Backup Failed" "Backup failed for $ENVIRONMENT"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Archive created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to cloud
REMOTE_PATH="$ENVIRONMENT/files/$(basename "$BACKUP_FILE")"
case "$CLOUD_PROVIDER" in
  s3)     [ -n "$S3_BUCKET" ] && aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$REMOTE_PATH" --storage-class STANDARD_IA --only-show-errors ;;
  gcs)    [ -n "$GCS_BUCKET" ] && gsutil cp "$BACKUP_FILE" "gs://$GCS_BUCKET/$REMOTE_PATH" ;;
  spaces) [ -n "$DO_SPACES_BUCKET" ] && s3cmd put "$BACKUP_FILE" "s3://$DO_SPACES_BUCKET/$REMOTE_PATH" ;;
esac
log "Uploaded to $CLOUD_PROVIDER"

# Cleanup old local backups
find "$LOCAL_BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
log "Cleanup completed"

[ -f "$ALERT_SCRIPT" ] && "$ALERT_SCRIPT" "INFO" "Files Backup Success" "Backup completed: $BACKUP_SIZE"
log "Files backup completed successfully"
