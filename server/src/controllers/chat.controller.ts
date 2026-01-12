// FILE: server/src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';

/**
 * Get list of available users to chat with
 */
export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await chatService.getContacts(req.user!.id);
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Load message history between current user and selected contact
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params; // The ID of the other person
    const myId = req.user!.id;

    const history = await chatService.getChatHistory(myId, userId);
    
    // Mark these messages as read when history is opened
    await chatService.markAsRead(myId, userId);

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send a new real-time message
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user!.id;

    if (!message || !receiverId) {
      return res.status(400).json({ success: false, message: "Missing message or receiver" });
    }

    const msg = await chatService.sendMessage(senderId, receiverId, message);
    res.json({ success: true, data: msg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};