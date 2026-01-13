#!/bin/bash

#===============================================================================
# Database Backup Script
# Creates compressed PostgreSQL backups with cloud upload and retention
#
# Usage: ./scripts/backup-db.sh [environment] [backup_type]
# Example: ./scripts/backup-db.sh production daily
#===============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-daily}  # daily, weekly, monthly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Directories
BACKUP_DIR="${BACKUP_DIR:-/opt/gold-factory/backups}"
LOCAL_BACKUP_DIR="$BACKUP_DIR/$ENVIRONMENT/database"
LOG_FILE="$BACKUP_DIR/logs/backup-db-$DATE.log"

# Database configuration (from environment or .env)
if [ -f "$SCRIPT_DIR/../backend/.env" ]; then
  source "$SCRIPT_DIR/../backend/.env"
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gold_factory}"
DB_USER="${DB_USER:-postgres}"

# Cloud storage configuration
CLOUD_PROVIDER="${CLOUD_PROVIDER:-s3}"  # s3, gcs, spaces
S3_BUCKET="${BACKUP_S3_BUCKET}"
GCS_BUCKET="${BACKUP_GCS_BUCKET}"
DO_SPACES_BUCKET="${BACKUP_DO_SPACES_BUCKET}"

# Retention configuration (number of backups to keep)
DAILY_RETENTION=30
WEEKLY_RETENTION=12
MONTHLY_RETENTION=12

# Notification
ALERT_SCRIPT="$SCRIPT_DIR/alert.sh"
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL}"

#===============================================================================
# Logging
#===============================================================================

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_notification() {
  local status=$1
  local message=$2
  
  if [ -f "$ALERT_SCRIPT" ]; then
    if [ "$status" = "success" ]; then
      "$ALERT_SCRIPT" "INFO" "Backup Completed" "$message"
    else
      "$ALERT_SCRIPT" "CRITICAL" "Backup Failed" "$message"
    fi
  fi
  
  # Email notification
  if [ -n "$NOTIFY_EMAIL" ] && command -v mail &> /dev/null; then
    echo "$message" | mail -s "[$status] Gold Factory Backup - $ENVIRONMENT" "$NOTIFY_EMAIL"
  fi
}

#===============================================================================
# Backup Functions
#===============================================================================

create_backup() {
  log "Starting database backup..."
  
  # Create backup directory
  mkdir -p "$LOCAL_BACKUP_DIR/$BACKUP_TYPE"
  
  # Backup filename
  BACKUP_FILE="$LOCAL_BACKUP_DIR/$BACKUP_TYPE/${DB_NAME}_${ENVIRONMENT}_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"
  
  # Create backup with pg_dump
  log "Dumping database: $DB_NAME"
  
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --verbose \
    2>> "$LOG_FILE" | gzip -9 > "$BACKUP_FILE"
  
  # Verify backup was created
  if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    log "ERROR: Backup file not created or empty"
    return 1
  fi
  
  # Get backup size
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
  
  # Verify backup integrity
  if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "ERROR: Backup file is corrupted"
    return 1
  fi
  
  log "Backup integrity verified"
  return 0
}

upload_to_cloud() {
  log "Uploading backup to cloud storage..."
  
  local remote_path="$ENVIRONMENT/database/$BACKUP_TYPE/$(basename "$BACKUP_FILE")"
  
  case "$CLOUD_PROVIDER" in
    s3)
      if [ -n "$S3_BUCKET" ]; then
        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$remote_path" \
          --storage-class STANDARD_IA \
          --only-show-errors
        log "Uploaded to S3: s3://$S3_BUCKET/$remote_path"
      else
        log "WARNING: S3 bucket not configured, skipping cloud upload"
      fi
      ;;
    
    gcs)
      if [ -n "$GCS_BUCKET" ]; then
        gsutil cp "$BACKUP_FILE" "gs://$GCS_BUCKET/$remote_path"
        log "Uploaded to GCS: gs://$GCS_BUCKET/$remote_path"
      else
        log "WARNING: GCS bucket not configured, skipping cloud upload"
      fi
      ;;
    
    spaces)
      if [ -n "$DO_SPACES_BUCKET" ]; then
        s3cmd put "$BACKUP_FILE" "s3://$DO_SPACES_BUCKET/$remote_path"
        log "Uploaded to DigitalOcean Spaces: $DO_SPACES_BUCKET/$remote_path"
      else
        log "WARNING: DO Spaces bucket not configured, skipping cloud upload"
      fi
      ;;
    
    *)
      log "WARNING: Unknown cloud provider: $CLOUD_PROVIDER"
      ;;
  esac
}

