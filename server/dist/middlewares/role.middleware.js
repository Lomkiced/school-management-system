"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = void 0;
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // 1. Safety Check: User must exist
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not identified'
            });
        }
        // 2. Role Check (with Type Assertion for safety)
        // We cast to UserRole to satisfy TypeScript if data comes in loosely
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions'
            });
        }
        next();
    };
};
exports.restrictTo = restrictTo;
