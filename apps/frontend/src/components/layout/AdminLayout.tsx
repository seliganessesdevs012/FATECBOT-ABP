import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  LayoutDashboard,
  Menu,
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
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/common.types";

export interface AdminNavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  helperText?: string;
  disabled?: boolean;
}

export interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  navigationItems?: AdminNavigationItem[];
  hidePageHeader?: boolean;
  contentClassName?: string;
}

const DEFAULT_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Usuarios",
    to: "/admin/users",
    icon: Users,
  },
  {
    label: "Care",
    to: "/admin/nodes",
    icon: Bot,
  },
  {
    label: "Tickets",
    to: "/admin/tickets",
    icon: Ticket,
    helperText: "Disponivel em sprint futura",
    disabled: true,
  },
  {
    label: "Historico",
    to: "/admin/logs",
    icon: ScrollText,
    helperText: "Pagina entra em sprint posterior",
    disabled: true,
  },
  {
    label: "Configuracoes",
    to: "/admin/settings",
    icon: Settings,
    helperText: "Disponivel em sprint futura",
    disabled: true,
  },
];

const ROLE_COPY: Record<Role, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria academica",
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
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const roleLabel = user?.role ? ROLE_COPY[user.role] : "Area protegida";
  const userName = user?.name ?? "Usuario autenticado";
  const userEmail = user?.email ?? "Sessao ativa";
  const currentSection =
    navigationItems.find(item => isItemActive(location.pathname, item.to))
      ?.label ?? "Painel";

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#ECE5D6] text-[#454545]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex w-full flex-col bg-[#FBFBFB] lg:min-h-screen lg:w-[222px] lg:border-r lg:border-[#E9E2D5]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#A5B59A] bg-[#E8E2D1]">
                <img
                  src={mascotImg}
                  alt="Mascote"
                  className="h-8 w-8 object-contain scale-x-[-1]"
                />
              </div>

              <div className="min-w-0">
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
              aria-label="Menu do painel"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#454545]"
            >
              <Menu className="size-7" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-between px-5 py-8" aria-label="Navegacao do painel">
            <div className="space-y-4">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = isItemActive(location.pathname, item.to);

              if (item.disabled) {
                return (
                  <div
                    key={item.to}
                    className="rounded-xl px-2 py-2 text-[#666666] opacity-65"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center text-[#575757]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.98rem] font-black italic">{item.label}</p>
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
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors",
                    isActive
                      ? "text-[#3B3B3B]"
                      : "text-[#575757] hover:text-[#2E2E2E]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center",
                      isActive
                        ? "text-[#3F3F3F]"
                        : "text-[#5A5A5A]",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>

                  <p className="text-[0.98rem] font-black italic">{item.label}</p>
                </NavLink>
              );
            })}
            </div>

            <div className="space-y-3 px-2">
              <div className="rounded-2xl bg-[#F6F2E8] px-3 py-3 text-[0.72rem] text-[#7B766E]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  <span>{userEmail}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                className="w-full justify-center"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair
              </Button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 bg-[#EEE9DA]">
          <div className="flex min-h-screen flex-col">
            <header className="flex items-start justify-between px-4 py-3 lg:px-5">
              <div>
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
                  <div className="h-10" />
                )}
              </div>

              <img
                src={fatecImg}
                alt="Fatec"
                className="w-20 object-contain opacity-95 lg:w-24"
              />
            </header>

            <main
              className={cn(
                "flex-1 px-4 pb-4 lg:px-5 lg:pb-5",
                contentClassName,
              )}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
