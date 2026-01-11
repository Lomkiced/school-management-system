// FILE: server/src/routes/auth.routes.ts
import { Router } from 'express';
import { getMe, login, logout, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // <--- Make sure this exists!

// Protected Routes
router.get('/me', authenticate, getMe);

export default router;