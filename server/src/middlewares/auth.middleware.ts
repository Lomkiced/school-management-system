// FILE: server/src/middlewares/auth.middleware.ts
import { UserRole } from '@prisma/client'; // <--- Import Enum
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// STRICT TYPE DEFINITION
interface JwtPayload {
  id: string;
  role: UserRole; // <--- Changed from 'string' to 'UserRole'
  email: string;
}

// Augment Express Request to match
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check Cookie first (Best for Web)
    let token = req.cookies?.token;

    // 2. Fallback to Header (Best for API/Mobile)
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // 3. Verify Token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};