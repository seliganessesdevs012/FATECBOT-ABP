import type { ReactNode } from "react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  ScrollText,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import fatecImg from "@/assets/login_fatec.png";
import mascotImg from "@/assets/login_jacare.png";
import { Button } from "@/components/ui/button";
import { ResponsiveMenuModal } from "@/components/shared/ResponsiveMenuModal";
import {
  ADMIN_ONLY_ROLES,
  PANEL_ROUTE_PATHS,
  SHARED_PANEL_ROLES,
  hasRoleAccess,
} from "@/features/admin/config/panel-access";
import { useAdminShellStore } from "@/features/admin/stores/admin-shell.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/common.types";

export interface AdminNavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  helperText?: string;
  disabled?: boolean;
  allowedRoles?: Role[];
}

export interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  navigationItems?: AdminNavigationItem[];
  hidePageHeader?: boolean;
  contentClassName?: string;
  containerClassName?: string;
}

const DEFAULT_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    to: PANEL_ROUTE_PATHS.home,
    icon: LayoutDashboard,
  },
  {
    label: "Usuários",
    to: PANEL_ROUTE_PATHS.users,
    icon: Users,
    allowedRoles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Care",
    to: PANEL_ROUTE_PATHS.nodes,
    icon: Bot,
    allowedRoles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Tickets",
    to: PANEL_ROUTE_PATHS.tickets,
    icon: Ticket,
  },
  {
    label: "Histórico",
    to: PANEL_ROUTE_PATHS.logs,
    icon: ScrollText,
  },
  {
    label: "Configurações",
    to: PANEL_ROUTE_PATHS.settings,
    icon: Settings,
    helperText: "Troca de senha da conta",
    allowedRoles: SHARED_PANEL_ROLES,
  },
];

const ROLE_COPY: Record<Role, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria acadêmica",
};

