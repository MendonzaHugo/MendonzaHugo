import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { secureHeaders } from "hono/secure-headers";
import { getDb } from "./db/client";
import type { AppEnv } from "./env";
import { resolveSession } from "./lib/session";
import { authRoutes } from "./routes/auth";
import { columnRoutes } from "./routes/columns";
import { meRoutes } from "./routes/me";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Bloqueia requisições de escrita vindas de outra origem (proteção CSRF). */
const sameOrigin = createMiddleware<AppEnv>(async (c, next) => {
  if (!SAFE_METHODS.has(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin && origin !== new URL(c.env.APP_URL).origin) {
      return c.json({ error: "origem_invalida" }, 403);
    }
  }
  await next();
});

const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await resolveSession(c, getDb(c.env.DB));
  if (!session) return c.json({ error: "nao_autenticado" }, 401);
  c.set("user", session.user);
  c.set("sessionId", session.sessionId);
  await next();
});

export const app = new Hono<AppEnv>();

app.use("/api/*", secureHeaders(), sameOrigin);

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);

const api = new Hono<AppEnv>();
api.use("*", requireAuth);
api.route("/me", meRoutes);
api.route("/columns", columnRoutes);
app.route("/api", api);

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "erro_interno" }, 500);
});

// Qualquer outra rota é servida pelos arquivos estáticos do frontend.
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));
