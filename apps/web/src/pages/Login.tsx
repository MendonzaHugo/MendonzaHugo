import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../lib/api";
import { useAuthConfig } from "../lib/queries";

const ERRORS: Record<string, string> = {
  email_nao_autorizado: "Esta conta Google não tem permissão para acessar o app.",
  acesso_negado: "O acesso foi cancelado na tela do Google.",
  estado_invalido: "A sessão de login expirou. Tente novamente.",
  falha_google: "Não foi possível falar com o Google. Tente novamente.",
};

export function LoginPage() {
  const [params] = useSearchParams();
  const config = useAuthConfig();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const error = params.get("erro");

  async function devLogin() {
    setBusy(true);
    try {
      await api("/auth/dev-login", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/kanban", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <img src="/icon.svg" alt="" className="mx-auto mb-4 size-14" />
        <h1 className="text-center text-xl font-semibold">Task Manager</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Suas tarefas, no seu tempo.</p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {ERRORS[error] ?? "Não foi possível entrar."}
          </p>
        )}

        <a
          href="/api/auth/google/login"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <GoogleLogo />
          Entrar com Google
        </a>

        {config.data?.devLogin && (
          <button
            type="button"
            onClick={devLogin}
            disabled={busy}
            className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            Entrar (modo desenvolvimento)
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
