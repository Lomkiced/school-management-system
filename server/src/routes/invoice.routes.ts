// FILE: server/src/routes/invoice.routes.ts
// 2026 Standard: Invoice routes for finance automation

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import * as InvoiceService from '../services/invoice.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ================= ADMIN ROUTES =================

/**
 * POST /api/invoices/generate
 * Generate monthly invoices for all students (Admin only)
 */
router.post(
    '/generate',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { month, year } = req.body;
            const billingDate = month && year
                ? new Date(year, month - 1, 1)
                : new Date();

            const invoices = await InvoiceService.generateMonthlyInvoices(billingDate);

            res.json({
                success: true,
                message: `Generated ${invoices.length} invoices`,
                data: invoices
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * POST /api/invoices/check-overdue
 * Check and process overdue invoices (Admin only)
 */
router.post(
    '/check-overdue',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const result = await InvoiceService.checkOverdueInvoices();

            res.json({
                success: true,
                message: `Processed ${result.blockedCount} overdue accounts`,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * GET /api/invoices
 * Get all invoices with filters (Admin only)
 */
router.get(
    '/',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const result = await InvoiceService.getInvoices({
                studentId: req.query.studentId as string,
                status: req.query.status as any,
                isOverdue: req.query.isOverdue === 'true',
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            });

            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ================= STUDENT/PARENT ROUTES =================

/**
 * GET /api/invoices/my-invoices
 * Get current user's invoices (Student/Parent)
 */
router.get('/my-invoices', async (req, res) => {
    try {
        // For students: get their own invoices
        // For parents: would need to get children's invoices
        const studentId = req.query.studentId as string;

        const result = await InvoiceService.getInvoices({
            studentId,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const invoice = await InvoiceService.getInvoiceById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        res.json({ success: true, data: invoice });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/invoices/balance/:studentId
 * Get student's outstanding balance
 */
router.get('/balance/:studentId', async (req, res) => {
    try {
        const balance = await InvoiceService.getStudentBalance(req.params.studentId);
        res.json({ success: true, data: balance });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================= PAYMENT ROUTES =================

/**
 * POST /api/invoices/:id/pay
 * Record payment for an invoice (Admin only)
 */
router.post(
    '/:id/pay',
    restrictTo('ADMIN', 'SUPER_ADMIN'),
    async (req, res) => {
        try {
            const { amount, method, reference } = req.body;

            const result = await InvoiceService.recordInvoicePayment({
                invoiceId: req.params.id,
                amount: parseFloat(amount),
                method,
                reference
            });

            res.json({
                success: true,
                message: 'Payment recorded successfully',
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;
