#!/bin/bash
# =============================================================================
# Gold Factory Inventory - Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh <environment> [version]
# Examples:
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production v1.2.3
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        log_warning ".env.$ENVIRONMENT not found, using .env"
    fi
    
    log_success "Prerequisites check passed"
}

load_environment() {
    log_info "Loading environment configuration for: $ENVIRONMENT"
    
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        set -a
        source "$PROJECT_ROOT/.env.$ENVIRONMENT"
        set +a
    elif [ -f "$PROJECT_ROOT/.env" ]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    fi
    
    export IMAGE_TAG="$VERSION"
    export DEPLOY_TIMESTAMP="$TIMESTAMP"
}

# -----------------------------------------------------------------------------
# Deployment Functions
# -----------------------------------------------------------------------------
backup_database() {
    log_info "Creating pre-deployment database backup..."
    
    if [ -x "$SCRIPT_DIR/backup.sh" ]; then
        "$SCRIPT_DIR/backup.sh" "$ENVIRONMENT" "pre-deploy-$TIMESTAMP"
        log_success "Database backup created"
    else
        log_warning "Backup script not found, skipping backup"
    fi
}

pull_images() {
    log_info "Pulling Docker images (version: $VERSION)..."
    
    cd "$PROJECT_ROOT"
    docker-compose pull
    
    log_success "Images pulled successfully"
}

stop_services() {
    log_info "Stopping current services..."
    
    cd "$PROJECT_ROOT"
    docker-compose stop backend frontend || true
    
    log_success "Services stopped"
}

run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    docker-compose run --rm backend npx prisma migrate deploy
    
    log_success "Migrations completed"
}

start_services() {
    log_info "Starting services..."
    
    cd "$PROJECT_ROOT"
    docker-compose up -d --remove-orphans
    
    log_success "Services started"
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
        
        log_info "Waiting for services to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    docker image prune -f --filter "until=168h" || true
    
    log_success "Cleanup completed"
}

save_deployment_info() {
    log_info "Saving deployment information..."
    
    local deploy_info="$PROJECT_ROOT/.last_deployment"
    
    cat > "$deploy_info" << EOF
DEPLOYMENT_TIMESTAMP=$TIMESTAMP
DEPLOYMENT_VERSION=$VERSION
DEPLOYMENT_ENVIRONMENT=$ENVIRONMENT
DEPLOYED_BY=${USER:-unknown}
DEPLOYED_AT=$(date -Iseconds)
EOF
    
    log_success "Deployment info saved to .last_deployment"
}

# -----------------------------------------------------------------------------
# Main Deployment Flow
# -----------------------------------------------------------------------------
main() {
    echo "=============================================="
    echo "  Gold Factory Inventory - Deployment"
    echo "=============================================="
    echo "  Environment: $ENVIRONMENT"
    echo "  Version: $VERSION"
    echo "  Timestamp: $TIMESTAMP"
    echo "=============================================="
    echo
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Valid environments: staging, production, development"
        exit 1
    fi
    
    # Production confirmation
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "You are about to deploy to PRODUCTION!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    load_environment
    backup_database
    pull_images
    
    # Blue-green for production, simple restart for staging
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Performing blue-green deployment..."
        run_migrations
        start_services
    else
        stop_services
        run_migrations
        start_services
    fi
    
    # Verify deployment
    if health_check; then
        cleanup_old_images
        save_deployment_info
        
        echo
        log_success "=============================================="
        log_success "  Deployment completed successfully!"
        log_success "  Environment: $ENVIRONMENT"
        log_success "  Version: $VERSION"
        log_success "=============================================="
    else
        log_error "Deployment verification failed!"
        log_warning "Consider running: ./scripts/rollback.sh $ENVIRONMENT"
        exit 1
    fi
}

# Run main function
main "$@"
