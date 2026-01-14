// FILE: server/src/routes/chat.routes.ts
// 2026 Standard: Comprehensive chat routes with class-based messaging

import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// ==================== CLASS-BASED CHAT ====================

/**
 * GET /api/chat/class/:classId
 * Get or create a class conversation (for LMS/Gradebook chat)
 */
router.get('/class/:classId', chatController.getClassConversation);

/**
 * POST /api/chat/class/:classId/send
 * Send a message to a class conversation
 */
router.post('/class/:classId/send', chatController.sendClassMessage);

// ==================== DIRECT MESSAGING ====================

/**
 * GET /api/chat/contacts
 * Get all available contacts for the authenticated user
 */
router.get('/contacts', chatController.getContacts);

/**
 * GET /api/chat/history/:userId
 * Get chat history between current user and another user
 */
router.get('/history/:userId', chatController.getHistory);

/**
 * POST /api/chat/send
 * Send a direct message to another user
 */
router.post('/send', chatController.sendMessage);

/**
 * GET /api/chat/unread
 * Get unread message count
 */
router.get('/unread', chatController.getUnreadCount);

/**
 * PUT /api/chat/read/:senderId
 * Mark messages from a sender as read
 */
router.put('/read/:senderId', chatController.markMessagesAsRead);

/**
 * DELETE /api/chat/:messageId
 * Delete a message
 */
router.delete('/:messageId', chatController.deleteMessage);

export default router;