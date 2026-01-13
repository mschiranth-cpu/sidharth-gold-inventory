#!/bin/bash

#===============================================================================
# Backup Verification Script
# Verifies backup integrity and sends alerts if issues detected
#
# Usage: ./scripts/backup-check.sh [environment]
# Add to crontab: 0 8 * * * /path/to/scripts/backup-check.sh production
#===============================================================================

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALERT_SCRIPT="$SCRIPT_DIR/alert.sh"

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/gold-factory/backups/$ENVIRONMENT}"
S3_BUCKET="${BACKUP_S3_BUCKET}"
MAX_BACKUP_AGE_HOURS=26  # Alert if no backup in last 26 hours
MIN_BACKUP_SIZE_MB=1     # Alert if backup smaller than 1MB

#===============================================================================
# Logging
#===============================================================================

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_alert() {
  local severity=$1
  local title=$2
  local message=$3
  
  log "[$severity] $title: $message"
  
  if [ -f "$ALERT_SCRIPT" ]; then
    "$ALERT_SCRIPT" "$severity" "$title" "$message"
  fi
}

#===============================================================================
# Check Functions
#===============================================================================

check_local_backups() {
  log "Checking local backups in $BACKUP_DIR..."
  
  if [ ! -d "$BACKUP_DIR" ]; then
    send_alert "ERROR" "Backup Directory Missing" "Directory $BACKUP_DIR does not exist"
    return 1
  fi
  
  # Find latest backup
  local latest_backup=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
  
  if [ -z "$latest_backup" ]; then
    send_alert "CRITICAL" "No Backups Found" "No backup files found in $BACKUP_DIR"
    return 1
  fi
  
  # Check age
  local backup_time=$(stat -c %Y "$latest_backup" 2>/dev/null || stat -f %m "$latest_backup")
  local current_time=$(date +%s)
  local age_hours=$(( (current_time - backup_time) / 3600 ))
  
  if [ "$age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]; then
    send_alert "CRITICAL" "Backup Too Old" "Latest backup is ${age_hours} hours old (threshold: ${MAX_BACKUP_AGE_HOURS}h)"
    return 1
  fi
  
  # Check size
  local size_mb=$(du -m "$latest_backup" | cut -f1)
  
  if [ "$size_mb" -lt "$MIN_BACKUP_SIZE_MB" ]; then
    send_alert "WARNING" "Backup Too Small" "Latest backup is only ${size_mb}MB"
    return 1
  fi
  
  # Verify integrity
  if ! gzip -t "$latest_backup" 2>/dev/null; then
    send_alert "CRITICAL" "Backup Corrupted" "Backup file $latest_backup is corrupted"
    return 1
  fi
  
  log "✓ Local backup OK: $(basename "$latest_backup") (${size_mb}MB, ${age_hours}h old)"
  return 0
}

check_s3_backups() {
  if [ -z "$S3_BUCKET" ]; then
    log "S3 backup check skipped (S3_BUCKET not configured)"
    return 0
  fi
  
  log "Checking S3 backups in $S3_BUCKET..."
  
  if ! command -v aws &> /dev/null; then
    log "AWS CLI not installed, skipping S3 check"
    return 0
  fi
  
  # List recent backups
  local s3_backups=$(aws s3 ls "s3://$S3_BUCKET/$ENVIRONMENT/" --recursive 2>/dev/null | tail -5)
  
  if [ -z "$s3_backups" ]; then
    send_alert "ERROR" "No S3 Backups" "No backups found in S3 bucket $S3_BUCKET"
    return 1
  fi
  
  # Check latest backup age
  local latest_s3=$(echo "$s3_backups" | tail -1)
  local s3_date=$(echo "$latest_s3" | awk '{print $1 " " $2}')
  local s3_time=$(date -d "$s3_date" +%s 2>/dev/null)
  local current_time=$(date +%s)
  
  if [ -n "$s3_time" ]; then
    local age_hours=$(( (current_time - s3_time) / 3600 ))
    
    if [ "$age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]; then
      send_alert "WARNING" "S3 Backup Old" "Latest S3 backup is ${age_hours} hours old"
      return 1
    fi
  fi
  
  log "✓ S3 backups OK"
  return 0
}

check_backup_retention() {
  log "Checking backup retention..."
  
  local backup_count=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
  
  if [ "$backup_count" -lt 7 ]; then
    send_alert "WARNING" "Low Backup Count" "Only $backup_count backups available (recommend: 7+)"
  fi
  
  log "✓ Backup count: $backup_count"
  return 0
}

test_restore() {
  if [ "$2" = "--test-restore" ]; then
    log "Testing backup restore..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
      send_alert "ERROR" "Restore Test Failed" "No backup file to test"
      return 1
    fi
    
    # Create temp database for testing
    local test_db="gold_factory_restore_test_$(date +%s)"
    
    log "Creating test database: $test_db"
    
    if ! psql -U postgres -c "CREATE DATABASE $test_db" 2>/dev/null; then
      log "Could not create test database, skipping restore test"
      return 0
    fi
    
    # Restore to test database
    if gunzip -c "$latest_backup" | psql -U postgres -d "$test_db" > /dev/null 2>&1; then
      log "✓ Restore test PASSED"
      
      # Verify data
      local table_count=$(psql -U postgres -d "$test_db" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')
      log "  Tables restored: $table_count"
    else
      send_alert "ERROR" "Restore Test Failed" "Could not restore backup to test database"
    fi
    
    # Cleanup
    psql -U postgres -c "DROP DATABASE IF EXISTS $test_db" 2>/dev/null
  fi
  
  return 0
}

#===============================================================================
# Main
#===============================================================================

main() {
  log "=========================================="
  log "Backup Verification - $ENVIRONMENT"
  log "=========================================="
  
  local issues=0
  
  check_local_backups || issues=$((issues + 1))
  check_s3_backups || issues=$((issues + 1))
  check_backup_retention || issues=$((issues + 1))
  test_restore "$@" || issues=$((issues + 1))
  
  log "=========================================="
  
  if [ "$issues" -eq 0 ]; then
    log "✓ All backup checks passed"
    exit 0
  else
    log "✗ $issues check(s) failed"
    exit 1
  fi
}

main "$@"
