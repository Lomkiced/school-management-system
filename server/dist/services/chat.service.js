"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContacts = getContacts;
exports.getChatHistory = getChatHistory;
exports.markAsRead = markAsRead;
exports.sendMessage = sendMessage;
exports.getUnreadCount = getUnreadCount;
exports.getUnreadMessagesBySender = getUnreadMessagesBySender;
exports.deleteMessage = deleteMessage;
// FILE: server/src/services/chat.service.ts
const socket_1 = require("../lib/socket");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Chat Service
 * Handles all chat-related operations
 */
/**
 * Get all available contacts for a user
 * Returns all active users except the current user
 */
async function getContacts(userId) {
    try {
        const contacts = await prisma_1.default.user.findMany({
            where: {
                id: { not: userId },
                isActive: true
            },
            select: {
                id: true,
                email: true,
                role: true,
                adminProfile: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                teacherProfile: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                studentProfile: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                parentProfile: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                email: 'asc'
            }
        });
        return contacts;
    }
    catch (error) {
        console.error('Error fetching contacts:', error);
        throw new Error('Failed to fetch contacts');
    }
}
/**
 * Get message history between two users
 * Returns messages sorted by creation date (oldest first)
 */
async function getChatHistory(userId, otherUserId) {
    try {
        const messages = await prisma_1.default.chat.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        return messages;
    }
    catch (error) {
        console.error('Error fetching chat history:', error);
        throw new Error('Failed to fetch chat history');
    }
}
/**
 * Mark all messages from a specific sender as read
 */
async function markAsRead(userId, senderId) {
    try {
        const result = await prisma_1.default.chat.updateMany({
            where: {
                receiverId: userId,
                senderId: senderId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
        return result;
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        throw new Error('Failed to mark messages as read');
    }
}
/**
 * Send a direct message to another user
 * Emits real-time notification via Socket.io
 */
async function sendMessage(senderId, receiverId, message) {
    try {
        // Validate inputs
        if (!senderId || !receiverId || !message) {
            throw new Error('Sender, receiver, and message are required');
        }
        if (message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        // Check if receiver exists and is active
        const receiver = await prisma_1.default.user.findUnique({
            where: { id: receiverId },
            select: { isActive: true }
        });
        if (!receiver) {
            throw new Error('Receiver not found');
        }
        if (!receiver.isActive) {
            throw new Error('Receiver account is inactive');
        }
        // Create the message
        const chatMessage = await prisma_1.default.chat.create({
            data: {
                senderId,
                receiverId,
                message: message.trim(),
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        adminProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        teacherProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        studentProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        parentProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        // Real-time delivery via Socket.io
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user_${receiverId}`).emit('new_message', chatMessage);
        }
        catch (socketError) {
            console.error('Socket.io emission failed:', socketError);
            // Don't throw - message is saved, socket failure is not critical
        }
        return chatMessage;
    }
    catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}
/**
 * Get unread message count for a user
 */
async function getUnreadCount(userId) {
    try {
        const count = await prisma_1.default.chat.count({
            where: {
                receiverId: userId,
                isRead: false
            }
        });
        return count;
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        throw new Error('Failed to get unread message count');
    }
}
/**
 * Get unread messages grouped by sender
 */
async function getUnreadMessagesBySender(userId) {
    try {
        const unreadMessages = await prisma_1.default.chat.findMany({
            where: {
                receiverId: userId,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        adminProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        teacherProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        studentProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        parentProfile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Group by sender
        const grouped = unreadMessages.reduce((acc, msg) => {
            const senderId = msg.senderId;
            if (!acc[senderId]) {
                acc[senderId] = {
                    sender: msg.sender,
                    count: 0,
                    lastMessage: msg
                };
            }
            acc[senderId].count++;
            return acc;
        }, {});
        return Object.values(grouped);
    }
    catch (error) {
        console.error('Error getting unread messages by sender:', error);
        throw new Error('Failed to get unread messages');
    }
}
/**
 * Delete a message (soft delete by marking as deleted)
 * Note: You may need to add a 'deletedAt' field to your schema for this
 */
async function deleteMessage(messageId, userId) {
    try {
        // Verify the user owns this message
        const message = await prisma_1.default.chat.findUnique({
            where: { id: messageId },
            select: { senderId: true }
        });
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('You can only delete your own messages');
        }
        // Delete the message
        const deleted = await prisma_1.default.chat.delete({
            where: { id: messageId }
        });
        return deleted;
    }
    catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}
