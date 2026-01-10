import { FeeStatus, Gender, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Advanced Seeding...');

  // 1. CLEANUP (Delete in order to avoid foreign key errors)
  await prisma.auditLog.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.subjectMaterial.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.section.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.gradeLevel.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.feeStructure.deleteMany();

  console.log('🧹 Database Cleared.');

  // 2. CREATE ACADEMIC STRUCTURE
  const year = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-30'),
      isCurrent: true,
    },
  });

  // Create Terms
  await prisma.term.createMany({
    data: [
      { name: '1st Quarter', academicYearId: year.id, startDate: new Date('2025-08-01'), endDate: new Date('2025-10-15') },
      { name: '2nd Quarter', academicYearId: year.id, startDate: new Date('2025-10-16'), endDate: new Date('2025-12-20') },
      { name: '3rd Quarter', academicYearId: year.id, startDate: new Date('2026-01-05'), endDate: new Date('2026-03-15') },
      { name: '4th Quarter', academicYearId: year.id, startDate: new Date('2026-03-16'), endDate: new Date('2026-05-30') },
    ]
  });

  const grade10 = await prisma.gradeLevel.create({ data: { name: 'Grade 10', level: 10 } });
  const sectionA = await prisma.section.create({ data: { name: 'Einstein', gradeLevelId: grade10.id, academicYearId: year.id } });
  
  // 3. CREATE USERS (Admin & Teachers)
  const password = await bcrypt.hash('123456', 10);

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@school.com', password, role: UserRole.SUPER_ADMIN,
      adminProfile: { create: { firstName: 'Super', lastName: 'Admin' } }
    }
  });

  // Teachers
  const teacherSubjects = ['Mathematics', 'Science', 'English', 'History', 'Programming'];
  const teachers = [];
  
  for (let i = 0; i < 5; i++) {
    const tUser = await prisma.user.create({
      data: {
        email: `teacher${i+1}@school.com`, password, role: UserRole.TEACHER,
        teacherProfile: { 
          create: { firstName: `Teacher`, lastName: `${teacherSubjects[i]}`, phone: '09123456789' } 
        }
      },
      include: { teacherProfile: true }
    });
    if(tUser.teacherProfile) teachers.push(tUser.teacherProfile);
  }

  // 4. CREATE CLASSES & SUBJECTS
  const classes = [];
  for (let i = 0; i < 5; i++) {
    const subject = await prisma.subject.create({
      data: { name: teacherSubjects[i], code: `SUB${100+i}`, gradeLevelId: grade10.id }
    });

    const cls = await prisma.class.create({
      data: { sectionId: sectionA.id, subjectId: subject.id, teacherId: teachers[i].id }
    });
    classes.push(cls);
  }

  // 5. CREATE STUDENTS & FINANCIAL DATA
  const feeStruct = await prisma.feeStructure.create({
    data: { name: 'Tuition Fee', amount: 25000, description: 'Annual Fee' }
  });

  console.log('👥 Creating 50 Students with Logs & Payments...');
  
  for (let i = 0; i < 50; i++) {
    const sUser = await prisma.user.create({
      data: {
        email: `student${i+1}@school.com`, password, role: UserRole.STUDENT,
        studentProfile: {
          create: {
            firstName: `Student`, lastName: `${i+1}`,
            dateOfBirth: new Date('2008-01-01'),
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            admissionDate: new Date(),
          }
        }
      },
      include: { studentProfile: true }
    });

    const studentId = sUser.studentProfile!.id;

    // Enroll
    await prisma.enrollment.create({
      data: { studentId, sectionId: sectionA.id }
    });

    // Assign Fee
    const studentFee = await prisma.studentFee.create({
      data: { studentId, feeStructureId: feeStruct.id, status: FeeStatus.PARTIAL }
    });

    // Create Realistic Payments (Spread over months for the graph)
    const monthsBack = i % 6; // 0 to 5 months ago
    const paymentDate = new Date();
    paymentDate.setMonth(paymentDate.getMonth() - monthsBack);

    await prisma.payment.create({
      data: {
        studentFeeId: studentFee.id,
        amount: Math.floor(Math.random() * 5000) + 1000,
        method: 'CASH',
        paidAt: paymentDate
      }
    });

    // Create Audit Log (For Dashboard "Recent Activity")
    await prisma.auditLog.create({
      data: {
        action: 'STUDENT_ENROLLED',
        details: `Enrolled in Grade 10 - Einstein`,
        userId: sUser.id,
        createdAt: paymentDate
      }
    });
  }

  console.log('✅ Seeding Complete. Login with: admin@school.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });