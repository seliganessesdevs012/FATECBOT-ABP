import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TicketList from "@/features/admin/components/TicketList";
import { useTickets } from "@/features/admin/hooks/useTickets";
import { useUpdateTicket } from "@/features/admin/hooks/useUpdateTicket";

vi.mock("@/features/admin/hooks/useTickets", () => ({
  useTickets: vi.fn(),
}));

vi.mock("@/features/admin/hooks/useUpdateTicket", () => ({
  useUpdateTicket: vi.fn(),
}));

const refetchMock = vi.fn().mockResolvedValue(undefined);
const mutateAsyncMock = vi.fn().mockResolvedValue(undefined);
const resetMock = vi.fn();

const createUseTicketsResult = (
  overrides: Partial<ReturnType<typeof useTickets>> = {},
): ReturnType<typeof useTickets> => ({
  items: [],
  meta: {
    total: 0,
    page: 1,
    limit: 20,
  },
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null,
  refetch: refetchMock,
  ...overrides,
});

const createUseUpdateTicketResult = (
  overrides: Partial<ReturnType<typeof useUpdateTicket>> = {},
): ReturnType<typeof useUpdateTicket> => ({
  mutateAsync: mutateAsyncMock,
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  reset: resetMock,
  variables: undefined,
  data: undefined,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  submittedAt: 0,
  isIdle: true,
  isSuccess: false,
  context: undefined,
  ...overrides,
}) as unknown as ReturnType<typeof useUpdateTicket>;

describe("TicketList", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("mostra loading enquanto carrega a listagem", () => {
    vi.mocked(useTickets).mockReturnValue(
      createUseTicketsResult({
        isLoading: true,
      }),
    );
    vi.mocked(useUpdateTicket).mockReturnValue(
      createUseUpdateTicketResult(),
    );

    render(<TicketList />);

    expect(screen.getByText("Carregando tickets...")).not.toBeNull();
  });

  it("renderiza tickets, permite busca e atualiza status", async () => {
    const user = userEvent.setup();

    vi.mocked(useTickets).mockReturnValue(
      createUseTicketsResult({
        items: [
          {
            id: 21,
            requester_name: "Aluno A",
            requester_email: "aluno.a@fatec.sp.gov.br",
            question: "Preciso do calendario do semestre.",
            session_log_id: 9,
            status: "ABERTA",
            created_at: "2026-05-18T11:00:00.000Z",
            updated_at: "2026-05-18T11:00:00.000Z",
          },
          {
            id: 22,
            requester_name: "Aluno B",
            requester_email: "aluno.b@fatec.sp.gov.br",
            question: "Minha AACC ja foi validada?",
            session_log_id: null,
            status: "RESPONDIDA",
            created_at: "2026-05-16T10:30:00.000Z",
            updated_at: "2026-05-17T08:15:00.000Z",
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
        },
      }),
    );
    vi.mocked(useUpdateTicket).mockReturnValue(
      createUseUpdateTicketResult(),
    );

    render(<TicketList />);

    expect(screen.getByText("Aluno A")).not.toBeNull();
    expect(screen.getByText("Sessao vinculada: #9")).not.toBeNull();
    expect(screen.getByText("Aberto")).not.toBeNull();
    expect(screen.getByText("Respondido")).not.toBeNull();

    await user.type(
      screen.getByPlaceholderText(/buscar por nome, email ou conteudo/i),
      "AACC",
    );

    expect(screen.queryByText("Aluno A")).toBeNull();
    expect(screen.getByText("Aluno B")).not.toBeNull();

    await user.clear(
      screen.getByPlaceholderText(/buscar por nome, email ou conteudo/i),
    );

    await user.click(
      screen.getByRole("button", { name: /marcar respondido/i }),
    );

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: 21,
      status: "RESPONDIDA",
    });
  });

  it("troca filtro e pagina usando os parametros do hook", async () => {
    const user = userEvent.setup();

    vi.mocked(useTickets).mockReturnValue(createUseTicketsResult());
    vi.mocked(useUpdateTicket).mockReturnValue(
      createUseUpdateTicketResult(),
    );

    const view = render(<TicketList />);

    expect(vi.mocked(useTickets)).toHaveBeenLastCalledWith({
      status: undefined,
      page: 1,
      limit: 20,
    });

    await user.click(screen.getByRole("button", { name: /abertos/i }));

    expect(vi.mocked(useTickets)).toHaveBeenLastCalledWith({
      status: "ABERTA",
      page: 1,
      limit: 20,
    });

    vi.mocked(useTickets).mockReturnValue(
      createUseTicketsResult({
        meta: {
          total: 40,
          page: 1,
          limit: 20,
        },
      }),
    );

    view.rerender(<TicketList />);

    await user.click(screen.getByRole("button", { name: /proxima/i }));

    expect(vi.mocked(useTickets)).toHaveBeenLastCalledWith({
      status: "ABERTA",
      page: 2,
      limit: 20,
    });
  });

  it("mostra erro da query com opcao de tentar novamente", async () => {
    const user = userEvent.setup();

    vi.mocked(useTickets).mockReturnValue(
      createUseTicketsResult({
        isError: true,
        error: new Error("Falha ao consultar tickets"),
      }),
    );
    vi.mocked(useUpdateTicket).mockReturnValue(
      createUseUpdateTicketResult(),
    );

    render(<TicketList />);

    expect(screen.getByText("Erro ao carregar tickets")).not.toBeNull();
    expect(screen.getByText("Falha ao consultar tickets")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
