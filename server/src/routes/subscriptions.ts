import { Router } from "express";
import { query, one } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const subscriptionsRouter = Router();

// GET /subscriptions/plans — public, list available plans
subscriptionsRouter.get("/plans", async (_req, res) => {
  try {
    const plans = await query("SELECT * FROM plans WHERE active = true ORDER BY price_aoa ASC");
    res.json({ plans: plans.rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// GET /subscriptions/search-users?q= — search users to add as family member
// NOTE: must be before /:id routes to avoid conflict
subscriptionsRouter.get("/search-users", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.json({ users: [] });
    const users = await query(`
      SELECT id, nome, email, avatar_url
      FROM profiles
      WHERE (nome ILIKE $1 OR email ILIKE $1) AND id != $2 AND blocked = false
      ORDER BY nome ASC LIMIT 10
    `, [`%${q}%`, req.userId]);
    res.json({ users: users.rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// GET /subscriptions/me — current user's active subscription
subscriptionsRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    // Check if user owns an active subscription
    const sub = await one<any>(`
      SELECT us.*, p.name as plan_name, p.max_disciplines, p.max_members, p.price_aoa
      FROM user_subscriptions us
      JOIN plans p ON p.id = us.plan_id
      WHERE us.user_id = $1 AND us.status IN ('active','pending')
      ORDER BY us.created_at DESC LIMIT 1
    `, [req.userId]);

    // Check if user is a member of a family plan
    const membership = await one<any>(`
      SELECT sm.*, us.plan_id, us.expires_at as sub_expires_at, us.status as sub_status,
             p.name as plan_name, p.max_disciplines,
             pr.nome as owner_nome, pr.email as owner_email
      FROM subscription_members sm
      JOIN user_subscriptions us ON us.id = sm.subscription_id
      JOIN plans p ON p.id = us.plan_id
      JOIN profiles pr ON pr.id = us.user_id
      WHERE sm.member_user_id = $1 AND us.status = 'active' AND us.expires_at > now()
      ORDER BY sm.added_at DESC LIMIT 1
    `, [req.userId]);

    // If owner of familia plan, get members list
    let members: any[] = [];
    if (sub && sub.plan_id === 'familia') {
      const mems = await query(`
        SELECT sm.*, pr.nome, pr.email, pr.avatar_url
        FROM subscription_members sm
        JOIN profiles pr ON pr.id = sm.member_user_id
        WHERE sm.subscription_id = $1
        ORDER BY sm.added_at ASC
      `, [sub.id]);
      members = mems.rows;
    }

    res.json({ subscription: sub || null, membership: membership || null, members });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// POST /subscriptions — create subscription request
subscriptionsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { plan_id, comprovativo_url } = req.body || {};
    if (!plan_id) return res.status(400).json({ error: "plan_id required" });

    const plan = await one<any>("SELECT * FROM plans WHERE id = $1 AND active = true", [plan_id]);
    if (!plan) return res.status(404).json({ error: "plan_not_found" });

    // Check if user already has active/pending subscription
    const existing = await one<any>(
      "SELECT id, status FROM user_subscriptions WHERE user_id = $1 AND status IN ('active','pending') LIMIT 1",
      [req.userId]
    );
    if (existing) return res.status(409).json({ error: "already_subscribed", status: existing.status });

    const isFree = plan.price_aoa === 0;

    if (!isFree && !comprovativo_url) {
      return res.status(400).json({ error: "comprovativo_url required for paid plans" });
    }

    const status = isFree ? 'active' : 'pending';
    const expires_at = isFree
      ? new Date(Date.now() + plan.duration_days * 86400000)
      : null; // set by admin on approval for paid plans

    const sub = await one<any>(`
      INSERT INTO user_subscriptions (user_id, plan_id, status, comprovativo_url, expires_at, activated_at, activated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      req.userId, plan_id, status, comprovativo_url || null,
      isFree ? expires_at : null,
      isFree ? new Date() : null,
      isFree ? req.userId : null,
    ]);

    if (isFree) {
      // Auto-notify
      try {
        await query(
          "INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)",
          [req.userId, "Plano Gratuito activado", "O seu plano gratuito está activo. Escolha a sua disciplina e comece a estudar!"]
        );
      } catch { /* non-critical */ }
    }

    res.json({ ok: true, subscription: sub });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// POST /subscriptions/:id/disciplines — lock discipline selection
subscriptionsRouter.post("/:id/disciplines", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const sub = await one<any>(
      "SELECT us.*, p.max_disciplines FROM user_subscriptions us JOIN plans p ON p.id = us.plan_id WHERE us.id = $1",
      [req.params.id]
    );
    if (!sub) return res.status(404).json({ error: "not_found" });

    // Check ownership or family membership
    const isMember = sub.user_id !== req.userId;
    let memberRow: any = null;
    if (isMember) {
      memberRow = await one<any>(
        "SELECT * FROM subscription_members WHERE subscription_id = $1 AND member_user_id = $2",
        [req.params.id, req.userId]
      );
      if (!memberRow) return res.status(403).json({ error: "forbidden" });
      // Only block when at full capacity (all slots filled)
      const existingMem: string[] = Array.isArray(memberRow.disciplines) ? memberRow.disciplines : JSON.parse(memberRow.disciplines || '[]');
      if (memberRow.disciplines_locked && existingMem.length >= sub.max_disciplines) {
        return res.status(409).json({ error: "already_locked" });
      }
    } else {
      if (sub.status !== 'active') return res.status(400).json({ error: "subscription_not_active" });
      // Only block when at full capacity
      const existingOwner: string[] = Array.isArray(sub.disciplines) ? sub.disciplines : JSON.parse(sub.disciplines || '[]');
      if (sub.disciplines_locked && existingOwner.length >= sub.max_disciplines) {
        return res.status(409).json({ error: "already_locked" });
      }
    }

    const { disciplines: incoming } = req.body || {};
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ error: "disciplines required" });
    }
    const maxDisc = sub.max_disciplines;

    // UNION with existing: can add disciplines, cannot remove already-chosen ones
    const existing: string[] = isMember
      ? (Array.isArray(memberRow.disciplines) ? memberRow.disciplines : JSON.parse(memberRow.disciplines || '[]'))
      : (Array.isArray(sub.disciplines) ? sub.disciplines : JSON.parse(sub.disciplines || '[]'));
    const merged = Array.from(new Set([...existing, ...incoming]));
    if (merged.length > maxDisc) {
      return res.status(400).json({ error: `max_${maxDisc}_disciplines` });
    }
    // Only lock when all slots are filled
    const shouldLock = merged.length >= maxDisc;

    if (isMember && memberRow) {
      await query(
        "UPDATE subscription_members SET disciplines = $1, disciplines_locked = $2 WHERE id = $3",
        [JSON.stringify(merged), shouldLock, memberRow.id]
      );
    } else {
      await query(
        "UPDATE user_subscriptions SET disciplines = $1, disciplines_locked = $2 WHERE id = $3",
        [JSON.stringify(merged), shouldLock, sub.id]
      );
    }

    res.json({ ok: true, disciplines: merged, disciplines_locked: shouldLock });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// POST /subscriptions/:id/members/add — add family member (owner only)
subscriptionsRouter.post("/:id/members/add", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const sub = await one<any>(
      "SELECT us.*, p.max_members FROM user_subscriptions us JOIN plans p ON p.id = us.plan_id WHERE us.id = $1 AND us.user_id = $2",
      [req.params.id, req.userId]
    );
    if (!sub) return res.status(404).json({ error: "not_found_or_not_owner" });
    if (sub.plan_id !== 'familia') return res.status(400).json({ error: "only_familia_plan" });
    if (sub.status !== 'active') return res.status(400).json({ error: "subscription_not_active" });
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) return res.status(400).json({ error: "subscription_expired" });

    // Count existing members (owner counts as 1 of the max_members)
    const memberCount = await one<{ c: number }>("SELECT count(*)::int c FROM subscription_members WHERE subscription_id = $1", [sub.id]);
    const totalWithOwner = (memberCount?.c ?? 0) + 1; // +1 for owner
    if (totalWithOwner >= sub.max_members) {
      return res.status(400).json({ error: "max_members_reached", max: sub.max_members });
    }

    const { member_user_id } = req.body || {};
    if (!member_user_id) return res.status(400).json({ error: "member_user_id required" });
    if (member_user_id === req.userId) return res.status(400).json({ error: "cannot_add_self" });

    // Check user exists
    const memberUser = await one<any>("SELECT id, nome, email FROM profiles WHERE id = $1", [member_user_id]);
    if (!memberUser) return res.status(404).json({ error: "user_not_found" });

    // Check not already member
    const already = await one<any>("SELECT id FROM subscription_members WHERE subscription_id = $1 AND member_user_id = $2", [sub.id, member_user_id]);
    if (already) return res.status(409).json({ error: "already_member" });

    await query(
      "INSERT INTO subscription_members (subscription_id, member_user_id) VALUES ($1, $2)",
      [sub.id, member_user_id]
    );

    // Notify new member
    try {
      await query(
        "INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)",
        [member_user_id, "Adicionado a um plano Família", "Foste adicionado ao plano Família Passei. Escolhe as tuas disciplinas e começa a estudar!"]
      );
    } catch { /* non-critical */ }

    res.json({ ok: true, member: memberUser });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});
