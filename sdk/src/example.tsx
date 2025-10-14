import React from 'react';
import { useExperiment, ABTestConfig } from './index';

// Example configuration
const config: ABTestConfig = {
  apiUrl: 'http://localhost:3001/api',
  userId: 'user-123',
  environment: 'development',
  debug: true,
  fallback: 'control',
  timeout: 5000,
};

// Example component
export const ButtonExperiment: React.FC = () => {
  // Simply provide the experiment ID - the hook will fetch experiment details automatically
  const {
    variation,
    experiment,
    isLoading,
    error,
    source,
    isActive,
    trackSuccess
  } = useExperiment('button-color-test', config); // Experiment ID from your dashboard

  const handleClick = async () => {
    // Track success event
    await trackSuccess({
      event: 'button_click',
      value: 1,
      buttonColor: variation,
      timestamp: new Date().toISOString()
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
      <h3>{experiment?.name || 'Button Color Experiment'}</h3>
      <p>Experiment ID: {experiment?.id}</p>
      <p>Description: {experiment?.description}</p>
      <p>Variation: {variation}</p>
      <p>Source: {source}</p>
      <p>Active: {isActive ? 'Yes' : 'No'}</p>
      <button style={buttonStyle} onClick={handleClick}>
        Click me! ({variation})
      </button>
    </div>
  );
};

// Example with multiple experiments
export const MultiExperimentExample: React.FC = () => {
  const { variation: headerVariation } = useExperiment('header-test', config);

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
