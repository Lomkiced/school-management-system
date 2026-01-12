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
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    data: fees,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const createFeeStructure = async (data: any) => {
  // e.g. "Grade 10 Tuition" - 15,000
  return await prisma.feeStructure.create({
    data: {
      name: data.name,
      amount: parseFloat(data.amount),
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      academicYearId: data.academicYearId // Optional if you have year tracking
    }
  });
};

// --- 2. Student Ledger (Parents/Students) ---

export const getStudentLedger = async (studentId: string) => {
  // 1. Get the Fees assigned to this student
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

  const ledger = studentFees.map(fee => {
    const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = fee.feeStructure.amount - paid;
    
    totalDue += fee.feeStructure.amount;
    totalPaid += paid;

    return {
      id: fee.id,
      title: fee.feeStructure.name,
      amount: fee.feeStructure.amount,
      paid: paid,
      balance: balance,
      status: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
      dueDate: fee.feeStructure.dueDate
    };
  });

  return {
    summary: {
      totalDue,
      totalPaid,
      outstanding: totalDue - totalPaid
    },
    items: ledger
  };
};

// --- 3. Record Payment (Cashier) ---
export const recordPayment = async (data: { studentFeeId: string, amount: number, method: PaymentMethod, reference?: string }) => {
  return await prisma.$transaction(async (tx) => {
    // A. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        studentFeeId: data.studentFeeId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        paidAt: new Date()
      }
    });

    // B. Check Balance & Update Status
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