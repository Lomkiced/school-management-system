// FILE: server/src/routes/chat.routes.ts
import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// 1. User List / Contacts
router.get('/contacts', chatController.getContacts);

// 2. Chat History with a specific user
router.get('/history/:userId', chatController.getHistory);

// 3. Send a direct message
router.post('/send', chatController.sendMessage);

export default router;