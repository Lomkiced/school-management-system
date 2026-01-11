// FILE: server/src/types/express.d.ts
import { UserRole } from '@prisma/client'; // Assuming you have Prisma generated types

// Define what payload your JWT holds
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      // Now req.user is strictly typed!
      user?: JwtPayload;
    }
  }
}