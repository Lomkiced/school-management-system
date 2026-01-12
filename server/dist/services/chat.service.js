// FILE: server/src/services/chat.service.ts
import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

/**
 * 1. Send a Message
 * In your schema, the model is named "Chat" with senderId and receiverId
 */
export const sendMessage = async (senderId: string, receiverId: string, message: string) => {
  // Create the record in the 'Chat' table as defined in your schema
  const chatMessage = await prisma.chat.create({
    data: {
      senderId,
      receiverId,
      message,
      isRead: false
    },
    include: {
      sender: { select: { id: true, email: true, role: true } },
      receiver: { select: { id: true, email: true, role: true } }
    }
  });

  // Emit to Socket.io for real-time delivery
  const io = getIO();
  io.to(`user_${receiverId}`).emit('new_message', chatMessage);

  return chatMessage;
};

/**
 * 2. Get Chat History between two users
 */
export const getChatHistory = async (userId: string, otherUserId: string) => {
  return await prisma.chat.findMany({
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
      sender: { select: { id: true, email: true } },
      receiver: { select: { id: true, email: true } }
    }
  });
};

/**
 * 3. Mark messages as read
 */
export const markAsRead = async (userId: string, senderId: string) => {
  return await prisma.chat.updateMany({
    where: {
      receiverId: userId,
      senderId: senderId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};

/**
 * 4. Get all contacts (Users I've chatted with or can chat with)
 */
export const getContacts = async (userId: string) => {
  // This gets all users except current user
  return await prisma.user.findMany({
    where: {
      id: { not: userId },
      isActive: true
    },
    select: {
      id: true,
      email: true,
      role: true,
      // Include profiles to get names
      adminProfile: { select: { firstName: true, lastName: true } },
      teacherProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { firstName: true, lastName: true } },
      parentProfile: { select: { firstName: true, lastName: true } }
    }
  });
};