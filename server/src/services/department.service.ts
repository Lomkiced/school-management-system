// FILE: server/src/services/department.service.ts
import prisma from '../utils/prisma';

export const createDepartment = async (data: { name: string; code?: string; description?: string }) => {
    return await prisma.department.create({ data });
};

export const getAllDepartments = async () => {
    return await prisma.department.findMany({
        include: {
            _count: { select: { teachers: true } }
        },
        orderBy: { name: 'asc' }
    });
};

export const getDepartmentById = async (id: string) => {
    return await prisma.department.findUnique({
        where: { id },
        include: {
            teachers: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    userId: true,
                    phone: true,
                    classes: {
                        select: {
                            id: true,
                            name: true,
                            subject: {
                                select: {
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            email: true,
                            isActive: true
                        }
                    },
                    _count: {
                        select: {
                            classes: true
                        }
                    }
                }
            }
        }
    });
};

export const updateDepartment = async (id: string, data: { name?: string; code?: string; description?: string }) => {
    return await prisma.department.update({ where: { id }, data });
};

export const deleteDepartment = async (id: string) => {
    return await prisma.department.delete({ where: { id } });
};

export const assignTeacherToDepartment = async (teacherId: string, departmentId: string | null) => {
    return await prisma.teacher.update({
        where: { id: teacherId },
        data: { departmentId }
    });
};
