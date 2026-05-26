import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./routes";
import LoginPage from "./routes/login";
import AdminPage from "./routes/admin";
import AdminLogsPage from "./routes/admin/logs";
import AdminNodesPage from "./routes/admin/nodes";
import AdminTicketsPage from "./routes/admin/tickets";
import AdminUsersPage from "./routes/admin/users";
import SecretaryPage from "./routes/secretary";
import { ProtectedRoute } from "../components/shared/ProtectedRoute";
import { RoleGuard } from "../components/shared/RoleGuard";
import {
  ADMIN_ONLY_ROLES,
  LEGACY_SECRETARY_PATH,
  PANEL_HOME_PATH,
  PANEL_ROUTE_PATHS,
  SHARED_PANEL_ROLES,
} from "@/features/admin/config/panel-access";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />, // Protege todas as rotas filhas
    children: [
      {
        path: PANEL_HOME_PATH,
        element: (
          <RoleGuard allowedRoles={SHARED_PANEL_ROLES}>
            <AdminPage />
          </RoleGuard>
        ),
      },
      {
        path: PANEL_ROUTE_PATHS.nodes,
        element: (
          <RoleGuard allowedRoles={ADMIN_ONLY_ROLES}>
            <AdminNodesPage />
          </RoleGuard>
        ),
      },
      {
        path: PANEL_ROUTE_PATHS.users,
        element: (
          <RoleGuard allowedRoles={ADMIN_ONLY_ROLES}>
            <AdminUsersPage />
          </RoleGuard>
        ),
      },
      {
        path: PANEL_ROUTE_PATHS.tickets,
        element: (
          <RoleGuard allowedRoles={SHARED_PANEL_ROLES}>
            <AdminTicketsPage />
          </RoleGuard>
        ),
      },
      {
        path: PANEL_ROUTE_PATHS.logs,
        element: (
          <RoleGuard allowedRoles={SHARED_PANEL_ROLES}>
            <AdminLogsPage />
          </RoleGuard>
        ),
      },
      {
        path: LEGACY_SECRETARY_PATH,
        element: (
          <RoleGuard allowedRoles={SHARED_PANEL_ROLES}>
            <SecretaryPage />
          </RoleGuard>
        ),
      },
    ],
  },
]);

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
