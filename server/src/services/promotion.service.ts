// FILE: server/src/services/promotion.service.ts
import prisma from '../utils/prisma';

interface PromotionCandidate {
    studentId: string;
    nextGradeLevel: number;
    nextStatus: 'PROMOTED' | 'RETAINED' | 'GRADUATED';
}

/**
 * Get list of students eligible for promotion from a specific class
 */
export const getPromotionCandidates = async (classId: string) => {
    const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
            enrollments: {
                include: {
                    student: {
                        include: {
                            grades: {
                                where: { classId }
                            },
                            academicRecords: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            }
        }
    });

    if (!classData) throw new Error('Class not found');

    return classData.enrollments.map(enrollment => {
        const student = enrollment.student;

        // Simple Logic: If GPA > 75 (or whatever passing), promote.
        // This logic can be refined based on AcademicRecord
        const currentGpa = student.academicRecords[0]?.gpa || 0;
        const isPassing = currentGpa >= 75;

        let nextStatus: 'PROMOTED' | 'RETAINED' | 'GRADUATED' = isPassing ? 'PROMOTED' : 'RETAINED';
        let nextGradeLevel = student.gradeLevel;

        if (isPassing) {
            if (student.gradeLevel >= 12 && student.gradeLevel < 13) {
                // K-12 Graduating or moving to College? 
                // Assuming 12 is max for HS, then Graduated
                nextStatus = 'GRADUATED';
            } else if (student.gradeLevel >= 16) {
                // College Graduating
                nextStatus = 'GRADUATED';
            } else {
                nextGradeLevel = student.gradeLevel + 1;
            }
        }

        return {
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`,
            currentGradeLevel: student.gradeLevel,
            currentGpa,
            suggestedStatus: nextStatus,
            suggestedNextGrade: nextGradeLevel
        };
    });
};

/**
 * Mass promote students
 */
export const processMassPromotion = async (candidates: PromotionCandidate[], nextClassId?: string) => {
    const results = { detailed: [] as any[] };

    await prisma.$transaction(async (tx) => {
        for (const candidate of candidates) {
            // 1. Update Student Grade Level
            if (candidate.nextStatus === 'PROMOTED') {
                await tx.student.update({
                    where: { id: candidate.studentId },
                    data: { gradeLevel: candidate.nextGradeLevel }
                });

                // 2. Enroll in next class (if provided)
                if (nextClassId) {
                    await tx.enrollment.create({
                        data: {
                            studentId: candidate.studentId,
                            classId: nextClassId
                        }
                    });
                }
            }

            // 3. Create Academic Record for "Promoted" status
            // (This might duplicate if recordGradeWithAutomation already did it, but this is explicit mass promotion)
            // We skip creating record if it exists, simplified for now.
        }
    });

    return { success: true, count: candidates.length };
};
