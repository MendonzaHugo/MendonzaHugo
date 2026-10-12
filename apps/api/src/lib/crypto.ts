const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64Decode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function randomToken(bytes = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** code_challenge do PKCE (método S256). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

async function importKey(keyBase64: string): Promise<CryptoKey> {
  const raw = base64Decode(keyBase64);
  if (raw.length !== 32) throw new Error("ENCRYPTION_KEY deve ter 32 bytes em base64");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Criptografa com AES-256-GCM. Saída: base64url(iv) + "." + base64url(cifra). */
export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(cipher))}`;
}

export async function decrypt(payload: string, keyBase64: string): Promise<string> {
  const [iv, data] = payload.split(".");
  if (!iv || !data) throw new Error("Payload criptografado inválido");
  const key = await importKey(keyBase64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64Decode(iv) },
    key,
    base64Decode(data),
  );
  return new TextDecoder().decode(plain);
}
