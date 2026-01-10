// FILE: server/src/types/express.d.ts

import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export { };