cleanup_old_backups() {
  log "Cleaning up old backups..."
  
  local retention
  case "$BACKUP_TYPE" in
    daily)   retention=$DAILY_RETENTION ;;
    weekly)  retention=$WEEKLY_RETENTION ;;
    monthly) retention=$MONTHLY_RETENTION ;;
    *)       retention=30 ;;
  esac
  
  # Local cleanup
  local backup_dir="$LOCAL_BACKUP_DIR/$BACKUP_TYPE"
  local count=$(ls -1 "$backup_dir"/*.sql.gz 2>/dev/null | wc -l)
  
  if [ "$count" -gt "$retention" ]; then
    local to_delete=$((count - retention))
    log "Deleting $to_delete old local backup(s)"
    
    ls -1t "$backup_dir"/*.sql.gz | tail -n "$to_delete" | xargs rm -f
  fi
  
  # Cloud cleanup
  case "$CLOUD_PROVIDER" in
    s3)
      if [ -n "$S3_BUCKET" ]; then
        # List and delete old backups from S3
        local remote_path="$ENVIRONMENT/database/$BACKUP_TYPE/"
        aws s3 ls "s3://$S3_BUCKET/$remote_path" | sort -r | tail -n +$((retention + 1)) | while read -r line; do
          filename=$(echo "$line" | awk '{print $4}')
          if [ -n "$filename" ]; then
            aws s3 rm "s3://$S3_BUCKET/$remote_path$filename" --only-show-errors
            log "Deleted from S3: $filename"
          fi
        done
      fi
      ;;
    
    gcs)
      if [ -n "$GCS_BUCKET" ]; then
        local remote_path="gs://$GCS_BUCKET/$ENVIRONMENT/database/$BACKUP_TYPE/"
        gsutil ls "$remote_path" | sort -r | tail -n +$((retention + 1)) | xargs -I {} gsutil rm {}
      fi
      ;;
  esac
  
  log "Cleanup completed"
}

record_backup_stats() {
  local stats_file="$BACKUP_DIR/stats/backup-stats.json"
  mkdir -p "$(dirname "$stats_file")"
  
  local backup_size_bytes=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
  
  # Append to stats
  cat >> "$stats_file" <<EOF
{"timestamp":"$(date -Iseconds)","environment":"$ENVIRONMENT","type":"$BACKUP_TYPE","size_bytes":$backup_size_bytes,"file":"$(basename "$BACKUP_FILE")"}
EOF
  
  log "Backup stats recorded"
}

#===============================================================================
# Main Execution
#===============================================================================

main() {
  log "=============================================="
  log "Database Backup - $ENVIRONMENT ($BACKUP_TYPE)"
  log "=============================================="
  
  local start_time=$(date +%s)
  local status="success"
  local message=""
  
  # Create backup
  if create_backup; then
    log "✓ Backup created successfully"
    
    # Upload to cloud
    upload_to_cloud
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Record stats
    record_backup_stats
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    message="Database backup completed successfully.\nEnvironment: $ENVIRONMENT\nType: $BACKUP_TYPE\nSize: $BACKUP_SIZE\nDuration: ${duration}s\nFile: $(basename "$BACKUP_FILE")"
    log "Backup completed in ${duration}s"
  else
    status="failed"
    message="Database backup FAILED for $ENVIRONMENT ($BACKUP_TYPE). Check logs: $LOG_FILE"
    log "✗ Backup failed"
  fi
  
  # Send notification
  send_notification "$status" "$message"
  
  log "=============================================="
  
  if [ "$status" = "failed" ]; then
    exit 1
  fi
}

main "$@"
