"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTeacherToDepartment = exports.deleteDepartment = exports.updateDepartment = exports.getDepartmentById = exports.getAllDepartments = exports.createDepartment = void 0;
// FILE: server/src/services/department.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const createDepartment = async (data) => {
    return await prisma_1.default.department.create({ data });
};
exports.createDepartment = createDepartment;
const getAllDepartments = async () => {
    return await prisma_1.default.department.findMany({
        include: {
            _count: { select: { teachers: true } }
        },
        orderBy: { name: 'asc' }
    });
};
exports.getAllDepartments = getAllDepartments;
const getDepartmentById = async (id) => {
    return await prisma_1.default.department.findUnique({
        where: { id },
        include: {
            teachers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    userId: true
                }
            }
        }
    });
};
exports.getDepartmentById = getDepartmentById;
const updateDepartment = async (id, data) => {
    return await prisma_1.default.department.update({ where: { id }, data });
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (id) => {
    return await prisma_1.default.department.delete({ where: { id } });
};
exports.deleteDepartment = deleteDepartment;
const assignTeacherToDepartment = async (teacherId, departmentId) => {
    return await prisma_1.default.teacher.update({
        where: { id: teacherId },
        data: { departmentId }
    });
};
exports.assignTeacherToDepartment = assignTeacherToDepartment;
