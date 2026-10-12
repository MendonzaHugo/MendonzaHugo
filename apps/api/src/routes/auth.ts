import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getDb } from "../db/client";
import { oauthTokens } from "../db/schema";
import type { AppEnv } from "../env";
import { encrypt, pkceChallenge, randomToken } from "../lib/crypto";
import { buildAuthUrl, exchangeCode, fetchUserInfo } from "../lib/google";
import { createSession, destroySession } from "../lib/session";
import { isAllowedEmail, upsertUser } from "../lib/users";

const OAUTH_COOKIE = "tm_oauth";

export const authRoutes = new Hono<AppEnv>();

const redirectUri = (appUrl: string) => `${appUrl}/api/auth/google/callback`;
const loginError = (appUrl: string, code: string) => `${appUrl}/login?erro=${code}`;

authRoutes.get("/google/login", async (c) => {
  const state = randomToken(16);
  const verifier = randomToken(48);
  setCookie(c, OAUTH_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/api/auth",
    maxAge: 600,
  });
  return c.redirect(
    buildAuthUrl({
      clientId: c.env.GOOGLE_CLIENT_ID,
      redirectUri: redirectUri(c.env.APP_URL),
      state,
      codeChallenge: await pkceChallenge(verifier),
      loginHint: c.env.ALLOWED_EMAIL.split(",")[0]?.trim(),
    }),
  );
});

authRoutes.get("/google/callback", async (c) => {
  const appUrl = c.env.APP_URL;
  const stored = getCookie(c, OAUTH_COOKIE);
  deleteCookie(c, OAUTH_COOKIE, { path: "/api/auth", secure: true });

  if (c.req.query("error")) return c.redirect(loginError(appUrl, "acesso_negado"));

  const [state, verifier] = stored?.split(".") ?? [];
  const code = c.req.query("code");
  if (!state || !verifier || !code || c.req.query("state") !== state) {
    return c.redirect(loginError(appUrl, "estado_invalido"));
  }

  let tokens: Awaited<ReturnType<typeof exchangeCode>>;
  let profile: Awaited<ReturnType<typeof fetchUserInfo>>;
  try {
    tokens = await exchangeCode({
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri: redirectUri(appUrl),
      code,
      codeVerifier: verifier,
    });
    profile = await fetchUserInfo(tokens.access_token);
  } catch (err) {
    console.error("OAuth Google falhou", err);
    return c.redirect(loginError(appUrl, "falha_google"));
  }

  if (!profile.email_verified || !isAllowedEmail(profile.email, c.env.ALLOWED_EMAIL)) {
    return c.redirect(loginError(appUrl, "email_nao_autorizado"));
  }

  const db = getDb(c.env.DB);
  const user = await upsertUser(db, {
    email: profile.email,
    googleSub: profile.sub,
    name: profile.name,
    picture: profile.picture,
  });

  if (tokens.refresh_token) {
    const refreshTokenEnc = await encrypt(tokens.refresh_token, c.env.ENCRYPTION_KEY);
    await db
      .insert(oauthTokens)
      .values({ userId: user.id, refreshTokenEnc, scopes: tokens.scope })
      .onConflictDoUpdate({
        target: oauthTokens.userId,
        set: { refreshTokenEnc, scopes: tokens.scope },
      });
  }

  await createSession(c, db, user.id);
  return c.redirect(`${appUrl}/`);
});

/** Login sem Google, apenas quando DEV_LOGIN=true (ambiente local). */
authRoutes.post("/dev-login", async (c) => {
  if (c.env.DEV_LOGIN !== "true") return c.json({ error: "not_found" }, 404);
  const email = c.env.ALLOWED_EMAIL.split(",")[0]?.trim();
  if (!email) return c.json({ error: "ALLOWED_EMAIL não configurado" }, 500);
  const db = getDb(c.env.DB);
  const user = await upsertUser(db, { email, name: "Dev" });
  await createSession(c, db, user.id);
  return c.json({ ok: true });
});

authRoutes.get("/config", (c) => c.json({ devLogin: c.env.DEV_LOGIN === "true" }));

authRoutes.post("/logout", async (c) => {
  await destroySession(c, getDb(c.env.DB));
  return c.json({ ok: true });
});
