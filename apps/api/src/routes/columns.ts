import type { Column } from "@tm/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db/client";
import { columns } from "../db/schema";
import type { AppEnv } from "../env";

export const columnRoutes = new Hono<AppEnv>();

columnRoutes.get("/", async (c) => {
  const rows = await getDb(c.env.DB)
    .select()
    .from(columns)
    .where(and(eq(columns.userId, c.get("user").id), isNull(columns.deletedAt)))
    .orderBy(asc(columns.position));
  const result: Column[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    color: r.color,
    position: r.position,
    wipLimit: r.wipLimit,
  }));
  return c.json(result);
});
