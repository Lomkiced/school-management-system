// FILE: server/src/middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    // 1. Check if header exists
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No authorization header provided.' 
      });
    }

    // 2. Extract Token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Malformed token.' 
      });
    }

    // 3. Verify Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("CRITICAL: JWT_SECRET is not defined in environment variables.");
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // 4. Attach to Request (Type-safe now!)
    req.user = decoded;
    
    next();
  } catch (error) {
    // 5. Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please log in again.' 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};