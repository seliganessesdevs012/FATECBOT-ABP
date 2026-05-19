import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NodeTree from "@/features/admin/components/NodeTree";
import { useNodes, type UseNodesResult } from "@/features/admin/hooks/useNodes";

vi.mock("@/features/admin/hooks/useNodes", () => ({
  useNodes: vi.fn(),
}));

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

describe("NodeTree", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a hierarquia com contadores e metadados dos nos", () => {
    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [
          {
            id: 1,
            title: "Cursos",
            slug: "cursos",
            parent_id: null,
            display_order: 2,
            is_active: true,
            childrenCount: 2,
          },
          {
            id: 2,
            title: "DSM",
            slug: "dsm",
            parent_id: 1,
            display_order: 2,
            is_active: true,
            childrenCount: 0,
          },
          {
            id: 3,
            title: "Geoprocessamento",
            slug: "geo",
            parent_id: 1,
            display_order: 1,
            is_active: false,
            childrenCount: 0,
          },
          {
            id: 4,
            title: "Institucional",
            slug: "institucional",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    render(<NodeTree />);

    expect(screen.getByText("Caré")).not.toBeNull();
    expect(screen.getByText("Nivel 1")).not.toBeNull();
    expect(screen.getByText("Nivel 2")).not.toBeNull();
    expect(
      screen.getByText("4 nos cadastrados, 2 raizes e 3 ativos."),
    ).not.toBeNull();
    expect(screen.getByText("Cursos")).not.toBeNull();
    expect(screen.getByText("2 opcoes")).not.toBeNull();
    expect(screen.getAllByText("Resposta final").length).toBe(3);
    expect(screen.getByText("Geoprocessamento")).not.toBeNull();
  });

  it("dispara callbacks de selecao, criacao e edicao", async () => {
    const user = userEvent.setup();
    const onSelectNode = vi.fn();
    const onCreateNode = vi.fn();
    const onEditNode = vi.fn();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [
          {
            id: 11,
            title: "Calendario academico",
            slug: "calendario",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    render(
      <NodeTree
        selectedNodeId={11}
        onSelectNode={onSelectNode}
        onCreateNode={onCreateNode}
        onEditNode={onEditNode}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /calendario academico/i }),
    );
    await user.click(screen.getByRole("button", { name: /novo no raiz/i }));
    await user.click(screen.getByRole("button", { name: /adicionar opcao/i }));
    await user.click(screen.getByRole("button", { name: /editar/i }));

    expect(onSelectNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11, title: "Calendario academico" }),
    );
    expect(onCreateNode).toHaveBeenNthCalledWith(1, null);
    expect(onCreateNode).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 11, title: "Calendario academico" }),
    );
    expect(onEditNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11, title: "Calendario academico" }),
    );
  });

  it("bloqueia remocao de no com filhos e remove no folha apos confirmacao", async () => {
    const user = userEvent.setup();
    const deleteNode = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        deleteNode,
        nodes: [
          {
            id: 21,
            title: "Cursos",
            slug: "cursos",
            parent_id: null,
            display_order: 1,
            is_active: true,
            childrenCount: 1,
          },
          {
            id: 22,
            title: "Estagio",
            slug: "estagio",
            parent_id: 21,
            display_order: 1,
            is_active: true,
            childrenCount: 0,
          },
        ],
      }),
    );

    const { rerender } = render(<NodeTree selectedNodeId={21} />);

    const deleteButtonWithParent = screen.getByRole("button", {
      name: /deletar/i,
    });

    expect(deleteButtonWithParent.hasAttribute("disabled")).toBe(true);

    rerender(<NodeTree selectedNodeId={22} />);

    const deleteButtonLeaf = screen.getByRole("button", { name: /deletar/i });

    expect(deleteButtonLeaf.hasAttribute("disabled")).toBe(false);

    await user.click(deleteButtonLeaf);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Remover o no "Estagio"? Esta acao nao pode ser desfeita.',
    );
    expect(deleteNode).toHaveBeenCalledWith(22);
  });

  it("mostra erro da query com acao de tentar novamente", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        isError: true,
        error: new Error("Falha ao buscar nos"),
        refetch,
      }),
    );

    render(<NodeTree />);

    expect(screen.getByText("Erro ao carregar a arvore")).not.toBeNull();
    expect(screen.getByText("Falha ao buscar nos")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
