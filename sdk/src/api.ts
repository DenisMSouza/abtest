import { ABTestConfig, BackendVariation, SuccessEvent } from "./types";
import { createApiClient, debugLog, errorLog } from "./utils";

/**
 * API client for A/B testing backend
 */
export class ABTestAPI {
  private config: ABTestConfig;
  private client: ReturnType<typeof createApiClient>;

  constructor(config: ABTestConfig) {
    this.config = config;
    this.client = createApiClient(config);
  }

  /**
   * Get user's variation for an experiment (internal SDK use)
   */
  async getExperimentVariation(
    experimentId: string
  ): Promise<BackendVariation[]> {
    // Use internal API for SDK internal operations
    const internalApiUrl = this.config.apiUrl.replace(
      "/api",
      "/api/internal/experiments"
    );

    // Build query parameters
    const params = new URLSearchParams();
    if (this.config.userId) params.append("userId", this.config.userId);
    if (this.config.sessionId)
      params.append("sessionId", this.config.sessionId);

    const url = `${internalApiUrl}/${experimentId}/variation?${params.toString()}`;
    debugLog(this.config, `Getting variation for experiment ${experimentId}`);

    try {
      const response = await this.client.fetch(url);
      return await response.json();
    } catch (error) {
      errorLog(
        this.config,
        `Failed to get variation for experiment ${experimentId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Persist user's variation for an experiment
   */
  async persistExperimentVariation(
    experimentId: string,
    variation: string
  ): Promise<void> {
    // Use internal API for SDK internal operations
    const internalApiUrl = this.config.apiUrl.replace(
      "/api",
      "/api/internal/experiments"
    );

    // Build query parameters
    const params = new URLSearchParams();
    if (this.config.userId) params.append("userId", this.config.userId);
    if (this.config.sessionId)
      params.append("sessionId", this.config.sessionId);

    const url = `${internalApiUrl}/${experimentId}/variation?${params.toString()}`;
    debugLog(
      this.config,
      `Persisting variation ${variation} for experiment ${experimentId}`
    );

    try {
      await this.client.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experimentId,
          variation,
        }),
      });
    } catch (error) {
      errorLog(
        this.config,
        `Failed to persist variation for experiment ${experimentId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Track a success event
   */
  async trackSuccess(
    experimentId: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    const url = `${this.config.apiUrl}/experiments/${experimentId}/success`;
    debugLog(
      this.config,
      `Tracking success for experiment ${experimentId}`,
      eventData
    );

    try {
      await this.client.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.config.userId,
          event: eventData?.event || "success", // Default event name
          value: eventData?.value || 1, // Default value
        }),
      });
    } catch (error) {
      errorLog(
        this.config,
        `Failed to track success for experiment ${experimentId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get experiment details (public API)
   * This is the only method external developers should use directly
   */
  async getExperiment(experimentId: string): Promise<any> {
    const url = `${this.config.apiUrl}/experiments/${experimentId}`;
    debugLog(this.config, `Getting experiment ${experimentId}`);

    try {
      const response = await this.client.fetch(url);
      return await response.json();
    } catch (error) {
      errorLog(this.config, `Failed to get experiment ${experimentId}`, error);
      throw error;
    }
  }

  /**
   * Track success event (public API)
   * This is the only method external developers should use directly
   */
  async trackSuccessEvent(
    experimentId: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    const url = `${this.config.apiUrl}/experiments/${experimentId}/success`;
    debugLog(
      this.config,
      `Tracking success for experiment ${experimentId}`,
      eventData
    );

    try {
      await this.client.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.config.userId,
          event: eventData?.event || "success", // Default event name
          value: eventData?.value || 1, // Default value
        }),
      });
    } catch (error) {
      errorLog(
        this.config,
        `Failed to track success for experiment ${experimentId}`,
        error
      );
      throw error;
    }
  }
}
