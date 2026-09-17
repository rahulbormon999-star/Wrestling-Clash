// lib/auth-middleware.ts
import type { VercelRequest } from '@vercel/node';
import { verifyGameToken, GameTokenPayload } from './jwt';

export function getAuthenticatedUser(req: VercelRequest): GameTokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length);
  try {
    return verifyGameToken(token);
  } catch {
    return null;
  }
}
