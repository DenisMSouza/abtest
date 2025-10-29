import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import compression from "compression";

/**
 * Comprehensive security middleware stack for self-hosted applications
 * Based on community best practices and OWASP guidelines
 */

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message:
      options.message ||
      "Too many requests from this IP, please try again later.",
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// Slow down configuration for additional protection
export const createSlowDown = (options: {
  windowMs?: number;
  delayAfter?: number;
  delayMs?: number;
}) => {
  return slowDown({
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

// Helmet configuration for security headers
export const securityHeaders = helmet({
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
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
});

// Enhanced localhost-only middleware with better security
export const localhostOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the actual client IP considering various proxy headers
  const getClientIP = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"] as string;
    const realIP = req.headers["x-real-ip"] as string;
    const cfConnectingIP = req.headers["cf-connecting-ip"] as string;

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    return (
      req.connection.remoteAddress || req.socket.remoteAddress || "unknown"
    );
  };

  const clientIP = getClientIP(req);

  // Check for localhost patterns
  const isLocalhost =
    clientIP === "127.0.0.1" ||
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

// Request validation middleware
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

// Security logging middleware
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    } else {
      console.log("Request:", logData);
    }
  });

  next();
};

// API key validation for internal routes (alternative to localhost-only)
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string;
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
