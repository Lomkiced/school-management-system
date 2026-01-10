// FILE: server/src/routes/chat.routes.ts
import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all chat routes
router.use(authenticate);

// Get the chat room for a specific class
router.get('/class/:classId', chatController.getClassChat);

// Get message history for a specific room
router.get('/room/:conversationId/messages', chatController.getHistory);

// Send a message
router.post('/send', chatController.sendMessage);

export default router;