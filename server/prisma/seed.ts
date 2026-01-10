import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Academic Year
  const year = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-30'),
      isCurrent: true,
    },
  });
  console.log('✅ Academic Year Created: 2025-2026');

  // 2. Create Terms (The Missing Piece)
  await prisma.term.createMany({
    data: [
      { name: '1st Quarter', academicYearId: year.id, startDate: new Date('2025-08-01'), endDate: new Date('2025-10-15') },
      { name: '2nd Quarter', academicYearId: year.id, startDate: new Date('2025-10-16'), endDate: new Date('2025-12-20') },
      { name: '3rd Quarter', academicYearId: year.id, startDate: new Date('2026-01-05'), endDate: new Date('2026-03-15') },
      { name: '4th Quarter', academicYearId: year.id, startDate: new Date('2026-03-16'), endDate: new Date('2026-05-30') },
    ]
  });
  console.log('✅ Terms Created: Q1 - Q4');

  // 3. Create Grade Level (Grade 10)
  const grade10 = await prisma.gradeLevel.create({
    data: {
      name: 'Grade 10',
      level: 10,
    },
  });

  // 4. Create Sections
  await prisma.section.create({
    data: { name: 'Einstein', gradeLevelId: grade10.id, academicYearId: year.id },
  });
  await prisma.section.create({
    data: { name: 'Newton', gradeLevelId: grade10.id, academicYearId: year.id },
  });
  console.log('✅ Sections Created');

  // 5. Create Subjects
  await prisma.subject.createMany({
    data: [
      { name: 'Mathematics 10', code: 'MATH10', gradeLevelId: grade10.id },
      { name: 'Science 10', code: 'SCI10', gradeLevelId: grade10.id },
      { name: 'English 10', code: 'ENG10', gradeLevelId: grade10.id },
    ]
  });
  console.log('✅ Subjects Created');

  console.log('🌱 Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });