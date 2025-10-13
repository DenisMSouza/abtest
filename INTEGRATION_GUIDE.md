# A/B Testing SDK - Integration Guide

This guide shows you how to integrate the A/B testing SDK into your React applications.

## 📦 Installation

```bash
npm install @abtest/sdk
```

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import React from "react";
import { useExperiment, ABTestConfig } from "@abtest/sdk";

// Configure the SDK
const config: ABTestConfig = {
  apiUrl: "http://localhost:3001/api", // Your self-hosted API
  userId: "user-123", // Optional: for user-based experiments
  debug: true, // Enable debug logging
  fallback: "control", // Fallback variation
};

// Define your experiment
const experiment = {
  id: "button-color-test",
  name: "Button Color Test",
  variations: [
    { name: "blue", weight: 0.5, isBaseline: true },
    { name: "red", weight: 0.5 },
  ],
};

// Use the hook
const ButtonExperiment = () => {
  const { variation, isLoading, error, trackSuccess } = useExperiment(
    experiment,
    config
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleClick = () => {
    trackSuccess({ buttonColor: variation });
  };

  return (
    <button
      onClick={handleClick}
      style={{ backgroundColor: variation === "blue" ? "#007bff" : "#dc3545" }}
    >
      Click me! ({variation})
    </button>
  );
};
```

## 🎯 Common Use Cases

### 1. Button Color Testing

```typescript
const ButtonColorTest = () => {
  const experiment = {
    id: "cta-button-color",
    name: "CTA Button Color Test",
    variations: [
      { name: "green", weight: 0.5, isBaseline: true },
      { name: "orange", weight: 0.5 },
    ],
  };

  const { variation, trackSuccess } = useExperiment(experiment, config);

  const buttonStyles = {
    green: { backgroundColor: "#28a745", color: "white" },
    orange: { backgroundColor: "#fd7e14", color: "white" },
  };

  return (
    <button
      style={buttonStyles[variation as keyof typeof buttonStyles]}
      onClick={() => trackSuccess({ variation, action: "button_click" })}
    >
      Get Started
    </button>
  );
};
```

### 2. Headline Testing

```typescript
const HeadlineTest = () => {
  const experiment = {
    id: "homepage-headline",
    name: "Homepage Headline Test",
    variations: [
      { name: "original", weight: 0.5, isBaseline: true },
      { name: "new", weight: 0.5 },
    ],
  };

  const { variation, trackSuccess } = useExperiment(experiment, config);

  const headlines = {
    original: "Welcome to Our Platform",
    new: "Transform Your Business Today",
  };

  return (
    <div>
      <h1>{headlines[variation as keyof typeof headlines]}</h1>
      <button
        onClick={() => trackSuccess({ variation, action: "headline_view" })}
      >
        Learn More
      </button>
    </div>
  );
};
```

### 3. Pricing Page Testing

```typescript
const PricingTest = () => {
  const experiment = {
    id: "pricing-layout",
    name: "Pricing Layout Test",
    variations: [
      { name: "grid", weight: 0.5, isBaseline: true },
      { name: "list", weight: 0.5 },
    ],
  };

  const { variation, trackSuccess } = useExperiment(experiment, config);

  const renderPricing = () => {
    if (variation === "grid") {
      return (
        <div className="grid grid-cols-3 gap-4">
          <PricingCard plan="Basic" price="$9" />
          <PricingCard plan="Pro" price="$29" />
          <PricingCard plan="Enterprise" price="$99" />
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <PricingCard plan="Basic" price="$9" />
          <PricingCard plan="Pro" price="$29" />
          <PricingCard plan="Enterprise" price="$99" />
        </div>
      );
    }
  };

  return (
    <div>
      <h2>Choose Your Plan</h2>
      {renderPricing()}
      <button
        onClick={() => trackSuccess({ variation, action: "pricing_view" })}
      >
        View Plans
      </button>
    </div>
  );
};
```

### 4. Form Testing

```typescript
const FormTest = () => {
  const experiment = {
    id: "signup-form",
    name: "Signup Form Test",
    variations: [
      { name: "single-step", weight: 0.5, isBaseline: true },
      { name: "multi-step", weight: 0.5 },
    ],
  };

  const { variation, trackSuccess, trackEvent } = useExperiment(
    experiment,
    config
  );

  const handleFormSubmit = async (formData: any) => {
    // Track form submission
    await trackSuccess({
      variation,
      action: "form_submit",
      formData: { fields: Object.keys(formData).length },
    });
  };

  const handleFieldFocus = (fieldName: string) => {
    trackEvent("field_focus", { variation, fieldName });
  };

  if (variation === "multi-step") {
    return (
      <MultiStepForm
        onSubmit={handleFormSubmit}
        onFieldFocus={handleFieldFocus}
      />
    );
  } else {
    return (
      <SingleStepForm
        onSubmit={handleFormSubmit}
        onFieldFocus={handleFieldFocus}
      />
    );
  }
};
```

## 🔧 Advanced Configuration

### Environment-Based Configuration

```typescript
// config/abtest.ts
import { ABTestConfig } from "@abtest/sdk";

const getConfig = (): ABTestConfig => {
  const baseConfig = {
    apiUrl: process.env.REACT_APP_ABTEST_API_URL || "http://localhost:3001/api",
    environment: process.env.NODE_ENV as
      | "development"
      | "staging"
      | "production",
    debug: process.env.NODE_ENV === "development",
    fallback: "control",
    timeout: 5000,
  };

  // Add user context if available
  const user = getCurrentUser(); // Your user management function
  if (user) {
    return {
      ...baseConfig,
      userId: user.id,
      sessionId: user.sessionId,
    };
  }

  return baseConfig;
};

export const abtestConfig = getConfig();
```

### Custom Random Function for Testing

```typescript
// For deterministic testing
const testConfig: ABTestConfig = {
  ...abtestConfig,
  randomFn: () => 0.3, // Always returns 30% for testing
};

// For A/B testing the A/B testing itself
const metaExperiment = {
  id: "abtest-sdk-test",
  name: "A/B Testing SDK Test",
  variations: [
    { name: "current", weight: 0.5, isBaseline: true },
    { name: "new", weight: 0.5 },
  ],
};

const { variation: sdkVariation } = useExperiment(metaExperiment, abtestConfig);
const configToUse = sdkVariation === "new" ? testConfig : abtestConfig;
```

## 📊 Event Tracking

### Success Events

```typescript
const EcommerceTest = () => {
  const { variation, trackSuccess } = useExperiment(experiment, config);

  const handlePurchase = async (orderData: any) => {
    await trackSuccess({
      variation,
      action: "purchase",
      value: orderData.total,
      currency: orderData.currency,
      items: orderData.items.length,
    });
  };

  return (
    <div>
      <ProductList variation={variation} />
      <button
        onClick={() =>
          handlePurchase({ total: 99.99, currency: "USD", items: [1, 2, 3] })
        }
      >
        Buy Now
      </button>
    </div>
  );
};
```

### Custom Events

```typescript
const AnalyticsTest = () => {
  const { variation, trackEvent } = useExperiment(experiment, config);

  const handlePageView = () => {
    trackEvent("page_view", {
      variation,
      page: window.location.pathname,
      referrer: document.referrer,
    });
  };

  const handleScroll = (scrollPercent: number) => {
    trackEvent("scroll", {
      variation,
      scrollPercent,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    handlePageView();

    const handleScrollEvent = () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100;
      handleScroll(scrollPercent);
    };

    window.addEventListener("scroll", handleScrollEvent);
    return () => window.removeEventListener("scroll", handleScrollEvent);
  }, [variation]);

  return <div>Your content here</div>;
};
```

## 🎨 Styling Variations

### CSS Classes

```typescript
const StyledTest = () => {
  const { variation } = useExperiment(experiment, config);

  return (
    <div className={`hero-section hero-${variation}`}>
      <h1>Welcome</h1>
      <p>Content here</p>
    </div>
  );
};

// CSS
.hero-original {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-new {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

### Inline Styles

```typescript
const InlineStyleTest = () => {
  const { variation } = useExperiment(experiment, config);

  const styles = {
    original: {
      backgroundColor: "#f8f9fa",
      padding: "2rem",
      borderRadius: "8px",
    },
    new: {
      backgroundColor: "#e3f2fd",
      padding: "3rem",
      borderRadius: "16px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  };

  return (
    <div style={styles[variation as keyof typeof styles]}>
      <h2>Featured Content</h2>
      <p>This content changes based on the variation</p>
    </div>
  );
};
```

## 🔄 Multiple Experiments

### Independent Experiments

```typescript
const MultiExperimentPage = () => {
  // Header experiment
  const headerExperiment = {
    id: "header-style",
    name: "Header Style Test",
    variations: [
      { name: "minimal", weight: 0.5, isBaseline: true },
      { name: "detailed", weight: 0.5 },
    ],
  };

  // CTA experiment
  const ctaExperiment = {
    id: "cta-text",
    name: "CTA Text Test",
    variations: [
      { name: "get-started", weight: 0.5, isBaseline: true },
      { name: "try-free", weight: 0.5 },
    ],
  };

  const { variation: headerVariation } = useExperiment(
    headerExperiment,
    config
  );
  const { variation: ctaVariation } = useExperiment(ctaExperiment, config);

  return (
    <div>
      <Header style={headerVariation} />
      <MainContent />
      <CTA text={ctaVariation} />
    </div>
  );
};
```

### Dependent Experiments

```typescript
const DependentExperiments = () => {
  const { variation: layoutVariation } = useExperiment(
    layoutExperiment,
    config
  );

  // Only run CTA experiment if layout is 'new'
  const ctaExperiment =
    layoutVariation === "new"
      ? {
          id: "cta-new-layout",
          name: "CTA for New Layout",
          variations: [
            { name: "button", weight: 0.5, isBaseline: true },
            { name: "link", weight: 0.5 },
          ],
        }
      : null;

  const { variation: ctaVariation } = useExperiment(ctaExperiment, config);

  return (
    <div className={`layout-${layoutVariation}`}>
      <Content />
      {ctaExperiment && <CTA type={ctaVariation} />}
    </div>
  );
};
```

## 🧪 Testing

### Unit Testing

```typescript
// __tests__/ButtonExperiment.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { useExperiment } from "@abtest/sdk";
import ButtonExperiment from "../ButtonExperiment";

// Mock the hook
jest.mock("@abtest/sdk");
const mockUseExperiment = useExperiment as jest.MockedFunction<
  typeof useExperiment
>;

test("renders button with correct variation", () => {
  mockUseExperiment.mockReturnValue({
    variation: "blue",
    isLoading: false,
    error: null,
    source: "generated",
    isActive: true,
    trackSuccess: jest.fn(),
    trackEvent: jest.fn(),
  });

  render(<ButtonExperiment />);

  const button = screen.getByRole("button");
  expect(button).toHaveStyle("background-color: #007bff");
});

test("tracks success on button click", () => {
  const mockTrackSuccess = jest.fn();
  mockUseExperiment.mockReturnValue({
    variation: "blue",
    isLoading: false,
    error: null,
    source: "generated",
    isActive: true,
    trackSuccess: mockTrackSuccess,
    trackEvent: jest.fn(),
  });

  render(<ButtonExperiment />);

  fireEvent.click(screen.getByRole("button"));
  expect(mockTrackSuccess).toHaveBeenCalledWith({ buttonColor: "blue" });
});
```

### Integration Testing

```typescript
// __tests__/integration/abtest.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "../../App";

const server = setupServer(
  rest.get(
    "http://localhost:3001/api/experiments/button-test/variation",
    (req, res, ctx) => {
      return res(
        ctx.json([
          {
            variation: "blue",
            experiment: "button-test",
            timestamp: new Date().toISOString(),
          },
        ])
      );
    }
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("loads experiment variation from API", async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("Loading...")).not.toBeInTheDocument();
  });

  const button = screen.getByRole("button");
  expect(button).toHaveStyle("background-color: #007bff");
});
```

## 🚀 Performance Optimization

### Lazy Loading Experiments

```typescript
const LazyExperiment = React.lazy(() => import("./ExperimentComponent"));

const App = () => {
  const [showExperiment, setShowExperiment] = useState(false);

  return (
    <div>
      <button onClick={() => setShowExperiment(true)}>Show Experiment</button>

      {showExperiment && (
        <Suspense fallback={<div>Loading experiment...</div>}>
          <LazyExperiment />
        </Suspense>
      )}
    </div>
  );
};
```

### Memoization

```typescript
const OptimizedExperiment = React.memo(() => {
  const { variation, trackSuccess } = useExperiment(experiment, config);

  const handleClick = useCallback(() => {
    trackSuccess({ variation });
  }, [variation, trackSuccess]);

  return <button onClick={handleClick}>Click me ({variation})</button>;
});
```

## 🔍 Debugging

### Debug Mode

```typescript
const config: ABTestConfig = {
  apiUrl: "http://localhost:3001/api",
  debug: true, // Enable debug logging
};

// This will log all SDK operations to the console
```

### Error Handling

```typescript
const RobustExperiment = () => {
  const { variation, isLoading, error, trackSuccess } = useExperiment(
    experiment,
    config
  );

  if (error) {
    console.error("A/B Test error:", error);
    // Fallback to default variation
    return <DefaultComponent />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <ExperimentComponent variation={variation} onSuccess={trackSuccess} />;
};
```

## 📱 React Native

The SDK works in React Native environments:

```typescript
// React Native example
import { useExperiment } from "@abtest/sdk";

const MobileExperiment = () => {
  const config: ABTestConfig = {
    apiUrl: "https://your-api.com/api",
    userId: "mobile-user-123",
    debug: __DEV__, // Enable debug in development
  };

  const { variation, trackSuccess } = useExperiment(experiment, config);

  return (
    <TouchableOpacity
      onPress={() => trackSuccess({ variation, platform: "mobile" })}
      style={styles[variation]}
    >
      <Text>Mobile Button ({variation})</Text>
    </TouchableOpacity>
  );
};
```

## 🎯 Best Practices

1. **Always provide fallbacks**: Use the `fallback` config option
2. **Test your experiments**: Use deterministic random functions in tests
3. **Monitor performance**: Track experiment impact on page load times
4. **Document experiments**: Keep clear records of what each experiment tests
5. **Gradual rollout**: Start with small traffic allocations
6. **Statistical significance**: Wait for enough data before drawing conclusions
7. **Clean up**: Remove old experiments and unused code

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**

   - Ensure the experiment object is properly defined
   - Check that all required fields are present

2. **API connection errors**

   - Verify the `apiUrl` is correct
   - Check network connectivity
   - Ensure CORS is properly configured

3. **Variation not changing**

   - Check if the experiment is active
   - Verify variation weights sum to 1.0
   - Clear localStorage and cookies

4. **Events not tracking**
   - Check browser console for errors
   - Verify API endpoint is accessible
   - Ensure user is assigned to a variation

### Getting Help

- Check the [SDK documentation](./sdk/README.md)
- Review the [deployment guide](./DEPLOYMENT.md)
- Create an issue on GitHub
- Check the browser console for error messages
