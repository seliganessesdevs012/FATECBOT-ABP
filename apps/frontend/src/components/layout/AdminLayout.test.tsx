import { expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as matchers from "@testing-library/jest-dom/matchers";

import { AdminLayout } from "./AdminLayout";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { AuthUser } from "@/features/auth/types/auth.types";

type MockAuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
};

expect.extend(matchers);

vi.mock("@/features/auth/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
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

describe("AdminLayout", () => {
  it("renderiza dados do usuario, navegacao e conteudo da pagina", () => {
    const state = createMockAuthState();

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (store: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
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

    expect(screen.getAllByText("Ana Admin")).toHaveLength(2);
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visao geral \/admin/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conteudo protegido")).toBeInTheDocument();
    expect(screen.getAllByText("Pagina entra na TASK-058")).toHaveLength(2);
  });

  it("encerra a sessao e navega para login ao clicar em sair", async () => {
    const user = userEvent.setup();
    const clearAuth = vi.fn();
    const state = createMockAuthState({ clearAuth });

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (store: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
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
});
