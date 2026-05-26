import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LogTable from "@/features/admin/components/LogTable";
import { useLogs } from "@/features/admin/hooks/useLogs";

vi.mock("@/features/admin/hooks/useLogs", () => ({
  useLogs: vi.fn(),
}));

const refetchMock = vi.fn().mockResolvedValue(undefined);

const createUseLogsResult = (
  overrides: Partial<ReturnType<typeof useLogs>> = {},
): ReturnType<typeof useLogs> => ({
  logs: [],
  meta: {
    total: 0,
    page: 1,
    limit: 20,
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: refetchMock,
  ...overrides,
});

describe("LogTable", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("mostra loading enquanto carrega a listagem", () => {
    vi.mocked(useLogs).mockReturnValue(
      createUseLogsResult({
        isLoading: true,
      }),
    );

    render(<LogTable />);

    expect(
      screen.getByText("Carregando historico de atendimentos..."),
    ).not.toBeNull();
  });

  it("renderiza logs, perguntas vinculadas e filtra por busca", async () => {
    const user = userEvent.setup();

    vi.mocked(useLogs).mockReturnValue(
      createUseLogsResult({
        logs: [
          {
            id: 1,
            navigation_flow: ["root", "cursos", "dsm"],
            flag: "ATENDEU",
            created_at: "2026-05-19T10:30:00.000Z",
            questions: [],
          },
          {
            id: 2,
            navigation_flow: ["root", "estagio", "documentacao"],
            flag: "NAO_ATENDEU",
            created_at: "2026-05-19T09:45:00.000Z",
            questions: [
              {
                id: 99,
                question: "Quais documentos preciso enviar?",
                status: "ABERTA",
              },
            ],
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
        },
      }),
    );

    render(<LogTable />);

    expect(screen.getByText("Sessao #1")).not.toBeNull();
    expect(screen.getByText("Sessao #2")).not.toBeNull();
    expect(screen.getByText("Pergunta #99")).not.toBeNull();
    expect(screen.getByText("Quais documentos preciso enviar?")).not.toBeNull();

    await user.type(
      screen.getByPlaceholderText(/buscar por sessao, caminho ou pergunta/i),
      "documentos",
    );

    expect(screen.queryByText("Sessao #1")).toBeNull();
    expect(screen.getByText("Sessao #2")).not.toBeNull();
  });

  it("troca filtro e pagina usando os parametros do hook", async () => {
    const user = userEvent.setup();

    vi.mocked(useLogs).mockReturnValue(createUseLogsResult());

    const view = render(<LogTable />);

    expect(vi.mocked(useLogs)).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      flag: undefined,
      from: undefined,
      to: undefined,
    });

    await user.click(screen.getByRole("button", { name: /nao atendeu/i }));

    expect(vi.mocked(useLogs)).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      flag: "NAO_ATENDEU",
      from: undefined,
      to: undefined,
    });

    vi.mocked(useLogs).mockReturnValue(
      createUseLogsResult({
        meta: {
          total: 40,
          page: 1,
          limit: 20,
        },
      }),
    );

    view.rerender(<LogTable />);

    await user.click(screen.getByRole("button", { name: /proxima/i }));

    expect(vi.mocked(useLogs)).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      flag: "NAO_ATENDEU",
      from: undefined,
      to: undefined,
    });
  });

  it("mostra erro da query com opcao de tentar novamente", async () => {
    const user = userEvent.setup();

    vi.mocked(useLogs).mockReturnValue(
      createUseLogsResult({
        isError: true,
        error: new Error("Falha ao consultar historico"),
      }),
    );

    render(<LogTable />);

    expect(screen.getByText("Erro ao carregar historico")).not.toBeNull();
    expect(screen.getByText("Falha ao consultar historico")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
