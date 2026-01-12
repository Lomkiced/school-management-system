// FILE: server/src/middlewares/role.middleware.ts
import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

export const restrictTo = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Safety Check: User must exist
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: User not identified' 
      });
    }

    // 2. Role Check (with Type Assertion for safety)
    // We cast to UserRole to satisfy TypeScript if data comes in loosely
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }

    next();
  };
};