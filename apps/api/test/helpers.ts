import { env as cfEnv, type D1Migration } from "cloudflare:test";
import { app } from "../src/app";
import type { Env } from "../src/env";

export const env = cfEnv as unknown as Env & { TEST_MIGRATIONS: D1Migration[] };

export const ORIGIN = "https://tm.example.com";

export function request(path: string, init: RequestInit = {}, overrides: Partial<typeof env> = {}) {
  return app.request(`${ORIGIN}${path}`, init, { ...env, ...overrides });
}

/** Extrai "nome=valor" dos cabeçalhos Set-Cookie. */
export function cookiesFrom(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const header of res.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const idx = pair?.indexOf("=") ?? -1;
    if (pair && idx > 0) out[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
  return out;
}

export async function devLogin(): Promise<string> {
  const res = await request("/api/auth/dev-login", { method: "POST", headers: { origin: ORIGIN } });
  if (res.status !== 200) throw new Error(`dev-login falhou: ${res.status}`);
  const token = cookiesFrom(res).tm_session;
  if (!token) throw new Error("sem cookie de sessão");
  return `tm_session=${token}`;
}
