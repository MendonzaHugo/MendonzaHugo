import type { Me } from "@tm/shared";
import { Hono } from "hono";
import type { AppEnv } from "../env";

export const meRoutes = new Hono<AppEnv>();

meRoutes.get("/", (c) => {
  const u = c.get("user");
  const me: Me = {
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    timezone: u.timezone,
  };
  return c.json(me);
});
