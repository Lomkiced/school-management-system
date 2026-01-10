"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const router = (0, express_1.Router)();
router.post('/structure', finance_controller_1.createFee); // Create "Tuition"
router.get('/structure', finance_controller_1.getFees); // List all Fees
router.post('/assign', finance_controller_1.assignFee); // Charge a student
router.post('/pay', finance_controller_1.pay); // Accept Payment
router.get('/ledger/:studentId', finance_controller_1.getLedger); // View Student Account
exports.default = router;
