"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result["default"] = mod;
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portalController = __importStar(require("../controllers/portal.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");

const router = (0, express_1.Router)();

router.use(auth_middleware_1.authenticate);

router.get('/grades', role_middleware_1.restrictTo('STUDENT'), portalController.getMyGrades);
router.get('/my-classes', role_middleware_1.restrictTo('STUDENT'), portalController.getMyClasses);
router.get('/class/:classId', role_middleware_1.restrictTo('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'), portalController.getClassInfo);
router.get('/dashboard', role_middleware_1.restrictTo('STUDENT'), portalController.getStudentDashboard);

exports.default = router;
