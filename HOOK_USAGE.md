# A/B Testing Hook Usage

## Quick Start

### 1. Install the SDK

```bash
npm install @denismartins/abtest-sdk
```

### 2. Basic Usage

```tsx
import { useExperiment } from "@denismartins/abtest-sdk";

function MyComponent() {
  const { variation, isLoading, trackSuccess } = useExperiment({
    experimentId: "your-experiment-id",
    userId: "user-123",
    apiKey: "your-api-key",
    apiUrl: "http://localhost:3001/api",
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {variation === "baseline" ? (
        <button>Original Button</button>
      ) : (
        <button style={{ backgroundColor: "red" }}>Red Button</button>
      )}

      <button onClick={() => trackSuccess()}>Track Conversion</button>
    </div>
  );
}
```

## Configuration

### Required Options

- `experimentId`: Your experiment ID from the dashboard
- `userId`: Unique user identifier
- `apiKey`: API key from your dashboard settings
- `apiUrl`: Your backend API URL

### Optional Options

- `sessionId`: Session identifier (auto-generated if not provided)
- `debug`: Enable debug logging
- `timeout`: Request timeout in milliseconds (default: 5000)

## Environment Variables

Set these in your `.env` file:

```env
NEXT_PUBLIC_ABTEST_API_KEY=your-api-key-here
NEXT_PUBLIC_ABTEST_API_URL=http://localhost:3001/api
```

Then use in your component:

```tsx
const { variation } = useExperiment({
  experimentId: "exp-123",
  userId: "user-123",
  apiKey: process.env.NEXT_PUBLIC_ABTEST_API_KEY,
  apiUrl: process.env.NEXT_PUBLIC_ABTEST_API_URL,
});
```

## API Methods

### `useExperiment(config)`

Returns an object with:

- `variation`: Current user's variation (string)
- `isLoading`: Loading state (boolean)
- `error`: Error message if any (string)
- `trackSuccess()`: Function to track conversion events

## Examples

### React Component

```tsx
function NewsletterSignup() {
  const { variation, trackSuccess } = useExperiment({
    experimentId: "newsletter-test",
    userId: "user-123",
    apiKey: "your-key",
    apiUrl: "http://localhost:3001/api",
  });

  return (
    <form onSubmit={() => trackSuccess()}>
      {variation === "simplified" ? (
        <input type="email" placeholder="Email" />
      ) : (
        <div>
          <input type="email" placeholder="Email" />
          <input type="text" placeholder="Name" />
        </div>
      )}
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

### Next.js App Router

```tsx
// app/page.tsx
"use client";
import { useExperiment } from "@denismartins/abtest-sdk";

export default function HomePage() {
  const { variation } = useExperiment({
    experimentId: "homepage-test",
    userId: "user-123",
    apiKey: process.env.NEXT_PUBLIC_ABTEST_API_KEY!,
    apiUrl: process.env.NEXT_PUBLIC_ABTEST_API_URL!,
  });

  return (
    <div>
      {variation === "control" ? (
        <h1>Welcome to our site!</h1>
      ) : (
        <h1>Welcome! Get 20% off today!</h1>
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **"No API key found"**: Make sure you're passing the `apiKey` in your config
2. **401 Unauthorized**: Check your API key is valid in the dashboard
3. **Network errors**: Verify your `apiUrl` is correct and backend is running

### Debug Mode

Enable debug logging to see what's happening:

```tsx
const { variation } = useExperiment({
  experimentId: "test",
  userId: "user-123",
  apiKey: "your-key",
  apiUrl: "http://localhost:3001/api",
  debug: true, // This will log to console
});
```

## Support

- Check your dashboard at `http://localhost:3000/settings` for API keys
- Ensure your backend is running on the correct port
- Verify experiment is active in the dashboard
