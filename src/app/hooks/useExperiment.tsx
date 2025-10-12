'use client';

import { useEffect, useReducer, useCallback } from 'react';
import {
  getExperimentVariation,
  persistExperimentVariaton,
} from '../services/api';

import { getCookie } from '../utils';
import { isEmpty, isNil } from 'ramda';

const DEBUG_MODE = false;

type Variation = { name: string; weight: number }[];

type BackendVariation = {
  experiment: string;
  timestamp: string;
  variation: string;
};

export type Experiment = {
  id: string;
  variations: Variation;
  version?: string;
  description?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
};

type ExperimentState = {
  variation: string | null;
  isLoading: boolean;
  error: Error | null;
  source: 'localStorage' | 'cookie' | 'backend' | 'generated' | null;
  isActive: boolean;
  metadata?: {
    version?: string;
    description?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
  };
};

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
  if (DEBUG_MODE) {
    console.log(action.type, {
      'Experiment state:': state,
      'Action:': action,
    });
  }
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

const getWeightedVariation = (
  variations: Variation,
  randomFn: () => number = Math.random
) => {
  if (variations.length === 1) {
    return variations[0].name;
  }

  const totalWeight = variations.reduce((acc, { weight }) => acc + weight, 0);
  const random = randomFn() * totalWeight;

  let weightSum = 0;
  for (const variation of variations) {
    weightSum += variation.weight;
    if (random <= weightSum) {
      return variation.name;
    }
  }

  return variations[variations.length - 1].name;
};

const getBaselineVariation = (variations: Variation): string | null => {
  const baselineVariation = variations.find(
    (v) => v.name.toLowerCase() === 'baseline'
  );
  return baselineVariation?.name ?? null;
};

const constructMetadata = (
  experiment: Experiment | null | undefined
): ExperimentState['metadata'] => {
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

const getExpId = (id: string) => {
  return `exp-${id}`;
};

const handleInactiveExperiment = (
  experiment: Experiment,
  dispatch: React.Dispatch<ExperimentAction>
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
      return true;
    }
    dispatch({
      type: 'SET_ERROR',
      payload: new Error(
        'Experiment is not active and no baseline variation found'
      ),
    });
    return true;
  }
  return false;
};

const isValidISODate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

const handleExperimentError = (
  dispatch: React.Dispatch<ExperimentAction>,
  error: any
) => {
  dispatch({ type: 'SET_ERROR', payload: error as Error });
  // Sentry.captureException(error);
};

