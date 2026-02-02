"use strict";
// FILE: server/src/middlewares/error.middleware.ts
// 2026 Standard: Centralized error handling middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ApiError = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
/**
 * Custom API Error Class
 * Extends Error with HTTP status code and optional error code
 */
class ApiError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
    // Factory methods for common errors
    static badRequest(message, details) {
        return new ApiError(400, message, 'BAD_REQUEST', details);
    }
    static unauthorized(message = 'Authentication required') {
        return new ApiError(401, message, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Access denied') {
        return new ApiError(403, message, 'FORBIDDEN');
    }
    static notFound(resource = 'Resource') {
        return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
    }
    static conflict(message) {
        return new ApiError(409, message, 'CONFLICT');
    }
    static internal(message = 'Internal server error') {
        return new ApiError(500, message, 'INTERNAL_ERROR');
    }
}
exports.ApiError = ApiError;
/**
 * Global Error Handler Middleware
 * Handles all errors thrown in route handlers and middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('🔥 Error:', {
        name: err.name,
        message: err.message,
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    // Build error response
    const response = {
        success: false,
        message: 'An error occurred',
    };
    let statusCode = 500;
    // Handle ApiError (our custom errors)
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        response.message = err.message;
        response.code = err.code;
        if (err.details)
            response.details = err.details;
    }
    // Handle Zod validation errors
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        response.message = err.issues[0]?.message || 'Validation failed';
        response.code = 'VALIDATION_ERROR';
        response.details = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));
    }
    // Handle Prisma errors
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
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
exports.errorHandler = errorHandler;
/**
 * 404 Not Found Handler
 * Catches unmatched routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};
exports.notFoundHandler = notFoundHandler;
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
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
