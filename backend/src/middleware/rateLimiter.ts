import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "../utils/errors";
import { logger } from "../utils/logger";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default: use IP address
    return req.ip || req.connection.remoteAddress || "unknown";
  }

  private getWindowStart(): number {
    const now = Date.now();
    return Math.floor(now / this.config.windowMs) * this.config.windowMs;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const windowStart = this.getWindowStart();
      const resetTime = windowStart + this.config.windowMs;

      // Get or create entry
      let entry = this.store.get(key);

      if (!entry || entry.resetTime < Date.now()) {
        // New window or expired entry
        entry = {
          count: 0,
          resetTime,
        };
      }

      // Increment counter
      entry.count++;
      this.store.set(key, entry);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": this.config.max.toString(),
        "X-RateLimit-Remaining": Math.max(
          0,
          this.config.max - entry.count
        ).toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      });

      // Check if limit exceeded
      if (entry.count > this.config.max) {
        const message = this.config.message || "Too many requests";

        logger.warn(
          "Rate limit exceeded",
          {
            key,
            count: entry.count,
            limit: this.config.max,
            windowMs: this.config.windowMs,
            method: req.method,
            url: req.url,
          },
          { requestId: (req as any).requestId }
        );

        throw new RateLimitError(message);
      }

      next();
    };
  }
}

// Pre-configured rate limiters
export const createRateLimiters = () => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10); // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);

  return {
    // General API rate limiter
    api: new RateLimiter({
      windowMs,
      max: maxRequests,
      message: "Too many API requests, please try again later",
      keyGenerator: (req) => {
        // Use IP + User-Agent for more granular limiting
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        return `${ip}:${userAgent}`;
      },
    }),

    // Strict rate limiter for sensitive endpoints
    strict: new RateLimiter({
      windowMs: 300000, // 5 minutes
      max: 10,
      message: "Too many requests to sensitive endpoint",
    }),

    // Dashboard rate limiter
    dashboard: new RateLimiter({
      windowMs: 600000, // 10 minutes
      max: 50,
      message: "Too many dashboard requests",
    }),

    // Experiment creation rate limiter
    experimentCreation: new RateLimiter({
      windowMs: 3600000, // 1 hour
      max: 5,
      message: "Too many experiment creation attempts",
    }),

    // Success tracking rate limiter (more permissive)
    tracking: new RateLimiter({
      windowMs: 60000, // 1 minute
      max: 1000,
      message: "Too many tracking requests",
    }),
  };
};

// Export rate limiters
export const rateLimiters = createRateLimiters();

// Middleware functions
export const apiRateLimit = rateLimiters.api.middleware();
export const strictRateLimit = rateLimiters.strict.middleware();
export const dashboardRateLimit = rateLimiters.dashboard.middleware();
export const experimentCreationRateLimit =
  rateLimiters.experimentCreation.middleware();
export const trackingRateLimit = rateLimiters.tracking.middleware();
