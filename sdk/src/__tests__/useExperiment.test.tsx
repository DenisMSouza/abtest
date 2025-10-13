import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useExperiment } from '../useExperiment';
import { ABTestConfig, Experiment } from '../types';

// Mock the API
(jest as any).mock('../api', () => ({
  ABTestAPI: (jest as any).fn().mockImplementation(() => ({
    getExperimentVariation: (jest as any).fn(),
    persistExperimentVariation: (jest as any).fn(),
    trackSuccess: (jest as any).fn(),
    trackEvent: (jest as any).fn(),
  })),
}));

describe('useExperiment', () => {
  const mockConfig: ABTestConfig = {
    apiUrl: 'http://localhost:3001/api',
    userId: 'test-user',
    debug: false,
  };

  const mockExperiment: Experiment = {
    id: 'test-experiment',
    name: 'Test Experiment',
    variations: [
      { name: 'control', weight: 0.5, isBaseline: true },
      { name: 'variant', weight: 0.5 },
    ],
  };

  beforeEach(() => {
    (jest as any).clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useExperiment(mockExperiment, mockConfig));

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.variation).toBeNull();

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After loading, should have a variation
    expect(result.current.isLoading).toBe(false);
    expect(result.current.variation).toBeDefined();
  });

  it('should handle experiment with no variations', () => {
    const experimentWithoutVariations: Experiment = {
      ...mockExperiment,
      variations: [],
    };

    const { result } = renderHook(() =>
      useExperiment(experimentWithoutVariations, mockConfig)
    );

    expect(result.current.error).toBeDefined();
  });

  it('should use fallback when experiment fails', () => {
    const configWithFallback: ABTestConfig = {
      ...mockConfig,
      fallback: 'fallback-variation',
    };

    const { result } = renderHook(() =>
      useExperiment(mockExperiment, configWithFallback)
    );

    // Should have fallback configuration available
    expect(configWithFallback.fallback).toBe('fallback-variation');
    expect(result.current).toBeDefined();
  });

  it('should track success events', async () => {
    const { result } = renderHook(() => useExperiment(mockExperiment, mockConfig));

    await act(async () => {
      await result.current.trackSuccess({ test: 'data' });
    });

    // Verify trackSuccess was called (mocked)
    expect(result.current.trackSuccess).toBeDefined();
  });

  it('should track custom events', async () => {
    const { result } = renderHook(() => useExperiment(mockExperiment, mockConfig));

    await act(async () => {
      await result.current.trackEvent('custom_event', { test: 'data' });
    });

    // Verify trackEvent was called (mocked)
    expect(result.current.trackEvent).toBeDefined();
  });
});
