import { Router } from "express";
import { one, query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";

export const promoRouter = Router();

// Public: returns the single currently-active promo (time window + active flag),
// or null if none. The frontend uses this to skip paywalls during promotions.
promoRouter.get("/active", async (_req, res) => {
  try {
    const row = await one<any>(
      `select id, label, discount_pct, starts_at, ends_at, is_active
         from promotions
        where is_active = true and starts_at <= now() and ends_at > now()
        order by created_at desc limit 1`,
      [],
    );
    res.json({ promo: row ?? null });
  } catch (e: any) {
    res.json({ promo: null });
  }
});

// Admin endpoints — all require admin JWT.
promoRouter.use("/admin", requireAdmin);

promoRouter.get("/admin", async (_req, res) => {
  try {
    const rows = (
      await query(
        `select id, label, discount_pct, starts_at, ends_at, is_active, created_at
           from promotions order by created_at desc`,
        [],
      )
    ).rows;
    res.json({ promos: rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

promoRouter.post("/admin", async (req, res) => {
  try {
    const { label, discount_pct, starts_at, ends_at } = req.body || {};
    if (!starts_at || !ends_at) return res.status(400).json({ error: "missing_dates" });
    const row = await one<any>(
      `insert into promotions (label, discount_pct, starts_at, ends_at, is_active)
       values ($1, $2, $3, $4, true) returning *`,
      [label || "Promoção", Number(discount_pct) || 100, starts_at, ends_at],
    );
    res.json({ promo: row });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

promoRouter.patch("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { label, discount_pct, starts_at, ends_at, is_active } = req.body || {};
    const row = await one<any>(
      `update promotions set
         label        = coalesce($2, label),
         discount_pct = coalesce($3, discount_pct),
         starts_at    = coalesce($4, starts_at),
         ends_at      = coalesce($5, ends_at),
         is_active    = coalesce($6, is_active)
       where id = $1 returning *`,
      [id, label ?? null, discount_pct != null ? Number(discount_pct) : null, starts_at ?? null, ends_at ?? null, is_active ?? null],
    );
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json({ promo: row });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

promoRouter.delete("/admin/:id", async (req, res) => {
  try {
    await query("delete from promotions where id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});
