import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`)
    .$onUpdateFn(() => new Date());
const deletedAt = () => integer("deleted_at", { mode: "timestamp_ms" });
const userRef = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

// ---------- Conta e autenticação ----------

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  googleSub: text("google_sub").unique(),
  name: text("name"),
  picture: text("picture"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 do token do cookie — o token em si nunca é gravado. */
    id: text("id").primaryKey(),
    userId: userRef(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const oauthTokens = sqliteTable("oauth_tokens", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("google"),
  /** refresh_token criptografado com AES-GCM (ENCRYPTION_KEY). */
  refreshTokenEnc: text("refresh_token_enc"),
  scopes: text("scopes").notNull().default(""),
  updatedAt: updatedAt(),
});

// ---------- Organização ----------

export const columns = sqliteTable(
  "columns",
  {
    id: id(),
    userId: userRef(),
    name: text("name").notNull(),
    /** Status que uma tarefa assume ao entrar na coluna. */
    status: text("status", { enum: ["inbox", "todo", "in_progress", "done"] }).notNull(),
    color: text("color").notNull().default("slate"),
    position: text("position").notNull(),
    wipLimit: integer("wip_limit"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index("columns_user_idx").on(t.userId, t.position)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    userId: userRef(),
    name: text("name").notNull(),
    color: text("color").notNull().default("slate"),
    position: text("position").notNull(),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index("projects_user_idx").on(t.userId)],
);

export const labels = sqliteTable(
  "labels",
  {
    id: id(),
    userId: userRef(),
    name: text("name").notNull(),
    color: text("color").notNull().default("slate"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index("labels_user_idx").on(t.userId)],
);

// ---------- Tarefas ----------

export const tasks = sqliteTable(
  "tasks",
  {
    id: id(),
    userId: userRef(),
    title: text("title").notNull(),
    notes: text("notes"),
    columnId: text("column_id").references(() => columns.id, { onDelete: "set null" }),
    position: text("position").notNull(),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    /** 1 = urgente … 4 = baixa */
    priority: integer("priority").notNull().default(4),
    status: text("status", { enum: ["inbox", "todo", "in_progress", "done"] })
      .notNull()
      .default("inbox"),
    dueAt: integer("due_at", { mode: "timestamp_ms" }),
    /** Data do prazo sem horário (YYYY-MM-DD), quando não há hora definida. */
    dueDate: text("due_date"),
    scheduledStart: integer("scheduled_start", { mode: "timestamp_ms" }),
    estimateMin: integer("estimate_min"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    recurrenceRuleId: text("recurrence_rule_id"),
    occurrenceDate: text("occurrence_date"),
    source: text("source", { enum: ["manual", "gmail", "recurrence"] })
      .notNull()
      .default("manual"),
    sourceRef: text("source_ref"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    index("tasks_user_column_idx").on(t.userId, t.columnId, t.position),
    index("tasks_user_updated_idx").on(t.userId, t.updatedAt),
    index("tasks_user_due_idx").on(t.userId, t.dueAt),
  ],
);

export const subtasks = sqliteTable(
  "subtasks",
  {
    id: id(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    position: text("position").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("subtasks_task_idx").on(t.taskId)],
);

export const taskLabels = sqliteTable(
  "task_labels",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.labelId] })],
);

/** Histórico de eventos — base para os relatórios de produtividade. */
export const activityLog = sqliteTable(
  "activity_log",
  {
    id: id(),
    userId: userRef(),
    taskId: text("task_id"),
    type: text("type").notNull(),
    data: text("data", { mode: "json" }),
    at: createdAt(),
  },
  (t) => [index("activity_user_at_idx").on(t.userId, t.at)],
);
