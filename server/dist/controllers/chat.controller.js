"use strict";
// FILE: server/src/controllers/chat.controller.ts
// 2026 Standard: Comprehensive chat controller with class-based messaging
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
exports.ChatController = void 0;
exports.getClassConversation = getClassConversation;
exports.sendClassMessage = sendClassMessage;
exports.getContacts = getContacts;
exports.getHistory = getHistory;
exports.sendMessage = sendMessage;
exports.getUnreadCount = getUnreadCount;
exports.markMessagesAsRead = markMessagesAsRead;
exports.deleteMessage = deleteMessage;
const chatService = __importStar(require("../services/chat.service"));
// ==================== CLASS-BASED CHAT ====================
/**
 * Get or create a class conversation
 * Returns class info, enrolled participants, and messages
 */
async function getClassConversation(req, res) {
    try {
        const { classId } = req.params;
        const userId = req.user.id;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        const conversation = await chatService.getClassConversation(classId, userId);
        res.json({
            success: true,
            data: conversation
        });
    }
    catch (error) {
        console.error('Get class conversation error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('not enrolled') || error.message.includes('not authorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get class conversation'
        });
    }
}
/**
 * Send a message to a class conversation
 */
async function sendClassMessage(req, res) {
    try {
        const { classId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        if (!classId || classId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }
        const message = await chatService.sendClassMessage(classId, userId, content.trim());
        res.status(201).json({
            success: true,
            data: message,
            message: 'Message sent'
        });
    }
    catch (error) {
        console.error('Send class message error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
}
// ==================== DIRECT MESSAGING ====================
/**
 * Get all contacts for the authenticated user
 */
async function getContacts(req, res) {
    try {
        const userId = req.user.id;
        const contacts = await chatService.getContacts(userId);
        res.json({
            success: true,
            data: contacts,
            count: contacts.length
        });
    }
    catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch contacts'
        });
    }
}
/**
 * Get chat history between current user and another user
 */
async function getHistory(req, res) {
    try {
        const { userId } = req.params;
        const myId = req.user.id;
        if (!userId || userId.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const history = await chatService.getChatHistory(myId, userId);
        await chatService.markAsRead(myId, userId);
        res.json({
            success: true,
            data: history,
            count: history.length
        });
    }
    catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch chat history'
        });
    }
}
/**
 * Send a direct message to another user
 */
async function sendMessage(req, res) {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user.id;
        if (!receiverId || !message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and message are required'
            });
        }
        const msg = await chatService.sendMessage(senderId, receiverId, message);
        res.status(201).json({
            success: true,
            data: msg,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
}
/**
 * Get unread message count for current user
 */
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;
        const count = await chatService.getUnreadCount(userId);
        res.json({
            success: true,
            data: { count }
        });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
}
/**
 * Mark messages from a sender as read
 */
async function markMessagesAsRead(req, res) {
    try {
        const { senderId } = req.params;
        const userId = req.user.id;
        await chatService.markAsRead(userId, senderId);
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
}
/**
 * Delete a message
 */
async function deleteMessage(req, res) {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        await chatService.deleteMessage(messageId, userId);
        res.json({
            success: true,
            message: 'Message deleted'
        });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete message'
        });
    }
}
// Export as object for convenience
exports.ChatController = {
    getClassConversation,
    sendClassMessage,
    getContacts,
    getHistory,
    sendMessage,
    getUnreadCount,
    markMessagesAsRead,
    deleteMessage
};
