import { Request, Response, NextFunction } from "express";
export declare function validateApiKey(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createApiKeyResponse(message: string, status?: number): {
    error: string;
    status: number;
};
//# sourceMappingURL=auth.d.ts.map