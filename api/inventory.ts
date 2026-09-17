// api/inventory.ts
// POST /api/inventory
//   { "action": "list" }
//   { "action": "purchase", "category": "clothing"|"vehicle"|"taunt", "itemId": "..." }
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../lib/db';
import { getAuthenticatedUser } from '../lib/auth-middleware';

const TABLES = {
  clothing: { catalog: 'clothing_items', unlocks: 'clothing_unlocks', unlockCol: 'item_id' },
  vehicle: { catalog: 'vehicles', unlocks: 'vehicle_unlocks', unlockCol: 'vehicle_id' },
  taunt: { catalog: 'taunts', unlocks: 'taunt_unlocks', unlockCol: 'taunt_id' },
} as const;
type Category = keyof typeof TABLES;

async function handleList(userId: string, res: VercelResponse) {
  const clothing = await sql`
    SELECT ci.id, ci.category, ci.name, ci.coin_price, ci.unlock_level,
           (cu.item_id IS NOT NULL) AS owned
    FROM clothing_items ci
    LEFT JOIN clothing_unlocks cu ON cu.item_id = ci.id AND cu.user_id = ${userId}
  `;
  const vehicles = await sql`
    SELECT v.id, v.name, v.coin_price, v.unlock_level, (vu.vehicle_id IS NOT NULL) AS owned
    FROM vehicles v
    LEFT JOIN vehicle_unlocks vu ON vu.vehicle_id = v.id AND vu.user_id = ${userId}
  `;
  const taunts = await sql`
    SELECT t.id, t.name, t.coin_price, t.unlock_level, t.is_starter,
           (t.is_starter OR tu.taunt_id IS NOT NULL) AS owned
    FROM taunts t
    LEFT JOIN taunt_unlocks tu ON tu.taunt_id = t.id AND tu.user_id = ${userId}
  `;
  return res.status(200).json({ clothing, vehicles, taunts });
}

async function handlePurchase(userId: string, category: Category, itemId: string, res: VercelResponse) {
  const cfg = TABLES[category];
  if (!cfg) return res.status(400).json({ error: 'Invalid category' });

  const [item] = await sql.query(
    `SELECT id, coin_price, unlock_level FROM ${cfg.catalog} WHERE id = $1`,
    [itemId]
  );
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const [profile] = await sql`
    SELECT level, coins FROM player_profile WHERE user_id = ${userId}
  `;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (profile.level < item.unlock_level) {
    return res.status(403).json({ error: `Requires level ${item.unlock_level}` });
  }
  if (profile.coins < item.coin_price) {
    return res.status(402).json({ error: 'Not enough coins' });
  }

  const alreadyOwned = await sql.query(
    `SELECT 1 FROM ${cfg.unlocks} WHERE user_id = $1 AND ${cfg.unlockCol} = $2`,
    [userId, itemId]
  );
  if (alreadyOwned.length > 0) {
    return res.status(409).json({ error: 'Already owned' });
  }

  // Deduct coins, record the unlock, and log the transaction together —
  // if any one of these fails the others already ran, so wrap in a
  // transaction once you move past this starter (Neon's serverless driver
  // supports sql.transaction()).
  await sql`
    UPDATE player_profile SET coins = coins - ${item.coin_price}, updated_at = now()
    WHERE user_id = ${userId}
  `;
  await sql.query(
    `INSERT INTO ${cfg.unlocks} (user_id, ${cfg.unlockCol}) VALUES ($1, $2)`,
    [userId, itemId]
  );
  await sql`
    INSERT INTO coin_transactions (user_id, amount, reason)
    VALUES (${userId}, ${-item.coin_price}, ${'purchase_' + category})
  `;

  return res.status(200).json({ purchased: true, remainingCoins: profile.coins - item.coin_price });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = getAuthenticatedUser(req);
  if (!auth) return res.status(401).json({ error: 'Missing or invalid token' });

  const { action, category, itemId } = req.body ?? {};
  try {
    if (action === 'list') return await handleList(auth.userId, res);
    if (action === 'purchase') return await handlePurchase(auth.userId, category, itemId, res);
    return res.status(400).json({ error: 'action must be one of: list, purchase' });
  } catch (err) {
    console.error('inventory error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
