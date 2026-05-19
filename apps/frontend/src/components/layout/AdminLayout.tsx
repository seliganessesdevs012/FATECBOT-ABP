import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  TreePine,
  Users,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

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
}

const DEFAULT_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  {
    label: "Visao geral",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Nos do chatbot",
    to: "/admin/nodes",
    icon: TreePine,
    helperText: "Pagina entra na TASK-058",
    disabled: true,
  },
  {
    label: "Usuarios",
    to: "/admin/users",
    icon: Users,
    helperText: "Pagina entra na TASK-058",
    disabled: true,
  },
  {
    label: "Logs",
    to: "/admin/logs",
    icon: ScrollText,
    helperText: "Pagina entra em sprint posterior",
    disabled: true,
  },
];

const ROLE_COPY: Record<Role, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria academica",
};

const getInitials = (name: string): string => {
  const parts = name
    .split(" ")
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "FB";
  }

  return parts.map(part => part[0]?.toUpperCase() ?? "").join("");
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
    <div className="min-h-screen bg-[#F3EFE5] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row lg:p-4">
        <aside className="w-full border-b border-[#D9D0C1] bg-[#F6F1E7] px-5 py-6 lg:min-h-[calc(100vh-2rem)] lg:w-[320px] lg:rounded-[32px] lg:border lg:px-6 lg:py-7 lg:shadow-[0_25px_70px_rgba(92,53,12,0.08)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B20000] text-lg font-black text-white shadow-[0_18px_30px_rgba(178,0,0,0.2)]">
              FB
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B20000]">
                FatecBot
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#1C262E]">
                Painel interno
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#E6DCCD] bg-white/75 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C262E] text-sm font-bold text-white">
                {getInitials(userName)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1C262E]">
                  {userName}
                </p>
                <p className="truncate text-xs text-[#6E6252]">{userEmail}</p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EAF3EE] px-3 py-1 text-xs font-semibold text-[#2E6A4F]">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {roleLabel}
            </div>
          </div>

          <nav className="mt-8 space-y-2" aria-label="Navegacao do painel">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = isItemActive(location.pathname, item.to);

              if (item.disabled) {
                return (
                  <div
                    key={item.to}
                    className="rounded-[22px] border border-dashed border-[#D8CEC0] bg-white/55 px-4 py-3 text-[#8B7C69]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEE5D6] text-[#7B6D5C]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs">{item.helperText ?? "Em breve"}</p>
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
                    "group flex items-center gap-3 rounded-[22px] border px-4 py-3 transition-all",
                    isActive
                      ? "border-[#B20000] bg-[#B20000] text-white shadow-[0_18px_36px_rgba(178,0,0,0.22)]"
                      : "border-transparent bg-white/70 text-[#2B2B2B] hover:border-[#E0C6C0] hover:bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                      isActive
                        ? "bg-white/18 text-white"
                        : "bg-[#F0E6D8] text-[#B20000] group-hover:bg-[#F8EEEC]",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <p className="font-semibold">{item.label}</p>
                    <p
                      className={cn(
                        "text-xs",
                        isActive ? "text-white/80" : "text-[#7B6D5C]",
                      )}
                    >
                      {item.to}
                    </p>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] bg-[#1C262E] p-4 text-[#F4EDE2]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F2C7C3]">
              Estado da sprint
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#F7F2EB]">
              Layout administrativo ativo. As paginas de gestao entram nas
              proximas tasks de integracao.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:px-4">
          <div className="flex min-h-full flex-col lg:rounded-[32px] lg:border lg:border-[#DDD2C4] lg:bg-[#FCFBF8] lg:shadow-[0_25px_70px_rgba(92,53,12,0.08)]">
            <header className="border-b border-[#E7DED1] bg-[#FCFBF8]/90 px-5 py-5 backdrop-blur lg:rounded-t-[32px] lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B20000]">
                    {currentSection}
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-[#1C262E]">
                    {title}
                  </h2>
                  {description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6E6252]">
                      {description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden rounded-[20px] border border-[#E6DCCD] bg-white px-4 py-2 text-right sm:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7E6C]">
                      Sessao ativa
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#1C262E]">
                      {userName}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sair
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 px-5 py-5 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
