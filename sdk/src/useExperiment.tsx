import { useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import { ABTestConfig, Experiment, ExperimentState, UseExperimentResult, BackendVariation } from './types';
import { ABTestAPI } from './api';
import {
  getCookie,
  setCookie,
  getWeightedVariation,
  getBaselineVariation,
  isExperimentActive,
  getExpId,
  removeExperimentPrefix,
  debugLog,
  errorLog,
} from './utils';

type ExperimentAction =
  | {
    type: 'SET_VARIATION';
    payload: {
      variation: string;
      source: ExperimentState['source'];
      metadata?: ExperimentState['metadata'];
    };
  }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_EXPERIMENT'; payload: Experiment }
  | { type: 'RESET' };

const experimentReducer = (
  state: ExperimentState,
  action: ExperimentAction
): ExperimentState => {
  switch (action.type) {
    case 'SET_VARIATION':
      return {
        ...state,
        variation: action.payload.variation,
        source: action.payload.source,
        metadata: action.payload.metadata,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_ACTIVE':
      return {
        ...state,
        isActive: action.payload,
      };
    case 'SET_EXPERIMENT':
      return {
        ...state,
        experiment: action.payload,
        metadata: constructMetadata(action.payload),
        isLoading: false,
        error: null,
      };
    case 'RESET':
      return {
        variation: null,
        isLoading: false,
        error: null,
        source: null,
        isActive: false,
        experiment: null,
        metadata: undefined,
      };
    default:
      return state;
  }
};

const constructMetadata = (experiment: Experiment | null | undefined): ExperimentState['metadata'] => {
  if (!experiment) {
    return undefined;
  }

  const metadata: ExperimentState['metadata'] = {};

  if (experiment.version !== undefined) {
    metadata.version = experiment.version;
  }
  if (experiment.description !== undefined) {
    metadata.description = experiment.description;
  }
  if (experiment.startDate !== undefined) {
    metadata.startDate = experiment.startDate;
  }
  if (experiment.endDate !== undefined) {
    metadata.endDate = experiment.endDate;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
};

const handleInactiveExperiment = (
  experiment: Experiment,
  dispatch: React.Dispatch<ExperimentAction>,
  config: ABTestConfig
): boolean => {
  const active = isExperimentActive(experiment);
  dispatch({ type: 'SET_ACTIVE', payload: active });

  if (!active) {
    const baseline = getBaselineVariation(experiment.variations);
    if (baseline) {
      localStorage.setItem(getExpId(experiment.id), baseline);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: baseline,
          source: 'generated',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(config, `Experiment ${experiment.id} is inactive, serving baseline: ${baseline}`);
      return true;
    }

    // Use fallback if no baseline
    const fallback = config.fallback || 'control';
    dispatch({
      type: 'SET_VARIATION',
      payload: {
        variation: fallback,
        source: 'fallback',
        metadata: constructMetadata(experiment),
      },
    });
    debugLog(config, `Experiment ${experiment.id} is inactive, no baseline found, using fallback: ${fallback}`);
    return true;
  }
  return false;
};

const handleExperimentError = (
  dispatch: React.Dispatch<ExperimentAction>,
  error: any,
  config: ABTestConfig,
  fallback?: string
) => {
  errorLog(config, 'Experiment error occurred', error);

  if (fallback) {
    dispatch({
      type: 'SET_VARIATION',
      payload: {
        variation: fallback,
        source: 'fallback',
        metadata: undefined,
      },
    });
  } else {
    dispatch({ type: 'SET_ERROR', payload: error as Error });
  }
};

/**
 * Enhanced useExperiment hook for production use
 * Now accepts experiment ID and fetches experiment details automatically
 * 
 * Environment-Aware Behavior:
 * - Server-Side (SSR): Skips localStorage, always fetches from backend
 * - Client-Side: Uses localStorage for performance, with backend sync
 * - Automatic detection: No configuration needed
 */
export const useExperiment = (
  experimentId: string,
  config: ABTestConfig
): UseExperimentResult => {
  // Create a stable config object to prevent infinite loops
  const stableConfig = useMemo(() => ({
    apiUrl: config.apiUrl,
    userId: config.userId,
    sessionId: config.sessionId,
    debug: config.debug,
    fallback: config.fallback,
    timeout: config.timeout,
    environment: config.environment,
    randomFn: config.randomFn,
  }), [
    config.apiUrl,
    config.userId,
    config.sessionId,
    config.debug,
    config.fallback,
    config.timeout,
    config.environment,
    config.randomFn
  ]);

  const api = useMemo(() => new ABTestAPI(stableConfig), [stableConfig]);

  const [state, dispatch] = useReducer(experimentReducer, {
    variation: null,
    isLoading: true, // Start with loading since we need to fetch experiment
    error: null,
    source: null,
    isActive: true,
    experiment: null, // Will be set after fetching experiment
    metadata: undefined, // Will be set after fetching experiment
  });

  const saveVariation = useCallback(
    async (experiment: Experiment, variation: string) => {
      try {
        const userVariation = await api.getExperimentVariation(experiment.id);
        if (!userVariation?.[0]) {
          await api.persistExperimentVariation(experiment.id, variation);
          debugLog(stableConfig, `Persisted variation ${variation} for experiment ${experiment.id}`);
        }
      } catch (err) {
        handleExperimentError(dispatch, err, stableConfig, stableConfig.fallback);
      }
    },
    [api, stableConfig]
  );

  const syncExperiment = useCallback(async (experiment: Experiment) => {
    if (handleInactiveExperiment(experiment, dispatch, stableConfig)) {
      return;
    }

    // Environment detection
    const isServer = typeof window === 'undefined';
    const hasLocalStorage = typeof localStorage !== 'undefined';

    debugLog(stableConfig, `Environment: ${isServer ? 'Server' : 'Client'}, localStorage: ${hasLocalStorage ? 'Available' : 'Unavailable'}`);

    const expId = getExpId(experiment.id);
    const cookieVariation = getCookie(removeExperimentPrefix(expId));
    const localVariation = hasLocalStorage ? localStorage.getItem(expId) : null;

    if (cookieVariation) {
      // Handle cookie variation directly
      if (hasLocalStorage) {
        localStorage.setItem(getExpId(experiment.id), cookieVariation);
      }
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: cookieVariation,
          source: 'cookie',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(stableConfig, `Using variation ${cookieVariation} from cookie for experiment ${experiment.id}`);
      await saveVariation(experiment, cookieVariation);
    } else if (localVariation && !isServer) {
      // Handle localStorage variation directly (only on client-side)
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: localVariation,
          source: 'localStorage',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(stableConfig, `Using variation ${localVariation} from localStorage for experiment ${experiment.id}`);
      await saveVariation(experiment, localVariation);
    } else if (stableConfig.userId) {
      // Load from backend
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const userVariations = await api.getExperimentVariation(experiment.id);
        if (userVariations?.[0]) {
          const backendVariationObject = userVariations[0] as BackendVariation;
          const variationName = backendVariationObject.variation;
          if (hasLocalStorage) {
            localStorage.setItem(getExpId(experiment.id), variationName);
          }
          dispatch({
            type: 'SET_VARIATION',
            payload: {
              variation: variationName,
              source: 'backend',
              metadata: constructMetadata(experiment),
            },
          });
          debugLog(stableConfig, `Loaded variation ${variationName} from backend for experiment ${experiment.id}`);
        } else {
          // Create new variation
          const variation = getWeightedVariation(experiment.variations, stableConfig.randomFn);
          if (hasLocalStorage) {
            localStorage.setItem(getExpId(experiment.id), variation);
          }
          dispatch({
            type: 'SET_VARIATION',
            payload: {
              variation,
              source: 'generated',
              metadata: constructMetadata(experiment),
            },
          });
          debugLog(stableConfig, `Generated new variation ${variation} for experiment ${experiment.id}`);
          await saveVariation(experiment, variation);
        }
      } catch (error) {
        handleExperimentError(dispatch, error, stableConfig, stableConfig.fallback);
      }
    } else {
      // Create new variation without login
      const variation = getWeightedVariation(experiment.variations, stableConfig.randomFn);
      if (hasLocalStorage) {
        localStorage.setItem(getExpId(experiment.id), variation);
      }
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation,
          source: 'generated',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(stableConfig, `Generated new variation ${variation} for experiment ${experiment.id}`);
    }
  }, [stableConfig, api, saveVariation]);


  const trackSuccess = useCallback(
    async (eventData?: Record<string, any>) => {
      if (!state.experiment || !state.variation) return;

      try {
        await api.trackSuccess(state.experiment.id, eventData);
        debugLog(stableConfig, `Tracked success for experiment ${state.experiment.id}`, eventData);
      } catch (error) {
        errorLog(stableConfig, `Failed to track success for experiment ${state.experiment.id}`, error);
      }
    },
    [state.experiment, state.variation, api, stableConfig]
  );


  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        debugLog(stableConfig, `Fetching experiment ${experimentId}`);
        const experiment = await api.getExperiment(experimentId);
        dispatch({ type: 'SET_EXPERIMENT', payload: experiment });

        // Now handle variation assignment
        await syncExperiment(experiment);
      } catch (error) {
        errorLog(stableConfig, `Failed to fetch experiment ${experimentId}`, error);
        dispatch({ type: 'SET_ERROR', payload: error as Error });
      }
    };

    fetchExperiment();

    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [experimentId, stableConfig, syncExperiment]);

  // Handle userId changes - re-run syncExperiment when user logs in/out
  useEffect(() => {
    const handleUserIdChange = async () => {
      if (state.experiment) {
        debugLog(stableConfig, `UserId changed to ${stableConfig.userId}, re-syncing experiment`);
        await syncExperiment(state.experiment);
      }
    };

    handleUserIdChange();
  }, [stableConfig.userId, state.experiment, syncExperiment]);

  return {
    variation: state.variation,
    isLoading: state.isLoading,
    error: state.error,
    source: state.source,
    isActive: state.isActive,
    experiment: state.experiment,
    metadata: state.metadata,
    trackSuccess,
  };
};