export const useExperiments = (
  experiment: Experiment,
  randomFn?: () => number
) => {
  // Mock app state for now - in a real app, this would come from your state management
  const app = { loggedIn: true, loading: false };
  const removeExperimentPrefix = (id: string) => id.replace('exp-', '');

  const [state, dispatch] = useReducer(experimentReducer, {
    variation: null,
    isLoading: false,
    error: null,
    source: null,
    isActive: true,
    metadata: constructMetadata(experiment),
  });

  // useEffect(() => {
  //   Sentry.addBreadcrumb({
  //     category: 'experiment',
  //     message: `Hook initialized for experiment: ${experiment?.id}`,
  //     level: 'info',
  //   });
  //   return () => {
  //     Sentry.addBreadcrumb({
  //       category: 'experiment',
  //       message: `Hook unmounted for experiment: ${experiment?.id}`,
  //       level: 'info',
  //     });
  //   };
  // }, [experiment?.id]);

  const saveVariation = useCallback(
    async (experiment: Experiment, variation: string) => {
      if (app.loggedIn) {
        try {
          const userVariation = await getExperimentVariation(experiment.id);
          if (!userVariation?.[0]) {
            // Sentry.addBreadcrumb({
            //   category: 'experiment',
            //   message: `[Experiment: ${experiment.id}] Persisting variation ${variation} to backend.`,
            //   level: 'info',
            // });
            await persistExperimentVariaton(experiment.id, variation);
          }
        } catch (err) {
          handleExperimentError(dispatch, err);
        }
      }
    },
    [app.loggedIn]
  );

  const createNewVariation = useCallback(
    async (loggedIn: boolean = true) => {
      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message: `[Experiment: ${experiment?.id}] Creating new variation.`,
      //   level: 'info',
      // });
      if (!experiment) {
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message:
        //     '[Experiment: Undefined] Cannot create new variation, experiment undefined.',
        //   level: 'warning',
        // });
        return;
      }

      if (handleInactiveExperiment(experiment, dispatch)) {
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message: `[Experiment: ${experiment.id}] Experiment is inactive, served baseline or error.`,
        //   level: 'info',
        // });
        return;
      }

      const variation = getWeightedVariation(experiment.variations, randomFn);
      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message: `[Experiment: ${experiment.id}] Generated variation ${variation}.`,
      //   level: 'info',
      // });
      localStorage.setItem(getExpId(experiment.id), variation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation,
          source: 'generated',
          metadata: constructMetadata(experiment),
        },
      });
      if (loggedIn) {
        await saveVariation(experiment, variation);
      }
    },
    [experiment, saveVariation, randomFn]
  );

  const loadVariationFromBackend = useCallback(async () => {
    if (!experiment) {
      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message:
      //     '[Experiment: Undefined] Cannot load from backend, experiment undefined.',
      //   level: 'warning',
      // });
      return;
    }
    // Sentry.addBreadcrumb({
    //   category: 'experiment',
    //   message: `[Experiment: ${experiment.id}] Loading variation from backend.`,
    //   level: 'info',
    // });
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const userVariations = await getExperimentVariation(experiment.id);
      if (!isNil(userVariations) && !isEmpty(userVariations) && userVariations?.[0]) {
        const backendVariationObject = userVariations[0] as BackendVariation;
        const variationName = backendVariationObject.variation;
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message: `[Experiment: ${experiment.id}] Loaded variation ${variationName} from backend.`,
        //   level: 'info',
        // });
        localStorage.setItem(getExpId(experiment.id), variationName);
        dispatch({
          type: 'SET_VARIATION',
          payload: {
            variation: variationName,
            source: 'backend',
            metadata: constructMetadata(experiment),
          },
        });
      } else {
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message: `[Experiment: ${experiment.id}] No variation found on backend, creating new one.`,
        //   level: 'info',
        // });
        await createNewVariation(true); // Create new and persist
      }
    } catch (error) {
      handleExperimentError(dispatch, error);
    }
  }, [experiment, createNewVariation]);

  const handleCookieVariation = useCallback(
    (cookieVariation: string) => {
      if (!experiment) return;
      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message: `[Experiment: ${experiment.id}] Using variation ${cookieVariation} from cookie.`,
      //   level: 'info',
      // });
      localStorage.setItem(getExpId(experiment.id), cookieVariation);
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: cookieVariation,
          source: 'cookie',
          metadata: constructMetadata(experiment),
        },
      });
      saveVariation(experiment, cookieVariation); // Sync with backend if needed
    },
    [experiment, saveVariation]
  );

  const handleLocalStorageVariation = useCallback(
    (localVariation: string) => {
      if (!experiment) return;
      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message: `[Experiment: ${experiment.id}] Using variation ${localVariation} from local storage.`,
      //   level: 'info',
      // });
      dispatch({
        type: 'SET_VARIATION',
        payload: {
          variation: localVariation,
          source: 'localStorage',
          metadata: constructMetadata(experiment),
        },
      });
      saveVariation(experiment, localVariation); // Sync with backend if needed
    },
    [experiment, saveVariation]
  );

  useEffect(() => {
    const syncExperiment = async (experiment: Experiment) => {
      if (handleInactiveExperiment(experiment, dispatch)) {
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message: `[Experiment: ${experiment.id}] Experiment is inactive during sync, served baseline or error.`,
        //   level: 'info',
        // });
        return;
      }

      const expId = getExpId(experiment.id);
      const cookieVariation = getCookie(removeExperimentPrefix(expId));
      const localVariation = localStorage.getItem(expId);

      if (cookieVariation) {
        handleCookieVariation(cookieVariation);
      } else if (localVariation) {
        handleLocalStorageVariation(localVariation);
      } else if (app.loggedIn) {
        await loadVariationFromBackend();
      } else {
        // Sentry.addBreadcrumb({
        //   category: 'experiment',
        //   message: `[Experiment: ${experiment.id}] No variation in cookie, local storage, or user not logged in. Creating new variation locally.`,
        //   level: 'info',
        // });
        await createNewVariation(false); // Create new, don't persist to backend for non-logged-in users
      }
    };

    const initializeVariation = async () => {
      if (!experiment || app.loading) {
        return;
      }

      // Sentry.addBreadcrumb({
      //   category: 'experiment',
      //   message: `[Experiment: ${experiment.id}] Initializing variation.`,
      //   level: 'info',
      // });

      const metadata = constructMetadata(experiment);
      if (metadata) {
        dispatch({
          type: 'SET_VARIATION',
          payload: {
            variation: state.variation!, // Keep existing if any, or will be set by sync
            source: state.source,
            metadata,
          },
        });
      }

      await syncExperiment(experiment);
    };

    initializeVariation();

    // Cleanup function to reset state if experiment ID changes or component unmounts
    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [
    experiment,
    app.loggedIn,
    app.loading,
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
    metadata: state.metadata,
  };
};

const isExperimentActive = (experiment: Experiment): boolean => {
  const now = new Date();

  if (!experiment.startDate && !experiment.endDate) {
    return true; // If no dates set, experiment is always active
  }

  if (experiment.startDate) {
    if (!isValidISODate(experiment.startDate)) {
      console.warn(
        `Invalid startDate format for experiment ${experiment.id}: ${experiment.startDate}`
      );
      return false;
    }
    if (new Date(experiment.startDate) > now) {
      return false;
    }
  }

  if (experiment.endDate) {
    if (!isValidISODate(experiment.endDate)) {
      console.warn(
        `Invalid endDate format for experiment ${experiment.id}: ${experiment.endDate}`
      );
      return false;
    }
    if (new Date(experiment.endDate) < now) {
      return false;
    }
  }

  return true;
};
