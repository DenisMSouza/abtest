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
    const url = `${this.config.apiUrl}/experiments/${experimentId}/variation`;
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
    const url = `${this.config.apiUrl}/experiments/${experimentId}/variation`;
    debugLog(
      this.config,
      `Persisting variation ${variation} for experiment ${experimentId}`
    );

    try {
      await this.client.fetch(url, {
        method: "POST",
        body: JSON.stringify({
          variation,
          userId: this.config.userId,
          sessionId: this.config.sessionId,
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
        body: JSON.stringify({
          userId: this.config.userId,
          sessionId: this.config.sessionId,
          eventData,
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
   * Track a custom event
   */
  async trackEvent(
    experimentId: string,
    eventName: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    const url = `${this.config.apiUrl}/experiments/${experimentId}/events`;
    debugLog(
      this.config,
      `Tracking event ${eventName} for experiment ${experimentId}`,
      eventData
    );

    try {
      await this.client.fetch(url, {
        method: "POST",
        body: JSON.stringify({
          eventName,
          userId: this.config.userId,
          sessionId: this.config.sessionId,
          eventData,
        }),
      });
    } catch (error) {
      errorLog(
        this.config,
        `Failed to track event ${eventName} for experiment ${experimentId}`,
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
        body: JSON.stringify({
          userId: this.config.userId,
          sessionId: this.config.sessionId,
          eventData,
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
