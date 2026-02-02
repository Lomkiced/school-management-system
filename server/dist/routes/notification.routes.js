"use strict";
// FILE: server/src/routes/notification.routes.ts
// 2026 Standard: Notification routes for the notification center
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const NotificationService = __importStar(require("../services/notification.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit, unreadOnly, type } = req.query;
        const result = await NotificationService.getUserNotifications(userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            unreadOnly: unreadOnly === 'true',
            type: type
        });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/notifications/unread-count
 * Get unread notification count for badge
 */
router.get('/unread-count', async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user.id);
        res.json({ success: true, count });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
    try {
        await NotificationService.markAsRead(req.params.id, req.user.id);
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res) => {
    try {
        const result = await NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: `Marked ${result.count} notifications as read` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
    try {
        await NotificationService.deleteNotification(req.params.id, req.user.id);
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
