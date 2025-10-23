# 🧪 A/B Testing Platform

[![npm version](https://img.shields.io/npm/v/@denismartins/abtest-sdk.svg)](https://www.npmjs.com/package/@denismartins/abtest-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

> **A complete, self-hosted A/B testing platform with React SDK, dashboard, and statistical analysis**

A powerful, open-source A/B testing solution that gives you full control over your experiments. Built with React, TypeScript, and modern web technologies.

![A/B Testing Dashboard](./public/Screenshot%202025-10-23%20at%2016.36.23.png)

_Beautiful, modern dashboard for managing your experiments_

## 🎯 What You Get

- **📊 Beautiful Dashboard** - Create and manage experiments with an intuitive interface
- **⚡ React SDK** - Easy-to-use hook for frontend integration
- **📈 Statistical Analysis** - Built-in significance testing and performance metrics
- **🔒 Self-Hosted** - Complete control over your data and infrastructure
- **🚀 Production Ready** - Docker support, API authentication, and more

## 📸 Dashboard Preview

![A/B Testing Dashboard](https://via.placeholder.com/800x500/1e40af/ffffff?text=A%2FB+Testing+Dashboard)

_Beautiful, modern dashboard for managing your experiments_

## 🚀 Quick Start

### 1. Install the SDK

```bash
npm install @denismartins/abtest-sdk
```

### 2. Clone the Repository

```bash
git clone git@github.com:DenisMSouza/abtest.git
cd abtest
```

### 3. Use in Your React App

```tsx
import { useExperiment } from "@denismartins/abtest-sdk";

function MyComponent() {
  const { variation, trackSuccess } = useExperiment({
    experimentId: "button-color-test",
    userId: "user-123",
    apiKey: "your-api-key",
    apiUrl: "http://localhost:3001/api",
  });

  return (
    <div>
      {variation === "red" ? (
        <button style={{ backgroundColor: "red" }}>Red Button</button>
      ) : (
        <button>Default Button</button>
      )}

      <button onClick={() => trackSuccess()}>Track Conversion</button>
    </div>
  );
}
```

### 3. Set Up the Backend

```bash
# Clone the repository
git clone https://github.com/yourusername/abtest.git
cd abtest

# Start with Docker
docker-compose up -d

# Or run locally
cd backend
npm install
npm start
```

## ✨ Key Features

### 🎨 **Modern Dashboard**

- Create and manage experiments visually
- Real-time performance metrics
- Statistical significance testing
- Experiment ID copying for easy integration

### ⚡ **React SDK**

- Simple `useExperiment` hook
- TypeScript support
- SSR-compatible
- Automatic user assignment
- Conversion tracking

### 📊 **Statistical Analysis**

- P-value calculations
- Confidence intervals
- Relative uplift metrics
- Sample size recommendations

### 🔒 **Enterprise Security**

- API key authentication
- Request signing
- Self-hosted deployment
- Database-driven configuration

## 📦 NPM Package

The React SDK is available on npm:

```bash
npm install @denismartins/abtest-sdk
```

**Package Details:**

- **Version:** Latest stable release
- **Size:** ~15KB gzipped
- **TypeScript:** Full type definitions included
- **React:** 16.8+ (hooks support)
- **Browser:** Modern browsers (ES2018+)

## 🛠️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Dashboard     │    │   Backend API   │
│                 │    │                 │    │                 │
│  useExperiment  │◄──►│  Create Tests   │◄──►│  Express.js     │
│  Hook           │    │  View Results   │    │  SQLite/MySQL   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📚 Documentation

- **[Hook Usage Guide](HOOK_USAGE.md)** - Complete frontend integration guide
- **[Setup Instructions](SETUP.md)** - Backend and dashboard setup
- **[API Documentation](backend/README.md)** - Backend API reference
- **[SDK Documentation](sdk/README.md)** - React SDK reference

## 🔗 Repository Information

- **GitHub Repository:** [DenisMSouza/abtest](https://github.com/DenisMSouza/abtest)
- **NPM Package:** [@denismartins/abtest-sdk](https://www.npmjs.com/package/@denismartins/abtest-sdk)
- **Issues & Discussions:** [GitHub Issues](https://github.com/DenisMSouza/abtest/issues)

## 🎯 Use Cases

- **E-commerce** - Test checkout flows, product pages, pricing
- **SaaS** - Optimize signup flows, feature adoption, onboarding
- **Content** - A/B test headlines, CTAs, layouts
- **Mobile Apps** - React Native integration support
- **Marketing** - Landing pages, email campaigns, ads

## 🔧 Configuration

### Environment Variables

```bash
# Backend
PORT=3001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_ABTEST_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ABTEST_API_KEY=your-api-key
```

### Docker Deployment

```yaml
version: "3.8"
services:
  abtest-backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production

  abtest-frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_ABTEST_API_URL=http://abtest-backend:3001/api
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/abtest.git
cd abtest

# Install dependencies
npm install

# Start development servers
npm run dev:backend  # Backend on :3001
npm run dev:frontend # Frontend on :3000
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/DenisMSouza/abtest/issues)
- **Discussions:** [GitHub Discussions](https://github.com/DenisMSouza/abtest/discussions)
- **Documentation:** [Full Documentation](https://github.com/DenisMSouza/abtest/wiki)

---

**Made with ❤️ for the developer community**

_Star this repository if you find it useful! ⭐_

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database by [Sequelize](https://sequelize.org/)
