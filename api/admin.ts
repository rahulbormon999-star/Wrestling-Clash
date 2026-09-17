// api/admin.ts
// POST /api/admin
//   { "action": "listPlayers", "search": "optional email substring" }
//   { "action": "adjustCoins", "userId": "...", "amount": 100, "reason": "..." }
//   { "action": "listContent" }
//   { "action": "upsertClothingItem", "id": "optional", "category": "...", "name": "...", "coinPrice": 0, "unlockLevel": 1 }
//   { "action": "auditLog" }
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../lib/db';
import { getAuthenticatedUser } from '../lib/auth-middleware';
import { getAdminInfo, writeAuditLog } from '../lib/admin-middleware';

async function listPlayers(search: string | undefined, res: VercelResponse) {
  const rows = search
    ? await sql`
        SELECT u.id, u.email, u.auth_provider, p.level, p.coins, u.created_at
        FROM users u JOIN player_profile p ON p.user_id = u.id
        WHERE u.email ILIKE ${'%' + search + '%'}
        ORDER BY u.created_at DESC LIMIT 100
      `
    : await sql`
        SELECT u.id, u.email, u.auth_provider, p.level, p.coins, u.created_at
        FROM users u JOIN player_profile p ON p.user_id = u.id
        ORDER BY u.created_at DESC LIMIT 100
      `;
  return res.status(200).json({ players: rows });
}

async function adjustCoins(adminId: string, userId: string, amount: number, reason: string, res: VercelResponse) {
  if (!userId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'userId and numeric amount are required' });
  }
  await sql`
    UPDATE player_profile SET coins = coins + ${amount}, updated_at = now()
    WHERE user_id = ${userId}
  `;
  await sql`
    INSERT INTO coin_transactions (user_id, amount, reason)
    VALUES (${userId}, ${amount}, ${reason ?? 'admin_adjustment'})
  `;
  await writeAuditLog(adminId, 'adjust_coins', 'player_profile', userId, { amount, reason });
  return res.status(200).json({ adjusted: true });
}

async function listContent(res: VercelResponse) {
  const [fighters, clothing, vehicles, taunts] = await Promise.all([
    sql`SELECT * FROM fighters ORDER BY name`,
    sql`SELECT * FROM clothing_items ORDER BY category, name`,
    sql`SELECT * FROM vehicles ORDER BY unlock_level`,
    sql`SELECT * FROM taunts ORDER BY unlock_level`,
  ]);
  return res.status(200).json({ fighters, clothing, vehicles, taunts });
}

async function upsertClothingItem(
  adminId: string,
  body: { id?: string; category: string; name: string; coinPrice: number; unlockLevel: number },
  res: VercelResponse
) {
  const { id, category, name, coinPrice, unlockLevel } = body;
  if (!category || !name || typeof coinPrice !== 'number' || typeof unlockLevel !== 'number') {
    return res.status(400).json({ error: 'category, name, coinPrice, unlockLevel are required' });
  }

  const [row] = id
    ? await sql`
        UPDATE clothing_items SET category = ${category}, name = ${name},
               coin_price = ${coinPrice}, unlock_level = ${unlockLevel}
        WHERE id = ${id} RETURNING id
      `
    : await sql`
        INSERT INTO clothing_items (category, name, coin_price, unlock_level)
        VALUES (${category}, ${name}, ${coinPrice}, ${unlockLevel})
        RETURNING id
      `;

  await writeAuditLog(adminId, id ? 'update_clothing_item' : 'create_clothing_item', 'clothing_items', row.id, body);
  return res.status(200).json({ id: row.id });
}

async function auditLog(res: VercelResponse) {
  const rows = await sql`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100
  `;
  return res.status(200).json({ log: rows });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = getAuthenticatedUser(req);
  if (!auth) return res.status(401).json({ error: 'Missing or invalid token' });

  const admin = await getAdminInfo(auth);
  if (!admin) return res.status(403).json({ error: 'Admin access required' });

  const { action, ...body } = req.body ?? {};
  try {
    switch (action) {
      case 'listPlayers':
        return await listPlayers(body.search, res);
      case 'adjustCoins':
        return await adjustCoins(admin.id, body.userId, body.amount, body.reason, res);
      case 'listContent':
        return await listContent(res);
      case 'upsertClothingItem':
        return await upsertClothingItem(admin.id, body as any, res);
      case 'auditLog':
        return await auditLog(res);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('admin error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
