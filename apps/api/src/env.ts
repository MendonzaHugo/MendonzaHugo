import type { users } from "./db/schema";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_URL: string;
  ALLOWED_EMAIL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  /** Chave AES-256 em base64 para criptografar tokens do Google. */
  ENCRYPTION_KEY: string;
  /** "true" habilita login sem Google (somente desenvolvimento local). */
  DEV_LOGIN?: string;
}

export type User = typeof users.$inferSelect;

export interface AppEnv {
  Bindings: Env;
  Variables: { user: User; sessionId: string };
}
