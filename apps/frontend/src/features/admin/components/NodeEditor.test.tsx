import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NodeEditor from "@/features/admin/components/NodeEditor";
import { nodesApi } from "@/features/admin/api/nodes.api";
import { useNodes, type UseNodesResult } from "@/features/admin/hooks/useNodes";

vi.mock("@/features/admin/hooks/useNodes", () => ({
  useNodes: vi.fn(),
}));

vi.mock("@/features/admin/api/nodes.api", () => {
  return {
    nodesApi: {
      getById: vi.fn(),
    },
  };
});

const createUseNodesResult = (
  overrides: Partial<UseNodesResult> = {},
): UseNodesResult => ({
  nodes: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  createNode: vi.fn().mockResolvedValue(undefined),
  updateNode: vi.fn().mockResolvedValue(undefined),
  deleteNode: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderWithQueryClient = (element: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>,
  );
};

describe("NodeEditor", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("preenche slug automaticamente e cria um novo filho com o pai selecionado", async () => {
    const user = userEvent.setup();
    const createNode = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        createNode,
        nodes: [
          {
            id: 1,
            title: "Cursos",
            slug: "cursos",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 2,
          },
          {
            id: 2,
            title: "Calendario",
            slug: "calendario",
            parent_id: 1,
            display_order: 1,
            is_active: true,
            childrenCount: 0,
          },
          {
            id: 3,
            title: "Estagio",
            slug: "estagio",
            parent_id: 1,
            display_order: 2,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    renderWithQueryClient(
      <NodeEditor
        parentNode={{
          id: 1,
          title: "Cursos",
          slug: "cursos",
          parent_id: null,
          display_order: 1,
          is_active: true,
          childrenCount: 2,
        }}
        onSuccess={onSuccess}
      />,
    );

    await user.type(
      screen.getByLabelText("Titulo"),
      "Aproveitamento de Estudos",
    );
    await user.type(
      screen.getByLabelText("Resumo da resposta"),
      "Resposta objetiva para o aluno.",
    );

    expect(
      (screen.getByLabelText("Slug") as HTMLInputElement).value,
    ).toBe("aproveitamento-de-estudos");
    expect(
      (screen.getByLabelText("Ordem de exibicao") as HTMLInputElement).value,
    ).toBe("3");

    await user.click(screen.getByRole("button", { name: /criar no/i }));

    await waitFor(() => {
      expect(createNode).toHaveBeenCalledWith({
        title: "Aproveitamento de Estudos",
        slug: "aproveitamento-de-estudos",
        prompt: null,
        answer_summary: "Resposta objetiva para o aluno.",
        evidence_excerpt: null,
        evidence_source: null,
        parent_id: 1,
        display_order: 3,
        is_active: true,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("valida conteudo minimo e consistencia da evidencia antes de salvar", async () => {
    const user = userEvent.setup();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [
          {
            id: 1,
            title: "Cursos",
            slug: "cursos",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    renderWithQueryClient(<NodeEditor />);

    await user.type(screen.getByLabelText("Titulo"), "Novo fluxo");
    await user.type(screen.getByLabelText("Trecho da evidencia"), "Art. 76");
    await user.click(screen.getByRole("button", { name: /criar no/i }));

    expect(
      screen.getByText("Preencha o prompt ou o resumo da resposta"),
    ).not.toBeNull();
    expect(screen.getByText("Informe a fonte da evidencia")).not.toBeNull();
  });

  it("carrega os detalhes do no em edicao e envia apenas os campos editaveis", async () => {
    const user = userEvent.setup();
    const updateNode = vi.fn().mockResolvedValue(undefined);
    vi.mocked(nodesApi.getById).mockResolvedValue({
      id: 4,
      title: "Aproveitamento",
      slug: "aproveitamento",
      prompt: null,
      answer_summary: "Resumo atual.",
      evidence_excerpt: "Art. 76",
      evidence_source: "Regulamento Geral",
      parent_id: 1,
      display_order: 2,
      is_active: true,
      children: [],
    });

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        updateNode,
        nodes: [
          {
            id: 1,
            title: "Cursos",
            slug: "cursos",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 1,
          },
          {
            id: 4,
            title: "Aproveitamento",
            slug: "aproveitamento",
            parent_id: 1,
            display_order: 2,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    renderWithQueryClient(<NodeEditor nodeId={4} />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText("Titulo") as HTMLInputElement).value,
      ).toBe("Aproveitamento");
    });

    expect(nodesApi.getById).toHaveBeenCalledWith(4);
    expect(
      (screen.getByLabelText("No pai") as HTMLInputElement).value,
    ).toBe("Cursos");

    await user.clear(screen.getByLabelText("Titulo"));
    await user.type(screen.getByLabelText("Titulo"), "Aproveitamento atualizado");
    await user.clear(screen.getByLabelText("Resumo da resposta"));
    await user.type(
      screen.getByLabelText("Resumo da resposta"),
      "Resumo revisado com nova orientacao.",
    );
    await user.click(
      screen.getByRole("button", { name: /salvar alteracoes/i }),
    );

    await waitFor(() => {
      expect(updateNode).toHaveBeenCalledWith(4, {
        title: "Aproveitamento atualizado",
        slug: "aproveitamento",
        prompt: null,
        answer_summary: "Resumo revisado com nova orientacao.",
        evidence_excerpt: "Art. 76",
        evidence_source: "Regulamento Geral",
        display_order: 2,
        is_active: true,
      });
    });
  });
});
