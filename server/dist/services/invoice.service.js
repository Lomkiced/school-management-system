"use strict";
// FILE: server/src/services/invoice.service.ts
// 2026 Standard: Automated invoice generation and management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlyInvoices = generateMonthlyInvoices;
exports.checkOverdueInvoices = checkOverdueInvoices;
exports.recordInvoicePayment = recordInvoicePayment;
exports.getInvoices = getInvoices;
exports.getInvoiceById = getInvoiceById;
exports.getStudentBalance = getStudentBalance;
const prisma_1 = __importDefault(require("../utils/prisma"));
const notification_service_1 = require("./notification.service");
// ================= INVOICE GENERATION =================
/**
 * Generate monthly invoices for all active students based on grade level
 * Called by CRON job on the 1st of each month
 */
async function generateMonthlyInvoices(billingMonth = new Date()) {
    const monthName = billingMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const yearPrefix = billingMonth.getFullYear();
    // Get all active students with their grade levels
    const students = await prisma_1.default.student.findMany({
        where: {
            user: { isActive: true }
        },
        include: {
            user: true
        }
    });
    const invoices = [];
    let invoiceCounter = await getNextInvoiceNumber(yearPrefix);
    for (const student of students) {
        // Get fee structure based on grade level
        const feeItems = await getFeesByGradeLevel(student.gradeLevel);
        if (feeItems.length === 0)
            continue;
        const totalAmount = feeItems.reduce((sum, fee) => sum + fee.amount, 0);
        const invoiceNumber = `INV-${yearPrefix}-${String(invoiceCounter++).padStart(5, '0')}`;
        // Calculate due date (15th of billing month)
        const dueDate = new Date(billingMonth.getFullYear(), billingMonth.getMonth(), 15);
        // Create invoice with items
        const invoice = await prisma_1.default.invoice.create({
            data: {
                invoiceNumber,
                studentId: student.id,
                amount: totalAmount,
                dueDate,
                billingPeriod: monthName,
                description: `Monthly tuition and fees for ${monthName}`,
                items: {
                    create: feeItems.map(fee => ({
                        description: fee.name,
                        amount: fee.amount,
                        quantity: 1
                    }))
                }
            },
            include: { items: true }
        });
        invoices.push(invoice);
        // Send notification to student/parent
        await (0, notification_service_1.createNotification)({
            userId: student.userId,
            type: 'INVOICE_GENERATED',
            title: 'New Invoice Generated',
            message: `Your invoice for ${monthName} (${invoiceNumber}) totaling ₱${totalAmount.toLocaleString()} is due on ${dueDate.toLocaleDateString()}.`,
            link: `/finance/invoices/${invoice.id}`,
            metadata: { invoiceId: invoice.id, amount: totalAmount }
        });
    }
    console.log(`✅ Generated ${invoices.length} invoices for ${monthName}`);
    return invoices;
}
/**
 * Get fee structure items for a specific grade level
 */
async function getFeesByGradeLevel(gradeLevel) {
    // Get current academic year
    const currentYear = await prisma_1.default.academicYear.findFirst({
        where: { isCurrent: true }
    });
    if (!currentYear)
        return [];
    // Get fees associated with this academic year
    // In production, you'd have grade-level specific fees
    const fees = await prisma_1.default.feeStructure.findMany({
        where: {
            academicYearId: currentYear.id
        }
    });
    return fees;
}
/**
 * Get next invoice number for the year
 */
async function getNextInvoiceNumber(year) {
    const lastInvoice = await prisma_1.default.invoice.findFirst({
        where: {
            invoiceNumber: { startsWith: `INV-${year}` }
        },
        orderBy: { invoiceNumber: 'desc' }
    });
    if (!lastInvoice)
        return 1;
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
    return lastNumber + 1;
}
// ================= OVERDUE DETECTION =================
/**
 * Check for overdue invoices and block portal access
 * Called daily by CRON job
 */
