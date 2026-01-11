import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

// Helper to generate JWT Token
const generateToken = (userId: string, role: string) => {
  // FIX: We added "|| '1d'" as a fallback and "as any" to bypass strict checking
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as any;

  return jwt.sign({ userId, role }, secret, {
    expiresIn: expiresIn,
  });
};

export const registerUser = async (data: any) => {
  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 3. Create the User and Profile
  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role || 'STUDENT',
      ...(data.role === 'TEACHER' && {
        teacherProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      }),
      ...(data.role === 'STUDENT' || !data.role ? {
        studentProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: new Date(),
            gender: 'OTHER',
          },
        },
      } : {}),
    },
  });

  // 4. Generate Token
  const token = generateToken(newUser.id, newUser.role);

  return { user: { id: newUser.id, email: newUser.email, role: newUser.role }, token };
};

export const loginUser = async (data: any) => {
  // 1. Find User AND fetch their specific profile
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      studentProfile: true,
      teacherProfile: true,
      parentProfile: true,
      adminProfile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. Check Password
  const isMatch = await bcrypt.compare(data.password, user.password);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // 3. Extract the Name based on Role (The Professional Way)
  let firstName = 'User';
  let lastName = '';
  
  if (user.role === 'STUDENT' && user.studentProfile) {
    firstName = user.studentProfile.firstName;
    lastName = user.studentProfile.lastName;
  } else if (user.role === 'TEACHER' && user.teacherProfile) {
    firstName = user.teacherProfile.firstName;
    lastName = user.teacherProfile.lastName;
  } else if (user.role === 'PARENT' && user.parentProfile) {
    firstName = user.parentProfile.firstName;
    lastName = user.parentProfile.lastName;
  } else if (user.adminProfile) {
    firstName = user.adminProfile.firstName;
    lastName = user.adminProfile.lastName;
  }

  // 4. Generate Token
  const token = generateToken(user.id, user.role);

  // 5. Return the full identity
  return { 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      firstName,  // <--- Now the frontend will say "Welcome, John!"
      lastName
    }, 
    token 
  };
};