// FILE: server/src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';

const parseId = (id: string) => parseInt(id);

export const getClassChat = async (req: Request, res: Response) => {
  try {
    const classId = parseId(req.params.classId);
    const userId = (req as any).user.userId;

    if (isNaN(classId)) return res.status(400).json({ message: "Invalid Class ID" });

    const conversation = await chatService.getClassConversation(classId, userId);
    res.json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = (req as any).user.userId;

    if (!content || !conversationId) {
      return res.status(400).json({ message: "Content and Conversation ID required" });
    }

    const message = await chatService.sendMessage(conversationId, senderId, content);
    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};