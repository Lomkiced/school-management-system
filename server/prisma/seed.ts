// FILE: server/prisma/seed.ts
import { EmploymentStatus, Gender, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise Seeding...');

  // --- PASSWORD HASHING ---
  // We hash it once and reuse it to ensure consistency
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. CREATE DEPARTMENTS
  const scienceDept = await prisma.department.upsert({
    where: { name: 'Science Department' },
    update: {},
    create: {
      name: 'Science Department',
      description: 'Physics, Chemistry, and Biology Wing',
    },
  });

  console.log('✅ Departments Synced');

  // 2. CREATE USERS (With Forced Password Updates)

  // A. SUPER ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: { password: hashedPassword }, // <--- FORCE PASSWORD RESET
    create: {
      email: 'admin@school.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      adminProfile: {
        create: { firstName: 'Super', lastName: 'Admin' },
      },
    },
  });

  // B. TEACHER
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: { password: hashedPassword }, // <--- FORCE PASSWORD RESET
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

  // C. PARENT
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    // vvv THIS IS THE CRITICAL CHANGE vvv
    update: { 
      password: hashedPassword 
    }, 
    // ^^^ THIS FORCES THE PASSWORD TO UPDATE ^^^
    create: {
      email: 'parent@school.com',
      password: hashedPassword,
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-0199',
          address: '123 Family Lane',
        },
      },
    },
  });
  
  // D. STUDENT
  // Ensure Parent Profile exists before linking
  const parentProfile = await prisma.parent.findUnique({ where: { userId: parentUser.id } });

  await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: { password: hashedPassword }, // <--- FORCE PASSWORD RESET
    create: {
      email: 'student@school.com',
      password: hashedPassword,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: new Date('2010-05-15'),
          gender: Gender.FEMALE,
          address: '123 Family Lane',
          parentId: parentProfile?.id,
        },
      },
    },
  });

  console.log('✅ Users & Passwords Synced (Password: password123)');

  // 3. ACADEMIC STRUCTURE
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