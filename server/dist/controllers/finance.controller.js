"use strict";
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
exports.getLedger = exports.pay = exports.assignFee = exports.getFees = exports.createFee = void 0;
const financeService = __importStar(require("../services/finance.service"));
const createFee = async (req, res) => {
    try {
        const fee = await financeService.createFeeStructure(req.body);
        res.status(201).json({ success: true, data: fee });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createFee = createFee;
const getFees = async (req, res) => {
    try {
        const fees = await financeService.getFeeStructures();
        res.json({ success: true, data: fees });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFees = getFees;
const assignFee = async (req, res) => {
    try {
        const result = await financeService.assignFeeToStudent(req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.assignFee = assignFee;
const pay = async (req, res) => {
    try {
        const result = await financeService.recordPayment(req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.pay = pay;
const getLedger = async (req, res) => {
    try {
        const ledger = await financeService.getStudentLedger(req.params.studentId);
        res.json({ success: true, data: ledger });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLedger = getLedger;
