import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access to localhost/internal requests only
 * This ensures that only the dashboard running on the same server can access internal routes
 */
export const localhostOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientIP =
    req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const forwardedIP = req.headers["x-forwarded-for"] as string;
  const realIP = req.headers["x-real-ip"] as string;

  // Get the actual client IP (considering proxies)
  const actualIP =
    forwardedIP?.split(",")[0]?.trim() || realIP || clientIP || "unknown";

  // Allow localhost, 127.0.0.1, and internal network ranges
  const allowedIPs = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];

  // Check if IP is localhost or internal
  const isLocalhost =
    allowedIPs.includes(actualIP) ||
    actualIP.startsWith("127.") ||
    actualIP.startsWith("::1") ||
    actualIP === "::ffff:127.0.0.1";

  if (!isLocalhost) {
    console.warn(`🚫 Access denied to internal route from IP: ${actualIP}`);
    return res.status(403).json({
      error: "Access denied",
      message: "Internal routes are only accessible from localhost",
    });
  }

  next();
};