const isItemActive = (pathname: string, itemPath: string): boolean => {
  if (itemPath === "/admin") {
    return pathname === itemPath;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export function AdminLayout({
  children,
  title,
  description,
  navigationItems = DEFAULT_NAVIGATION_ITEMS,
  hidePageHeader = false,
  contentClassName,
  containerClassName,
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isSidebarCollapsed = useAdminShellStore(
    (state) => state.isSidebarCollapsed,
  );
  const toggleSidebar = useAdminShellStore((state) => state.toggleSidebar);
  const mobileMenuOpen = useAdminShellStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useAdminShellStore((state) => state.setMobileMenuOpen);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  const roleLabel = user?.role ? ROLE_COPY[user.role] : "Área protegida";
  const userName = user?.name ?? "Usuário autenticado";
  const userEmail = user?.email ?? "Sessão ativa";
  const visibleNavigationItems = navigationItems.filter(
    (item) =>
      !item.allowedRoles || hasRoleAccess(user?.role, item.allowedRoles),
  );
  const currentSection =
    visibleNavigationItems.find((item) =>
      isItemActive(location.pathname, item.to),
    )?.label ?? "Painel";

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#ECE5D6] text-[#454545]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className={cn(
            "!hidden lg:!flex w-full flex-col bg-[#FBFBFB] lg:min-h-screen lg:border-r lg:border-[#E9E2D5]",
            isSidebarCollapsed ? "lg:w-22" : "lg:w-55.5",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#A5B59A] bg-[#E8E2D1]">
                <img
                  src={mascotImg}
                  alt="Mascote"
                  className="h-8 w-8 object-contain scale-x-[-1]"
                />
              </div>

              <div className={cn("min-w-0", isSidebarCollapsed && "lg:hidden")}>
                <p className="truncate text-[0.95rem] font-black text-[#454545]">
                  {userName.split(" ")[0] ?? "Usuario"}
                </p>
                <p className="truncate text-[0.72rem] text-[#7B766E]">
                  {roleLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label={
                isSidebarCollapsed
                  ? "Expandir barra lateral"
                  : "Recolher barra lateral"
              }
              title={
                isSidebarCollapsed
                  ? "Expandir barra lateral"
                  : "Recolher barra lateral"
              }
              onClick={toggleSidebar}
              className={cn(
                "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[#454545] transition-colors hover:bg-[#F3EEE3] active:bg-[#E9E1D4]",
                isSidebarCollapsed && "lg:h-9 lg:w-9",
              )}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="size-5" aria-hidden="true" />
              ) : (
                <ChevronLeft className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <nav
            className={cn(
              "flex flex-1 flex-col justify-between py-8",
              isSidebarCollapsed ? "px-3" : "px-5",
            )}
            aria-label="Navegação do painel"
          >
            <div className="space-y-4">
              {visibleNavigationItems.map((item) => {
                // CORREÇÃO 1: Extrair o Icon e calcular o isActive antes de usar
                const Icon = item.icon;
                const isActive = isItemActive(location.pathname, item.to);

                // CORREÇÃO 2: Fechar o bloco disabled corretamente com o "if"
                if (item.disabled) {
                  return (
                    <div
                      key={item.to}
                      className={cn(
                        "rounded-xl px-2 py-2 text-[#666666] opacity-65",
                        isSidebarCollapsed && "lg:flex lg:justify-center",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center text-[#575757]">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <div
                          className={cn(
                            "min-w-0",
                            isSidebarCollapsed && "lg:hidden",
                          )}
                        >
                          <p className="text-[0.98rem] font-black italic">
                            {item.label}
                          </p>
                          {item.helperText ? (
                            <p className="text-[0.68rem] leading-tight text-[#8A857E]">
                              {item.helperText}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Fluxo padrão (ativo)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 transition-colors active:bg-[#ECE4D7]",
                      isSidebarCollapsed && "lg:justify-center",
                      isActive
                        ? "bg-[#F3EEE3] text-[#3B3B3B]"
                        : "text-[#575757] hover:bg-[#F7F2E9] hover:text-[#2E2E2E]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center",
                        isActive ? "text-[#3F3F3F]" : "text-[#5A5A5A]",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <p
                      className={cn(
                        "text-[0.98rem] font-black italic",
                        isSidebarCollapsed && "lg:hidden",
                      )}
                    >
                      {item.label}
                    </p>
                  </NavLink>
                );
              })}
            </div>

            <div
              className={cn("space-y-3 px-2", isSidebarCollapsed && "lg:px-0")}
            >
              <div
                className={cn(
                  "rounded-2xl bg-[#F6F2E8] px-3 py-3 text-[0.72rem] text-[#7B766E]",
                  isSidebarCollapsed && "lg:hidden",
                )}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  <span>{userEmail}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                className={cn(
                  "w-full justify-center",
                  isSidebarCollapsed && "lg:w-auto lg:px-3",
                )}
                title={isSidebarCollapsed ? "Sair" : undefined}
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className={cn(isSidebarCollapsed && "lg:hidden")}>
                  Sair
                </span>
              </Button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 bg-[#EEE9DA]">
          <div className="flex min-h-screen flex-col">
            <header className="px-4 py-3 lg:px-5">
              <div
                className={cn(
                  "mx-auto flex w-full items-start justify-between gap-6",
                  "max-w-330",
                  containerClassName,
                )}
              >
                <div>
                  {/* Menu Hamburguer (Sempre visível no mobile) */}
                  <div className="mb-2 lg:hidden">
                    <button
                      type="button"
                      aria-label="Abrir menu"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#454545] shadow-sm"
                      onClick={() => setMobileMenuOpen(true)}
                    >
                      <Menu className="size-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Textos do Cabeçalho (Ocultos se hidePageHeader for true) */}
                  {!hidePageHeader ? (
                    <>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#8C7E6C]">
                        {currentSection}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-[#33383D]">
                        {title}
                      </h2>
                      {description ? (
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6F6A62]">
                          {description}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <div className="hidden lg:block h-10" />
                  )}
                </div>

                <img
                  src={fatecImg}
                  alt="Fatec"
                  className="w-20 object-contain opacity-95 lg:w-24"
                />
              </div>
            </header>

            <ResponsiveMenuModal
              open={mobileMenuOpen}
              title="Navegacao do painel"
              onClose={() => setMobileMenuOpen(false)}
              initialFocusRef={firstLinkRef}
            >
              <nav className="space-y-2" aria-label="Menu principal">
                {visibleNavigationItems.map((item, idx) => {
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.to}
                        className="rounded-xl border border-[#EDE5D7] px-3 py-3 text-[#666666] opacity-65"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-5 w-5 items-center justify-center text-[#575757]">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.98rem] font-black italic">
                              {item.label}
                            </p>
                            {item.helperText ? (
                              <p className="text-[0.68rem] leading-tight text-[#8A857E]">
                                {item.helperText}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      ref={idx === 0 ? firstLinkRef : undefined}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-base font-semibold text-[#33383D] transition-colors hover:bg-[#F3EEE3]"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center text-[#575757]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </ResponsiveMenuModal>

            <main
              className={cn(
                "flex-1 px-4 pb-4 lg:px-5 lg:pb-5",
              )}
            >
              <div
                className={cn(
                  "mx-auto w-full max-w-330",
                  containerClassName,
                  contentClassName,
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}