// FILE: server/src/middlewares/authorize.middleware.ts
// 2026 Standard: Role-based access control middleware

import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

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
export const authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Role-specific authorization middlewares for common use cases
 * These are pre-configured authorize functions for convenience
 */

/** Only Super Admins can access */
export const superAdminOnly = authorize(['SUPER_ADMIN']);

/** Only Admins and Super Admins can access */
export const adminOnly = authorize(['ADMIN', 'SUPER_ADMIN']);

/** Teachers, Admins, and Super Admins can access */
export const teacherAndAbove = authorize(['TEACHER', 'ADMIN', 'SUPER_ADMIN']);

/** Students, Teachers, Admins, and Super Admins can access (excludes parents) */
export const studentAndAbove = authorize(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']);

/** All authenticated users can access */
export const anyAuthenticated = authorize(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PARENT']);

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
export const selfOrAdmin = (getUserIdFromRequest: (req: Request) => string | undefined) => {
    return (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Teacher of Class Authorization
 * 
 * Allows only the teacher assigned to a class (or admins) to modify class resources.
 * Useful for grading, attendance, assignments, etc.
 */
export const teacherOfClassOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // Import prisma here to avoid circular dependency
    const prisma = (await import('../utils/prisma')).default;

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
        } catch (error) {
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
