// FILE: server/src/services/chat.service.ts
import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

/**
 * 1. Get all available contacts for a user
 * Includes profiles to show actual names (Pedro, Maria, etc.)
 */
export const getContacts = async (userId: string) => {
  return await prisma.user.findMany({
    where: {
      id: { not: userId },
      isActive: true
    },
    select: {
      id: true,
      email: true,
      role: true,
      adminProfile: { select: { firstName: true, lastName: true } },
      teacherProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { firstName: true, lastName: true } },
      parentProfile: { select: { firstName: true, lastName: true } }
    }
  });
};

/**
 * 2. Get message history between two users
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
 * 3. Mark messages from a specific sender to the current user as read
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
 * 4. Send a Direct Message
 */
export const sendMessage = async (senderId: string, receiverId: string, message: string) => {
  const chatMessage = await prisma.chat.create({
    data: {
      senderId,
      receiverId,
      message,
      isRead: false
    },
    include: {
      sender: { 
        select: { 
          id: true, 
          email: true,
          adminProfile: { select: { firstName: true, lastName: true } },
          teacherProfile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { firstName: true, lastName: true } },
          parentProfile: { select: { firstName: true, lastName: true } }
        } 
      }
    }
  });

  // Emit real-time notification via Socket.io
  const io = getIO();
  io.to(`user_${receiverId}`).emit('new_message', chatMessage);

  return chatMessage;
};