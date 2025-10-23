"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRateLimit = exports.experimentCreationRateLimit = exports.dashboardRateLimit = exports.strictRateLimit = exports.apiRateLimit = exports.rateLimiters = exports.createRateLimiters = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
class RateLimiter {
    constructor(config) {
        this.store = new Map();
        this.config = config;
        // Clean up expired entries every minute
        setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetTime < now) {
                this.store.delete(key);
            }
        }
    }
    getKey(req) {
        if (this.config.keyGenerator) {
            return this.config.keyGenerator(req);
        }
        // Default: use IP address
        return req.ip || req.connection.remoteAddress || "unknown";
    }
    getWindowStart() {
        const now = Date.now();
        return Math.floor(now / this.config.windowMs) * this.config.windowMs;
    }
    middleware() {
        return (req, res, next) => {
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
                "X-RateLimit-Remaining": Math.max(0, this.config.max - entry.count).toString(),
                "X-RateLimit-Reset": new Date(resetTime).toISOString(),
            });
            // Check if limit exceeded
            if (entry.count > this.config.max) {
                const message = this.config.message || "Too many requests";
                logger_1.logger.warn("Rate limit exceeded", {
                    key,
                    count: entry.count,
                    limit: this.config.max,
                    windowMs: this.config.windowMs,
                    method: req.method,
                    url: req.url,
                }, { requestId: req.requestId });
                throw new errors_1.RateLimitError(message);
            }
            next();
        };
    }
}
// Pre-configured rate limiters
const createRateLimiters = () => {
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
exports.createRateLimiters = createRateLimiters;
// Export rate limiters
exports.rateLimiters = (0, exports.createRateLimiters)();
// Middleware functions
exports.apiRateLimit = exports.rateLimiters.api.middleware();
exports.strictRateLimit = exports.rateLimiters.strict.middleware();
exports.dashboardRateLimit = exports.rateLimiters.dashboard.middleware();
exports.experimentCreationRateLimit = exports.rateLimiters.experimentCreation.middleware();
exports.trackingRateLimit = exports.rateLimiters.tracking.middleware();
//# sourceMappingURL=rateLimiter.js.map