"use strict";
// FILE: server/src/middlewares/authorize.middleware.ts
// 2026 Standard: Role-based access control middleware
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherOfClassOrAdmin = exports.selfOrAdmin = exports.anyAuthenticated = exports.studentAndAbove = exports.teacherAndAbove = exports.adminOnly = exports.superAdminOnly = exports.authorize = void 0;
/**
 * Authorization Middleware Factory
 *
 * Creates middleware that checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER the authenticate middleware.
 *
 * @param allowedRoles - Array of roles that are permitted to access the route
 * @returns Express middleware function
 *
 * @example
 * // Allow only admins
 * router.get('/admin/users', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getUsers);
 *
 * @example
 * // Allow teachers and admins
 * router.post('/grades', authenticate, authorize(['TEACHER', 'ADMIN']), createGrade);
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated (set by authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`⚠️ Authorization failed: User ${req.user.email} (${req.user.role}) attempted to access route requiring ${allowedRoles.join(' or ')}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                code: 'FORBIDDEN',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }
        // User is authorized, proceed to next middleware
        next();
    };
};
exports.authorize = authorize;
/**
 * Role-specific authorization middlewares for common use cases
 * These are pre-configured authorize functions for convenience
 */
/** Only Super Admins can access */
exports.superAdminOnly = (0, exports.authorize)(['SUPER_ADMIN']);
/** Only Admins and Super Admins can access */
exports.adminOnly = (0, exports.authorize)(['ADMIN', 'SUPER_ADMIN']);
/** Teachers, Admins, and Super Admins can access */
exports.teacherAndAbove = (0, exports.authorize)(['TEACHER', 'ADMIN', 'SUPER_ADMIN']);
/** Students, Teachers, Admins, and Super Admins can access (excludes parents) */
exports.studentAndAbove = (0, exports.authorize)(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']);
/** All authenticated users can access */
exports.anyAuthenticated = (0, exports.authorize)(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PARENT']);
/**
 * Self or Admin Authorization
 *
 * Allows users to access their own resources OR admins to access any resource.
 * Requires the route to have a userId parameter or the resource to be owned by user.
 *
 * @param getUserIdFromRequest - Function to extract the target user ID from the request
 *
 * @example
 * // Allow users to view their own profile or admins to view any
 * router.get('/users/:userId', authenticate, selfOrAdmin(req => req.params.userId), getUser);
 */
const selfOrAdmin = (getUserIdFromRequest) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const targetUserId = getUserIdFromRequest(req);
        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        const isSelf = req.user.id === targetUserId;
        if (!isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.',
                code: 'FORBIDDEN'
            });
        }
        next();
    };
};
exports.selfOrAdmin = selfOrAdmin;
/**
 * Teacher of Class Authorization
 *
 * Allows only the teacher assigned to a class (or admins) to modify class resources.
 * Useful for grading, attendance, assignments, etc.
 */
const teacherOfClassOrAdmin = async (req, res, next) => {
    // Import prisma here to avoid circular dependency
    const prisma = (await Promise.resolve().then(() => __importStar(require('../utils/prisma')))).default;
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    // Admins can access any class
    if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return next();
    }
    // Teachers need to verify they own the class
    if (req.user.role === 'TEACHER') {
        const classId = req.params.classId || req.params.id || req.body.classId;
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Class ID is required',
                code: 'BAD_REQUEST'
            });
        }
        try {
            // Get teacher profile
            const teacher = await prisma.teacher.findUnique({
                where: { userId: req.user.id },
                select: { id: true }
            });
            if (!teacher) {
                return res.status(403).json({
                    success: false,
                    message: 'Teacher profile not found',
                    code: 'FORBIDDEN'
                });
            }
            // Check if teacher is assigned to this class
            const classData = await prisma.class.findUnique({
                where: { id: classId },
                select: { teacherId: true }
            });
            if (!classData) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found',
                    code: 'NOT_FOUND'
                });
            }
            if (classData.teacherId !== teacher.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not assigned to this class.',
                    code: 'FORBIDDEN'
                });
            }
            return next();
        }
        catch (error) {
            console.error('Authorization check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization check failed',
                code: 'INTERNAL_ERROR'
            });
        }
    }
    // Other roles cannot access
    return res.status(403).json({
        success: false,
        message: 'Access denied. Teachers or admins only.',
        code: 'FORBIDDEN'
    });
};
exports.teacherOfClassOrAdmin = teacherOfClassOrAdmin;
