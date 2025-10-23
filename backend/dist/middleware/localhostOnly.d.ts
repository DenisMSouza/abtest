import { Request, Response, NextFunction } from "express";
/**
 * Middleware to restrict access to localhost/internal requests only
 * This ensures that only the dashboard running on the same server can access internal routes
 */
export declare const localhostOnly: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=localhostOnly.d.ts.map