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
        path: "/admin",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <AdminPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/nodes",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <AdminNodesPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <AdminUsersPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/tickets",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <AdminTicketsPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/logs",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <AdminLogsPage />
          </RoleGuard>
        ),
      },
      {
        path: "/secretary",
        element: (
          <RoleGuard allowedRoles={["SECRETARIA"]}>
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
