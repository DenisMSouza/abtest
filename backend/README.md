# A/B Testing Backend

A Node.js backend API for managing A/B tests and experiments.

## Features

- Create and manage experiments
- Define variations with weights
- Track user variations
- Analytics and statistics
- SQLite database (easily switchable to PostgreSQL/MySQL)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

## API Endpoints

### Experiments

- `POST /api/experiments` - Create new experiment
- `GET /api/experiments` - Get all experiments
- `GET /api/experiments/:id` - Get experiment by ID
- `PUT /api/experiments/:id` - Update experiment
- `DELETE /api/experiments/:id` - Delete experiment

### Variations

- `GET /api/experiments/:experimentId/variation` - Get user's variation
- `POST /api/experiments/:experimentId/variation` - Persist user variation

### Analytics

- `GET /api/experiments/:id/stats` - Get experiment statistics

## Database Schema

- **Experiments**: Store experiment metadata
- **Variations**: Store experiment variations with weights
- **UserVariations**: Track which variation each user gets

## Example Usage

Create an experiment:

```bash
curl -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Button Color Test",
    "description": "Test different button colors",
    "variations": [
      {"name": "baseline", "weight": 0.5, "isBaseline": true},
      {"name": "red", "weight": 0.5, "isBaseline": false}
    ]
  }'
```
