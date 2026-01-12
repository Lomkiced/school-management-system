// FILE: server/src/controllers/finance.controller.ts
import { Request, Response } from 'express';
import * as financeService from '../services/finance.service';

// Export as individual functions (Named Exports)
export const getFeeList = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const fees = await financeService.getAllFees(filters);
    res.json({ success: true, data: fees });
  } catch (error: any) {
    console.error("Finance Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch fees" });
  }
};

export const createFee = async (req: Request, res: Response) => {
  try {
    const fee = await financeService.createFeeStructure(req.body);
    res.status(201).json({ success: true, data: fee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudentLedger = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const ledger = await financeService.getStudentLedger(studentId);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};