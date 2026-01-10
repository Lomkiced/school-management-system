"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormOptions = exports.createClass = exports.getAllClasses = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAllClasses = async () => {
    // Deep fetch: Get the Class, plus the Teacher's name, Subject name, and Section name
    return await prisma_1.default.class.findMany({
        include: {
            teacher: true,
            subject: true,
            section: true,
        },
        orderBy: { id: 'desc' }
    });
};
exports.getAllClasses = getAllClasses;
const createClass = async (data) => {
    // Validate that the section and subject exist
    // In a real app, we would add checks here to ensure no scheduling conflicts
    return await prisma_1.default.class.create({
        data: {
            teacherId: data.teacherId,
            subjectId: parseInt(data.subjectId),
            sectionId: parseInt(data.sectionId),
        },
        include: {
            teacher: true,
            subject: true,
            section: true
        }
    });
};
exports.createClass = createClass;
// Helper to get lists for dropdowns
const getFormOptions = async () => {
    const teachers = await prisma_1.default.teacher.findMany();
    const subjects = await prisma_1.default.subject.findMany();
    const sections = await prisma_1.default.section.findMany();
    return { teachers, subjects, sections };
};
exports.getFormOptions = getFormOptions;
