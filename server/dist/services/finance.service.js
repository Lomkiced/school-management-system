"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPayment = exports.getStudentLedger = exports.createFeeStructure = exports.getAllFees = void 0;
// FILE: server/src/services/finance.service.ts
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../utils/prisma"));
// --- 1. Manage Fee Structures (Admin) ---
const getAllFees = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = query.search ? {
        name: { contains: query.search, mode: 'insensitive' }
    } : {};
    const [total, fees] = await prisma_1.default.$transaction([
        prisma_1.default.feeStructure.count({ where }),
        prisma_1.default.feeStructure.findMany({
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
exports.getAllFees = getAllFees;
const createFeeStructure = async (data) => {
    // e.g. "Grade 10 Tuition" - 15,000
    return await prisma_1.default.feeStructure.create({
        data: {
            name: data.name,
            amount: parseFloat(data.amount),
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            academicYearId: data.academicYearId // Optional if you have year tracking
        }
    });
};
exports.createFeeStructure = createFeeStructure;
// --- 2. Student Ledger (Parents/Students) ---
const getStudentLedger = async (studentId) => {
    // 1. Get the Fees assigned to this student
    const studentFees = await prisma_1.default.studentFee.findMany({
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
exports.getStudentLedger = getStudentLedger;
// --- 3. Record Payment (Cashier) ---
const recordPayment = async (data) => {
    return await prisma_1.default.$transaction(async (tx) => {
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
                data: { status: isPaid ? client_1.FeeStatus.PAID : client_1.FeeStatus.PARTIAL }
            });
        }
        return payment;
    });
};
exports.recordPayment = recordPayment;
