"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔧 Fixing Terms...');
    // 1. Find the Active Academic Year
    let year = await prisma.academicYear.findFirst({
        where: { isCurrent: true }
    });
    // If missing, create it
    if (!year) {
        console.log('Creating missing Academic Year...');
        year = await prisma.academicYear.create({
            data: {
                name: '2025-2026',
                startDate: new Date('2025-08-01'),
                endDate: new Date('2026-05-30'),
                isCurrent: true,
            },
        });
    }
    // 2. Check if Terms exist
    const existingTerms = await prisma.term.count({
        where: { academicYearId: year.id }
    });
    if (existingTerms === 0) {
        console.log('Creating Missing Quarters...');
        await prisma.term.createMany({
            data: [
                { name: '1st Quarter', academicYearId: year.id, startDate: new Date('2025-08-01'), endDate: new Date('2025-10-15') },
                { name: '2nd Quarter', academicYearId: year.id, startDate: new Date('2025-10-16'), endDate: new Date('2025-12-20') },
                { name: '3rd Quarter', academicYearId: year.id, startDate: new Date('2026-01-05'), endDate: new Date('2026-03-15') },
                { name: '4th Quarter', academicYearId: year.id, startDate: new Date('2026-03-16'), endDate: new Date('2026-05-30') },
            ]
        });
        console.log('✅ SUCCESS: Terms Created (Q1-Q4)');
    }
    else {
        console.log('ℹ️ Terms already exist. No changes needed.');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
