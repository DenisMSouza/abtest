import { Response } from "express";
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    readonly details?: any;
    constructor(message: string, statusCode?: number, isOperational?: boolean, code?: string, details?: any);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: any);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, originalError?: Error);
}
export interface ErrorResponse {
    error: {
        message: string;
        code?: string;
        statusCode: number;
        details?: any;
        timestamp: string;
        requestId?: string;
    };
}
export declare const errorHandler: (error: Error, req: any, res: Response, next: any) => void;
export declare const asyncHandler: (fn: Function) => (req: any, res: Response, next: any) => void;
export declare const validateRequired: (data: any, fields: string[]) => void;
export declare const validateId: (id: string, fieldName?: string) => void;
export declare const validatePagination: (page?: string, limit?: string) => {
    page: number;
    limit: number;
};
export declare const sendSuccess: (res: Response, data: any, statusCode?: number) => void;
export declare const sendPaginated: (res: Response, data: any[], total: number, page: number, limit: number) => void;
//# sourceMappingURL=errors.d.ts.map