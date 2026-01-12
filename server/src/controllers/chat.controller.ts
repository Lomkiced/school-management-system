// FILE: server/src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';

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

    // Validation
    if (!userId || userId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }

    if (userId === myId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot chat with yourself' 
      });
    }

    // Fetch history
    const history = await chatService.getChatHistory(myId, userId);
    
    // Mark messages as read
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
 * Send a message to another user
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user!.id;

    // Validation
    if (!receiverId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Receiver ID is required' 
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }

    if (receiverId === senderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send message to yourself' 
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is too long (max 5000 characters)' 
      });
    }

    // Send message
    const msg = await chatService.sendMessage(senderId, receiverId, message);

    res.status(201).json({ 
      success: true, 
      data: msg,
      message: 'Message sent successfully'
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    if (error.message.includes('inactive')) {
      return res.status(403).json({ 
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
      message: error.message || 'Failed to get unread count'
    });
  }
}

/**
 * Get unread messages grouped by sender
 */
export async function getUnreadMessages(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const messages = await chatService.getUnreadMessagesBySender(userId);
    
    res.json({ 
      success: true, 
      data: messages
    });
  } catch (error: any) {
    console.error('Get unread messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get unread messages'
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

    if (!senderId || senderId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid sender ID' 
      });
    }

    await chatService.markAsRead(userId, senderId);
    
    res.json({ 
      success: true, 
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to mark messages as read'
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

    if (!messageId || messageId.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid message ID' 
      });
    }

    await chatService.deleteMessage(messageId, userId);
    
    res.json({ 
      success: true, 
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    if (error.message.includes('only delete your own')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete message'
    });
  }
}

// Export as both individual functions and as an object
export const ChatController = {
  getContacts,
  getHistory,
  sendMessage,
  getUnreadCount,
  getUnreadMessages,
  markMessagesAsRead,
  deleteMessage
};