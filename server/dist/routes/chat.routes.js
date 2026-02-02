"use strict";
// FILE: server/src/routes/chat.routes.ts
// 2026 Standard: Comprehensive chat routes with class-based messaging
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
const chatController = __importStar(require("../controllers/chat.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
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
exports.default = router;
