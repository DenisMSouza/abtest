import { Response } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404, true, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, "CONFLICT", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, true, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, true, "FORBIDDEN");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, true, "RATE_LIMIT");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, false, "DATABASE_ERROR", {
      originalError: originalError?.message,
      stack: originalError?.stack,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `External service error (${service}): ${message}`,
      502,
      false,
      "EXTERNAL_SERVICE_ERROR",
      {
        service,
        originalError: originalError?.message,
      }
    );
  }
}

// Error response interface
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

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: any,
  res: Response,
  next: any
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === "ValidationError") {
    appError = new ValidationError(error.message);
  } else if (error.name === "CastError") {
    appError = new ValidationError("Invalid ID format");
  } else if (error.name === "MongoError" || error.name === "SequelizeError") {
    appError = new DatabaseError("Database operation failed", error);
  } else {
    // Unknown error
    appError = new AppError(
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
      500,
      false,
      "INTERNAL_ERROR"
    );
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error(
      "Server error",
      appError,
      {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { requestId: req.requestId }
    );
  } else {
    logger.warn(
      "Client error",
      {
        message: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        method: req.method,
        url: req.url,
      },
      { requestId: req.requestId }
    );
  }

  // Send error response
  const errorResponse: ErrorResponse = {
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

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation helper
export const validateRequired = (data: any, fields: string[]): void => {
  const missing = fields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      { missingFields: missing }
    );
  }
};

// ID validation helper
export const validateId = (id: string, fieldName: string = "id"): void => {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new ValidationError(
      `Invalid ${fieldName}: must be a non-empty string`
    );
  }
};

// Pagination validation helper
export const validatePagination = (
  page?: string,
  limit?: string
): { page: number; limit: number } => {
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

// Success response helper
export const sendSuccess = (
  res: Response,
  data: any,
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Paginated response helper
export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
): void => {
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
