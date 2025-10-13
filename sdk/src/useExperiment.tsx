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
 */
export const useExperiment = (
  experimentId: string,
  config: ABTestConfig
): UseExperimentResult => {
  const api = useMemo(() => new ABTestAPI(config), [config]);

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
      if (!state.experiment) return;

      if (handleInactiveExperiment(state.experiment, dispatch, config)) {
        return;
      }

      const variation = getWeightedVariation(state.experiment.variations, config.randomFn);
      localStorage.setItem(getExpId(state.experiment.id), variation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation,
          source: 'generated',
          metadata: constructMetadata(state.experiment),
        },
      });

      debugLog(config, `Generated new variation ${variation} for experiment ${state.experiment.id}`);

      if (loggedIn) {
        await saveVariation(state.experiment, variation);
      }
    },
    [state.experiment, saveVariation, config]
  );

  const loadVariationFromBackend = useCallback(async () => {
    if (!state.experiment) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const userVariations = await api.getExperimentVariation(state.experiment.id);
      if (userVariations?.[0]) {
        const backendVariationObject = userVariations[0] as BackendVariation;
        const variationName = backendVariationObject.variation;
        localStorage.setItem(getExpId(state.experiment.id), variationName);
        dispatch({
          type: 'SET_VARIATION',
          payload: {
            variation: variationName,
            source: 'backend',
            metadata: constructMetadata(state.experiment),
          },
        });
        debugLog(config, `Loaded variation ${variationName} from backend for experiment ${state.experiment.id}`);
      } else {
        await createNewVariation(true);
      }
    } catch (error) {
      handleExperimentError(dispatch, error, config, config.fallback);
    }
  }, [state.experiment, createNewVariation, api, config]);

  const handleCookieVariation = useCallback(
    (cookieVariation: string) => {
      if (!state.experiment) return;

      localStorage.setItem(getExpId(state.experiment.id), cookieVariation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: cookieVariation,
          source: 'cookie',
          metadata: constructMetadata(state.experiment),
        },
      });
      debugLog(config, `Using variation ${cookieVariation} from cookie for experiment ${state.experiment.id}`);
      saveVariation(state.experiment, cookieVariation);
    },
    [state.experiment, saveVariation, config]
  );

  const handleLocalStorageVariation = useCallback(
    (localVariation: string) => {
      if (!state.experiment) return;

      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: localVariation,
          source: 'localStorage',
          metadata: constructMetadata(state.experiment),
        },
      });
      debugLog(config, `Using variation ${localVariation} from localStorage for experiment ${state.experiment.id}`);
      saveVariation(state.experiment, localVariation);
    },
    [state.experiment, saveVariation, config]
  );

  const trackSuccess = useCallback(
    async (eventData?: Record<string, any>) => {
      if (!state.experiment || !state.variation) return;

      try {
        await api.trackSuccess(state.experiment.id, eventData);
        debugLog(config, `Tracked success for experiment ${state.experiment.id}`, eventData);
      } catch (error) {
        errorLog(config, `Failed to track success for experiment ${state.experiment.id}`, error);
      }
    },
    [state.experiment, state.variation, api, config]
  );

  const trackEvent = useCallback(
    async (eventName: string, eventData?: Record<string, any>) => {
      if (!state.experiment || !state.variation) return;

      try {
        await api.trackEvent(state.experiment.id, eventName, eventData);
        debugLog(config, `Tracked event ${eventName} for experiment ${state.experiment.id}`, eventData);
      } catch (error) {
        errorLog(config, `Failed to track event ${eventName} for experiment ${state.experiment.id}`, error);
      }
    },
    [state.experiment, state.variation, api, config]
  );

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        debugLog(config, `Fetching experiment ${experimentId}`);
        const experiment = await api.getExperiment(experimentId);
        dispatch({ type: 'SET_EXPERIMENT', payload: experiment });

        // Now handle variation assignment
        await syncExperiment(experiment);
      } catch (error) {
        errorLog(config, `Failed to fetch experiment ${experimentId}`, error);
        dispatch({ type: 'SET_ERROR', payload: error as Error });
      }
    };

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

    fetchExperiment();

    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [
    experimentId,
    api,
    config,
    createNewVariation,
    loadVariationFromBackend,
    handleCookieVariation,
    handleLocalStorageVariation,
  ]);

  return {
    variation: state.variation,
    isLoading: state.isLoading,
    error: state.error,
    source: state.source,
    isActive: state.isActive,
    experiment: state.experiment,
    metadata: state.metadata,
    trackSuccess,
    trackEvent,
  };
};
