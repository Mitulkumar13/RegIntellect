import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  lastLogin?: Date;
  onboardingCompleted?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}