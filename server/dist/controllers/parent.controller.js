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
exports.deleteParent = exports.linkStudents = exports.updateParent = exports.createParent = exports.getParents = void 0;
const zod_1 = require("zod");
const parentService = __importStar(require("../services/parent.service"));
const validation_1 = require("../utils/validation");
const getParents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const result = await parentService.getAllParents({ page, limit, search });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getParents = getParents;
const createParent = async (req, res) => {
    try {
        const validated = validation_1.createParentSchema.parse(req.body);
        const parent = await parentService.createParent(validated);
        res.status(201).json({ success: true, data: parent });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return res.status(400).json({ success: false, message: error.issues[0].message });
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createParent = createParent;
const updateParent = async (req, res) => {
    try {
        const validated = validation_1.updateParentSchema.parse(req.body);
        const parent = await parentService.updateParent(req.params.id, validated);
        res.json({ success: true, data: parent });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateParent = updateParent;
const linkStudents = async (req, res) => {
    try {
        const { studentIds } = validation_1.linkStudentSchema.parse(req.body);
        await parentService.linkStudentsToParent(req.params.id, studentIds);
        res.json({ success: true, message: "Students linked successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.linkStudents = linkStudents;
const deleteParent = async (req, res) => {
    try {
        await parentService.deleteParent(req.params.id);
        res.json({ success: true, message: "Parent deleted successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteParent = deleteParent;
