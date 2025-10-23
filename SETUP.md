# A/B Testing Platform Setup

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd abtest
npm install
```

### 2. Start Backend

```bash
cd backend
npm install
npm run build
npm start
```

### 3. Start Dashboard

```bash
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## Docker Setup (Production)

### 1. Start with Docker Compose

```bash
docker-compose up -d
```

This will start:

- Backend: `http://localhost:3001`
- Dashboard: `http://localhost:3000`
- Nginx: `http://localhost:80`

## API Key Management

### Generate API Keys

1. Go to `http://localhost:3000/settings`
2. Click "Create New Key"
3. Copy the generated key
4. Use this key in your frontend applications

### Security

- API keys are stored in the database
- Internal routes (dashboard) don't require API keys
- External routes (SDK) require valid API keys
- Dashboard is only accessible from localhost

## Configuration

### Backend Configuration

- **Port**: 3001 (configurable)
- **Database**: SQLite (development) / PostgreSQL (production)
- **API Keys**: Database-driven management

### Dashboard Configuration

- **Port**: 3000 (configurable)
- **Authentication**: None (localhost only)
- **API Integration**: Automatic backend communication

## Environment Variables

### Backend

```env
PORT=3001
NODE_ENV=production
```

**Note**: API keys are now managed through the dashboard at `/settings` - no environment variables needed!

## Database

### Development

- SQLite database (`backend/database.sqlite`)
- Auto-migrations on startup
- No additional setup required

### Production

- PostgreSQL recommended
- Update connection string in `backend/src/config/database.ts`
- Run migrations: `npm run migrate`

## API Endpoints

### Public API (for SDK)

- `GET /api/experiments/:id` - Get experiment details
- `GET /api/experiments/:id/variation` - Get user variation
- `POST /api/experiments/:id/success` - Track conversion

### Internal API (for dashboard)

- `GET /api/internal/experiments` - List experiments
- `POST /api/internal/experiments` - Create experiment
- `GET /api/internal/api-keys` - List API keys
- `POST /api/internal/api-keys` - Create API key

## Troubleshooting

### Common Issues

1. **Port already in use**: Kill existing processes or change ports
2. **Database errors**: Delete `backend/database.sqlite` and restart
3. **API key not working**: Check key is active in dashboard settings
4. **CORS errors**: Ensure frontend and backend are on same domain

### Logs

- Backend logs: Check terminal output
- Dashboard logs: Check browser console
- Database logs: Check SQLite file permissions

### Health Checks

- Backend: `http://localhost:3001/health`
- Dashboard: `http://localhost:3000`
- API Keys: `http://localhost:3000/settings`

## Development

### Backend Development

```bash
cd backend
npm run dev  # Auto-reload on changes
```

### Dashboard Development

```bash
npm run dev  # Next.js development server
```

### Database Migrations

```bash
cd backend
npm run migrate  # Run pending migrations
```

## Production Deployment

### Docker (Recommended)

```bash
# Set your API key
export ABTEST_API_KEY="your-production-key"

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Manual Deployment

1. Build backend: `cd backend && npm run build`
2. Build dashboard: `npm run build`
3. Set environment variables
4. Start services with PM2 or similar

## Security Notes

- Generate API keys through the dashboard (`/settings`)
- Use HTTPS in production
- Restrict dashboard access to trusted networks
- Regular database backups recommended
- Monitor API key usage and rotate regularly through the dashboard

## Support

- Check logs for error messages
- Verify all services are running
- Test API endpoints with curl
- Check dashboard for experiment status
