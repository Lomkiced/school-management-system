// FILE: server/prisma/seed.ts
import { Gender, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 ARCHITECT SEED: Initializing System Data...');

  // ================= 1. CLEANUP (Ghostbuster Mode) =================
  // We delete in a specific order to prevent "Foreign Key" collisions.
  const deleteOrder = [
    prisma.auditLog.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.studentFee.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.quizAnswer.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.questionOption.deleteMany(),
    prisma.question.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.subjectMaterial.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.class.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.term.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.student.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.user.deleteMany(),
  ];

  await prisma.$transaction(deleteOrder);
  console.log('🧹 Database Wiped Clean.');

  // ================= 2. MASTER SETTINGS =================
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt); // Universal Password

  // --- Academic Year & Terms ---
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
  const q1Term = academicYear.terms[0];
  console.log(`📅 Academic Year Set: ${academicYear.name}`);

  // --- Subjects ---
  const subjectsData = [
    { name: 'Mathematics 10', code: 'MATH10' },
    { name: 'Science 10', code: 'SCI10' },
    { name: 'English 10', code: 'ENG10' },
    { name: 'History 10', code: 'HIST10' },
  ];
  
  // Create subjects and store them in a map for easy access
  const subjects = [];
  for (const sub of subjectsData) {
    const created = await prisma.subject.create({ data: sub });
    subjects.push(created);
  }
  console.log(`📚 Subjects Created: ${subjects.length}`);

  // ================= 3. USERS (The Cast) =================
  
  // --- Admin ---
  await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password,
      role: 'ADMIN',
      adminProfile: { create: { firstName: 'Super', lastName: 'Admin', phone: '1234567890' } },
    },
  });

  // --- Teacher ---
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.com',
      password,
      role: 'TEACHER',
      teacherProfile: { 
        create: { 
          firstName: 'John', 
          lastName: 'Keating', 
          phone: '0999999999',
          address: 'Faculty Room',
        } 
      },
    },
    include: { teacherProfile: true },
  });
  const teacherId = teacherUser.teacherProfile!.id;

  // --- Parent ---
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@school.com',
      password,
      role: 'PARENT',
      parentProfile: {
        create: { firstName: 'Martha', lastName: 'Kent', phone: '0988888888' },
      },
    },
    include: { parentProfile: true },
  });
  const parentId = parentUser.parentProfile!.id;

  // --- Student ---
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
          dateOfBirth: new Date('2010-01-01'),
          parentId: parentId, // Linking to Parent
        },
      },
    },
    include: { studentProfile: true },
  });
  const studentId = studentUser.studentProfile!.id;
  console.log(`👥 Users Created: Admin, Teacher, Parent, Student`);

  // ================= 4. CLASSES & ENROLLMENT (Connecting the Dots) =================
  
  // Create a Class linked to the Teacher and Math Subject
  const mathClass = await prisma.class.create({
    data: {
      name: 'Grade 10 - Rizal',
      teacherId: teacherId,
      subjectId: subjects[0].id, // Math
    },
  });

  // Enroll the Student
  await prisma.enrollment.create({
    data: {
      studentId: studentId,
      classId: mathClass.id,
    },
  });
  console.log(`🏫 Class Created & Student Enrolled`);

  // ================= 5. ACADEMIC DATA (Grades & Attendance) =================
  
  // Give a Grade
  await prisma.grade.create({
    data: {
      score: 95.5,
      feedback: 'Excellent work on the final exam.',
      studentId: studentId,
      classId: mathClass.id,
      termId: q1Term.id,
      gradedById: teacherId,
    },
  });

  // Mark Attendance
  await prisma.attendance.create({
    data: {
      date: new Date(),
      status: 'PRESENT',
      studentId: studentId,
      classId: mathClass.id,
    },
  });
  console.log(`📝 Grades & Attendance Recorded`);

  console.log('✅ ARCHITECT SEED COMPLETE: System is populated and ready.');
}

main()
  .catch((e) => {
    console.error('❌ SEED FAILURE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });