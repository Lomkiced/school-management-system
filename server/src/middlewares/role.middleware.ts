// FILE: server/src/middlewares/role.middleware.ts
import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

/**
 * RESTRICT TO
 * Only allows users with specific roles to access the route.
 * Usage: router.get('/', restrictTo('ADMIN', 'SUPER_ADMIN'), controller.action);
 */
export const restrictTo = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Check if user exists (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not authenticated.' 
      });
    }

    // 2. Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`⛔ ACCESS DENIED: User ${req.user.email} (${req.user.role}) tried to access restricted route.`);
      
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You do not have permission to perform this action.' 
      });
    }

    // 3. Allowed! Proceed.
    next();
  };
};