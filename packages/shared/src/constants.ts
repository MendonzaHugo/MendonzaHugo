export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type TaskStatus = "inbox" | "todo" | "in_progress" | "done";

/** Colunas criadas no primeiro login. Podem ser renomeadas/reordenadas depois. */
export const DEFAULT_COLUMNS: ReadonlyArray<{ name: string; status: TaskStatus; color: string }> = [
  { name: "Caixa de entrada", status: "inbox", color: "slate" },
  { name: "A fazer", status: "todo", color: "blue" },
  { name: "Hoje", status: "todo", color: "amber" },
  { name: "Fazendo", status: "in_progress", color: "violet" },
  { name: "Feito", status: "done", color: "emerald" },
];
