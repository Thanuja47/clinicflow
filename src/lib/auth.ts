import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn('CRITICAL SECURITY WARNING: JWT_SECRET or JWT_REFRESH_SECRET is missing in production environment variables.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-clinicflow-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-clinicflow-key';

export interface UserSessionPayload {
  userId: string;
  clinicId: string;
  branchId?: string | null;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function signRefreshToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}
