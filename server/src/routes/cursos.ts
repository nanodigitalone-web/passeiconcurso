import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { requireAdmin } from "../lib/auth.js";

export const cursosRouter = Router();

// Active courses (optionally by concurso).
cursosRouter.get("/", requireAuth, async (req, res) => {
  const conc = req.query.concurso as string | undefined;
  const r = conc
    ? await query(
        "select * from cursos_preparatorios where ativo = true and concurso_id = $1 order by ordem, created_at",
        [conc],
      )
    : await query(
        "select * from cursos_preparatorios where ativo = true order by ordem, created_at",
      );
  res.json(r.rows);
});

// ---- Admin ----
cursosRouter.get("/admin/all", requireAdmin, async (_req, res) => {
  const r = await query("select * from cursos_preparatorios order by concurso_id, ordem");
  res.json(r.rows);
});

cursosRouter.post("/admin", requireAdmin, async (req, res) => {
  const c = req.body || {};
  const r = await query(
    `insert into cursos_preparatorios (concurso_id, nome, logo_url, contacto, link_externo, descricao, ativo, ordem)
     values ($1,$2,$3,$4,$5,$6,coalesce($7,true),coalesce($8,0)) returning *`,
    [c.concurso_id, c.nome, c.logo_url, c.contacto, c.link_externo, c.descricao, c.ativo, c.ordem],
  );
  res.json(r.rows[0]);
});

cursosRouter.patch("/admin/:id", requireAdmin, async (req, res) => {
  const allowed = ["concurso_id", "nome", "logo_url", "contacto", "link_externo", "descricao", "ativo", "ordem"];
  const keys = Object.keys(req.body || {}).filter((k) => allowed.includes(k));
  if (keys.length === 0) return res.json({ ok: true });
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  await query(
    `update cursos_preparatorios set ${sets.join(", ")}, updated_at = now() where id = $1`,
    [req.params.id, ...keys.map((k) => req.body[k])],
  );
  res.json({ ok: true });
});

cursosRouter.delete("/admin/:id", requireAdmin, async (req, res) => {
  await query("delete from cursos_preparatorios where id = $1", [req.params.id]);
  res.json({ ok: true });
});
