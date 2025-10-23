# A/B Testing SDK

A production-ready React hook for A/B testing with your self-hosted A/B testing platform.

## Features

- 🚀 **Production Ready**: Built for real-world applications with error handling and fallbacks
- 🎯 **Self-Hosted**: Works with your own A/B testing server
- 📊 **Event Tracking**: Built-in success and custom event tracking
- 🔄 **Offline Support**: Graceful degradation when server is unavailable
- 🎲 **Weighted Variations**: Support for complex traffic allocation
- 📱 **React Native Compatible**: Works in both web and mobile environments
- 🛡️ **TypeScript**: Full type safety and IntelliSense support
- 🐛 **Debug Mode**: Comprehensive logging for development
- 🔐 **API Key Authentication**: Secure communication with your backend
- 🌐 **Environment Aware**: Works seamlessly in SSR and client-side environments

## Installation

```bash
npm install @denismartins/abtest-sdk
```

## Quick Start

### 1. Install and Configure

```typescript
import { useExperiment } from "@denismartins/abtest-sdk";

const { variation, isLoading, trackSuccess } = useExperiment({
  experimentId: "your-experiment-id", // From your dashboard
  userId: "user-123", // Optional: for user-based experiments
  apiKey: "your-api-key", // Required: from dashboard settings
  apiUrl: "http://localhost:3001/api", // Your backend URL
  debug: false, // Optional: enable debug logging
  timeout: 5000, // Optional: API timeout in ms
});
```

### 2. Use the Hook

```typescript
import React from "react";
import { useExperiment } from "@denismartins/abtest-sdk";

const ButtonExperiment = () => {
  const { variation, isLoading, trackSuccess } = useExperiment({
    experimentId: "button-color-test", // Experiment ID from your dashboard
    userId: "user-123",
    apiKey: "your-api-key", // Get this from your dashboard settings
    apiUrl: "http://localhost:3001/api",
  });

  if (isLoading) return <div>Loading...</div>;

  const handleClick = () => {
    // Track success when user clicks the button
    trackSuccess();
  };

  return (
    <button
      onClick={handleClick}
      style={{ backgroundColor: variation === "blue" ? "#007bff" : "#dc3545" }}
    >
      Click me!
    </button>
  );
};
```

## API Reference

### `useExperiment(config)`

The main hook for A/B testing.

#### Parameters

- **config** (`ABTestConfig`): SDK configuration object

#### Returns

- **variation** (`string | null`): Current variation name
- **isLoading** (`boolean`): Whether the experiment is loading
- **error** (`string | null`): Any error that occurred
- **trackSuccess** (`function`): Track a success event

### `ABTestConfig`

Configuration object for the SDK.

```typescript
interface ABTestConfig {
  experimentId: string; // Required: Experiment ID from your dashboard
  apiKey: string; // Required: API key from dashboard settings
  apiUrl: string; // Required: Your backend API URL
  userId?: string; // Optional: User ID for user-based experiments
  sessionId?: string; // Optional: Session ID for session-based experiments
  debug?: boolean; // Optional: Enable debug logging
  timeout?: number; // Optional: API timeout in ms (default: 5000)
  customHeaders?: Record<string, string>; // Optional: Custom headers
  enableRequestSigning?: boolean; // Optional: Enable request signing
}
```

## Environment Variables

Set these in your `.env` file:

```env
NEXT_PUBLIC_ABTEST_API_KEY=your-api-key-here
NEXT_PUBLIC_ABTEST_API_URL=http://localhost:3001/api
```

Then use in your component:

```typescript
const { variation } = useExperiment({
  experimentId: "exp-123",
  userId: "user-123",
  apiKey: process.env.NEXT_PUBLIC_ABTEST_API_KEY,
  apiUrl: process.env.NEXT_PUBLIC_ABTEST_API_URL,
});
```

## Event Tracking

### Track Success Events

```typescript
const { trackSuccess } = useExperiment({
  experimentId: "button-test",
  apiKey: "your-key",
  apiUrl: "http://localhost:3001/api",
});

// Track a success event
trackSuccess();
```

### Track Custom Events

```typescript
const { trackSuccess } = useExperiment({
  experimentId: "button-test",
  apiKey: "your-key",
  apiUrl: "http://localhost:3001/api",
});

// Track a custom event as a success event
trackSuccess({
  event: "page_view",
  value: 1,
  page: "/checkout",
  timeOnPage: 120,
});
```

## Advanced Usage

### Environment-Specific Configuration

```typescript
const { variation } = useExperiment({
  experimentId: "button-test",
  apiKey: process.env.NEXT_PUBLIC_ABTEST_API_KEY!,
  apiUrl: process.env.NEXT_PUBLIC_ABTEST_API_URL!,
  debug: process.env.NODE_ENV === "development",
});
```

### Error Handling

```typescript
const { variation, error, isLoading } = useExperiment({
  experimentId: "button-test",
  apiKey: "your-key",
  apiUrl: "http://localhost:3001/api",
});

if (error) {
  // Handle error - show fallback UI
  return <div>Error: {error}</div>;
}

if (isLoading) {
  // Show loading state
  return <div>Loading...</div>;
}

// Use variation
return <div>Variation: {variation}</div>;
```

## Security Features

- **API Key Authentication**: All requests require valid API keys
- **Request Signing**: Optional HMAC-SHA256 request signing for enhanced security
- **Custom Headers**: Support for additional security headers
- **Environment Detection**: Automatically handles SSR and client-side environments

## Self-Hosted Setup

This SDK works with the self-hosted A/B testing platform. To set up your own server:

1. **Deploy the Backend**: Follow the setup guide in the main repository
2. **Generate API Keys**: Use the dashboard at `/settings` to create API keys
3. **Configure SDK**: Point the SDK to your server's API endpoint with your API key

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## React Native Support

The SDK works in React Native environments. Make sure to:

1. Install the required dependencies
2. Configure the API URL for your mobile app
3. Handle network connectivity gracefully

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- 📧 Email: denisconchas@gmail.com
- 🐛 Issues: GitHub Issues
