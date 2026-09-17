// lib/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it in Vercel > Project > Settings > Environment Variables.');
}

export interface GameTokenPayload {
  userId: string;
  authProvider: 'email' | 'dev_onix';
}

export function signGameToken(payload: GameTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyGameToken(token: string): GameTokenPayload {
  return jwt.verify(token, JWT_SECRET) as GameTokenPayload;
}
