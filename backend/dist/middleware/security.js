"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = exports.securityLogger = exports.validateRequest = exports.localhostOnly = exports.compressionMiddleware = exports.securityHeaders = exports.createSlowDown = exports.createRateLimit = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const compression_1 = __importDefault(require("compression"));
/**
 * Comprehensive security middleware stack for self-hosted applications
 * Based on community best practices and OWASP guidelines
 */
// Rate limiting configurations
const createRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
        max: options.max || 100, // limit each IP to 100 requests per windowMs
        message: options.message ||
            "Too many requests from this IP, please try again later.",
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
};
exports.createRateLimit = createRateLimit;
// Slow down configuration for additional protection
const createSlowDown = (options) => {
    return (0, express_slow_down_1.default)({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
        delayAfter: options.delayAfter || 50, // allow 50 requests per 15 minutes, then...
        // Use function form for express-slow-down v2 compatibility
        delayMs: (used) => {
            const delayAfter = options.delayAfter || 50;
            const delayMs = options.delayMs || 500;
            return used > delayAfter ? (used - delayAfter) * delayMs : 0;
        },
    });
};
exports.createSlowDown = createSlowDown;
// Helmet configuration for security headers
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for self-hosted apps
});
// Compression middleware
exports.compressionMiddleware = (0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
});
// Enhanced localhost-only middleware with better security
const localhostOnly = (req, res, next) => {
    // Get the actual client IP considering various proxy headers
    const getClientIP = (req) => {
        const forwarded = req.headers["x-forwarded-for"];
        const realIP = req.headers["x-real-ip"];
        const cfConnectingIP = req.headers["cf-connecting-ip"];
        if (forwarded) {
            return forwarded.split(",")[0].trim();
        }
        if (realIP) {
            return realIP;
        }
        if (cfConnectingIP) {
            return cfConnectingIP;
        }
        return (req.connection.remoteAddress || req.socket.remoteAddress || "unknown");
    };
    const clientIP = getClientIP(req);
    // Check for localhost patterns
    const isLocalhost = clientIP === "127.0.0.1" ||
        clientIP === "::1" ||
        clientIP === "::ffff:127.0.0.1" ||
        clientIP === "localhost" ||
        clientIP.startsWith("127.") ||
        clientIP.startsWith("::1") ||
        clientIP === "::ffff:127.0.0.1";
    if (!isLocalhost) {
        console.warn(`🚫 Access denied to internal route from IP: ${clientIP}`);
        return res.status(403).json({
            error: "Access denied",
            message: "Internal routes are only accessible from localhost",
            timestamp: new Date().toISOString(),
        });
    }
    next();
};
exports.localhostOnly = localhostOnly;
// Request validation middleware
const validateRequest = (req, res, next) => {
    // Basic request size validation
    const contentLength = parseInt(req.headers["content-length"] || "0");
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength > maxSize) {
        return res.status(413).json({
            error: "Request too large",
            message: "Request size exceeds maximum allowed limit",
        });
    }
    // Basic header validation
    const suspiciousHeaders = [
        "x-forwarded-host",
        "x-originating-ip",
        "x-remote-ip",
    ];
    for (const header of suspiciousHeaders) {
        if (req.headers[header]) {
            console.warn(`Suspicious header detected: ${header}`);
        }
    }
    next();
};
exports.validateRequest = validateRequest;
// Security logging middleware
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            timestamp: new Date().toISOString(),
        };
        // Log security-relevant events
        if (res.statusCode >= 400) {
            console.warn("Security event:", logData);
        }
        else {
            console.log("Request:", logData);
        }
    });
    next();
};
exports.securityLogger = securityLogger;
// API key validation for internal routes (alternative to localhost-only)
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.INTERNAL_API_KEY;
    if (!validApiKey) {
        console.error("INTERNAL_API_KEY environment variable not set");
        return res.status(500).json({
            error: "Server configuration error",
            message: "Internal API key not configured",
        });
    }
    if (!apiKey || apiKey !== validApiKey) {
        console.warn(`Invalid API key attempt from IP: ${req.ip}`);
        return res.status(401).json({
            error: "Unauthorized",
            message: "Valid API key required for internal routes",
        });
    }
    next();
};
exports.validateApiKey = validateApiKey;
//# sourceMappingURL=security.js.map