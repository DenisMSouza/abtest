#!/bin/bash

# A/B Testing Platform Deployment Script
# This script deploys the self-hosted A/B testing platform using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="abtest"
BACKUP_DIR="./backups"

# Functions
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Docker and Docker Compose are installed"
}

# Check if ports are available
check_ports() {
    local ports=(80 3000 3001)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use. You may need to stop the service using this port."
        fi
    done
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p ./ssl
    mkdir -p ./backend/data
    
    log_success "Directories created"
}

# Backup existing data
backup_data() {
    if [ -d "./backend/data" ] && [ "$(ls -A ./backend/data)" ]; then
        log_info "Backing up existing data..."
        
        local backup_file="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$backup_file" ./backend/data/
        
        log_success "Data backed up to $backup_file"
    fi
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Stop existing services
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down 2>/dev/null || true
    
    # Build and start services
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --build
    
    log_success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps | grep -q "healthy"; then
            log_success "Services are healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy within expected time"
    return 1
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    
    echo ""
    log_info "Access URLs:"
    echo "  Dashboard: http://localhost:3000"
    echo "  API: http://localhost:3001/api"
    echo "  Health Check: http://localhost:3001/health"
    
    if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps | grep -q "nginx"; then
        echo "  Nginx Proxy: http://localhost"
    fi
    
    echo ""
    log_info "Useful Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
    echo "  Restart services: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart"
}

# Main deployment function
main() {
    log_info "Starting A/B Testing Platform deployment..."
    
    check_docker
    check_ports
    create_directories
    backup_data
    deploy_services
    
    if wait_for_services; then
        show_status
        log_success "Deployment completed successfully!"
    else
        log_error "Deployment failed. Check the logs with: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "stop")
        log_info "Stopping A/B Testing Platform..."
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting A/B Testing Platform..."
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_data
        ;;
    *)
        main
        ;;
esac
