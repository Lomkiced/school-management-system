// FILE: server/prisma/seed.ts
import { Gender, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seed...');

  // 1. Clean existing data (Order matters to avoid foreign key errors)
  await prisma.auditLog.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Database cleaned.');

  // 2. Create Global Password
  const password = await bcrypt.hash('Admin123', 10);

  // 3. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password,
      role: UserRole.ADMIN,
      adminProfile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '09123456789'
        }
      }
    }
  });
  console.log('👤 Admin created: admin@school.com');

  // 4. Create Academic Year & Terms
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-30'),
      isCurrent: true,
      terms: {
        create: [
          { name: '1st Quarter' },
          { name: '2nd Quarter' },
          { name: '3rd Quarter' },
          { name: '4th Quarter' }
        ]
      }
    },
    include: { terms: true }
  });
  console.log('📅 Academic Year set: 2025-2026');

  // 5. Create Teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.com',
      password,
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '09987654321',
          address: 'Manila, Philippines'
        }
      }
    },
    include: { teacherProfile: true }
  });
  console.log('👨‍🏫 Teacher created: teacher@school.com');

  // 6. Create Subject
  const mathSubject = await prisma.subject.create({
    data: {
      name: 'Mathematics 10',
      code: 'MATH10'
    }
  });

  // 7. Create Class linked to Teacher & Subject
  // Note: teacherUser.teacherProfile is not null here because we included it
  if (teacherUser.teacherProfile) {
    await prisma.class.create({
      data: {
        name: 'Grade 10 - Rizal',
        teacherId: teacherUser.teacherProfile.id,
        subjectId: mathSubject.id
      }
    });
    console.log('🏫 Class created: Grade 10 - Rizal');
  }

  // 8. Create Parent
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@school.com',
      password,
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          firstName: 'Maria',
          lastName: 'Santos',
          phone: '09111111111',
          address: 'Quezon City'
        }
      }
    },
    include: { parentProfile: true }
  });
  console.log('👨‍👩‍👧 Parent created: parent@school.com');

  // 9. Create Student linked to Parent
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@school.com',
      password,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          firstName: 'Pedro',
          lastName: 'Santos',
          gender: Gender.MALE,
          dateOfBirth: new Date('2010-05-15'),
          address: 'Quezon City',
          guardianName: 'Maria Santos',
          guardianPhone: '09111111111',
          // Link to parent if parent profile exists
          parentId: parentUser.parentProfile?.id
        }
      }
    }
  });
  console.log('🎓 Student created: student@school.com');

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });