#!/bin/bash
# =============================================================================
# Gold Factory Inventory - Rollback Script
# =============================================================================
# Usage: ./scripts/rollback.sh <environment> [version]
# Examples:
#   ./scripts/rollback.sh staging           # Rollback to previous version
#   ./scripts/rollback.sh production v1.1.0 # Rollback to specific version
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
TARGET_VERSION="${2:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
# Rollback Functions
# -----------------------------------------------------------------------------
get_previous_version() {
    log_info "Determining rollback version..."
    
    # Check for last deployment info
    local deploy_info="$PROJECT_ROOT/.last_deployment"
    
    if [ -f "$deploy_info" ]; then
        source "$deploy_info"
        log_info "Current deployment: $DEPLOYMENT_VERSION (deployed at $DEPLOYED_AT)"
    fi
    
    # List available versions
    log_info "Available versions in registry:"
    docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "backend|frontend" | head -10 || true
}

get_previous_backup() {
    local backup_dir="$PROJECT_ROOT/backups"
    
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(ls -t "$backup_dir"/*.sql.gz 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            echo "$latest_backup"
        fi
    fi
}

rollback_containers() {
    local version="${1:-}"
    
    log_info "Rolling back containers..."
    
    cd "$PROJECT_ROOT"
    
    if [ -n "$version" ]; then
        # Rollback to specific version
        export IMAGE_TAG="$version"
        log_info "Rolling back to version: $version"
    else
        # Rollback to previous image
        log_info "Rolling back to previous image..."
        
        # Get previous image digests
        local prev_backend=$(docker images --format "{{.ID}}" "$IMAGE_NAME/backend" | sed -n '2p')
        local prev_frontend=$(docker images --format "{{.ID}}" "$IMAGE_NAME/frontend" | sed -n '2p')
        
        if [ -z "$prev_backend" ]; then
            log_error "No previous backend image found"
            exit 1
        fi
    fi
    
    # Stop current services
    docker-compose stop backend frontend
    
    # Pull and start previous version
    if [ -n "$version" ]; then
        docker-compose pull
    fi
    
    docker-compose up -d backend frontend
    
    log_success "Containers rolled back"
}

rollback_database() {
    local backup_file="${1:-}"
    
    if [ -z "$backup_file" ]; then
        backup_file=$(get_previous_backup)
    fi
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_warning "No database backup found, skipping database rollback"
        return 0
    fi
    
    log_warning "Database rollback will restore from: $backup_file"
    read -p "Proceed with database rollback? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Database rollback skipped"
        return 0
    fi
    
    log_info "Restoring database from backup..."
    
    cd "$PROJECT_ROOT"
    
    # Load environment
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    elif [ -f ".env" ]; then
        source ".env"
    fi
    
    # Restore database
    gunzip -c "$backup_file" | docker-compose exec -T postgres \
        psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-gold_factory}"
    
    log_success "Database restored from backup"
}

health_check() {
    log_info "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    local health_url="http://localhost:${BACKEND_PORT:-5000}/api/health"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "Health check failed"
    return 1
}

save_rollback_info() {
    local rollback_info="$PROJECT_ROOT/.last_rollback"
    
    cat > "$rollback_info" << EOF
ROLLBACK_TIMESTAMP=$TIMESTAMP
ROLLBACK_TO_VERSION=$TARGET_VERSION
ROLLBACK_ENVIRONMENT=$ENVIRONMENT
ROLLBACK_BY=${USER:-unknown}
ROLLBACK_AT=$(date -Iseconds)
EOF
    
    log_info "Rollback info saved"
}

# -----------------------------------------------------------------------------
# Main Rollback Flow
# -----------------------------------------------------------------------------
main() {
    echo "=============================================="
    echo "  Gold Factory Inventory - Rollback"
    echo "=============================================="
    echo "  Environment: $ENVIRONMENT"
    echo "  Target Version: ${TARGET_VERSION:-previous}"
    echo "  Timestamp: $TIMESTAMP"
    echo "=============================================="
    echo
    
    # Confirmation
    log_warning "You are about to rollback the $ENVIRONMENT environment!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    # Show available versions
    get_previous_version
    
    # Prompt for version if not specified
    if [ -z "$TARGET_VERSION" ]; then
        read -p "Enter target version (or press Enter for previous): " TARGET_VERSION
    fi
    
    # Create backup before rollback
    log_info "Creating backup before rollback..."
    if [ -x "$SCRIPT_DIR/backup.sh" ]; then
        "$SCRIPT_DIR/backup.sh" "$ENVIRONMENT" "pre-rollback-$TIMESTAMP"
    fi
    
    # Perform rollback
    rollback_containers "$TARGET_VERSION"
    
    # Optional database rollback
    read -p "Rollback database as well? (yes/no): " db_rollback
    if [ "$db_rollback" = "yes" ]; then
        rollback_database
    fi
    
    # Verify rollback
    if health_check; then
        save_rollback_info
        
        echo
        log_success "=============================================="
        log_success "  Rollback completed successfully!"
        log_success "  Environment: $ENVIRONMENT"
        log_success "  Version: ${TARGET_VERSION:-previous}"
        log_success "=============================================="
    else
        log_error "Rollback verification failed!"
        log_error "Manual intervention may be required"
        exit 1
    fi
}

# Run main function
main "$@"
