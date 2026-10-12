import { and, eq, gt } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Db } from "../db/client";
import { sessions, users } from "../db/schema";
import type { AppEnv, User } from "../env";
import { randomToken, sha256Hex } from "./crypto";

export const SESSION_COOKIE = "tm_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Renova a validade quando restar menos que isto (sessão deslizante). */
const RENEW_THRESHOLD_MS = 29 * 24 * 60 * 60 * 1000;

export async function createSession(c: Context<AppEnv>, db: Db, userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id: await sha256Hex(token),
    userId,
    expiresAt,
    userAgent: c.req.header("user-agent")?.slice(0, 255) ?? null,
  });
  setSessionCookie(c, token, expiresAt);
}

function setSessionCookie(c: Context<AppEnv>, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function resolveSession(
  c: Context<AppEnv>,
  db: Db,
): Promise<{ user: User; sessionId: string } | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const sessionId = await sha256Hex(token);
  const now = new Date();
  const row = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get();
  if (!row) return null;

  if (row.expiresAt.getTime() - now.getTime() < RENEW_THRESHOLD_MS) {
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, sessionId));
    setSessionCookie(c, token, expiresAt);
  }
  return { user: row.user, sessionId };
}

export async function destroySession(c: Context<AppEnv>, db: Db): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await db.delete(sessions).where(eq(sessions.id, await sha256Hex(token)));
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true });
}
