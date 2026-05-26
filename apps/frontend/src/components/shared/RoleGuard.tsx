import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../../features/auth/stores/auth.store";
import type { Role } from "../../types/common.types";
import { PANEL_HOME_PATH } from "@/features/admin/config/panel-access";

type RoleGuardProps = {
  allowedRoles: Role[];
  children?: ReactNode;
  redirectTo?: string;
};

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = PANEL_HOME_PATH,
}: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = allowedRoles.includes(user.role);

  if (!hasRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
