import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { BoardPage } from "./pages/Board";
import { LoginPage } from "./pages/Login";
import { PlaceholderPage } from "./pages/Placeholder";
import { SettingsPage } from "./pages/Settings";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/kanban" replace /> },
      { path: "kanban", element: <BoardPage /> },
      { path: "hoje", element: <PlaceholderPage title="Hoje" fase={3} /> },
      { path: "semana", element: <PlaceholderPage title="Semana" fase={3} /> },
      { path: "mes", element: <PlaceholderPage title="Mês" fase={3} /> },
      { path: "relatorios", element: <PlaceholderPage title="Relatórios" fase={5} /> },
      { path: "configuracoes", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/kanban" replace /> },
    ],
  },
]);
