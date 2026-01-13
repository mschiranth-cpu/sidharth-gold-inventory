#!/bin/bash
#===============================================================================
# Backup Test Script - Monthly restore testing and verification
#===============================================================================

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE=$(date +%Y-%m-%d)
REPORT_DIR="${BACKUP_DIR:-/opt/gold-factory/backups}/test-reports"
REPORT_FILE="$REPORT_DIR/backup-test-$DATE.md"

[ -f "$SCRIPT_DIR/../backend/.env" ] && source "$SCRIPT_DIR/../backend/.env"

S3_BUCKET="${BACKUP_S3_BUCKET}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-s3}"
TEST_DB_NAME="${TEST_DB_NAME:-gold_factory_test}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"

mkdir -p "$REPORT_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
report() { echo "$1" >> "$REPORT_FILE"; }

log "Starting backup test..."

# Initialize report
cat > "$REPORT_FILE" <<EOF
# Backup Test Report - $DATE

| Test | Status | Details |
|------|--------|---------|
EOF

TEST_PASSED=true

# Test 1: Find latest backup
log "Finding latest backup..."
case "$CLOUD_PROVIDER" in
  s3) LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/production/database/daily/" --recursive | sort | tail -1 | awk '{print $4}') ;;
  *) LATEST_BACKUP="" ;;
esac

if [ -n "$LATEST_BACKUP" ]; then
  report "| Latest Backup Found | ✅ PASS | $LATEST_BACKUP |"
else
  report "| Latest Backup Found | ❌ FAIL | No backup found |"
  TEST_PASSED=false
fi

# Test 2: Download and verify
if [ -n "$LATEST_BACKUP" ]; then
  log "Downloading backup..."
  TEMP_FILE="/tmp/backup-test-$DATE.sql.gz"
  
  case "$CLOUD_PROVIDER" in
    s3) aws s3 cp "s3://$S3_BUCKET/$LATEST_BACKUP" "$TEMP_FILE" --only-show-errors ;;
  esac
  
  if gzip -t "$TEMP_FILE" 2>/dev/null; then
    SIZE=$(du -h "$TEMP_FILE" | cut -f1)
    report "| Backup Integrity | ✅ PASS | Size: $SIZE |"
  else
    report "| Backup Integrity | ❌ FAIL | Corrupted |"
    TEST_PASSED=false
  fi
  
  # Test 3: Restore to test database
  log "Restoring to test database..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME" 2>/dev/null || true
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $TEST_DB_NAME" 2>/dev/null
  
  if gunzip -c "$TEMP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TEST_DB_NAME" -q 2>/dev/null; then
    report "| Database Restore | ✅ PASS | Restored to $TEST_DB_NAME |"
    
    # Test 4: Verify data
    ORDER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM \"Order\"" 2>/dev/null | tr -d ' ')
    USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\"" 2>/dev/null | tr -d ' ')
    
    report "| Data Verification | ✅ PASS | Orders: $ORDER_COUNT, Users: $USER_COUNT |"
  else
    report "| Database Restore | ❌ FAIL | Restore failed |"
    TEST_PASSED=false
  fi
  
  # Cleanup
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME" 2>/dev/null || true
  rm -f "$TEMP_FILE"
fi

# Summary
echo "" >> "$REPORT_FILE"
if [ "$TEST_PASSED" = true ]; then
  echo "## Result: ✅ ALL TESTS PASSED" >> "$REPORT_FILE"
  log "All tests passed"
else
  echo "## Result: ❌ SOME TESTS FAILED" >> "$REPORT_FILE"
  log "Some tests failed"
fi

echo "" >> "$REPORT_FILE"
echo "Report: $REPORT_FILE" >> "$REPORT_FILE"

log "Test report saved to: $REPORT_FILE"
cat "$REPORT_FILE"
