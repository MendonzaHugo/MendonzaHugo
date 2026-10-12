import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDb } from "../src/db/client";
import { oauthTokens, users } from "../src/db/schema";
import { decrypt } from "../src/lib/crypto";
import { cookiesFrom, devLogin, env, ORIGIN, request } from "./helpers";

afterEach(() => vi.restoreAllMocks());

async function startLogin() {
  const res = await request("/api/auth/google/login");
  const oauth = cookiesFrom(res).tm_oauth ?? "";
  const location = new URL(res.headers.get("location") ?? "");
  return { res, oauth, location, state: location.searchParams.get("state") ?? "" };
}

function mockGoogle(profile: { email: string; email_verified?: boolean }) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      return Response.json({
        access_token: "access",
        refresh_token: "refresh-secreto",
        expires_in: 3600,
        scope: "openid email profile",
        token_type: "Bearer",
      });
    }
    if (url.startsWith("https://openidconnect.googleapis.com/v1/userinfo")) {
      return Response.json({ sub: "google-123", name: "Dono", email_verified: true, ...profile });
    }
    throw new Error(`fetch inesperado: ${url}`);
  });
}

describe("login com Google", () => {
  it("redireciona para o Google com state e PKCE", async () => {
    const { res, oauth, location, state } = await startLogin();
    expect(res.status).toBe(302);
    expect(location.origin).toBe("https://accounts.google.com");
    expect(location.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/api/auth/google/callback`);
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("access_type")).toBe("offline");
    expect(oauth.startsWith(`${state}.`)).toBe(true);
  });

  it("rejeita callback com state diferente", async () => {
    const { oauth } = await startLogin();
    const res = await request("/api/auth/google/callback?code=abc&state=outro", {
      headers: { cookie: `tm_oauth=${oauth}` },
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?erro=estado_invalido`);
  });

  it("cria usuário, guarda refresh token criptografado e abre sessão", async () => {
    mockGoogle({ email: "Dono@Example.com" });
    const { oauth, state } = await startLogin();
    const res = await request(`/api/auth/google/callback?code=abc&state=${state}`, {
      headers: { cookie: `tm_oauth=${oauth}` },
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/`);
    const session = cookiesFrom(res).tm_session;
    expect(session).toBeTruthy();

    const db = getDb(env.DB);
    const user = await db.select().from(users).where(eq(users.email, "dono@example.com")).get();
    expect(user?.googleSub).toBe("google-123");
    const token = await db.select().from(oauthTokens).get();
    expect(token?.refreshTokenEnc).not.toContain("refresh-secreto");
    expect(await decrypt(token?.refreshTokenEnc ?? "", env.ENCRYPTION_KEY)).toBe("refresh-secreto");

    const me = await request("/api/me", { headers: { cookie: `tm_session=${session}` } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email: "dono@example.com", name: "Dono" });
  });

  it("bloqueia e-mail fora da lista de permissão", async () => {
    mockGoogle({ email: "intruso@example.com" });
    const { oauth, state } = await startLogin();
    const res = await request(`/api/auth/google/callback?code=abc&state=${state}`, {
      headers: { cookie: `tm_oauth=${oauth}` },
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?erro=email_nao_autorizado`);
    expect(cookiesFrom(res).tm_session).toBeUndefined();
    const intruso = await getDb(env.DB)
      .select()
      .from(users)
      .where(eq(users.email, "intruso@example.com"))
      .get();
    expect(intruso).toBeUndefined();
  });

  it("bloqueia e-mail não verificado", async () => {
    mockGoogle({ email: "dono@example.com", email_verified: false });
    const { oauth, state } = await startLogin();
    const res = await request(`/api/auth/google/callback?code=abc&state=${state}`, {
      headers: { cookie: `tm_oauth=${oauth}` },
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?erro=email_nao_autorizado`);
  });
});

describe("sessão", () => {
  it("exige autenticação na API", async () => {
    expect((await request("/api/me")).status).toBe(401);
    expect((await request("/api/columns")).status).toBe(401);
  });

  it("health é público", async () => {
    expect((await request("/api/health")).status).toBe(200);
  });

  it("dev-login fica desligado sem DEV_LOGIN", async () => {
    const res = await request(
      "/api/auth/dev-login",
      { method: "POST", headers: { origin: ORIGIN } },
      { DEV_LOGIN: undefined },
    );
    expect(res.status).toBe(404);
  });

  it("primeiro login cria as colunas padrão do Kanban", async () => {
    const cookie = await devLogin();
    const res = await request("/api/columns", { headers: { cookie } });
    const cols = (await res.json()) as { name: string }[];
    expect(cols.map((c) => c.name)).toEqual([
      "Caixa de entrada",
      "A fazer",
      "Hoje",
      "Fazendo",
      "Feito",
    ]);
  });

  it("logout invalida a sessão", async () => {
    const cookie = await devLogin();
    await request("/api/auth/logout", { method: "POST", headers: { cookie, origin: ORIGIN } });
    expect((await request("/api/me", { headers: { cookie } })).status).toBe(401);
  });

  it("recusa escrita vinda de outra origem", async () => {
    const res = await request("/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://malicioso.example" },
    });
    expect(res.status).toBe(403);
  });
});
