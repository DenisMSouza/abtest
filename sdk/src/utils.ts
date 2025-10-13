import { ABTestConfig, Variation, Experiment } from "./types";

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

/**
 * Set a cookie value
 */
export const setCookie = (
  name: string,
  value: string,
  days: number = 30
): void => {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

/**
 * Get weighted variation based on weights
 */
export const getWeightedVariation = (
  variations: Variation[],
  randomFn: () => number = Math.random
): string => {
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

/**
 * Get baseline variation from experiment
 */
export const getBaselineVariation = (
  variations: Variation[]
): string | null => {
  const baselineVariation = variations.find((v) => v.isBaseline);
  if (baselineVariation) {
    return baselineVariation.name;
  }

  // Fallback to finding by name
  const baselineByName = variations.find(
    (v) => v.name.toLowerCase() === "baseline"
  );
  return baselineByName?.name ?? null;
};

/**
 * Check if experiment is active based on dates
 */
export const isExperimentActive = (experiment: Experiment): boolean => {
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

/**
 * Validate ISO date string
 */
export const isValidISODate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Get experiment ID with prefix
 */
export const getExpId = (id: string): string => {
  return `exp-${id}`;
};

/**
 * Remove experiment prefix from ID
 */
export const removeExperimentPrefix = (id: string): string => {
  return id.replace("exp-", "");
};

/**
 * Create API client with timeout and error handling
 */
export const createApiClient = (config: ABTestConfig) => {
  const timeout = config.timeout || 5000;

  return {
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  };
};

/**
 * Log debug messages
 */
export const debugLog = (
  config: ABTestConfig,
  message: string,
  data?: any
): void => {
  if (config.debug) {
    console.log(`[ABTest SDK] ${message}`, data || "");
  }
};

/**
 * Log error messages
 */
export const errorLog = (
  config: ABTestConfig,
  message: string,
  error?: any
): void => {
  console.error(`[ABTest SDK] ${message}`, error || "");
};
