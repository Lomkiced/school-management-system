// FILE: server/prisma/reset-parent.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 FORCE RESET: Fixing Parent Account...');

  const email = 'parent@school.com';
  const newPassword = 'password123';

  // 1. Hash the password manually
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 2. Force Update the user
  const user = await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword,
      isActive: true
    },
  });

  console.log(`✅ Success! User [${user.email}] password has been reset to: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });