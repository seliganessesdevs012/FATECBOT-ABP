import { expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as matchers from "@testing-library/jest-dom/matchers";

import { AdminLayout } from "./AdminLayout";
import { useAdminShellStore } from "@/features/admin/stores/admin-shell.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { AuthUser } from "@/features/auth/types/auth.types";

type MockAuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
};

type MockAdminShellState = {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

expect.extend(matchers);

vi.mock("@/features/auth/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/features/admin/stores/admin-shell.store", () => ({
  useAdminShellStore: vi.fn(),
}));

const createMockAuthState = (
  overrides: Partial<MockAuthState> = {},
): MockAuthState => ({
  token: "valid-token",
  user: {
    id: 1,
    name: "Ana Admin",
    email: "ana@fatec.sp.gov.br",
    role: "ADMIN",
  },
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  ...overrides,
});

const createMockAdminShellState = (
  overrides: Partial<MockAdminShellState> = {},
): MockAdminShellState => ({
  isSidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
  toggleSidebar: vi.fn(),
  ...overrides,
});

describe("AdminLayout", () => {
  it("renderiza dados do usuario, navegacao e conteudo da pagina", () => {
    const state = createMockAuthState();
    const shellState = createMockAdminShellState();

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (store: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
    );
    vi.mocked(useAdminShellStore).mockImplementation(
      (selector?: (store: MockAdminShellState) => unknown) =>
        selector ? selector(shellState) : shellState,
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminLayout
                title="Painel administrativo"
                description="Descricao da pagina."
              >
                <div>Conteudo protegido</div>
              </AdminLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^care$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^usuarios$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conteudo protegido")).toBeInTheDocument();
    expect(screen.queryByText("Pagina entra em sprint posterior")).toBeNull();
    expect(screen.getAllByText("Disponivel em sprint futura")).toHaveLength(1);
  });

  it("encerra a sessao e navega para login ao clicar em sair", async () => {
    const user = userEvent.setup();
    const clearAuth = vi.fn();
    const state = createMockAuthState({ clearAuth });
    const shellState = createMockAdminShellState();

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (store: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
    );
    vi.mocked(useAdminShellStore).mockImplementation(
      (selector?: (store: MockAdminShellState) => unknown) =>
        selector ? selector(shellState) : shellState,
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminLayout title="Painel administrativo">
                <div>Conteudo protegido</div>
              </AdminLayout>
            }
          />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /^sair$/i }));

    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
  });

  it("usa o mesmo toggle global da sidebar em qualquer pagina do painel", async () => {
    const user = userEvent.setup();
    const state = createMockAuthState();
    const toggleSidebar = vi.fn();
    const shellState = createMockAdminShellState({
      isSidebarCollapsed: true,
      toggleSidebar,
    });

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (store: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
    );
    vi.mocked(useAdminShellStore).mockImplementation(
      (selector?: (store: MockAdminShellState) => unknown) =>
        selector ? selector(shellState) : shellState,
    );

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route
            path="/admin/users"
            element={
              <AdminLayout title="Usuarios">
                <div>Conteudo protegido</div>
              </AdminLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /expandir barra lateral/i }),
    );

    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });
});
