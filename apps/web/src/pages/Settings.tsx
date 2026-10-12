import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../lib/api";
import { useMe } from "../lib/queries";

export function SettingsPage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-xl p-4 md:p-6">
      <h1 className="text-lg font-semibold">Ajustes</h1>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-medium">Conta</h2>
        <div className="mt-3 flex items-center gap-3">
          {me.data?.picture && (
            <img
              src={me.data.picture}
              alt=""
              className="size-10 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0 text-sm">
            <div className="truncate font-medium">{me.data?.name ?? "—"}</div>
            <div className="truncate text-slate-500">{me.data?.email}</div>
          </div>
        </div>
        <dl className="mt-3 text-sm">
          <dt className="text-slate-500">Fuso horário</dt>
          <dd>{me.data?.timezone}</dd>
        </dl>
        <button
          type="button"
          onClick={logout}
          className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Sair
        </button>
      </section>
    </div>
  );
}
