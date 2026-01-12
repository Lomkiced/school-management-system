// FILE: server/src/controllers/auth.controller.ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { loginSchema, registerSchema } from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'ADMIN',
        adminProfile: {
          create: { firstName: data.firstName, lastName: data.lastName }
        }
      }
    });

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validate Input
    const { email, password } = loginSchema.parse(req.body);
    
    // 2. Find User
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        adminProfile: true, 
        teacherProfile: true, 
        studentProfile: true,
        parentProfile: true 
      }
    });

    // 3. Security Checks
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Admin.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // 4. Determine Display Name
    let name = 'User';
    if (user.role === 'ADMIN' && user.adminProfile) name = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
    else if (user.role === 'TEACHER' && user.teacherProfile) name = `${user.teacherProfile.firstName} ${user.teacherProfile.lastName}`;
    else if (user.role === 'STUDENT' && user.studentProfile) name = `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    else if (user.role === 'PARENT' && user.parentProfile) name = `${user.parentProfile.firstName} ${user.parentProfile.lastName}`;

    // 5. Issue Token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 6. Send Cookie (THE FIX)
    // On localhost, secure must be false. In production (https), it must be true.
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, 
      sameSite: isProduction ? 'none' : 'lax', // 'lax' allows the cookie to travel between localhost ports
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    console.log(`✅ Login Success: ${email} [${user.role}]`);

    // 7. Send Response
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: name
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        adminProfile: true, 
        teacherProfile: true, 
        studentProfile: true,
        parentProfile: true 
      }
    });

    if (!user) return res.status(401).json({ success: false });

    let name = 'User';
    if (user.role === 'ADMIN' && user.adminProfile) name = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
    else if (user.role === 'TEACHER' && user.teacherProfile) name = `${user.teacherProfile.firstName} ${user.teacherProfile.lastName}`;
    else if (user.role === 'STUDENT' && user.studentProfile) name = `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    else if (user.role === 'PARENT' && user.parentProfile) name = `${user.parentProfile.firstName} ${user.parentProfile.lastName}`;

    res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name }
    });
  } catch (error) {
    res.status(401).json({ success: false });
  }
};