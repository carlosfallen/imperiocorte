import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const pwBuffer = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', pwBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

export async function createUserToken(userId: string, secret: string): Promise<string> {
  return new SignJWT({ userId, type: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(encoder.encode(secret));
}

export async function createAdminToken(adminId: string, secret: string): Promise<string> {
  return new SignJWT({ adminId, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(encoder.encode(secret));
}

export async function verifyUserToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload.type === 'user' && typeof payload.userId === 'string' ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload.type === 'admin' && typeof payload.adminId === 'string' ? payload.adminId : null;
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
