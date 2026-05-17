import { expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

import { RoleGuard } from "./RoleGuard";
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
  token: null,
  user: null,
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  ...overrides,
});

describe("RoleGuard", () => {
  it("renderiza a rota quando o role e permitido", () => {
    const state = createMockAuthState({
      token: "valid-token",
      user: {
        id: 1,
        name: "Admin",
        email: "admin@fatec.sp.gov.br",
        role: "ADMIN",
      },
    });

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Painel Admin")).toBeInTheDocument();
  });

  it("bloqueia acesso quando o role nao e permitido", () => {
    const state = createMockAuthState({
      token: "valid-token",
      user: {
        id: 1,
        name: "Secretaria",
        email: "secretaria@fatec.sp.gov.br",
        role: "SECRETARIA",
      },
    });

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: MockAuthState) => unknown) =>
        selector ? selector(state) : state,
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/" element={<div>Pagina Inicial</div>} />
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Pagina Inicial")).toBeInTheDocument();
    expect(screen.queryByText("Painel Admin")).not.toBeInTheDocument();
  });
});
