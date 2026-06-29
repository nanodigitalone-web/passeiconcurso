import { one } from "./db.js";
import { isAdmin } from "./auth.js";

/**
 * Server-side content gating — the single source of truth for whether a user
 * may see paid quiz answers / recursos:
 *   admin OR within the free trial window OR an active category_access row.
 */
export async function hasCategoryAccess(
  userId: string,
  conc: string,
  cat: string,
): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  const u = await one<{ on_trial: boolean }>(
    "select (trial_ends_at is not null and trial_ends_at > now()) as on_trial from users where id = $1",
    [userId],
  );
  if (u?.on_trial) return true;

  const a = await one(
    `select 1 from category_access
       where user_id = $1 and concurso_id = $2 and categoria_id = $3
         and (expires_at is null or expires_at > now()) limit 1`,
    [userId, conc, cat],
  );
  return !!a;
}
