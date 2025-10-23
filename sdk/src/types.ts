export interface ABTestConfig {
  /** API base URL for your self-hosted A/B testing server */
  apiUrl: string;
  /** Optional: Simple API key for basic authentication (recommended for production) */
  apiKey?: string;
  /** Optional: User ID for user-based experiments */
  userId?: string;
  /** Optional: Session ID for session-based experiments */
  sessionId?: string;
  /** Optional: Environment (development, staging, production) */
  environment?: "development" | "staging" | "production";
  /** Optional: Enable debug logging */
  debug?: boolean;
  /** Optional: Fallback variation when experiment fails */
  fallback?: string;
  /** Optional: Custom random function for testing */
  randomFn?: () => number;
  /** Optional: Timeout for API requests (ms) */
  timeout?: number;
  /** Optional: Enable enhanced security (request signing) - only for high-security needs */
  enableRequestSigning?: boolean;
  /** Optional: Custom headers for authentication */
  customHeaders?: Record<string, string>;
}

export interface Variation {
  name: string;
  weight: number;
  isBaseline?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  variations: Variation[];
  version?: string;
  description?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  isActive?: boolean;
  successMetric?: {
    type: "click" | "conversion" | "custom";
    target?: string;
    value?: string;
  };
}

export interface ExperimentState {
  variation: string | null;
  isLoading: boolean;
  error: Error | null;
  source:
    | "localStorage"
    | "cookie"
    | "backend"
    | "generated"
    | "fallback"
    | null;
  isActive: boolean;
  experiment: Experiment | null;
  metadata?: {
    version?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface UseExperimentResult {
  /** Current variation name */
  variation: string | null;
  /** Whether the experiment is currently loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Source of the current variation */
  source: ExperimentState["source"];
  /** Whether the experiment is active */
  isActive: boolean;
  /** Experiment data */
  experiment: Experiment | null;
  /** Experiment metadata */
  metadata?: ExperimentState["metadata"];
  /** Track a success event for this experiment */
  trackSuccess: (eventData?: Record<string, any>) => Promise<void>;
}

export interface BackendVariation {
  experiment: string;
  timestamp: string;
  variation: string;
}

export interface SuccessEvent {
  experimentId: string;
  variation: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  eventData?: Record<string, any>;
}
