// api/profile/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db';
import { getAuthenticatedUser } from '../../lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT level, xp, coins FROM player_profile WHERE user_id = ${auth.userId}
      `;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('profile get error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
