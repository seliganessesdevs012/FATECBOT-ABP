import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./routes";
import LoginPage from "./routes/login";
import AdminPage from "./routes/admin";
import AdminNodesPage from "./routes/admin/nodes";
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
