# A/B Testing Backend

A Node.js backend API for managing A/B tests and experiments with database-driven API key management.

## Features

- 🚀 **Database-driven API key management** - Secure key generation and validation
- 🔒 **Security middleware** - IP-based access control for internal routes
- 📊 **Experiment management** - Create, update, and track experiments
- 🎯 **User variation tracking** - Persistent user assignments
- 📈 **Analytics and statistics** - Comprehensive experiment metrics
- 🗄️ **SQLite database** - Easy setup with migration support
- 🛡️ **API key authentication** - Secure public endpoints

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Build and start:

```bash
npm run build
npm start
```

**Note**: No environment variables needed! API keys are managed through the dashboard.

## API Endpoints

### Public API (for SDK - requires API key)

- `GET /api/experiments/:id` - Get experiment details
- `GET /api/experiments/:id/variation` - Get user's variation
- `POST /api/experiments/:id/variation` - Persist user variation
- `POST /api/experiments/:id/success` - Track success events

### Internal API (for dashboard - localhost only)

- `GET /api/internal/experiments` - List all experiments
- `POST /api/internal/experiments` - Create experiment
- `GET /api/internal/experiments/:id` - Get experiment details
- `PUT /api/internal/experiments/:id` - Update experiment
- `DELETE /api/internal/experiments/:id` - Delete experiment
- `GET /api/internal/experiments/:id/stats` - Get experiment statistics

### API Key Management (for dashboard - localhost only)

- `GET /api/internal/api-keys` - List API keys
- `POST /api/internal/api-keys` - Create new API key
- `GET /api/internal/api-keys/:id` - Get API key details
- `PATCH /api/internal/api-keys/:id/deactivate` - Deactivate key
- `PATCH /api/internal/api-keys/:id/reactivate` - Reactivate key
- `DELETE /api/internal/api-keys/:id` - Delete key

## Security

- **Public routes**: Require valid API key in `Authorization: Bearer <key>` header
- **Internal routes**: Restricted to localhost only (no API key needed)
- **API key management**: Database-driven with secure generation
- **IP-based access control**: Internal routes protected by IP whitelist

## Database Schema

- **Experiments**: Store experiment metadata
- **Variations**: Store experiment variations with weights
- **UserVariations**: Track which variation each user gets
- **ApiKeys**: Store and validate API keys
- **SuccessEvents**: Track conversion events

## Example Usage

### Using the SDK (requires API key)

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3001/api/experiments/your-experiment-id/variation?userId=user-123
```

### Dashboard access (no API key needed)

```bash
curl http://localhost:3001/api/internal/experiments
```

## Health Check

```bash
curl http://localhost:3001/health
```
