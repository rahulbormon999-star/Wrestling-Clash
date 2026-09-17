// lib/admin-middleware.ts
import { sql } from './db';
import { GameTokenPayload } from './jwt';

export interface AdminInfo {
  id: string;
  role: 'support' | 'content_manager' | 'superadmin';
  permissions: Record<string, boolean>;
}

// An authenticated game user is only an admin if a matching row exists in
// admin_users, keyed by their Dev-Onix id — email-only accounts can never
// be admins by design, since admin access should route through Dev-Onix.
export async function getAdminInfo(auth: GameTokenPayload): Promise<AdminInfo | null> {
  if (auth.authProvider !== 'dev_onix') return null;

  const rows = await sql`
    SELECT au.id, au.role, au.permissions
    FROM admin_users au
    JOIN users u ON u.dev_onix_user_id = au.dev_onix_user_id
    WHERE u.id = ${auth.userId}
  `;
  if (rows.length === 0) return null;
  return rows[0] as AdminInfo;
}

export async function writeAuditLog(
  adminId: string,
  action: string,
  targetTable: string | null,
  targetId: string | null,
  payload: unknown
) {
  await sql`
    INSERT INTO audit_log (admin_user_id, action, target_table, target_id, payload)
    VALUES (${adminId}, ${action}, ${targetTable}, ${targetId}, ${JSON.stringify(payload)})
  `;
}
