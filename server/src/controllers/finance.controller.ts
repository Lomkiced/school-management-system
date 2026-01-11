// FILE: server/src/controllers/finance.controller.ts
import { Request, Response } from 'express';
import * as financeService from '../services/finance.service';

const createFee = async (req: Request, res: Response) => {
  try {
    const fee = await financeService.createFeeStructure(req.body);
    res.status(201).json({ success: true, data: fee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getFees = async (req: Request, res: Response) => {
  try {
    const fees = await financeService.getFeeStructures();
    res.json({ success: true, data: fees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignFee = async (req: Request, res: Response) => {
  try {
    const result = await financeService.assignFeeToStudent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Renamed from 'pay' to 'recordPayment' to match Route
const recordPayment = async (req: Request, res: Response) => {
  try {
    const result = await financeService.recordPayment(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Renamed from 'getLedger' to 'getStudentLedger' to match Route
const getStudentLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await financeService.getStudentLedger(req.params.studentId);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXPORT AS UNIFIED OBJECT
export const FinanceController = {
  createFee,
  getFees,
  assignFee,
  recordPayment,
  getStudentLedger
};