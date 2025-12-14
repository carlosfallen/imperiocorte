// FILE: src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUserToken(userId: string, secret: string): Promise<string> {
  const token = await new SignJWT({ userId, type: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(encoder.encode(secret));
  return token;
}

export async function createAdminToken(adminId: string, secret: string): Promise<string> {
  const token = await new SignJWT({ adminId, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(encoder.encode(secret));
  return token;
}

export async function verifyUserToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    if (payload.type === 'user' && typeof payload.userId === 'string') {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    if (payload.type === 'admin' && typeof payload.adminId === 'string') {
      return payload.adminId;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateMagicCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateId(prefix: string = ''): string {
  return prefix ? `${prefix}_${nanoid(16)}` : nanoid(16);
}