async function checkOverdueInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Find unpaid invoices past due date
    const overdueInvoices = await prisma_1.default.invoice.findMany({
        where: {
            status: { in: ['PENDING'] },
            dueDate: { lt: today },
            isOverdue: false
        },
        include: {
            student: {
                include: { user: true, parent: { include: { user: true } } }
            }
        }
    });
    const blocked = [];
    for (const invoice of overdueInvoices) {
        // Mark invoice as overdue
        await prisma_1.default.invoice.update({
            where: { id: invoice.id },
            data: { isOverdue: true, status: 'OVERDUE' }
        });
        // Block student portal access
        await prisma_1.default.student.update({
            where: { id: invoice.studentId },
            data: { isPortalBlocked: true }
        });
        blocked.push(invoice.student.firstName + ' ' + invoice.student.lastName);
        // Notify student
        await (0, notification_service_1.createNotification)({
            userId: invoice.student.userId,
            type: 'PORTAL_BLOCKED',
            title: 'Portal Access Blocked',
            message: `Your portal access has been blocked due to overdue invoice ${invoice.invoiceNumber}. Please settle your balance to regain access.`,
            link: `/finance/invoices/${invoice.id}`,
            channel: 'IN_APP'
        });
        // Notify parent if exists
        if (invoice.student.parent) {
            await (0, notification_service_1.createNotification)({
                userId: invoice.student.parent.userId,
                type: 'INVOICE_OVERDUE',
                title: 'Overdue Invoice Alert',
                message: `Invoice ${invoice.invoiceNumber} for ${invoice.student.firstName} is overdue. Portal access has been blocked.`,
                link: `/finance/invoices/${invoice.id}`,
                channel: 'IN_APP'
            });
        }
    }
    console.log(`⚠️ Blocked ${blocked.length} student portals due to overdue invoices`);
    return { blockedCount: blocked.length, students: blocked };
}
// ================= PAYMENT PROCESSING =================
/**
 * Record payment against an invoice
 */
async function recordInvoicePayment(data) {
    return await prisma_1.default.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
            where: { id: data.invoiceId },
            include: { student: true }
        });
        if (!invoice)
            throw new Error('Invoice not found');
        // Update invoice
        const updatedInvoice = await tx.invoice.update({
            where: { id: data.invoiceId },
            data: {
                status: data.amount >= invoice.amount ? 'PAID' : 'PENDING',
                paidAt: data.amount >= invoice.amount ? new Date() : null,
                isOverdue: false
            }
        });
        // If fully paid, unblock portal
        if (data.amount >= invoice.amount) {
            // Check if student has any other overdue invoices
            const otherOverdue = await tx.invoice.count({
                where: {
                    studentId: invoice.studentId,
                    status: 'OVERDUE',
                    id: { not: invoice.id }
                }
            });
            if (otherOverdue === 0) {
                await tx.student.update({
                    where: { id: invoice.studentId },
                    data: { isPortalBlocked: false }
                });
                // Notify student of unblocked access
                await (0, notification_service_1.createNotification)({
                    userId: invoice.student.userId,
                    type: 'SYSTEM_ALERT',
                    title: 'Portal Access Restored',
                    message: 'Your portal access has been restored. Thank you for your payment!',
                    link: '/dashboard'
                });
            }
        }
        return updatedInvoice;
    });
}
// ================= INVOICE QUERIES =================
/**
 * Get all invoices with filters
 */
async function getInvoices(query) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const where = {};
    if (query.studentId)
        where.studentId = query.studentId;
    if (query.status)
        where.status = query.status;
    if (query.isOverdue !== undefined)
        where.isOverdue = query.isOverdue;
    const [total, invoices] = await prisma_1.default.$transaction([
        prisma_1.default.invoice.count({ where }),
        prisma_1.default.invoice.findMany({
            where,
            include: {
                student: {
                    select: { firstName: true, lastName: true, gradeLevel: true }
                },
                items: true
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        })
    ]);
    return {
        data: invoices,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
}
/**
 * Get invoice by ID with full details
 */
async function getInvoiceById(invoiceId) {
    return await prisma_1.default.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            student: {
                include: {
                    user: { select: { email: true } },
                    parent: { select: { firstName: true, lastName: true, phone: true } }
                }
            },
            items: true
        }
    });
}
/**
 * Get student's outstanding balance
 */
async function getStudentBalance(studentId) {
    const invoices = await prisma_1.default.invoice.findMany({
        where: {
            studentId,
            status: { in: ['PENDING', 'OVERDUE'] }
        }
    });
    const totalDue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices
        .filter(inv => inv.isOverdue)
        .reduce((sum, inv) => sum + inv.amount, 0);
    return {
        totalDue,
        overdueAmount,
        invoiceCount: invoices.length,
        overdueCount: invoices.filter(inv => inv.isOverdue).length
    };
}
