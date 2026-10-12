import { z } from "zod";

export const meSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  picture: z.string().nullable(),
  timezone: z.string(),
});
export type Me = z.infer<typeof meSchema>;

export const columnSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["inbox", "todo", "in_progress", "done"]),
  color: z.string(),
  position: z.string(),
  wipLimit: z.number().int().nullable(),
});
export type Column = z.infer<typeof columnSchema>;
