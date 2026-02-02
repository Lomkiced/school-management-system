// FILE: server/src/routes/notification.routes.ts
// 2026 Standard: Notification routes for the notification center

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as NotificationService from '../services/notification.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user!.id;
        const { page, limit, unreadOnly, type } = req.query;

        const result = await NotificationService.getUserNotifications(userId, {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            unreadOnly: unreadOnly === 'true',
            type: type as any
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for badge
 */
router.get('/unread-count', async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user!.id);
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
    try {
        await NotificationService.markAsRead(req.params.id, req.user!.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res) => {
    try {
        const result = await NotificationService.markAllAsRead(req.user!.id);
        res.json({ success: true, message: `Marked ${result.count} notifications as read` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
    try {
        await NotificationService.deleteNotification(req.params.id, req.user!.id);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
