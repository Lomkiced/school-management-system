// FILE: server/src/services/chat.service.ts
// 2026 Standard: Comprehensive chat service with class-based messaging

import { getIO } from '../lib/socket';
import prisma from '../utils/prisma';

// In-memory storage for class messages (since schema doesn't have ClassMessage model)
// In production, you would add a proper model to the schema
const classMessages: Map<string, any[]> = new Map();

// ==================== CLASS-BASED CHAT ====================

/**
 * Get or create a class conversation
 * Returns class info and messages for that class
 */
export async function getClassConversation(classId: string, userId: string) {
  // 1. Verify class exists
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, userId: true } },
      subject: { select: { name: true, code: true } },
      enrollments: {
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, userId: true }
          }
        }
      }
    }
  });

  if (!classInfo) {
    throw new Error('Class not found');
  }

  // 2. Check if user is authorized (teacher of class or enrolled student)
  const isTeacher = classInfo.teacher?.userId === userId;
  const isEnrolled = classInfo.enrollments.some(e => e.student.userId === userId);

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isTeacher && !isEnrolled && !isAdmin) {
    throw new Error('You are not authorized to view this class conversation');
  }

  // 3. Get messages for this class (from in-memory storage)
  const messages = classMessages.get(classId) || [];

  return {
    id: classId,
    classInfo: {
      id: classInfo.id,
      name: classInfo.name,
      teacher: classInfo.teacher,
      subject: classInfo.subject
    },
    participants: [
      ...(classInfo.teacher ? [{ ...classInfo.teacher, role: 'TEACHER' }] : []),
      ...classInfo.enrollments.map(e => ({ ...e.student, role: 'STUDENT' }))
    ],
    messages
  };
}

/**
 * Send a message to a class conversation
 */
export async function sendClassMessage(classId: string, userId: string, content: string) {
  // 1. Verify class exists and user is authorized
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: { select: { userId: true } },
      enrollments: {
        include: {
          student: { select: { userId: true } }
        }
      }
    }
  });

  if (!classInfo) {
    throw new Error('Class not found');
  }

  const isTeacher = classInfo.teacher?.userId === userId;
  const isEnrolled = classInfo.enrollments.some(e => e.student.userId === userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isTeacher && !isEnrolled && !isAdmin) {
    throw new Error('You are not authorized to send messages to this class');
  }

  // 2. Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teacherProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { firstName: true, lastName: true } },
      adminProfile: { select: { firstName: true, lastName: true } }
    }
  });

  const senderName = sender?.teacherProfile || sender?.studentProfile || sender?.adminProfile || { firstName: 'Unknown', lastName: 'User' };

  // 3. Create message
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classId,
    senderId: userId,
    sender: {
      id: userId,
      role: sender?.role,
      firstName: senderName.firstName,
      lastName: senderName.lastName
    },
    content,
    createdAt: new Date().toISOString()
  };

  // 4. Store message
  if (!classMessages.has(classId)) {
    classMessages.set(classId, []);
  }
  classMessages.get(classId)!.push(message);

  // Keep only last 100 messages per class
  const messages = classMessages.get(classId)!;
  if (messages.length > 100) {
    classMessages.set(classId, messages.slice(-100));
  }

  // 5. Emit via Socket.io
  try {
    const io = getIO();
    io.to(`class_${classId}`).emit('class_message', message);
  } catch (socketError) {
    console.error('Socket.io emission failed:', socketError);
  }

  return message;
}

// ==================== DIRECT MESSAGING ====================

/**
 * Get all available contacts for a user
 */
export async function getContacts(userId: string) {
  const contacts = await prisma.user.findMany({
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
    },
    orderBy: { email: 'asc' }
  });

  return contacts;
}

/**
 * Get message history between two users
 */
export async function getChatHistory(userId: string, otherUserId: string) {
  const messages = await prisma.chat.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, email: true, role: true } },
      receiver: { select: { id: true, email: true, role: true } }
    }
  });

  return messages;
}

/**
 * Mark all messages from a specific sender as read
 */
export async function markAsRead(userId: string, senderId: string) {
  return await prisma.chat.updateMany({
    where: {
      receiverId: userId,
      senderId: senderId,
      isRead: false
    },
    data: { isRead: true }
  });
}

/**
 * Send a direct message to another user
 */
export async function sendMessage(senderId: string, receiverId: string, message: string) {
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { isActive: true }
  });

  if (!receiver) {
    throw new Error('Receiver not found');
  }

  if (!receiver.isActive) {
    throw new Error('Receiver account is inactive');
  }

  const chatMessage = await prisma.chat.create({
    data: {
      senderId,
      receiverId,
      message: message.trim(),
      isRead: false
    },
    include: {
      sender: { select: { id: true, email: true, role: true } },
      receiver: { select: { id: true, email: true, role: true } }
    }
  });

  // Real-time delivery via Socket.io
  try {
    const io = getIO();
    io.to(`user_${receiverId}`).emit('new_message', chatMessage);
  } catch (socketError) {
    console.error('Socket.io emission failed:', socketError);
  }

  return chatMessage;
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string) {
  return await prisma.chat.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });
}

/**
 * Get unread messages grouped by sender
 */
export async function getUnreadMessagesBySender(userId: string) {
  const unreadMessages = await prisma.chat.findMany({
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
          adminProfile: { select: { firstName: true, lastName: true } },
          teacherProfile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { firstName: true, lastName: true } },
          parentProfile: { select: { firstName: true, lastName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by sender
  const grouped = unreadMessages.reduce((acc: any, msg) => {
    const senderId = msg.senderId;
    if (!acc[senderId]) {
      acc[senderId] = { sender: msg.sender, count: 0, lastMessage: msg };
    }
    acc[senderId].count++;
    return acc;
  }, {});

  return Object.values(grouped);
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.chat.findUnique({
    where: { id: messageId },
    select: { senderId: true }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  if (message.senderId !== userId) {
    throw new Error('You can only delete your own messages');
  }

  return await prisma.chat.delete({
    where: { id: messageId }
  });
}