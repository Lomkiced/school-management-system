// FILE: server/src/controllers/chat.controller.ts
// 2026 Standard: Comprehensive chat controller with class-based messaging

import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';

// ==================== CLASS-BASED CHAT ====================

/**
 * Get or create a class conversation
 * Returns class info, enrolled participants, and messages
 */
export async function getClassConversation(req: Request, res: Response) {
  try {
    const { classId } = req.params;
    const userId = req.user!.id;

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
  } catch (error: any) {
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
export async function sendClassMessage(req: Request, res: Response) {
  try {
    const { classId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

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
  } catch (error: any) {
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
export async function getContacts(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const contacts = await chatService.getContacts(userId);

    res.json({
      success: true,
      data: contacts,
      count: contacts.length
    });
  } catch (error: any) {
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
export async function getHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const myId = req.user!.id;

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
  } catch (error: any) {
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
export async function sendMessage(req: Request, res: Response) {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user!.id;

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
  } catch (error: any) {
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
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const count = await chatService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
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
export async function markMessagesAsRead(req: Request, res: Response) {
  try {
    const { senderId } = req.params;
    const userId = req.user!.id;

    await chatService.markAsRead(userId, senderId);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
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
export async function deleteMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    await chatService.deleteMessage(messageId, userId);

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
}

// Export as object for convenience
export const ChatController = {
  getClassConversation,
  sendClassMessage,
  getContacts,
  getHistory,
  sendMessage,
  getUnreadCount,
  markMessagesAsRead,
  deleteMessage
};