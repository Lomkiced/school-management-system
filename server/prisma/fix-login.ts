// FILE: server/prisma/fix-login.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables manually to be sure
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 --- DIAGNOSTIC & REPAIR TOOL ---');
  
  // 1. Verify Database Connection
  const dbUrl = process.env.DATABASE_URL;
  console.log(`📡 Connecting to Database: ${dbUrl ? 'Found (Hidden for security)' : 'MISSING!'}`);
  
  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL is missing from .env file');
    process.exit(1);
  }

  const email = 'parent@school.com';
  const rawPassword = 'password123';

  // 2. Hash Password
  console.log('🔐 Generating fresh hash for "password123"...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  // 3. Force Upsert User (Create if missing, Update if exists)
  console.log(`🛠️  Fixing account for: ${email}`);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      role: UserRole.PARENT,
      isActive: true 
    },
    create: {
      email,
      password: hashedPassword,
      role: UserRole.PARENT,
      isActive: true,
      parentProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-FIXED',
          address: 'Repair Lane',
        },
      },
    },
  });

  console.log(`✅ User ID: ${user.id} is saved in the database.`);

  // 4. VERIFY LOGIC (The "Unit Test")
  console.log('🧪 Running internal verification...');
  
  // Fetch freshly from DB to ensure it stuck
  const savedUser = await prisma.user.findUnique({ where: { email } });
  
  if (!savedUser) {
    console.error('❌ CRITICAL ERROR: User was not found immediately after saving!');
    process.exit(1);
  }

  const isMatch = await bcrypt.compare(rawPassword, savedUser.password);

  if (isMatch) {
    console.log('\n🎉 SUCCESS: Password verification PASSED!');
    console.log('------------------------------------------------');
    console.log('You may now log in with:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log('------------------------------------------------\n');
  } else {
    console.error('\n❌ FAILED: The saved password hash does not match!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Script Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });