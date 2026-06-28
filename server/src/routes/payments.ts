import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const paymentsRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// In production we store proofs on Cloudinary (persistent, no disk required).
// When CLOUDINARY_URL is absent (local dev), fall back to disk. The Cloudinary
// SDK reads CLOUDINARY_URL from the environment automatically.
const useCloudinary = !!process.env.CLOUDINARY_URL;
if (!useCloudinary) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Buffer the upload in memory, then push to Cloudinary or write to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Upload a payment / top-up proof. Returns the proof URL (absolute for
// Cloudinary, relative /uploads path for local disk).
paymentsRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "no_file" });

    if (useCloudinary) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: `passei/proofs/${req.userId}`, resource_type: "auto" },
            (err, r) => (err ? reject(err) : resolve(r)),
          );
          stream.end(req.file!.buffer);
        });
        return res.json({ path: result.secure_url, url: result.secure_url });
      } catch {
        return res.status(500).json({ error: "upload_failed" });
      }
    }

    // Local disk fallback (dev).
    const dir = path.join(UPLOAD_DIR, req.userId || "anon");
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(req.file.originalname) || ".bin";
    const filename = `${Date.now()}${ext}`;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);
    const rel = path.join(req.userId || "anon", filename).split(path.sep).join("/");
    return res.json({ path: rel, url: `/uploads/${rel}` });
  },
);

// Create a payment (access) request.
paymentsRouter.post("/request", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId, categoriaNome, comprovativoPath } = req.body || {};
  const me = await one<{ email: string }>("select email from profiles where id = $1", [req.userId]);
  const row = await one<{ id: string }>(
    `insert into payment_requests (user_id, email, concurso_id, categoria_id, categoria_nome, comprovativo_url, status)
     values ($1,$2,$3,$4,$5,$6,'awaiting_review') returning id`,
    [req.userId, me?.email, concursoId, categoriaId, categoriaNome, comprovativoPath],
  );
  res.json({ id: row!.id });
});

// Activate a 6-digit access code.
paymentsRouter.post("/activate-code", requireAuth, async (req: AuthedRequest, res) => {
  const { code, concursoId, categoriaId } = req.body || {};
  const c = await one<{ id: string }>(
    `select id from access_codes
       where code = $1 and concurso_id = $2 and categoria_id = $3 and status = 'available'
       for update`,
    [code, concursoId, categoriaId],
  );
  if (!c) return res.json({ ok: false, error: "invalid_or_used" });
  await query("update access_codes set status='used', used_by=$2, used_at=now() where id=$1", [c.id, req.userId]);
  await query(
    `insert into category_access (user_id, concurso_id, categoria_id, code, expires_at)
     values ($1,$2,$3,$4, now() + interval '4 months')
     on conflict (user_id, concurso_id, categoria_id) do update set expires_at = now() + interval '4 months'`,
    [req.userId, concursoId, categoriaId, code],
  );
  res.json({ ok: true });
});
