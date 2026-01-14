// FILE: server/prisma/seed.ts
import { AttendanceStatus, FeeStatus, Gender, PaymentMethod, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 ARCHITECT FACTORY: Initializing Production Simulation...');

  // ================= 1. DEEP CLEAN (Reset System) =================
  // Deleting in correct order to respect Foreign Keys
  const tableNames = [
    'AuditLog', 'Chat', 'Payment', 'StudentFee', 'FeeStructure', 
    'QuizAnswer', 'QuizAttempt', 'QuestionOption', 'Question', 'Quiz', 
    'Submission', 'Assignment', 'SubjectMaterial', 'Grade', 'Attendance', 
    'Enrollment', 'Class', 'Subject', 'Term', 'AcademicYear', 
    'Student', 'Parent', 'Teacher', 'Admin', 'User'
  ];

  for (const tableName of tableNames) {
    try {
      // @ts-ignore
      await prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].deleteMany();
      console.log(` - Cleared ${tableName}`);
    } catch (error) {
      console.log(` ! Note: Could not clear ${tableName} (might be empty or locked)`);
    }
  }

  // ================= 2. GLOBAL SETTINGS =================
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt); // Universal Password for ALL users

  // --- Academic Year ---
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      isCurrent: true,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-30'),
      terms: {
        create: [
          { name: '1st Quarter' },
          { name: '2nd Quarter' },
          { name: '3rd Quarter' },
          { name: '4th Quarter' },
        ],
      },
    },
    include: { terms: true },
  });
  const currentTerm = academicYear.terms[0]; // 1st Quarter

  // ================= 3. USER ACCOUNTS (The Credentials) =================
  
  // --- 3.1 SUPER ADMIN ---
  await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password,
      role: 'ADMIN',
      adminProfile: { create: { firstName: 'Principal', lastName: 'Skinner', phone: '111-111-1111' } },
    },
  });
  console.log('👤 Admin Created');

  // --- 3.2 TEACHER ---
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.com',
      password,
      role: 'TEACHER',
      teacherProfile: { 
        create: { 
          firstName: 'Edna', 
          lastName: 'Krabappel', 
          phone: '222-222-2222',
          address: 'Room 101, Springfield Elementary',
        } 
      },
    },
    include: { teacherProfile: true },
  });
  const teacherId = teacherUser.teacherProfile!.id;
  console.log('👩‍🏫 Teacher Created');

  // --- 3.3 PARENT ---
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@school.com',
      password,
      role: 'PARENT',
      parentProfile: {
        create: { firstName: 'Martha', lastName: 'Kent', phone: '333-333-3333', address: 'Smallville Farm' },
      },
    },
    include: { parentProfile: true },
  });
  const parentId = parentUser.parentProfile!.id;
  console.log('👪 Parent Created');

  // --- 3.4 STUDENT ---
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@school.com',
      password,
      role: 'STUDENT',
      studentProfile: {
        create: {
          firstName: 'Clark',
          lastName: 'Kent',
          gender: Gender.MALE,
          dateOfBirth: new Date('2010-06-18'),
          address: 'Metropolis',
          guardianName: 'Martha Kent',
          guardianPhone: '333-333-3333',
          parentId: parentId, // Link to Parent
        },
      },
    },
    include: { studentProfile: true },
  });
  const studentId = studentUser.studentProfile!.id;
  console.log('🎓 Student Created');

  // ================= 4. ACADEMIC STRUCTURE =================

  // --- Subjects ---
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: 'Advanced Mathematics', code: 'MATH101' } }),
    prisma.subject.create({ data: { name: 'Nuclear Physics', code: 'SCI202' } }),
    prisma.subject.create({ data: { name: 'World History', code: 'HIST303' } }),
  ]);

  // --- Classes ---
  // Create a class for EACH subject and assign the teacher
  const classes = [];
  for (const subject of subjects) {
    const newClass = await prisma.class.create({
      data: {
        name: `Grade 10 - ${subject.name}`,
        teacherId: teacherId,
        subjectId: subject.id,
      },
    });
    classes.push(newClass);
  }

  // ================= 5. ENROLLMENT & DATA INJECTION =================

  // Enroll Clark Kent in ALL classes
  for (const cls of classes) {
    await prisma.enrollment.create({
      data: {
        studentId: studentId,
        classId: cls.id,
        joinedAt: new Date(),
      },
    });

    // Add some Dummy Grades
    await prisma.grade.create({
      data: {
        studentId: studentId,
        classId: cls.id,
        termId: currentTerm.id,
        subjectId: cls.subjectId, // Explicitly link subject
        score: Math.floor(Math.random() * (99 - 85) + 85), // Random score between 85-99
        feedback: 'Excellent performance in class.',
        gradedById: teacherId,
      },
    });

    // Add Attendance
    await prisma.attendance.create({
      data: {
        date: new Date(),
        status: AttendanceStatus.PRESENT,
        studentId: studentId,
        classId: cls.id,
      },
    });
  }
  console.log(`✅ Student Enrolled in ${classes.length} Classes with Grades & Attendance`);

  // ================= 6. FINANCE (Fees & Payments) =================
  
  const fee = await prisma.feeStructure.create({
    data: {
      name: 'Annual Tuition Fee',
      amount: 50000,
      description: 'Standard tuition for Grade 10',
      dueDate: new Date('2026-02-01'),
      academicYearId: academicYear.id,
    },
  });

  const studentFee = await prisma.studentFee.create({
    data: {
      studentId: studentId,
      feeStructureId: fee.id,
      status: FeeStatus.PARTIAL,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 25000,
      method: PaymentMethod.CASH,
      reference: 'RCPT-001',
      studentFeeId: studentFee.id,
      paidAt: new Date(),
    },
  });
  console.log('💰 Finance Records Created (Tuition & Partial Payment)');

  console.log('🚀 SYSTEM READY. All systems nominal.');
}

main()
  .catch((e) => {
    console.error('❌ SEED ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });