import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QuestionList from "@/features/secretary/components/QuestionList";
import { useQuestions } from "@/features/secretary/hooks/useQuestions";
import { useUpdateQuestion } from "@/features/secretary/hooks/useUpdateQuestion";

vi.mock("@/features/secretary/hooks/useQuestions", () => ({
  useQuestions: vi.fn(),
}));

vi.mock("@/features/secretary/hooks/useUpdateQuestion", () => ({
  useUpdateQuestion: vi.fn(),
}));

const refetchMock = vi.fn().mockResolvedValue(undefined);
const mutateAsyncMock = vi.fn().mockResolvedValue(undefined);
const resetMock = vi.fn();

const createUseQuestionsResult = (
  overrides: Partial<ReturnType<typeof useQuestions>> = {},
): ReturnType<typeof useQuestions> => ({
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

const createUseUpdateQuestionResult = (
  overrides: Partial<ReturnType<typeof useUpdateQuestion>> = {},
): ReturnType<typeof useUpdateQuestion> => ({
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
}) as unknown as ReturnType<typeof useUpdateQuestion>;

describe("QuestionList", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("mostra loading enquanto carrega a listagem", () => {
    vi.mocked(useQuestions).mockReturnValue(
      createUseQuestionsResult({
        isLoading: true,
      }),
    );
    vi.mocked(useUpdateQuestion).mockReturnValue(
      createUseUpdateQuestionResult(),
    );

    render(<QuestionList />);

    expect(screen.getByText("Carregando perguntas...")).not.toBeNull();
  });

  it("renderiza perguntas, destaca abertas e atualiza o status", async () => {
    const user = userEvent.setup();

    vi.mocked(useQuestions).mockReturnValue(
      createUseQuestionsResult({
        items: [
          {
            id: 11,
            requester_name: "Aluno A",
            requester_email: "aluno.a@fatec.sp.gov.br",
            question: "Preciso do calendario do semestre.",
            session_log_id: 9,
            status: "ABERTA",
            created_at: "2026-05-18T11:00:00.000Z",
            updated_at: "2026-05-18T11:00:00.000Z",
          },
          {
            id: 12,
            requester_name: "Aluno B",
            requester_email: "aluno.b@fatec.sp.gov.br",
            question: "Ja validei as AACC com a coordenacao?",
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
    vi.mocked(useUpdateQuestion).mockReturnValue(
      createUseUpdateQuestionResult(),
    );

    render(<QuestionList />);

    expect(screen.getByText("Aluno A")).not.toBeNull();
    expect(screen.getByText("Atendimento vinculado: #9")).not.toBeNull();
    expect(screen.getByText("Aberta")).not.toBeNull();
    expect(screen.getByText("Respondida")).not.toBeNull();

    const answeredButton = screen.getByRole("button", {
      name: /marcar respondida/i,
    });

    await user.click(answeredButton);

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: 11,
      status: "RESPONDIDA",
    });

    expect(
      screen.getByRole("button", { name: /ja respondida/i }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
  });

  it("troca filtro e pagina usando os parametros do hook", async () => {
    const user = userEvent.setup();

    vi.mocked(useQuestions).mockReturnValue(createUseQuestionsResult());
    vi.mocked(useUpdateQuestion).mockReturnValue(
      createUseUpdateQuestionResult(),
    );

    const view = render(<QuestionList />);

    expect(vi.mocked(useQuestions)).toHaveBeenLastCalledWith({
      status: undefined,
      page: 1,
      limit: 20,
    });

    await user.click(screen.getByRole("button", { name: "Abertas" }));

    expect(vi.mocked(useQuestions)).toHaveBeenLastCalledWith({
      status: "ABERTA",
      page: 1,
      limit: 20,
    });

    vi.mocked(useQuestions).mockReturnValue(
      createUseQuestionsResult({
        meta: {
          total: 40,
          page: 1,
          limit: 20,
        },
      }),
    );

    view.rerender(<QuestionList />);

    await user.click(screen.getByRole("button", { name: /proxima/i }));

    expect(vi.mocked(useQuestions)).toHaveBeenLastCalledWith({
      status: "ABERTA",
      page: 2,
      limit: 20,
    });
  });

  it("mostra erro da query com opcao de tentar novamente", async () => {
    const user = userEvent.setup();

    vi.mocked(useQuestions).mockReturnValue(
      createUseQuestionsResult({
        isError: true,
        error: new Error("Falha ao consultar perguntas"),
      }),
    );
    vi.mocked(useUpdateQuestion).mockReturnValue(
      createUseUpdateQuestionResult(),
    );

    render(<QuestionList />);

    expect(screen.getByText("Erro ao carregar perguntas")).not.toBeNull();
    expect(screen.getByText("Falha ao consultar perguntas")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
