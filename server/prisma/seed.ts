// FILE: server/prisma/seed.ts

import { EmploymentStatus, Gender, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise Seeding...');

  // 1. CLEANUP (Optional: careful in production!)
  // await prisma.auditLog.deleteMany();
  // await prisma.message.deleteMany();
  // await prisma.conversationMember.deleteMany();
  // await prisma.conversation.deleteMany();

  // 2. CREATE DEPARTMENTS (The HR Layer)
  const scienceDept = await prisma.department.upsert({
    where: { name: 'Science Department' },
    update: {},
    create: {
      name: 'Science Department',
      description: 'Physics, Chemistry, and Biology Wing',
    },
  });

  const mathDept = await prisma.department.upsert({
    where: { name: 'Mathematics Department' },
    update: {},
    create: {
      name: 'Mathematics Department',
      description: 'Calculus, Algebra, and Geometry',
    },
  });

  console.log('✅ Departments Created');

  // 3. CREATE USERS & PROFILES

  // --- PASSWORD HASHING ---
  const hashedPassword = await bcrypt.hash('password123', 10);

  // A. SUPER ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      adminProfile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
        },
      },
    },
  });

  // B. TEACHER (Head of Science)
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      password: hashedPassword,
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          firstName: 'Albert',
          lastName: 'Einstein',
          phone: '123-456-7890',
          specialization: 'Physics',
          status: EmploymentStatus.FULL_TIME,
          departmentId: scienceDept.id,
        },
      },
    },
  });

  // C. PARENT (The New Feature!)
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {},
    create: {
      email: 'parent@school.com',
      password: hashedPassword,
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-0199', // Unique Phone for SMS
          address: '123 Family Lane',
        },
      },
    },
  });

  // D. STUDENT (Linked to Parent)
  // We need to fetch the parent profile ID first to link them
  const parentProfile = await prisma.parent.findUnique({
    where: { userId: parentUser.id },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: {},
    create: {
      email: 'student@school.com',
      password: hashedPassword,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe', // Daughter of John Doe
          dateOfBirth: new Date('2010-05-15'),
          gender: Gender.FEMALE,
          address: '123 Family Lane',
          parentId: parentProfile?.id, // <--- LINKING HAPPENS HERE
        },
      },
    },
  });

  console.log('✅ Users (Admin, Teacher, Parent, Student) Created');

  // 4. ACADEMIC STRUCTURE
  const currentYear = await prisma.academicYear.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-06-01'),
      isCurrent: true,
      terms: {
        create: [
          { name: 'Fall Semester', startDate: new Date('2025-08-01'), endDate: new Date('2025-12-20') },
          { name: 'Spring Semester', startDate: new Date('2026-01-05'), endDate: new Date('2026-06-01') },
        ],
      },
    },
  });

  const grade10 = await prisma.gradeLevel.upsert({
    where: { id: 10 }, // Arbitrary ID to prevent duplicates
    update: {},
    create: {
      name: 'Grade 10',
      level: 10,
    },
  });

  // 5. CLASS & SUBJECT
  const physicsSubject = await prisma.subject.create({
    data: {
      name: 'Physics 101',
      code: 'PHY101',
      gradeLevelId: grade10.id,
    },
  });

  const sectionA = await prisma.section.create({
    data: {
      name: 'Section A - The Innovators',
      gradeLevelId: grade10.id,
      academicYearId: currentYear.id,
    },
  });

  // Create a Class (Physics for Section A, Taught by Einstein)
  // Need to get teacher profile ID
  const teacherProfile = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });

  if (teacherProfile) {
    await prisma.class.create({
      data: {
        sectionId: sectionA.id,
        subjectId: physicsSubject.id,
        teacherId: teacherProfile.id,
      },
    });
  }

  console.log('✅ Academic Structure Created');
  console.log('🚀 Database Seeding Completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });