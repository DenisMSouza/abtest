# A/B Testing Platform - API Documentation

## Overview

The A/B Testing Platform provides two distinct API interfaces:

1. **Public API** - For external developers using the SDK
2. **Internal API** - For the dashboard and admin operations

## 🔓 Public API (For External Developers)

**Base URL**: `https://your-abtest-server.com/api`

### Endpoints

#### 1. Get Experiment Details

```http
GET /api/experiments/{experimentId}
```

**Description**: Retrieve experiment configuration and details.

**Parameters**:

- `experimentId` (path): The unique identifier of the experiment

**Response**:

```json
{
  "id": "experiment-123",
  "name": "Button Color Test",
  "description": "Testing different button colors",
  "variations": [
    {
      "name": "blue",
      "weight": 0.5,
      "isBaseline": true
    },
    {
      "name": "red",
      "weight": 0.5,
      "isBaseline": false
    }
  ],
  "isActive": true,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

#### 2. Track Success Event

```http
POST /api/experiments/{experimentId}/success
```

**Description**: Track a success event for an experiment.

**Parameters**:

- `experimentId` (path): The unique identifier of the experiment

**Request Body**:

```json
{
  "userId": "user-123",
  "sessionId": "session-456",
  "eventData": {
    "action": "click",
    "value": 99.99,
    "currency": "USD"
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "Success event tracked"
}
```

---

## 🔒 Internal API (For Dashboard/Admin)

**Base URL**: `https://your-abtest-server.com/api/internal`

### Authentication

Internal API endpoints require authentication (to be implemented).

### Endpoints

#### Experiment Management

```http
# Create experiment
POST /api/internal/experiments

# Get all experiments
GET /api/internal/experiments

# Get experiment by ID
GET /api/internal/experiments/{id}

# Update experiment
PUT /api/internal/experiments/{id}

# Delete experiment
DELETE /api/internal/experiments/{id}

# Get experiment statistics
GET /api/internal/experiments/{id}/stats
```

#### SDK Internal Endpoints

```http
# Get user variation (used by SDK)
GET /api/internal/experiments/{experimentId}/variation

# Persist user variation (used by SDK)
POST /api/internal/experiments/{experimentId}/variation
```

---

## 🚀 SDK Usage Examples

### Basic Usage

```typescript
import { useExperiment, ABTestConfig } from "@abtest/sdk";

const config: ABTestConfig = {
  apiUrl: "https://your-abtest-server.com/api",
  userId: "user-123",
  debug: false,
};

const MyComponent = () => {
  const { variation, trackSuccess } = useExperiment(
    {
      id: "button-color-test",
      name: "Button Color Test",
      variations: [
        { name: "blue", weight: 0.5, isBaseline: true },
        { name: "red", weight: 0.5 },
      ],
    },
    config
  );

  return (
    <button
      className={variation === "blue" ? "btn-blue" : "btn-red"}
      onClick={() => trackSuccess({ action: "click" })}
    >
      Click Me
    </button>
  );
};
```

### Advanced Usage with Direct API

```typescript
import { ABTestAPI } from "@abtest/sdk";

const api = new ABTestAPI({
  apiUrl: "https://your-abtest-server.com/api",
  userId: "user-123",
});

// Get experiment details
const experiment = await api.getExperiment("experiment-123");

// Track success event
await api.trackSuccessEvent("experiment-123", {
  action: "purchase",
  value: 99.99,
});
```

---

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)

```bash
NEXT_PUBLIC_API_URL=https://your-abtest-server.com/api
```

#### Backend (.env)

```bash
# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abtest
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Rate Limiting

- **Public API**: 100 requests per 15 minutes per IP
- **Internal API**: 1000 requests per 15 minutes per authenticated user

---

## 🛡️ Security

- **CORS**: Configured for your domain
- **Rate Limiting**: Applied to all endpoints
- **Input Validation**: All inputs are validated
- **Error Handling**: Secure error messages (no sensitive data exposed)

---

## 📝 Error Codes

| Code | Description                                      |
| ---- | ------------------------------------------------ |
| 400  | Bad Request - Invalid input                      |
| 401  | Unauthorized - Missing or invalid authentication |
| 404  | Not Found - Experiment not found                 |
| 429  | Too Many Requests - Rate limit exceeded          |
| 500  | Internal Server Error - Server error             |

---

## 🔍 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Available via dashboard
- **Logs**: Structured logging with Winston
- **Alerts**: Configure alerts for critical errors
