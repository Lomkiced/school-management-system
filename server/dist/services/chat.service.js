"use strict";
// FILE: server/src/services/chat.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.sendMessage = exports.getClassConversation = void 0;
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
// 1. Get or Create a Chat for a specific Class (Contextual Chat)
const getClassConversation = async (classId, userId) => {
    // Check if conversation exists for this class
    let conversation = await prisma_1.default.conversation.findUnique({
        where: { classId },
        include: {
            messages: {
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: { email: true, id: true, role: true }
                    }
                }
            }
        }
    });
    // If not, create it (First time anyone opens chat for this class)
    if (!conversation) {
        conversation = await prisma_1.default.conversation.create({
            data: {
                type: 'CLASS_GROUP',
                classId: classId,
                name: `Class ${classId} General`
            },
            // FIX 1: The return type must match the findUnique structure above
            include: {
                messages: {
                    include: {
                        sender: {
                            select: { email: true, id: true, role: true }
                        }
                    }
                }
            }
        });
    }
    // Ensure the user calling this is a member of the conversation
    // FIX 2: We use conversation!.id because we guarantee it exists above
    const membership = await prisma_1.default.conversationMember.findUnique({
        where: {
            userId_conversationId: {
                userId,
                conversationId: conversation.id
            }
        }
    });
    if (!membership) {
        await prisma_1.default.conversationMember.create({
            data: {
                userId,
                conversationId: conversation.id
            }
        });
    }
    return conversation;
};
exports.getClassConversation = getClassConversation;
// 2. Send a Message
const sendMessage = async (conversationId, senderId, content) => {
    // A. Save to Database (Persistence)
    const message = await prisma_1.default.message.create({
        data: {
            conversationId,
            senderId,
            content
        },
        include: {
            sender: {
                select: { id: true, email: true, role: true } // Don't send password!
            }
        }
    });
    // B. Broadcast via Socket.io (Real-time)
    try {
        const io = (0, socket_1.getIO)();
        io.to(`conversation_${conversationId}`).emit('receive_message', message);
    }
    catch (error) {
        console.error("Socket emit failed (Server might be restarting):", error);
    }
    return message;
};
exports.sendMessage = sendMessage;
// 3. Get History (Infinite Scroll support)
const getMessages = async (conversationId) => {
    return await prisma_1.default.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }, // Oldest first for chat history
        take: 100, // Limit to last 100 messages
        include: {
            sender: {
                select: { id: true, email: true, role: true }
            }
        }
    });
};
exports.getMessages = getMessages;
