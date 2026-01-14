// FILE: server/src/middlewares/error.middleware.ts
// 2026 Standard: Centralized error handling middleware

import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Custom API Error Class
 * Extends Error with HTTP status code and optional error code
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }

    // Factory methods for common errors
    static badRequest(message: string, details?: any): ApiError {
        return new ApiError(400, message, 'BAD_REQUEST', details);
    }

    static unauthorized(message: string = 'Authentication required'): ApiError {
        return new ApiError(401, message, 'UNAUTHORIZED');
    }

    static forbidden(message: string = 'Access denied'): ApiError {
        return new ApiError(403, message, 'FORBIDDEN');
    }

    static notFound(resource: string = 'Resource'): ApiError {
        return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
    }

    static conflict(message: string): ApiError {
        return new ApiError(409, message, 'CONFLICT');
    }

    static internal(message: string = 'Internal server error'): ApiError {
        return new ApiError(500, message, 'INTERNAL_ERROR');
    }
}

/**
 * Error Response Interface
 */
interface ErrorResponse {
    success: false;
    message: string;
    code?: string;
    details?: any;
    stack?: string;
}

/**
 * Global Error Handler Middleware
 * Handles all errors thrown in route handlers and middleware
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log error for debugging
    console.error('🔥 Error:', {
        name: err.name,
        message: err.message,
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });

    // Build error response
    const response: ErrorResponse = {
        success: false,
        message: 'An error occurred',
    };

    let statusCode = 500;

    // Handle ApiError (our custom errors)
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        response.message = err.message;
        response.code = err.code;
        if (err.details) response.details = err.details;
    }

    // Handle Zod validation errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        response.message = err.errors[0]?.message || 'Validation failed';
        response.code = 'VALIDATION_ERROR';
        response.details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
    }

    // Handle Prisma errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                statusCode = 409;
                response.message = 'A record with this value already exists';
                response.code = 'DUPLICATE_ENTRY';
                break;
            case 'P2025': // Record not found
                statusCode = 404;
                response.message = 'Record not found';
                response.code = 'NOT_FOUND';
                break;
            case 'P2003': // Foreign key constraint failed
                statusCode = 400;
                response.message = 'Related record not found';
                response.code = 'FOREIGN_KEY_ERROR';
                break;
            default:
                response.message = 'Database operation failed';
                response.code = 'DATABASE_ERROR';
        }
    }

    // Handle Prisma validation errors
    else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        response.message = 'Invalid data provided';
        response.code = 'VALIDATION_ERROR';
    }

    // Handle syntax/type errors
    else if (err instanceof SyntaxError) {
        statusCode = 400;
        response.message = 'Invalid JSON in request body';
        response.code = 'INVALID_JSON';
    }

    // Handle generic errors
    else {
        response.message = err.message || 'Internal server error';
        response.code = 'INTERNAL_ERROR';
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Catches unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json({ success: true, data: users });
 * }));
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
