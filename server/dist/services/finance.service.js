// FILE: server/src/services/finance.service.ts
import { FeeStatus, PaymentMethod, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

// --- 1. Manage Fee Structures (Admin) ---

export const getAllFees = async (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where: Prisma.FeeStructureWhereInput = query.search ? {
    name: { contains: query.search, mode: 'insensitive' }
  } : {};

  const [total, fees] = await prisma.$transaction([
    prisma.feeStructure.count({ where }),
    prisma.feeStructure.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // schema now has createdAt
      include: { academicYear: true }
    })
  ]);

  return {
    data: fees,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const createFeeStructure = async (data: any) => {
  return await prisma.feeStructure.create({
    data: {
      name: data.name,
      amount: parseFloat(data.amount),
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      academicYearId: data.academicYearId 
    }
  });
};

// --- 2. Student Ledger (Parents/Students) ---

export const getStudentLedger = async (studentId: string) => {
  // 1. Get Fees assigned to student
  const studentFees = await prisma.studentFee.findMany({
    where: { studentId },
    include: {
      feeStructure: true,
      payments: {
        orderBy: { paidAt: 'desc' }
      }
    }
  });

  // 2. Calculate Totals
  let totalDue = 0;
  let totalPaid = 0;

  const items = studentFees.map(fee => {
    const paidAmount = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = fee.feeStructure.amount - paidAmount;
    
    totalDue += fee.feeStructure.amount;
    totalPaid += paidAmount;

    return {
      id: fee.id,
      title: fee.feeStructure.name,
      amount: fee.feeStructure.amount,
      paid: paidAmount,
      balance: balance,
      status: balance <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
      dueDate: fee.feeStructure.dueDate
    };
  });

  return {
    summary: {
      totalDue,
      totalPaid,
      outstanding: totalDue - totalPaid
    },
    items
  };
};

// --- 3. Record Payment (Cashier) ---
export const recordPayment = async (data: { studentFeeId: string, amount: number, method: PaymentMethod, reference?: string }) => {
  return await prisma.$transaction(async (tx) => {
    // A. Create Payment
    const payment = await tx.payment.create({
      data: {
        studentFeeId: data.studentFeeId, // Now compatible (String -> String)
        amount: data.amount,
        method: data.method,
        reference: data.reference
      }
    });

    // B. Update Status
    const fee = await tx.studentFee.findUnique({
      where: { id: data.studentFeeId },
      include: { feeStructure: true, payments: true }
    });

    if (fee) {
      const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
      const isPaid = totalPaid >= fee.feeStructure.amount;
      
      await tx.studentFee.update({
        where: { id: fee.id },
        data: { status: isPaid ? FeeStatus.PAID : FeeStatus.PARTIAL }
      });
    }

    return payment;
  });
};