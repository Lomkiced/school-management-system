// FILE: server/src/services/academic.service.ts
// 2026 Standard: Academic automation for GPA calculation and student promotion

import prisma from '../utils/prisma';
import { createNotification, notifyStudentAboutGrade } from './notification.service';

// ================= GPA CALCULATION =================

/**
 * Calculate and update student's GPA for current term/year
 * Called automatically when a grade is submitted
 */
export async function calculateStudentGPA(studentId: string, academicYearId?: string) {
    // Get current academic year if not provided
    let yearId = academicYearId;
    if (!yearId) {
        const currentYear = await prisma.academicYear.findFirst({
            where: { isCurrent: true }
        });
        if (!currentYear) throw new Error('No current academic year found');
        yearId = currentYear.id;
    }

    // Get all grades for this student in this academic year
    const grades = await prisma.grade.findMany({
        where: {
            studentId,
            term: { academicYearId: yearId }
        },
        include: {
            class: { include: { subject: true } }
        }
    });

    if (grades.length === 0) {
        return { gpa: null, totalCredits: 0 };
    }

    // Calculate weighted GPA
    // Formula: Sum(score * weight) / Sum(weight)
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const grade of grades) {
        totalWeightedScore += grade.score * grade.weight;
        totalWeight += grade.weight;
    }

    const gpa = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const gpaRounded = Math.round(gpa * 100) / 100;

    // Upsert academic record
    await prisma.academicRecord.upsert({
        where: {
            studentId_academicYearId: { studentId, academicYearId: yearId }
        },
        update: {
            gpa: gpaRounded,
            totalCredits: totalWeight
        },
        create: {
            studentId,
            academicYearId: yearId,
            gpa: gpaRounded,
            totalCredits: totalWeight
        }
    });

    return { gpa: gpaRounded, totalCredits: totalWeight, gradeCount: grades.length };
}

/**
 * Get student's academic summary
 */
