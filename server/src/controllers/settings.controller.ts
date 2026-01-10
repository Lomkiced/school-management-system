import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import prisma from '../utils/prisma';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await auditService.getSystemLogs();
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: "Password updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};