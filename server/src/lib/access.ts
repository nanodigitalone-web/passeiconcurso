import { one } from "./db.js";
import { isAdmin } from "./auth.js";

/**
 * Server-side content gating — the single source of truth for whether a user
 * may see paid quiz answers / recursos. Mirrors the old `has_category_access`:
 *   admin OR account younger than 2 days (trial) OR an active category_access row.
 */
export async function hasCategoryAccess(
  userId: string,
  conc: string,
  cat: string,
): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  const u = await one<{ recent: boolean }>(
    "select (created_at > now() - interval '2 days') as recent from users where id = $1",
    [userId],
  );
  if (u?.recent) return true;

  const a = await one(
    `select 1 from category_access
       where user_id = $1 and concurso_id = $2 and categoria_id = $3
         and (expires_at is null or expires_at > now()) limit 1`,
    [userId, conc, cat],
  );
  return !!a;
}
