// FILE: server/src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await chatService.getContacts(req.user!.id);
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const myId = req.user!.id;

    const history = await chatService.getChatHistory(myId, userId);
    
    // Mark messages as read once they are loaded into the UI
    await chatService.markAsRead(myId, userId);

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user!.id;

    if (!message || !receiverId) {
      return res.status(400).json({ success: false, message: "Receiver and message content are required" });
    }

    const msg = await chatService.sendMessage(senderId, receiverId, message);
    res.json({ success: true, data: msg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};