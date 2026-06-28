import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { one, query } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

// In production, refuse to start with the insecure fallback secret: a known
// JWT secret lets anyone forge valid tokens for any account.
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-me") {
  throw new Error(
    "JWT_SECRET is not set. Refusing to start in production with the insecure default.",
  );
}

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export type AuthedRequest = Request & { userId?: string; isAdmin?: boolean };

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const r = await one<{ role: string }>(
    "select role from user_roles where user_id = $1 and role = 'admin' limit 1",
    [userId],
  );
  return !!r;
}

/** Grant the admin role to seeded admin emails. */
export async function maybeGrantAdmin(userId: string, email: string) {
  if (ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
    await query(
      "insert into user_roles (user_id, role) values ($1,'admin') on conflict (user_id, role) do nothing",
      [userId],
    );
  }
}

/** Require a valid token. Populates req.userId. */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = bearer(req);
  const userId = token ? verifyToken(token) : null;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

/** Optional auth — populates req.userId if a valid token is present. */
export async function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = bearer(req);
  const userId = token ? verifyToken(token) : null;
  if (userId) req.userId = userId;
  next();
}

/** Require an admin user. */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = bearer(req);
  const userId = token ? verifyToken(token) : null;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!(await isAdmin(userId)))
    return res.status(403).json({ error: "Forbidden" });
  req.userId = userId;
  req.isAdmin = true;
  next();
}
