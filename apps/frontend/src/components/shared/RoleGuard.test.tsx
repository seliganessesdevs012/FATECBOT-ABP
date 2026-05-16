import { expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

import { RoleGuard } from "./RoleGuard";
import { useAuthStore } from "../../features/auth/stores/auth.store";
// import type { AuthUser } from "../../features/auth/types/auth.types";

// test-only shape omitted (useAny in mock implementations)

expect.extend(matchers);

vi.mock("../../features/auth/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

describe("RoleGuard", () => {
  it("renderiza a rota quando o role e permitido", () => {
    vi.mocked(useAuthStore).mockImplementation(
      (selector?: any) =>
        selector
          ? selector({
              token: "valid-token",
              user: {
                id: 1,
                name: "Admin",
                email: "admin@fatec.sp.gov.br",
                role: "ADMIN",
              },
            })
          : null
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Painel Admin")).toBeInTheDocument();
  });

  it("bloqueia acesso quando o role nao e permitido", () => {
    vi.mocked(useAuthStore).mockImplementation(
      (selector?: any) =>
        selector
          ? selector({
              token: "valid-token",
              user: {
                id: 1,
                name: "Secretaria",
                email: "secretaria@fatec.sp.gov.br",
                role: "SECRETARIA",
              },
            })
          : null
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/" element={<div>Pagina Inicial</div>} />
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<div>Painel Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Pagina Inicial")).toBeInTheDocument();
    expect(screen.queryByText("Painel Admin")).not.toBeInTheDocument();
  });
});