"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portal_controller_1 = require("../controllers/portal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect this route! Only logged in users can see it.
router.get('/grades', auth_middleware_1.authenticate, portal_controller_1.getMyGrades);
exports.default = router;
