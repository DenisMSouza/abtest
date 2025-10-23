import { Request, Response, NextFunction } from "express";
interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}
declare class RateLimiter {
    private store;
    private config;
    constructor(config: RateLimitConfig);
    private cleanup;
    private getKey;
    private getWindowStart;
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
}
export declare const createRateLimiters: () => {
    api: RateLimiter;
    strict: RateLimiter;
    dashboard: RateLimiter;
    experimentCreation: RateLimiter;
    tracking: RateLimiter;
};
export declare const rateLimiters: {
    api: RateLimiter;
    strict: RateLimiter;
    dashboard: RateLimiter;
    experimentCreation: RateLimiter;
    tracking: RateLimiter;
};
export declare const apiRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const strictRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const dashboardRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const experimentCreationRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const trackingRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map