"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/logs', auth_middleware_1.authenticate, settings_controller_1.getLogs);
router.post('/password', auth_middleware_1.authenticate, settings_controller_1.changePassword);
exports.default = router;
