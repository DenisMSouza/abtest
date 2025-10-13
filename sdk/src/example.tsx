import React from 'react';
import { useExperiment, ABTestConfig, Experiment } from './index';

// Example configuration
const config: ABTestConfig = {
  apiUrl: 'http://localhost:3001/api',
  userId: 'user-123',
  environment: 'development',
  debug: true,
  fallback: 'control',
  timeout: 5000,
};

// Example experiment
const experiment: Experiment = {
  id: 'button-color-test',
  name: 'Button Color Test',
  variations: [
    { name: 'blue', weight: 0.5, isBaseline: true },
    { name: 'red', weight: 0.5 },
  ],
  description: 'Test different button colors to improve conversion',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
};

// Example component
export const ButtonExperiment: React.FC = () => {
  const {
    variation,
    isLoading,
    error,
    source,
    isActive,
    trackSuccess,
    trackEvent
  } = useExperiment(experiment, config);

  const handleClick = async () => {
    // Track success event
    await trackSuccess({
      buttonColor: variation,
      timestamp: new Date().toISOString()
    });

    // Track custom event
    await trackEvent('button_click', {
      variation,
      source
    });
  };

  if (isLoading) {
    return <div>Loading experiment...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isActive) {
    return <div>Experiment is not active</div>;
  }

  const buttonStyle = {
    backgroundColor: variation === 'blue' ? '#007bff' : '#dc3545',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  return (
    <div>
      <h3>Button Color Experiment</h3>
      <p>Variation: {variation}</p>
      <p>Source: {source}</p>
      <button style={buttonStyle} onClick={handleClick}>
        Click me! ({variation})
      </button>
    </div>
  );
};

// Example with multiple experiments
export const MultiExperimentExample: React.FC = () => {
  const headerExperiment: Experiment = {
    id: 'header-test',
    name: 'Header Test',
    variations: [
      { name: 'original', weight: 0.5, isBaseline: true },
      { name: 'new', weight: 0.5 },
    ],
  };

  const { variation: headerVariation } = useExperiment(headerExperiment, config);

  return (
    <div>
      <header style={{
        backgroundColor: headerVariation === 'new' ? '#f8f9fa' : '#ffffff',
        padding: '20px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h1>My Website</h1>
        <p>Header variation: {headerVariation}</p>
      </header>

      <main style={{ padding: '20px' }}>
        <ButtonExperiment />
      </main>
    </div>
  );
};
