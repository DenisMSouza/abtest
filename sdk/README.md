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

## Installation

```bash
npm install @abtest/sdk
```

## Quick Start

### 1. Configure the SDK

```typescript
import { useExperiment, ABTestConfig } from "@abtest/sdk";

const config: ABTestConfig = {
  apiUrl: "http://localhost:3001/api", // Your self-hosted API URL
  userId: "user-123", // Optional: for user-based experiments
  environment: "production", // Optional: development, staging, production
  debug: false, // Optional: enable debug logging
  fallback: "control", // Optional: fallback variation
  timeout: 5000, // Optional: API timeout in ms
};
```

### 2. Use the Hook

```typescript
import React from "react";
import { useExperiment } from "@abtest/sdk";

const ButtonExperiment = () => {
  // Simply provide the experiment ID - the hook will fetch experiment details automatically
  const { variation, isLoading, error, trackSuccess, experiment } =
    useExperiment(
      "button-color-test", // Experiment ID from your dashboard
      config
    );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleClick = () => {
    // Track success when user clicks the button
    trackSuccess({ buttonColor: variation });
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

### `useExperiment(experiment, config)`

The main hook for A/B testing.

#### Parameters

- **experiment** (`Experiment`): The experiment configuration
- **config** (`ABTestConfig`): SDK configuration

#### Returns

- **variation** (`string | null`): Current variation name
- **isLoading** (`boolean`): Whether the experiment is loading
- **error** (`Error | null`): Any error that occurred
- **source** (`string`): Source of the variation (localStorage, cookie, backend, generated, fallback)
- **isActive** (`boolean`): Whether the experiment is active
- **metadata** (`object`): Experiment metadata
- **trackSuccess** (`function`): Track a success event

### `ABTestConfig`

Configuration object for the SDK.

```typescript
interface ABTestConfig {
  apiUrl: string; // Required: Your self-hosted API URL
  userId?: string; // Optional: User ID for user-based experiments
  sessionId?: string; // Optional: Session ID for session-based experiments
  environment?: "development" | "staging" | "production"; // Optional: Environment
  debug?: boolean; // Optional: Enable debug logging
  fallback?: string; // Optional: Fallback variation when experiment fails
  randomFn?: () => number; // Optional: Custom random function for testing
  timeout?: number; // Optional: API timeout in ms (default: 5000)
}
```

### `Experiment`

Experiment configuration object.

```typescript
interface Experiment {
  id: string; // Unique experiment ID
  name: string; // Experiment name
  variations: Variation[]; // Array of variations
  version?: string; // Optional: Experiment version
  description?: string; // Optional: Experiment description
  startDate?: string; // Optional: Start date (ISO string)
  endDate?: string; // Optional: End date (ISO string)
  isActive?: boolean; // Optional: Whether experiment is active
  successMetric?: {
    // Optional: Success metric configuration
    type: "click" | "conversion" | "custom";
    target?: string;
    value?: string;
  };
}
```

### `Variation`

Variation configuration object.

```typescript
interface Variation {
  name: string; // Variation name
  weight: number; // Traffic weight (0-1)
  isBaseline?: boolean; // Whether this is the baseline variation
}
```

## Event Tracking

### Track Success Events

```typescript
const { trackSuccess } = useExperiment(experiment, config);

// Track a success event
await trackSuccess({
  conversionValue: 29.99,
  productId: "product-123",
});
```

### Track Custom Events

```typescript
const { trackSuccess } = useExperiment(experiment, config);

// Track a custom event as a success event
await trackSuccess({
  event: "page_view",
  value: 1,
  page: "/checkout",
  timeOnPage: 120,
});
```

## Advanced Usage

### Custom Random Function

For testing or deterministic behavior:

```typescript
const config: ABTestConfig = {
  apiUrl: "http://localhost:3001/api",
  randomFn: () => 0.3, // Always returns 30% for testing
};
```

### Environment-Specific Configuration

```typescript
const config: ABTestConfig = {
  apiUrl: process.env.REACT_APP_ABTEST_API_URL || "http://localhost:3001/api",
  environment: process.env.NODE_ENV as "development" | "staging" | "production",
  debug: process.env.NODE_ENV === "development",
};
```

### Error Handling

```typescript
const { variation, error, isLoading } = useExperiment(experiment, config);

if (error) {
  // Handle error - show fallback UI
  return <FallbackComponent />;
}

if (isLoading) {
  // Show loading state
  return <LoadingSpinner />;
}

// Use variation
return <ExperimentComponent variation={variation} />;
```

## Self-Hosted Setup

This SDK works with the self-hosted A/B testing platform. To set up your own server:

1. **Deploy the Backend**: Follow the deployment guide in the main repository
2. **Configure API URL**: Point the SDK to your server's API endpoint
3. **Set up Experiments**: Use the dashboard to create and manage experiments

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
