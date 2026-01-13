#!/bin/bash
# =============================================================================
# Gold Factory Inventory - Database Backup Script
# =============================================================================
# Usage: ./scripts/backup.sh <environment> [backup_name]
# Examples:
#   ./scripts/backup.sh staging
#   ./scripts/backup.sh production daily-backup
#   ./scripts/backup.sh production pre-deploy-20240115
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
BACKUP_NAME="${2:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------------------------
# Backup Functions
# -----------------------------------------------------------------------------
setup_backup_dir() {
    log_info "Setting up backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/$ENVIRONMENT"
    
    log_success "Backup directory ready: $BACKUP_DIR/$ENVIRONMENT"
}

load_environment() {
    log_info "Loading environment configuration..."
    
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        set -a
        source "$PROJECT_ROOT/.env.$ENVIRONMENT"
        set +a
    elif [ -f "$PROJECT_ROOT/.env" ]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    fi
    
    # Set defaults
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_DB="${POSTGRES_DB:-gold_factory}"
    POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
    POSTGRES_PORT="${POSTGRES_PORT:-5432}"
}

check_database_connection() {
    log_info "Checking database connection..."
    
    cd "$PROJECT_ROOT"
    
    if docker-compose ps postgres | grep -q "Up"; then
        log_success "Database container is running"
    else
        log_error "Database container is not running"
        exit 1
    fi
}

create_backup() {
    local backup_file="$BACKUP_DIR/$ENVIRONMENT/${ENVIRONMENT}_${BACKUP_NAME}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log_info "Creating database backup..."
    log_info "Database: $POSTGRES_DB"
    log_info "Output: $compressed_file"
    
    cd "$PROJECT_ROOT"
    
    # Create backup using pg_dump
    docker-compose exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --format=plain \
        | gzip > "$compressed_file"
    
    # Verify backup was created
    if [ -f "$compressed_file" ] && [ -s "$compressed_file" ]; then
        local size=$(du -h "$compressed_file" | cut -f1)
        log_success "Backup created successfully: $compressed_file ($size)"
        
        # Create latest symlink
        ln -sf "$compressed_file" "$BACKUP_DIR/$ENVIRONMENT/latest.sql.gz"
        
        echo "$compressed_file"
    else
        log_error "Backup file is empty or was not created"
        exit 1
    fi
}

create_schema_backup() {
    local schema_file="$BACKUP_DIR/$ENVIRONMENT/${ENVIRONMENT}_schema_${TIMESTAMP}.sql"
    
    log_info "Creating schema-only backup..."
    
    cd "$PROJECT_ROOT"
    
    docker-compose exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --schema-only \
        --no-owner \
        --no-acl \
        > "$schema_file"
    
    if [ -f "$schema_file" ] && [ -s "$schema_file" ]; then
        log_success "Schema backup created: $schema_file"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    local count_before=$(find "$BACKUP_DIR/$ENVIRONMENT" -name "*.sql.gz" -type f | wc -l)
    
    # Delete backups older than retention period
    find "$BACKUP_DIR/$ENVIRONMENT" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/$ENVIRONMENT" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete
    
    local count_after=$(find "$BACKUP_DIR/$ENVIRONMENT" -name "*.sql.gz" -type f | wc -l)
    local deleted=$((count_before - count_after))
    
    if [ $deleted -gt 0 ]; then
        log_info "Deleted $deleted old backup(s)"
    fi
    
    log_success "Cleanup completed. $count_after backup(s) remaining."
}

upload_to_s3() {
    local backup_file="$1"
    
    if [ -z "${AWS_S3_BUCKET:-}" ]; then
        log_info "S3 bucket not configured, skipping S3 upload"
        return 0
    fi
    
    log_info "Uploading backup to S3..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/$ENVIRONMENT/"
        log_success "Backup uploaded to S3"
    else
        log_warning "AWS CLI not installed, skipping S3 upload"
    fi
}

list_backups() {
    log_info "Available backups for $ENVIRONMENT:"
    echo
    
    if [ -d "$BACKUP_DIR/$ENVIRONMENT" ]; then
        ls -lh "$BACKUP_DIR/$ENVIRONMENT"/*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
    else
        echo "No backup directory found"
    fi
}

verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity..."
    
    # Check if file can be decompressed
    if gzip -t "$backup_file" 2>/dev/null; then
        log_success "Backup file integrity verified"
    else
        log_error "Backup file is corrupted!"
        exit 1
    fi
    
    # Check for essential tables
    local tables=$(gunzip -c "$backup_file" | grep -c "CREATE TABLE" || true)
    log_info "Backup contains $tables table definitions"
    
    if [ "$tables" -lt 1 ]; then
        log_warning "Backup may be incomplete - no tables found"
    fi
}

save_backup_metadata() {
    local backup_file="$1"
    local metadata_file="${backup_file%.sql.gz}.meta"
    
    cat > "$metadata_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENVIRONMENT",
  "database": "$POSTGRES_DB",
  "backup_name": "$BACKUP_NAME",
  "file": "$(basename "$backup_file")",
  "size": "$(du -h "$backup_file" | cut -f1)",
  "created_by": "${USER:-unknown}",
  "created_at": "$(date -Iseconds)"
}
EOF
    
    log_info "Metadata saved"
}

# -----------------------------------------------------------------------------
# Main Backup Flow
# -----------------------------------------------------------------------------
main() {
    echo "=============================================="
    echo "  Gold Factory Inventory - Database Backup"
    echo "=============================================="
    echo "  Environment: $ENVIRONMENT"
    echo "  Backup Name: $BACKUP_NAME"
    echo "  Timestamp: $TIMESTAMP"
    echo "=============================================="
    echo
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
    
    # Run backup steps
    setup_backup_dir
    load_environment
    check_database_connection
    
    # Create backups
    backup_file=$(create_backup)
    create_schema_backup
    
    # Verify and cleanup
    verify_backup "$backup_file"
    save_backup_metadata "$backup_file"
    cleanup_old_backups
    
    # Optional S3 upload
    upload_to_s3 "$backup_file"
    
    echo
    log_success "=============================================="
    log_success "  Backup completed successfully!"
    log_success "  File: $backup_file"
    log_success "=============================================="
    
    # List recent backups
    echo
    list_backups
}

# Handle special commands
case "${1:-}" in
    list)
        ENVIRONMENT="${2:-staging}"
        list_backups
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
