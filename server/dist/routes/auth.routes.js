"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: server/src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/logout', auth_controller_1.logout); // <--- Make sure this exists!
// Protected Routes
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
exports.default = router;
