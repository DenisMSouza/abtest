# A/B Testing Platform - Deployment Guide

This guide covers deploying the self-hosted A/B testing platform in production environments.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 80, 3000, and 3001 available

### One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/your-username/abtest.git
cd abtest

# Deploy with Docker Compose
./deploy.sh
```

The platform will be available at:

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📋 Manual Deployment

### 1. Backend Deployment

```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate:up

# Build the application
npm run build

# Start the server
npm start
```

### 2. Frontend Deployment

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Deployment

#### Backend Container

```bash
# Build backend image
docker build -t abtest-backend ./backend

# Run backend container
docker run -d \
  --name abtest-backend \
  -p 3001:3001 \
  -v abtest_data:/app/data \
  -e NODE_ENV=production \
  abtest-backend
```

#### Frontend Container

```bash
# Build frontend image
docker build -t abtest-frontend .

# Run frontend container
docker run -d \
  --name abtest-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-backend:3001/api \
  abtest-frontend
```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration

| Variable            | Default                 | Description                                  |
| ------------------- | ----------------------- | -------------------------------------------- |
| `NODE_ENV`          | `development`           | Environment (development/staging/production) |
| `PORT`              | `3001`                  | Server port                                  |
| `HOST`              | `0.0.0.0`               | Server host                                  |
| `DB_PATH`           | `/app/data/abtest.db`   | Database file path                           |
| `CORS_ORIGIN`       | `http://localhost:3000` | Allowed CORS origins (comma-separated)       |
| `LOG_LEVEL`         | `info`                  | Logging level (error/warn/info/debug)        |
| `LOG_CONSOLE`       | `true`                  | Enable console logging                       |
| `LOG_FILE`          | `false`                 | Enable file logging                          |
| `LOG_FILE_PATH`     | `/app/logs/app.log`     | Log file path                                |
| `RATE_LIMIT_WINDOW` | `900000`                | Rate limit window (ms)                       |
| `RATE_LIMIT_MAX`    | `100`                   | Max requests per window                      |
| `HEALTH_CHECK`      | `true`                  | Enable health check endpoint                 |
| `METRICS`           | `false`                 | Enable metrics endpoint                      |

#### Frontend Configuration

| Variable              | Default                     | Description     |
| --------------------- | --------------------------- | --------------- |
| `NODE_ENV`            | `development`               | Environment     |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend API URL |

### Production Configuration

Create a `.env.production` file:

```env
# Backend
NODE_ENV=production
PORT=3001
DB_PATH=/app/data/abtest.db
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com
LOG_LEVEL=warn
LOG_FILE=true
LOG_FILE_PATH=/app/logs/app.log
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🗄️ Database Management

### Running Migrations

```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down
```

### Database Backup

```bash
# Create backup
cp /app/data/abtest.db /app/backups/backup-$(date +%Y%m%d-%H%M%S).db

# Restore from backup
cp /app/backups/backup-20240101-120000.db /app/data/abtest.db
```

### Database Seeding

```bash
# Seed with sample data
npm run seed
```

## 🔒 Security Configuration

### SSL/TLS Setup

1. **Obtain SSL certificates** (Let's Encrypt recommended)

2. **Update nginx.conf**:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}
```

3. **Update docker-compose.yml**:

```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### Rate Limiting

Configure rate limiting in nginx.conf:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=dashboard:10m rate=5r/s;
```

## 📊 Monitoring & Logging

### Health Checks

The platform includes built-in health checks:

- **Backend**: `GET /health`
- **Frontend**: `GET /api/health`

### Logging

Logs are available in multiple formats:

```bash
# View container logs
docker-compose logs -f abtest-backend
docker-compose logs -f abtest-frontend

# View application logs (if file logging enabled)
tail -f /app/logs/app.log
```

### Metrics (Optional)

Enable metrics collection:

```env
METRICS=true
METRICS_PATH=/metrics
```

Access metrics at: `GET /metrics`

## 🔄 Updates & Maintenance

### Updating the Platform

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Maintenance

```bash
# Check database integrity
sqlite3 /app/data/abtest.db "PRAGMA integrity_check;"

# Optimize database
sqlite3 /app/data/abtest.db "VACUUM;"
```

### Backup Strategy

Create automated backups:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/app/backups"
DB_PATH="/app/data/abtest.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/backup-$DATE.db"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup-*.db" -mtime +30 -delete
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /app/scripts/backup.sh
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Locked

```bash
# Check for locked database
sqlite3 /app/data/abtest.db "PRAGMA busy_timeout=30000;"

# Restart services
docker-compose restart
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
deploy:
  mem_limit: 1g
  memswap_limit: 1g
```

### Log Analysis

```bash
# Search for errors
docker-compose logs | grep -i error

# Monitor real-time logs
docker-compose logs -f --tail=100
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM experiments WHERE isActive = 1;

-- Create additional indexes if needed
CREATE INDEX idx_experiments_name ON experiments(name);
```

### Caching

Consider adding Redis for caching:

```yaml
# docker-compose.yml
redis:
  image: redis:alpine
  container_name: abtest-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### Load Balancing

For high-traffic deployments, use multiple backend instances:

```yaml
# docker-compose.yml
abtest-backend:
  # ... configuration
  deploy:
    replicas: 3
```

## 🆘 Support

### Getting Help

- **Documentation**: Check this guide and README.md
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions

### Emergency Procedures

#### Complete System Recovery

```bash
# Stop all services
docker-compose down

# Restore from backup
cp /app/backups/latest-backup.db /app/data/abtest.db

# Restart services
docker-compose up -d
```

#### Data Export

```bash
# Export all data
sqlite3 /app/data/abtest.db ".dump" > full_backup.sql
```

---

## 📝 Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Ports 80, 3000, 3001 available
- [ ] Environment variables configured
- [ ] SSL certificates obtained (production)
- [ ] Firewall configured
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health checks working
- [ ] Database migrations run
- [ ] Sample data seeded (optional)
- [ ] Documentation updated
- [ ] Team access configured
