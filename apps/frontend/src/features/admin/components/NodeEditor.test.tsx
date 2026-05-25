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

  it("cria um novo no de resposta final com slug automatico e pai selecionado", async () => {
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
      screen.getByLabelText("Resposta final"),
      "Resposta objetiva para o aluno.",
    );

    expect((screen.getByLabelText("Slug") as HTMLInputElement).value).toBe(
      "aproveitamento-de-estudos",
    );
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

  it("valida o campo essencial do tipo menu antes de salvar", async () => {
    const user = userEvent.setup();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [],
      }),
    );

    renderWithQueryClient(<NodeEditor />);

    await user.type(screen.getByLabelText("Titulo"), "Novo fluxo");
    await user.click(screen.getByRole("button", { name: /criar no/i }));

    expect(
      screen.getByText("Informe a pergunta exibida neste menu"),
    ).not.toBeNull();
  });

  it("limpa os campos de menu e usa o nome do PDF ao criar um no de resposta", async () => {
    const user = userEvent.setup();
    const createNode = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        createNode,
        nodes: [],
      }),
    );

    renderWithQueryClient(<NodeEditor />);

    await user.click(screen.getByRole("button", { name: /resposta final/i }));
    await user.type(screen.getByLabelText("Titulo"), "Fluxo com evidencia");
    await user.type(
      screen.getByLabelText("Resposta final"),
      "Resumo com documento oficial.",
    );
    await user.type(screen.getByLabelText("Trecho da evidencia"), "Art. 76");

    const file = new File(["pdf"], "regulamento-geral.pdf", {
      type: "application/pdf",
    });

    await user.upload(screen.getByLabelText("Arquivo da evidencia"), file);
    await user.click(screen.getByRole("button", { name: /criar no/i }));

    await waitFor(() => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: null,
          answer_summary: "Resumo com documento oficial.",
          evidence_excerpt: "Art. 76",
          evidence_source: "regulamento-geral.pdf",
          evidence_file_name: "regulamento-geral.pdf",
          evidence_file_mime_type: "application/pdf",
          evidence_file_data: expect.any(String),
        }),
      );
    });
  });

  it("carrega um no folha em edicao e permite trocar para menu", async () => {
    const user = userEvent.setup();
    const updateNode = vi.fn().mockResolvedValue(undefined);

    vi.mocked(nodesApi.getById).mockResolvedValue({
      id: 4,
      title: "Aproveitamento",
      slug: "aproveitamento",
      prompt: null,
      answer_summary: "Resumo atual.",
      evidence_excerpt: "Art. 76",
      evidence_source: "regulamento-geral.pdf",
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

    await user.click(screen.getByRole("button", { name: /menu de opcoes/i }));

    expect(screen.getByLabelText("Pergunta exibida")).not.toBeNull();
    expect(screen.queryByLabelText("Resposta final")).toBeNull();

    await user.type(
      screen.getByLabelText("Pergunta exibida"),
      "O que deseja consultar agora?",
    );
    await user.click(
      screen.getByRole("button", { name: /salvar alteracoes/i }),
    );

    await waitFor(() => {
      expect(updateNode).toHaveBeenCalledWith(4, {
        title: "Aproveitamento",
        slug: "aproveitamento",
        prompt: "O que deseja consultar agora?",
        answer_summary: null,
        evidence_excerpt: null,
        evidence_source: null,
        display_order: 2,
        is_active: true,
      });
    });
  });

  it("trava o tipo como menu quando o no ja possui filhos", async () => {
    vi.mocked(nodesApi.getById).mockResolvedValue({
      id: 7,
      title: "Estagio",
      slug: "estagio",
      prompt: "Sobre qual parte do estagio voce quer saber?",
      answer_summary: null,
      evidence_excerpt: null,
      evidence_source: null,
      parent_id: 1,
      display_order: 3,
      is_active: true,
      children: [{ id: 8, title: "Comprovacao", slug: "comprovacao", display_order: 1 }],
    });

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
            childrenCount: 1,
          },
          {
            id: 7,
            title: "Estagio",
            slug: "estagio",
            parent_id: 1,
            display_order: 3,
            is_active: true,
            childrenCount: 2,
          },
        ],
      }),
    );

    renderWithQueryClient(<NodeEditor nodeId={7} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Pergunta exibida")).not.toBeNull();
    });

    expect(
      screen.getByText("Este no ja possui filhos, entao permanece como menu."),
    ).not.toBeNull();
    expect(
      (
        screen.getByRole("button", { name: /resposta final/i }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
