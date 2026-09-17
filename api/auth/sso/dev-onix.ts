// api/auth/sso/dev-onix.ts
// TODO before going live: confirm exactly how Dev-Onix signs its JWTs.
// This version assumes a shared secret (HS256) — swap verifyDevOnixToken()
// for a public-key/JWKS check if Dev-Onix actually uses RS256.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { sql } from '../../../lib/db';
import { signGameToken } from '../../../lib/jwt';

interface DevOnixTokenPayload {
  sub: string;
  email?: string;
}

function verifyDevOnixToken(token: string): DevOnixTokenPayload {
  const secret = process.env.DEV_ONIX_JWT_SECRET;
  if (!secret) {
    throw new Error('DEV_ONIX_JWT_SECRET is not set');
  }
  return jwt.verify(token, secret) as DevOnixTokenPayload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { devOnixToken } = req.body ?? {};
  if (!devOnixToken) {
    return res.status(400).json({ error: 'devOnixToken is required' });
  }

  let devOnixPayload: DevOnixTokenPayload;
  try {
    devOnixPayload = verifyDevOnixToken(devOnixToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired Dev-Onix token' });
  }

  try {
    const existing = await sql`
      SELECT id FROM users WHERE dev_onix_user_id = ${devOnixPayload.sub}
    `;

    let userId: string;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [user] = await sql`
        INSERT INTO users (dev_onix_user_id, email, auth_provider)
        VALUES (${devOnixPayload.sub}, ${devOnixPayload.email ?? null}, 'dev_onix')
        RETURNING id
      `;
      userId = user.id;

      await sql`
        INSERT INTO player_profile (user_id, level, xp, coins)
        VALUES (${userId}, 1, 0, 0)
      `;
    }

    const token = signGameToken({ userId, authProvider: 'dev_onix' });
    return res.status(200).json({ token });
  } catch (err) {
    console.error('dev-onix sso error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
