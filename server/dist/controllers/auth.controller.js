"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const validation_1 = require("../utils/validation");
const register = async (req, res) => {
    try {
        // 1. Validate Input
        const validatedData = validation_1.registerSchema.parse(req.body);
        // 2. Call Service
        const result = await (0, auth_service_1.registerUser)(validatedData);
        // 3. Send Response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    }
    catch (error) {
        // Handle specific Zod errors or generic errors
        res.status(400).json({
            success: false,
            message: error.errors ? error.errors[0].message : error.message,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = validation_1.loginSchema.parse(req.body);
        const result = await (0, auth_service_1.loginUser)(validatedData);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: error.message || 'Authentication failed',
        });
    }
};
exports.login = login;
