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
exports.getOptions = exports.createClass = exports.getClasses = void 0;
const classService = __importStar(require("../services/class.service"));
const getClasses = async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        res.json({ success: true, data: classes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getClasses = getClasses;
const createClass = async (req, res) => {
    try {
        const newClass = await classService.createClass(req.body);
        res.status(201).json({ success: true, data: newClass });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createClass = createClass;
const getOptions = async (req, res) => {
    try {
        const options = await classService.getFormOptions();
        res.json({ success: true, data: options });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getOptions = getOptions;
