# A/B Testing Platform

A full-stack A/B testing platform built with Next.js and Node.js, featuring a React hook for easy experiment management and a dashboard for analytics.

## 🚀 Features

- **Frontend Hook**: Easy-to-use React hook for A/B testing
- **Dashboard**: Create and manage experiments with a beautiful UI
- **Real-time Analytics**: Track user variations and conversion rates
- **Database**: SQLite database with Sequelize ORM (easily switchable to PostgreSQL/MySQL)
- **TypeScript**: Full type safety across the stack
- **Modern UI**: Built with Tailwind CSS

## 🏗️ Architecture

### Frontend (Next.js)

- **React Hook**: `useExperiments` for managing A/B tests
- **Dashboard**: Experiment creation and management
- **API Integration**: Seamless connection to backend services

### Backend (Node.js + Express)

- **RESTful API**: Full CRUD operations for experiments
- **Database Models**: Experiments, Variations, UserVariations
- **Analytics**: Real-time statistics and user tracking

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The backend will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to the root directory:

```bash
cd ..
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Usage

### Using the A/B Testing Hook

```tsx
import { useExperiments } from "./hooks/useExperiment";

function MyComponent() {
  const experiment = {
    id: "button-color-test",
    variations: [
      { name: "baseline", weight: 0.5 },
      { name: "red", weight: 0.5 },
    ],
  };

  const { variation, isLoading, error } = useExperiments(experiment);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <button className={variation === "red" ? "bg-red-500" : "bg-blue-500"}>
      {variation === "red" ? "Red Button" : "Blue Button"}
    </button>
  );
}
```

### Creating Experiments via Dashboard

1. Go to `http://localhost:3000/dashboard`
2. Click "New Experiment"
3. Fill in experiment details:
   - Name and description
   - Variations with weights
   - Mark one as baseline
4. Click "Create"

### API Endpoints

- `GET /api/experiments` - List all experiments
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments/:id` - Get experiment details
- `GET /api/experiments/:id/stats` - Get experiment statistics
- `GET /api/experiments/:experimentId/variation` - Get user's variation
- `POST /api/experiments/:experimentId/variation` - Persist user variation

## 🗄️ Database Schema

### Experiments

- `id` (UUID, Primary Key)
- `name` (String)
- `description` (Text)
- `version` (String)
- `startDate` (Date)
- `endDate` (Date)
- `isActive` (Boolean)

### Variations

- `id` (UUID, Primary Key)
- `experimentId` (UUID, Foreign Key)
- `name` (String)
- `weight` (Float)
- `isBaseline` (Boolean)

### UserVariations

- `id` (UUID, Primary Key)
- `experimentId` (UUID, Foreign Key)
- `variationId` (UUID, Foreign Key)
- `userId` (String, Optional)
- `sessionId` (String, Optional)
- `timestamp` (Date)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
NODE_ENV=development
PORT=3001
DATABASE_URL=sqlite:./database.sqlite
```

### Frontend Environment

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚀 Deployment

### Backend Deployment

1. Build the backend:

```bash
cd backend
npm run build
```

2. Start production server:

```bash
npm start
```

### Frontend Deployment

1. Build the frontend:

```bash
npm run build
```

2. Start production server:

```bash
npm start
```

## 📈 Analytics

The platform provides real-time analytics including:

- Total users per experiment
- Variation distribution
- Conversion rates
- User behavior tracking

## 🔒 Security

- Input validation and sanitization
- SQL injection protection via Sequelize ORM
- CORS configuration
- Environment variable management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
