import { FeeStatus } from '@prisma/client';
import prisma from '../utils/prisma';

// 1. Create a Standard Fee (e.g. "Grade 10 Tuition")
export const createFeeStructure = async (data: any) => {
  return await prisma.feeStructure.create({
    data: {
      name: data.name,
      amount: parseFloat(data.amount),
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  });
};

export const getFeeStructures = async () => {
  return await prisma.feeStructure.findMany();
};

// 2. Assign Fee to Student (The "Charge")
export const assignFeeToStudent = async (data: any) => {
  return await prisma.studentFee.create({
    data: {
      studentId: data.studentId,
      feeStructureId: parseInt(data.feeStructureId),
      status: 'PENDING'
    }
  });
};

// 3. Record a Payment
export const recordPayment = async (data: any) => {
  const { studentFeeId, amount, method, transactionId } = data;
  const payAmount = parseFloat(amount);

  // A. Record the payment transaction
  const payment = await prisma.payment.create({
    data: {
      studentFeeId: parseInt(studentFeeId),
      amount: payAmount,
      method,
      transactionId
    }
  });

  // B. Auto-Update Status (Advanced Logic)
  // We need to check if they have fully paid or not
  const studentFee = await prisma.studentFee.findUnique({
    where: { id: parseInt(studentFeeId) },
    include: { feeStructure: true, payments: true }
  });

  if (studentFee) {
    const totalPaid = studentFee.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCost = studentFee.feeStructure.amount;

    let newStatus: FeeStatus = 'PARTIAL';
    if (totalPaid >= totalCost) newStatus = 'PAID';
    if (totalPaid === 0) newStatus = 'PENDING';

    await prisma.studentFee.update({
      where: { id: studentFee.id },
      data: { status: newStatus }
    });
  }

  return payment;
};

// 4. Get Student Ledger (The "Account Statement")
export const getStudentLedger = async (studentId: string) => {
  const fees = await prisma.studentFee.findMany({
    where: { studentId },
    include: {
      feeStructure: true,
      payments: { orderBy: { paidAt: 'desc' } }
    }
  });

  // Calculate totals dynamically
  const ledger = fees.map(fee => {
    const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = fee.feeStructure.amount - totalPaid;
    return {
      ...fee,
      totalPaid,
      balance
    };
  });

  return ledger;
};