export async function getStudentAcademicSummary(studentId: string) {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            academicRecords: {
                include: { academicYear: true },
                orderBy: { academicYear: { startDate: 'desc' } }
            },
            grades: {
                include: {
                    class: { include: { subject: true } },
                    term: true
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!student) throw new Error('Student not found');

    // Current year record
    const currentRecord = student.academicRecords.find(r => r.academicYear.isCurrent);

    // Grade distribution by type
    const gradesByType = student.grades.reduce((acc, g) => {
        if (!acc[g.gradeType]) {
            acc[g.gradeType] = { count: 0, totalScore: 0 };
        }
        acc[g.gradeType].count++;
        acc[g.gradeType].totalScore += g.score;
        return acc;
    }, {} as Record<string, { count: number; totalScore: number }>);

    return {
        student: {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            gradeLevel: student.gradeLevel
        },
        currentGPA: currentRecord?.gpa || null,
        academicHistory: student.academicRecords,
        gradesByType: Object.entries(gradesByType).map(([type, data]) => ({
            type,
            count: data.count,
            average: Math.round((data.totalScore / data.count) * 100) / 100
        })),
        recentGrades: student.grades.slice(0, 10)
    };
}

// ================= STUDENT PROMOTION =================

/**
 * Promote students to next grade level at end of academic year
 * Called manually by admin or via CRON at year end
 */
export async function promoteStudents(academicYearId: string, passingGPA: number = 75) {
    const results = {
        promoted: [] as string[],
        retained: [] as string[],
        errors: [] as string[]
    };

    // Get all students with their academic records for this year
    const records = await prisma.academicRecord.findMany({
        where: { academicYearId },
        include: {
            student: {
                include: { user: true }
            }
        }
    });

    for (const record of records) {
        try {
            const student = record.student;
            const gpa = record.gpa || 0;

            if (gpa >= passingGPA) {
                // Promote student
                const newGradeLevel = Math.min(student.gradeLevel + 1, 12);

                await prisma.$transaction([
                    prisma.student.update({
                        where: { id: student.id },
                        data: { gradeLevel: newGradeLevel }
                    }),
                    prisma.academicRecord.update({
                        where: { id: record.id },
                        data: {
                            isPromoted: true,
                            promotedTo: newGradeLevel,
                            remarks: `Promoted with GPA ${gpa}`
                        }
                    })
                ]);

                // Notify student
                await createNotification({
                    userId: student.userId,
                    type: 'SYSTEM_ALERT',
                    title: '🎉 Congratulations! You\'ve Been Promoted',
                    message: `You have been promoted to Grade ${newGradeLevel} with a GPA of ${gpa}. Keep up the great work!`,
                    link: '/student/grades'
                });

                results.promoted.push(`${student.firstName} ${student.lastName}`);
            } else {
                // Retain student
                await prisma.academicRecord.update({
                    where: { id: record.id },
                    data: {
                        isPromoted: false,
                        remarks: `Retained - GPA ${gpa} below passing threshold of ${passingGPA}`
                    }
                });

                results.retained.push(`${student.firstName} ${student.lastName}`);
            }
        } catch (error: any) {
            results.errors.push(`${record.student.firstName}: ${error.message}`);
        }
    }

    console.log(`📊 Promotion Results: ${results.promoted.length} promoted, ${results.retained.length} retained`);
    return results;
}

// ================= ENHANCED GRADE SUBMISSION =================

/**
 * Record a grade with automatic GPA recalculation and notification
 */
export async function recordGradeWithAutomation(data: {
    studentId: string;
    classId: string;
    termId: string;
    score: number;
    gradeType: 'QUIZ' | 'ASSIGNMENT' | 'EXAM' | 'PROJECT' | 'PARTICIPATION';
    weight?: number;
    feedback?: string;
    gradedById?: string;
}) {
    return await prisma.$transaction(async (tx) => {
        // 1. Get student and class info for notification
        const [student, classInfo] = await Promise.all([
            tx.student.findUnique({ where: { id: data.studentId } }),
            tx.class.findUnique({
                where: { id: data.classId },
                include: { subject: true }
            })
        ]);

        if (!student || !classInfo) {
            throw new Error('Student or class not found');
        }

        // 2. Verify student is enrolled
        const enrollment = await tx.enrollment.findFirst({
            where: { studentId: data.studentId, classId: data.classId }
        });

        if (!enrollment) {
            throw new Error('Student is not enrolled in this class');
        }

        // 3. Create or update grade
        const existingGrade = await tx.grade.findFirst({
            where: {
                studentId: data.studentId,
                classId: data.classId,
                termId: data.termId,
                gradeType: data.gradeType
            }
        });

        let grade;
        if (existingGrade) {
            grade = await tx.grade.update({
                where: { id: existingGrade.id },
                data: {
                    score: data.score,
                    weight: data.weight || 1.0,
                    feedback: data.feedback,
                    gradedById: data.gradedById
                }
            });
        } else {
            grade = await tx.grade.create({
                data: {
                    studentId: data.studentId,
                    classId: data.classId,
                    termId: data.termId,
                    score: data.score,
                    gradeType: data.gradeType,
                    weight: data.weight || 1.0,
                    feedback: data.feedback,
                    gradedById: data.gradedById
                }
            });
        }

        return { grade, student, classInfo };
    }).then(async (result) => {
        // 4. Recalculate GPA (outside transaction for performance)
        const gpaResult = await calculateStudentGPA(data.studentId);

        // 5. Send notification
        await notifyStudentAboutGrade(
            data.studentId,
            result.student.userId,
            result.classInfo.subject?.name || result.classInfo.name,
            data.score,
            data.gradeType
        );

        return {
            grade: result.grade,
            newGPA: gpaResult.gpa
        };
    });
}

// ================= CLASS RANKINGS =================

/**
 * Calculate and store class rankings for academic year
 */
export async function calculateClassRankings(academicYearId: string) {
    // Get all academic records for this year, sorted by GPA
    const records = await prisma.academicRecord.findMany({
        where: { academicYearId },
        orderBy: { gpa: 'desc' }
    });

    // Update rankings
    for (let i = 0; i < records.length; i++) {
        await prisma.academicRecord.update({
            where: { id: records[i].id },
            data: { classRank: i + 1 }
        });
    }

    return { rankedCount: records.length };
}
