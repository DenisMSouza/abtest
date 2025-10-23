"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendSuccess = exports.validatePagination = exports.validateId = exports.validateRequired = exports.asyncHandler = exports.errorHandler = exports.ExternalServiceError = exports.DatabaseError = exports.RateLimitError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("./logger");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Specific error types
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, true, "VALIDATION_ERROR", details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        const message = id
            ? `${resource} with id '${id}' not found`
            : `${resource} not found`;
        super(message, 404, true, "NOT_FOUND");
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, true, "CONFLICT", details);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, true, "UNAUTHORIZED");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, true, "FORBIDDEN");
    }
}
exports.ForbiddenError = ForbiddenError;
class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, true, "RATE_LIMIT");
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(message, 500, false, "DATABASE_ERROR", {
            originalError: originalError?.message,
            stack: originalError?.stack,
        });
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(service, message, originalError) {
        super(`External service error (${service}): ${message}`, 502, false, "EXTERNAL_SERVICE_ERROR", {
            service,
            originalError: originalError?.message,
        });
    }
}
exports.ExternalServiceError = ExternalServiceError;
// Error handler middleware
const errorHandler = (error, req, res, next) => {
    let appError;
    // Convert known errors to AppError
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error.name === "ValidationError") {
        appError = new ValidationError(error.message);
    }
    else if (error.name === "CastError") {
        appError = new ValidationError("Invalid ID format");
    }
    else if (error.name === "MongoError" || error.name === "SequelizeError") {
        appError = new DatabaseError("Database operation failed", error);
    }
    else {
        // Unknown error
        appError = new AppError(process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message, 500, false, "INTERNAL_ERROR");
    }
    // Log error
    if (appError.statusCode >= 500) {
        logger_1.logger.error("Server error", appError, {
            method: req.method,
            url: req.url,
            body: req.body,
            query: req.query,
            params: req.params,
        }, { requestId: req.requestId });
    }
    else {
        logger_1.logger.warn("Client error", {
            message: appError.message,
            code: appError.code,
            statusCode: appError.statusCode,
            method: req.method,
            url: req.url,
        }, { requestId: req.requestId });
    }
    // Send error response
    const errorResponse = {
        error: {
            message: appError.message,
            code: appError.code,
            statusCode: appError.statusCode,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        },
    };
    // Include details in development
    if (process.env.NODE_ENV === "development" && appError.details) {
        errorResponse.error.details = appError.details;
    }
    res.status(appError.statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Validation helper
const validateRequired = (data, fields) => {
    const missing = fields.filter((field) => !data[field]);
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(", ")}`, { missingFields: missing });
    }
};
exports.validateRequired = validateRequired;
// ID validation helper
const validateId = (id, fieldName = "id") => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
        throw new ValidationError(`Invalid ${fieldName}: must be a non-empty string`);
    }
};
exports.validateId = validateId;
// Pagination validation helper
const validatePagination = (page, limit) => {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (isNaN(pageNum) || pageNum < 1) {
        throw new ValidationError("Invalid page: must be a positive integer");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new ValidationError("Invalid limit: must be between 1 and 100");
    }
    return { page: pageNum, limit: limitNum };
};
exports.validatePagination = validatePagination;
// Success response helper
const sendSuccess = (res, data, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
    });
};
exports.sendSuccess = sendSuccess;
// Paginated response helper
const sendPaginated = (res, data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    res.json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
    });
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=errors.js.map