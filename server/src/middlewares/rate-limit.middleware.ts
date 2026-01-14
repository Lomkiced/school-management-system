// FILE: server/src/middlewares/rate-limit.middleware.ts
// 2026 Standard: Rate limiting middleware for API protection

import { NextFunction, Request, Response } from 'express';

/**
 * Rate Limit Configuration
 */
interface RateLimitConfig {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum number of requests per window */
    maxRequests: number;
    /** Custom message for rate limit exceeded */
    message?: string;
    /** Optional key generator for custom rate limiting (e.g., by user ID) */
    keyGenerator?: (req: Request) => string;
}

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const stores: Map<string, RateLimitStore> = new Map();

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    stores.forEach((store, name) => {
        Object.keys(store).forEach(key => {
            if (store[key].resetTime < now) {
                delete store[key];
            }
        });
    });
}, 60000); // Cleanup every minute

/**
 * Create Rate Limiter Middleware
 * 
 * @param name - Unique identifier for this limiter's store
 * @param config - Rate limit configuration
 * @returns Express middleware function
 * 
 * @example
 * // General API rate limiting: 100 requests per minute
 * app.use('/api', createRateLimiter('api', { windowMs: 60000, maxRequests: 100 }));
 * 
 * @example
 * // Login rate limiting: 5 attempts per 15 minutes
 * router.post('/login', createRateLimiter('login', { windowMs: 900000, maxRequests: 5 }), login);
 */
export const createRateLimiter = (
    name: string,
    config: RateLimitConfig
) => {
    // Initialize store for this limiter
    if (!stores.has(name)) {
        stores.set(name, {});
    }

    const {
        windowMs,
        maxRequests,
        message = 'Too many requests, please try again later',
        keyGenerator = (req: Request) => req.ip || 'unknown'
    } = config;

    return (req: Request, res: Response, next: NextFunction) => {
        const store = stores.get(name)!;
        const key = keyGenerator(req);
        const now = Date.now();

        // Initialize or get current entry
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 0,
                resetTime: now + windowMs
            };
        }

        const entry = store[key];
        entry.count++;

        // Set rate limit headers
        const remaining = Math.max(0, maxRequests - entry.count);
        const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

        // Check if rate limit exceeded
        if (entry.count > maxRequests) {
            res.setHeader('Retry-After', resetSeconds.toString());

            return res.status(429).json({
                success: false,
                message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: resetSeconds
            });
        }

        next();
    };
};

/**
 * Pre-configured rate limiters for common use cases
 */

/** General API rate limiting: 100 requests per minute */
export const apiRateLimiter = createRateLimiter('api', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests. Please wait a moment.'
});

/** Authentication rate limiting: 5 attempts per 15 minutes */
export const authRateLimiter = createRateLimiter('auth', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
});

/** Strict rate limiting for sensitive operations: 10 per hour */
export const strictRateLimiter = createRateLimiter('strict', {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Rate limit exceeded for this operation. Please try again later.'
});

/** File upload rate limiting: 20 uploads per hour */
export const uploadRateLimiter = createRateLimiter('upload', {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many file uploads. Please try again later.'
});
