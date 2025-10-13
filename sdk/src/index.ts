// Main exports
export { useExperiment } from "./useExperiment";
export { ABTestAPI } from "./api";

// Type exports
export type {
  ABTestConfig,
  Experiment,
  Variation,
  UseExperimentResult,
  ExperimentState,
  BackendVariation,
  SuccessEvent,
} from "./types";

// Utility exports
export {
  getCookie,
  setCookie,
  getWeightedVariation,
  getBaselineVariation,
  isExperimentActive,
  getExpId,
  removeExperimentPrefix,
  debugLog,
  errorLog,
} from "./utils";

// Default export for convenience
export { useExperiment as default } from "./useExperiment";
