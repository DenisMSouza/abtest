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

### Multi-layered Security Approach

- **Server Binding**: Server bound to `127.0.0.1` (localhost only) by default
- **Security Headers**: Helmet.js provides comprehensive HTTP security headers
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Request Validation**: Input validation and size limits
- **Compression**: Response compression for performance
- **Security Logging**: Comprehensive request/response logging

### Route Protection

- **Public routes**: Require valid API key in `Authorization: Bearer <key>` header
- **Internal routes**: Multiple protection options:
  - **Option 1**: IP-based localhost restriction (current default)
  - **Option 2**: API key validation (set `INTERNAL_API_KEY` env var)
- **API key management**: Database-driven with secure generation

### Environment Configuration

Create a `.env` file with optional security settings:

```bash
# Server Configuration
PORT=3001
HOST=127.0.0.1
NODE_ENV=development

# Dashboard Configuration (optional)
# Dashboard origins - where the admin dashboard runs
# Default: http://localhost:3000,http://127.0.0.1:3000
DASHBOARD_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Hook Configuration (optional)
# Frontend origins where the A/B test hook will be used
# Comma-separated list of origins
# Example: HOOK_ORIGINS=http://localhost:3002,http://localhost:5173,https://myapp.com
HOOK_ORIGINS=http://localhost:3002,http://localhost:5173

# Security (optional)
INTERNAL_API_KEY=your-super-secret-api-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**CORS Configuration:**

- `DASHBOARD_ORIGINS`: Dashboard origins (always included, default: localhost:3000)
- `HOOK_ORIGINS`: Frontend origins where your applications using the A/B test hook will run
- Both support comma-separated lists
- Dashboard origins are always included automatically
- Hook origins are optional - only add them if you're using the hook in external applications

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
