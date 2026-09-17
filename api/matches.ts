// api/matches.ts
// POST /api/matches
//   { "action": "report", "matchType": "1v1", "refereeType": "ai"|"human",
//     "participants": [{ "userId": "...", "fighterId": "...", "finalHealthPct": 0, "role": "fighter" }],
//     "winnerUserId": "..." }
//   { "action": "history" }
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../lib/db';
import { getAuthenticatedUser } from '../lib/auth-middleware';

const COINS_PER_WIN = 50; // same fixed amount regardless of match type, per the design spec

async function handleReport(req: VercelRequest, res: VercelResponse) {
  const { matchType, refereeType, participants, winnerUserId } = req.body ?? {};
  if (!matchType || !refereeType || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'matchType, refereeType, and participants are required' });
  }

  const [match] = await sql`
    INSERT INTO matches (match_type, referee_type, winner_user_id, ended_at)
    VALUES (${matchType}, ${refereeType}, ${winnerUserId ?? null}, now())
    RETURNING id
  `;

  for (const p of participants) {
    await sql`
      INSERT INTO match_participants (match_id, user_id, role, fighter_id, final_health_pct)
      VALUES (${match.id}, ${p.userId}, ${p.role ?? 'fighter'}, ${p.fighterId ?? null}, ${p.finalHealthPct ?? null})
    `;
  }

  if (winnerUserId) {
    await sql`
      UPDATE player_profile SET coins = coins + ${COINS_PER_WIN}, updated_at = now()
      WHERE user_id = ${winnerUserId}
    `;
    await sql`
      INSERT INTO coin_transactions (user_id, amount, reason, match_id)
      VALUES (${winnerUserId}, ${COINS_PER_WIN}, 'match_win', ${match.id})
    `;
  }

  return res.status(201).json({ matchId: match.id, coinsAwarded: winnerUserId ? COINS_PER_WIN : 0 });
}

async function handleHistory(userId: string, res: VercelResponse) {
  const rows = await sql`
    SELECT m.id, m.match_type, m.referee_type, m.started_at, m.ended_at, m.winner_user_id
    FROM matches m
    JOIN match_participants mp ON mp.match_id = m.id
    WHERE mp.user_id = ${userId}
    ORDER BY m.started_at DESC
    LIMIT 50
  `;
  return res.status(200).json({ matches: rows });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = getAuthenticatedUser(req);
  if (!auth) return res.status(401).json({ error: 'Missing or invalid token' });

  const { action } = req.body ?? {};
  try {
    if (action === 'report') return await handleReport(req, res);
    if (action === 'history') return await handleHistory(auth.userId, res);
    return res.status(400).json({ error: 'action must be one of: report, history' });
  } catch (err) {
    console.error('matches error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
