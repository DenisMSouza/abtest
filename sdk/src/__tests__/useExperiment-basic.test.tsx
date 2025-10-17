import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useExperiment } from '../useExperiment';
import { ABTestConfig, Experiment } from '../types';

// Mock the API
(jest as any).mock('../api', () => ({
  ABTestAPI: (jest as any).fn().mockImplementation(() => ({
    getExperiment: (jest as any).fn(),
    getExperimentVariation: (jest as any).fn(),
    persistExperimentVariation: (jest as any).fn(),
    trackSuccess: (jest as any).fn(),
  })),
}));

describe('useExperiment - Basic Functionality', () => {
  const mockExperiment: Experiment = {
    id: 'test-experiment',
    name: 'Test Experiment',
    variations: [
      { name: 'blue', weight: 0.5, isBaseline: true },
      { name: 'red', weight: 0.5, isBaseline: false },
    ],
  };

  beforeEach(() => {
    (jest as any).clearAllMocks();
    localStorage.clear();
  });

  it('should work without userId', async () => {
    const config: ABTestConfig = {
      apiUrl: 'http://localhost:3001/api',
      debug: true,
    };

    const { result } = renderHook(() => useExperiment('test-experiment', config));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have a variation
    expect(result.current.isLoading).toBe(false);
    expect(result.current.variation).toBeDefined();
  });

  it('should work with userId', async () => {
    const config: ABTestConfig = {
      apiUrl: 'http://localhost:3001/api',
      userId: 'user-123',
      debug: true,
    };

    const { result } = renderHook(() => useExperiment('test-experiment', config));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have a variation
    expect(result.current.isLoading).toBe(false);
    expect(result.current.variation).toBeDefined();
  });
});
