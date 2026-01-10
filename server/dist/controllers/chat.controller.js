"use strict";
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
exports.getHistory = exports.sendMessage = exports.getClassChat = void 0;
const chatService = __importStar(require("../services/chat.service"));
const parseId = (id) => parseInt(id);
const getClassChat = async (req, res) => {
    try {
        const classId = parseId(req.params.classId);
        const userId = req.user.userId;
        if (isNaN(classId))
            return res.status(400).json({ message: "Invalid Class ID" });
        const conversation = await chatService.getClassConversation(classId, userId);
        res.json({ success: true, data: conversation });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getClassChat = getClassChat;
const sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user.userId;
        if (!content || !conversationId) {
            return res.status(400).json({ message: "Content and Conversation ID required" });
        }
        const message = await chatService.sendMessage(conversationId, senderId, content);
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendMessage = sendMessage;
const getHistory = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await chatService.getMessages(conversationId);
        res.json({ success: true, data: messages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getHistory = getHistory;
