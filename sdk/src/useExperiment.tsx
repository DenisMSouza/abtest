import { useEffect, useReducer, useCallback, useMemo } from 'react';
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
    case 'RESET':
      return {
        variation: null,
        isLoading: false,
        error: null,
        source: null,
        isActive: false,
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
 */
export const useExperiment = (
  experiment: Experiment,
  config: ABTestConfig
): UseExperimentResult => {
  const api = useMemo(() => new ABTestAPI(config), [config]);

  const [state, dispatch] = useReducer(experimentReducer, {
    variation: null,
    isLoading: false,
    error: null,
    source: null,
    isActive: true,
    metadata: constructMetadata(experiment),
  });

  const saveVariation = useCallback(
    async (experiment: Experiment, variation: string) => {
      try {
        const userVariation = await api.getExperimentVariation(experiment.id);
        if (!userVariation?.[0]) {
          await api.persistExperimentVariation(experiment.id, variation);
          debugLog(config, `Persisted variation ${variation} for experiment ${experiment.id}`);
        }
      } catch (err) {
        handleExperimentError(dispatch, err, config, config.fallback);
      }
    },
    [api, config]
  );

  const createNewVariation = useCallback(
    async (loggedIn: boolean = true) => {
      if (!experiment) return;

      if (handleInactiveExperiment(experiment, dispatch, config)) {
        return;
      }

      const variation = getWeightedVariation(experiment.variations, config.randomFn);
      localStorage.setItem(getExpId(experiment.id), variation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation,
          source: 'generated',
          metadata: constructMetadata(experiment),
        },
      });

      debugLog(config, `Generated new variation ${variation} for experiment ${experiment.id}`);

      if (loggedIn) {
        await saveVariation(experiment, variation);
      }
    },
    [experiment, saveVariation, config]
  );

  const loadVariationFromBackend = useCallback(async () => {
    if (!experiment) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const userVariations = await api.getExperimentVariation(experiment.id);
      if (userVariations?.[0]) {
        const backendVariationObject = userVariations[0] as BackendVariation;
        const variationName = backendVariationObject.variation;
        localStorage.setItem(getExpId(experiment.id), variationName);
        dispatch({
          type: 'SET_VARIATION',
          payload: {
            variation: variationName,
            source: 'backend',
            metadata: constructMetadata(experiment),
          },
        });
        debugLog(config, `Loaded variation ${variationName} from backend for experiment ${experiment.id}`);
      } else {
        await createNewVariation(true);
      }
    } catch (error) {
      handleExperimentError(dispatch, error, config, config.fallback);
    }
  }, [experiment, createNewVariation, api, config]);

  const handleCookieVariation = useCallback(
    (cookieVariation: string) => {
      if (!experiment) return;

      localStorage.setItem(getExpId(experiment.id), cookieVariation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: cookieVariation,
          source: 'cookie',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(config, `Using variation ${cookieVariation} from cookie for experiment ${experiment.id}`);
      saveVariation(experiment, cookieVariation);
    },
    [experiment, saveVariation, config]
  );

  const handleLocalStorageVariation = useCallback(
    (localVariation: string) => {
      if (!experiment) return;

      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: localVariation,
          source: 'localStorage',
          metadata: constructMetadata(experiment),
        },
      });
      debugLog(config, `Using variation ${localVariation} from localStorage for experiment ${experiment.id}`);
      saveVariation(experiment, localVariation);
    },
    [experiment, saveVariation, config]
  );

  const trackSuccess = useCallback(
    async (eventData?: Record<string, any>) => {
      if (!experiment || !state.variation) return;

      try {
        await api.trackSuccess(experiment.id, eventData);
        debugLog(config, `Tracked success for experiment ${experiment.id}`, eventData);
      } catch (error) {
        errorLog(config, `Failed to track success for experiment ${experiment.id}`, error);
      }
    },
    [experiment, state.variation, api, config]
  );

  const trackEvent = useCallback(
    async (eventName: string, eventData?: Record<string, any>) => {
      if (!experiment || !state.variation) return;

      try {
        await api.trackEvent(experiment.id, eventName, eventData);
        debugLog(config, `Tracked event ${eventName} for experiment ${experiment.id}`, eventData);
      } catch (error) {
        errorLog(config, `Failed to track event ${eventName} for experiment ${experiment.id}`, error);
      }
    },
    [experiment, state.variation, api, config]
  );

  useEffect(() => {
    const syncExperiment = async (experiment: Experiment) => {
      if (handleInactiveExperiment(experiment, dispatch, config)) {
        return;
      }

      const expId = getExpId(experiment.id);
      const cookieVariation = getCookie(removeExperimentPrefix(expId));
      const localVariation = localStorage.getItem(expId);

      if (cookieVariation) {
        handleCookieVariation(cookieVariation);
      } else if (localVariation) {
        handleLocalStorageVariation(localVariation);
      } else if (config.userId) {
        await loadVariationFromBackend();
      } else {
        await createNewVariation(false);
      }
    };

    const initializeVariation = async () => {
      if (!experiment) {
        return;
      }

      const metadata = constructMetadata(experiment);
      if (metadata) {
        dispatch({
          type: 'SET_VARIATION',
          payload: {
            variation: state.variation!,
            source: state.source,
            metadata,
          },
        });
      }

      await syncExperiment(experiment);
    };

    initializeVariation();

    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [
    experiment,
    config.userId,
    createNewVariation,
    loadVariationFromBackend,
    handleCookieVariation,
    handleLocalStorageVariation,
    config,
    state.variation,
    state.source,
  ]);

  return {
    variation: state.variation,
    isLoading: state.isLoading,
    error: state.error,
    source: state.source,
    isActive: state.isActive,
    metadata: state.metadata,
    trackSuccess,
    trackEvent,
  };
};
