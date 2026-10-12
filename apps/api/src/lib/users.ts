import { DEFAULT_COLUMNS, initialPositions } from "@tm/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { columns, users } from "../db/schema";
import type { User } from "../env";

export function isAllowedEmail(email: string, allowed: string): boolean {
  const list = allowed
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/** Cria o usuário no primeiro login (com as colunas padrão do Kanban) ou atualiza o perfil. */
export async function upsertUser(
  db: Db,
  profile: { email: string; googleSub?: string; name?: string | null; picture?: string | null },
): Promise<User> {
  const email = profile.email.toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        googleSub: profile.googleSub ?? existing.googleSub,
        name: profile.name ?? existing.name,
        picture: profile.picture ?? existing.picture,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const id = crypto.randomUUID();
  const positions = initialPositions(DEFAULT_COLUMNS.length);
  const [, created] = await db.batch([
    db.insert(users).values({
      id,
      email,
      googleSub: profile.googleSub ?? null,
      name: profile.name ?? null,
      picture: profile.picture ?? null,
    }),
    db.select().from(users).where(eq(users.id, id)),
    db.insert(columns).values(
      DEFAULT_COLUMNS.map((col, i) => ({
        userId: id,
        name: col.name,
        status: col.status,
        color: col.color,
        position: positions[i] as string,
      })),
    ),
  ]);
  const user = created[0];
  if (!user) throw new Error("Falha ao criar usuário");
  return user;
}
