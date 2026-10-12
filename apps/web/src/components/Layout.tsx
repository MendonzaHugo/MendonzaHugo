import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Columns3,
  type LucideIcon,
  Settings,
  Sun,
} from "lucide-react";
import { Navigate, NavLink, Outlet } from "react-router";
import { ApiError } from "../lib/api";
import { useMe } from "../lib/queries";

const NAV: { to: string; label: string; icon: LucideIcon; mobile: boolean }[] = [
  { to: "/kanban", label: "Kanban", icon: Columns3, mobile: true },
  { to: "/hoje", label: "Hoje", icon: Sun, mobile: true },
  { to: "/semana", label: "Semana", icon: CalendarRange, mobile: true },
  { to: "/mes", label: "Mês", icon: CalendarDays, mobile: false },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, mobile: true },
  { to: "/configuracoes", label: "Ajustes", icon: Settings, mobile: true },
];

export function Layout() {
  const me = useMe();

  if (me.error instanceof ApiError && me.error.status === 401)
    return <Navigate to="/login" replace />;
  if (me.isPending) return <FullScreenMessage>Carregando…</FullScreenMessage>;
  if (me.isError)
    return <FullScreenMessage>Não foi possível conectar. Tente novamente.</FullScreenMessage>;

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-3 md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2 px-2 pt-1">
          <img src="/icon.svg" alt="" className="size-7" />
          <span className="font-semibold">Task Manager</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-auto truncate px-2 text-xs text-slate-500">{me.data.email}</div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {NAV.filter((i) => i.mobile).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-2 py-2 text-sm ${
          isActive
            ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  );
}

export function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
      {children}
    </div>
  );
}
