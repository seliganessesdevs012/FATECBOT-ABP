import type { Role } from "@/types/common.types";

export const PANEL_HOME_PATH = "/admin";
export const LEGACY_SECRETARY_PATH = "/secretary";

export const SHARED_PANEL_ROLES: Role[] = ["ADMIN", "SECRETARIA"];
export const ADMIN_ONLY_ROLES: Role[] = ["ADMIN"];

export const PANEL_ROUTE_PATHS = {
  home: PANEL_HOME_PATH,
  users: "/admin/users",
  nodes: "/admin/nodes",
  tickets: "/admin/tickets",
  logs: "/admin/logs",
  settings: "/admin/settings",
} as const;

export function hasRoleAccess(
  role: Role | null | undefined,
  allowedRoles: readonly Role[],
): boolean {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}
