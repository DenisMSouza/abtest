import { Request, Response, NextFunction } from "express";
/**
 * Comprehensive security middleware stack for self-hosted applications
 * Based on community best practices and OWASP guidelines
 */
export declare const createRateLimit: (options: {
    windowMs?: number;
    max?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const createSlowDown: (options: {
    windowMs?: number;
    delayAfter?: number;
    delayMs?: number;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const localhostOnly: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=security.d.ts.map