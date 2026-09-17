// lib/db.ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it in Vercel > Project > Settings > Environment Variables.');
}

export const sql = neon(process.env.DATABASE_URL);
