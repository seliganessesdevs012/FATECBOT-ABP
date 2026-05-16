import { expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { AuthUser } from "@/features/auth/types/auth.types";

type AuthStateShape = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
};

expect.extend(matchers);

vi.mock("@/features/auth/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

describe("ProtectedRoute", () => {
  it("redireciona para /login quando nao autenticado", () => {
    const state: AuthStateShape = {
      token: null,
      user: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    };

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: AuthStateShape) => unknown) =>
        selector ? selector(state) : state
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
          <Route path="/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Página de Login")).toBeInTheDocument();
    expect(screen.queryByText("Painel Admin")).not.toBeInTheDocument();
  });

  it("renderiza as rotas filhas quando autenticado", () => {
    const state: AuthStateShape = {
      token: "valid-token",
      user: {
        id: 1,
        name: "Admin",
        email: "admin@fatec.sp.gov.br",
        role: "ADMIN",
      },
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    };

    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: AuthStateShape) => unknown) =>
        selector ? selector(state) : state
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Painel Admin")).toBeInTheDocument();
  });
});