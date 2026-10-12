import { useColumns } from "../lib/queries";

const DOT: Record<string, string> = {
  slate: "bg-slate-400",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
};

export function BoardPage() {
  const columns = useColumns();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6">
        <h1 className="text-lg font-semibold">Kanban</h1>
      </header>

      {columns.isPending ? (
        <p className="px-6 text-sm text-slate-500">Carregando…</p>
      ) : (
        <div className="flex flex-1 snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 md:px-6">
          {columns.data?.map((col) => (
            <section
              key={col.id}
              className="flex w-[85vw] max-w-80 shrink-0 snap-start flex-col rounded-xl bg-slate-100 p-3 md:w-72 dark:bg-slate-900"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <span className={`size-2 rounded-full ${DOT[col.color] ?? DOT.slate}`} />
                {col.name}
              </h2>
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                Nenhuma tarefa
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
