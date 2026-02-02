"use strict";
// FILE: server/src/routes/invoice.routes.ts
// 2026 Standard: Invoice routes for finance automation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const InvoiceService = __importStar(require("../services/invoice.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ================= ADMIN ROUTES =================
/**
 * POST /api/invoices/generate
 * Generate monthly invoices for all students (Admin only)
 */
router.post('/generate', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /api/invoices/check-overdue
 * Check and process overdue invoices (Admin only)
 */
router.post('/check-overdue', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const result = await InvoiceService.checkOverdueInvoices();
        res.json({
            success: true,
            message: `Processed ${result.blockedCount} overdue accounts`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/invoices
 * Get all invoices with filters (Admin only)
 */
router.get('/', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const result = await InvoiceService.getInvoices({
            studentId: req.query.studentId,
            status: req.query.status,
            isOverdue: req.query.isOverdue === 'true',
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ================= STUDENT/PARENT ROUTES =================
/**
 * GET /api/invoices/my-invoices
 * Get current user's invoices (Student/Parent)
 */
router.get('/my-invoices', async (req, res) => {
    try {
        // For students: get their own invoices
        // For parents: would need to get children's invoices
        const studentId = req.query.studentId;
        const result = await InvoiceService.getInvoices({
            studentId,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        });
        res.json({ success: true, ...result });
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ================= PAYMENT ROUTES =================
/**
 * POST /api/invoices/:id/pay
 * Record payment for an invoice (Admin only)
 */
router.post('/:id/pay', (0, role_middleware_1.restrictTo)('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
