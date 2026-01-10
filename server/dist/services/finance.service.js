"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentLedger = exports.recordPayment = exports.assignFeeToStudent = exports.getFeeStructures = exports.createFeeStructure = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// 1. Create a Standard Fee (e.g. "Grade 10 Tuition")
const createFeeStructure = async (data) => {
    return await prisma_1.default.feeStructure.create({
        data: {
            name: data.name,
            amount: parseFloat(data.amount),
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : null
        }
    });
};
exports.createFeeStructure = createFeeStructure;
const getFeeStructures = async () => {
    return await prisma_1.default.feeStructure.findMany();
};
exports.getFeeStructures = getFeeStructures;
// 2. Assign Fee to Student (The "Charge")
const assignFeeToStudent = async (data) => {
    return await prisma_1.default.studentFee.create({
        data: {
            studentId: data.studentId,
            feeStructureId: parseInt(data.feeStructureId),
            status: 'PENDING'
        }
    });
};
exports.assignFeeToStudent = assignFeeToStudent;
// 3. Record a Payment
const recordPayment = async (data) => {
    const { studentFeeId, amount, method, transactionId } = data;
    const payAmount = parseFloat(amount);
    // A. Record the payment transaction
    const payment = await prisma_1.default.payment.create({
        data: {
            studentFeeId: parseInt(studentFeeId),
            amount: payAmount,
            method,
            transactionId
        }
    });
    // B. Auto-Update Status (Advanced Logic)
    // We need to check if they have fully paid or not
    const studentFee = await prisma_1.default.studentFee.findUnique({
        where: { id: parseInt(studentFeeId) },
        include: { feeStructure: true, payments: true }
    });
    if (studentFee) {
        const totalPaid = studentFee.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalCost = studentFee.feeStructure.amount;
        let newStatus = 'PARTIAL';
        if (totalPaid >= totalCost)
            newStatus = 'PAID';
        if (totalPaid === 0)
            newStatus = 'PENDING';
        await prisma_1.default.studentFee.update({
            where: { id: studentFee.id },
            data: { status: newStatus }
        });
    }
    return payment;
};
exports.recordPayment = recordPayment;
// 4. Get Student Ledger (The "Account Statement")
const getStudentLedger = async (studentId) => {
    const fees = await prisma_1.default.studentFee.findMany({
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
exports.getStudentLedger = getStudentLedger;
