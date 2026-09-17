// api/auth.ts
// One function handles all three auth flows via body.action, so the whole
// auth system counts as ONE serverless function instead of three —
// important on Vercel's Hobby plan (12 functions per deployment max).
//
// POST /api/auth
//   { "action": "register", "email": "...", "password": "..." }
//   { "action": "login",    "email": "...", "password": "..." }
//   { "action": "dev-onix", "devOnixToken": "..." }
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../lib/db';
import { signGameToken } from '../lib/jwt';

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body ?? {};
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, auth_provider)
    VALUES (${email}, ${passwordHash}, 'email')
    RETURNING id
  `;
  await sql`
    INSERT INTO player_profile (user_id, level, xp, coins)
    VALUES (${user.id}, 1, 0, 0)
  `;

  const token = signGameToken({ userId: user.id, authProvider: 'email' });
  return res.status(201).json({ token });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const rows = await sql`
    SELECT id, password_hash FROM users WHERE email = ${email} AND auth_provider = 'email'
  `;
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = rows[0];
  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signGameToken({ userId: user.id, authProvider: 'email' });
  return res.status(200).json({ token });
}

// TODO before going live: confirm exactly how Dev-Onix signs its JWTs and
// adjust this verification. Assumes a shared secret (HS256) for now — swap
// for a public-key/JWKS check if Dev-Onix actually uses RS256.
async function handleDevOnixSso(req: VercelRequest, res: VercelResponse) {
  const { devOnixToken } = req.body ?? {};
  if (!devOnixToken) {
    return res.status(400).json({ error: 'devOnixToken is required' });
  }

  const secret = process.env.DEV_ONIX_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server misconfigured: DEV_ONIX_JWT_SECRET missing' });
  }

  let payload: { sub: string; email?: string };
  try {
    payload = jwt.verify(devOnixToken, secret) as { sub: string; email?: string };
  } catch {
    return res.status(401).json({ error: 'Invalid or expired Dev-Onix token' });
  }

  const existing = await sql`
    SELECT id FROM users WHERE dev_onix_user_id = ${payload.sub}
  `;

  let userId: string;
  if (existing.length > 0) {
    userId = existing[0].id;
  } else {
    const [user] = await sql`
      INSERT INTO users (dev_onix_user_id, email, auth_provider)
      VALUES (${payload.sub}, ${payload.email ?? null}, 'dev_onix')
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body ?? {};
  try {
    switch (action) {
      case 'register':
        return await handleRegister(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'dev-onix':
        return await handleDevOnixSso(req, res);
      default:
        return res.status(400).json({ error: 'action must be one of: register, login, dev-onix' });
    }
  } catch (err) {
    console.error('auth error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
    }
