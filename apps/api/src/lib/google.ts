const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/**
 * Escopos pedidos no login. Agenda e Gmail serão adicionados na fase 4
 * (o Google pede o consentimento extra uma única vez).
 */
export const GOOGLE_SCOPES = ["openid", "email", "profile"];

export interface GoogleTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export function buildAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  loginHint?: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });
  if (opts.loginHint) params.set("login_hint", opts.loginHint);
  return `${AUTH_URL}?${params}`;
}

export async function exchangeCode(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<GoogleTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      code: opts.code,
      code_verifier: opts.codeVerifier,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Falha ao trocar código do Google (${res.status})`);
  return res.json();
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_URL, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Falha ao obter perfil do Google (${res.status})`);
  return res.json();
}
