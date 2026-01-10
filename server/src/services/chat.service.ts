// FILE: server/src/services/chat.service.ts

import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// 1. Get or Create a Chat for a specific Class (Contextual Chat)
export const getClassConversation = async (classId: number, userId: string) => {
  // Check if conversation exists for this class
  let conversation = await prisma.conversation.findUnique({
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
    conversation = await prisma.conversation.create({
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
  const membership = await prisma.conversationMember.findUnique({
    where: { 
      userId_conversationId: { 
        userId, 
        conversationId: conversation!.id 
      } 
    }
  });

  if (!membership) {
    await prisma.conversationMember.create({
      data: { 
        userId, 
        conversationId: conversation!.id 
      }
    });
  }

  return conversation;
};

// 2. Send a Message
export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  // A. Save to Database (Persistence)
  const message = await prisma.message.create({
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
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit('receive_message', message);
  } catch (error) {
    console.error("Socket emit failed (Server might be restarting):", error);
  }

  return message;
};

// 3. Get History (Infinite Scroll support)
export const getMessages = async (conversationId: string) => {
  return await prisma.message.findMany({
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