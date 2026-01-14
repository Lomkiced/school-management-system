"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = exports.deleteMessage = exports.markMessagesAsRead = exports.getUnreadCount = exports.sendMessage = exports.getHistory = exports.getContacts = exports.sendClassMessage = exports.getClassConversation = void 0;
const chatService = __importStar(require("../services/chat.service"));

// Class-based chat
function getClassConversation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { classId } = req.params;
            const userId = req.user.id;
            if (!classId || classId.length < 10) {
                return res.status(400).json({ success: false, message: 'Invalid class ID' });
            }
            const conversation = yield chatService.getClassConversation(classId, userId);
            res.json({ success: true, data: conversation });
        }
        catch (error) {
            console.error('Get class conversation error:', error);
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('not authorized')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: error.message || 'Failed to get class conversation' });
        }
    });
}
exports.getClassConversation = getClassConversation;

function sendClassMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { classId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;
            if (!classId || classId.length < 10) {
                return res.status(400).json({ success: false, message: 'Invalid class ID' });
            }
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            const message = yield chatService.sendClassMessage(classId, userId, content.trim());
            res.status(201).json({ success: true, data: message, message: 'Message sent' });
        }
        catch (error) {
            console.error('Send class message error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to send message' });
        }
    });
}
exports.sendClassMessage = sendClassMessage;

// Direct messaging
function getContacts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.user.id;
            const contacts = yield chatService.getContacts(userId);
            res.json({ success: true, data: contacts, count: contacts.length });
        }
        catch (error) {
            console.error('Get contacts error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
        }
    });
}
exports.getContacts = getContacts;

function getHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId } = req.params;
            const myId = req.user.id;
            const history = yield chatService.getChatHistory(myId, userId);
            yield chatService.markAsRead(myId, userId);
            res.json({ success: true, data: history, count: history.length });
        }
        catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
        }
    });
}
exports.getHistory = getHistory;

function sendMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { receiverId, message } = req.body;
            const senderId = req.user.id;
            if (!receiverId || !message) {
                return res.status(400).json({ success: false, message: 'Receiver ID and message are required' });
            }
            const msg = yield chatService.sendMessage(senderId, receiverId, message);
            res.status(201).json({ success: true, data: msg, message: 'Message sent' });
        }
        catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to send message' });
        }
    });
}
exports.sendMessage = sendMessage;

function getUnreadCount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.user.id;
            const count = yield chatService.getUnreadCount(userId);
            res.json({ success: true, data: { count } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get unread count' });
        }
    });
}
exports.getUnreadCount = getUnreadCount;

function markMessagesAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { senderId } = req.params;
            const userId = req.user.id;
            yield chatService.markAsRead(userId, senderId);
            res.json({ success: true, message: 'Messages marked as read' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
        }
    });
}
exports.markMessagesAsRead = markMessagesAsRead;

function deleteMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;
            yield chatService.deleteMessage(messageId, userId);
            res.json({ success: true, message: 'Message deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to delete message' });
        }
    });
}
exports.deleteMessage = deleteMessage;

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
